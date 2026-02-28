import { query, getClient } from '../config/database';
import { User, Device, UserSettings, AuthTokens, JWTPayload } from '../models';
import { hashPassword, verifyPassword, hashToken } from '../utils';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendEmail, emailTemplates, isEmailEnabled } from '../config/email';

export class AuthService {
  // Register new user
  static async register(email: string, password: string, full_name?: string, device_info?: any): Promise<{ user: User; tokens: AuthTokens; device: Device }> {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, language_preference, timezone, created_at`,
      [email, password_hash, full_name || email.split('@')[0]]
    );

    const user = userResult.rows[0];

    // Create default user settings
    await query(
      `INSERT INTO user_settings (user_id)
       VALUES ($1)`,
      [user.id]
    );

    // Create default "Personal" group with max_members = 1 (personal only)
    const groupResult = await query(
      `INSERT INTO groups (name, description, created_by, max_members)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Personal', 'Your personal food management group', user.id, 1]
    );

    // Add user as owner of the group
    await query(
      `INSERT INTO group_memberships (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [groupResult.rows[0].id, user.id, 'owner']
    );

    // Note: Default categories and locations are no longer created here
    // They will be pushed from the mobile app's local database when the group is created

    // Register device if provided
    let device: Device | null = null;
    if (device_info) {
      device = await this.registerDevice(user.id, device_info);
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, device?.id);

    // Store refresh token hash
    if (device) {
      await query(
        `UPDATE devices SET refresh_token_hash = $1 WHERE id = $2`,
        [hashToken(tokens.refreshToken), device.id]
      );
    }

    return { user, tokens, device: device! };
  }

  // Login user
  static async login(email: string, password: string, device_info?: any): Promise<{ user: User; tokens: AuthTokens; device: Device }> {
    // Get user
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Register or update device
    let device: Device;
    if (device_info) {
      device = await this.registerDevice(user.id, device_info);
    } else {
      // Create a generic device entry
      device = await this.registerDevice(user.id, {
        device_uuid: `web-${Date.now()}`,
        device_name: 'Web Browser',
        device_type: 'web',
        platform: 'web',
      });
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, device.id);

    // Store refresh token hash
    await query(
      `UPDATE devices SET refresh_token_hash = $1, last_active_at = NOW() WHERE id = $2`,
      [hashToken(tokens.refreshToken), device.id]
    );

    // Remove password_hash from response
    delete user.password_hash;

    return { user, tokens, device };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string, userId: string, _deviceId?: string): Promise<AuthTokens> {
    // Verify refresh token is still valid in database
    const deviceResult = await query(
      'SELECT * FROM devices WHERE user_id = $1 AND refresh_token_hash = $2',
      [userId, hashToken(refreshToken)]
    );

    if (deviceResult.rows.length === 0) {
      throw new AppError('Invalid refresh token', 401);
    }

    const device = deviceResult.rows[0];

    // Get user email
    const userResult = await query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Generate new tokens
    const tokens = this.generateTokens(userId, userResult.rows[0].email, device.id);

    // Update refresh token hash
    await query(
      `UPDATE devices SET refresh_token_hash = $1, last_active_at = NOW() WHERE id = $2`,
      [hashToken(tokens.refreshToken), device.id]
    );

    return tokens;
  }

  // Logout (invalidate refresh token)
  static async logout(userId: string, deviceId?: string): Promise<void> {
    if (deviceId) {
      await query(
        'UPDATE devices SET refresh_token_hash = NULL WHERE id = $1 AND user_id = $2',
        [deviceId, userId]
      );
    } else {
      // Logout from all devices
      await query(
        'UPDATE devices SET refresh_token_hash = NULL WHERE user_id = $1',
        [userId]
      );
    }
  }

  // Register or update device
  static async registerDevice(userId: string, device_info: any): Promise<Device> {
    const { device_uuid, device_name, device_type, platform } = device_info;

    // Check if device already exists
    const existingDevice = await query(
      'SELECT * FROM devices WHERE user_id = $1 AND device_uuid = $2',
      [userId, device_uuid]
    );

    if (existingDevice.rows.length > 0) {
      // Update existing device
      const result = await query(
        `UPDATE devices 
         SET device_name = $1, device_type = $2, platform = $3, last_active_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [device_name, device_type, platform, existingDevice.rows[0].id]
      );
      return result.rows[0];
    }

    // Create new device
    const result = await query(
      `INSERT INTO devices (user_id, device_uuid, device_name, device_type, platform)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, device_uuid, device_name, device_type, platform]
    );

    return result.rows[0];
  }

  // Generate access and refresh tokens
  private static generateTokens(userId: string, email: string, deviceId?: string): AuthTokens {
    const payload: JWTPayload = {
      userId,
      email,
      deviceId,
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User> {
    const result = await query(
      'SELECT id, email, full_name, avatar_url, language_preference, timezone, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  }

  // Update user profile
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const allowedFields = ['full_name', 'avatar_url', 'language_preference', 'timezone'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [userId, ...fields.map(field => (updates as any)[field])];

    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, email, full_name, avatar_url, language_preference, timezone`,
      values
    );

    return result.rows[0];
  }

  // Get user settings
  static async getUserSettings(userId: string): Promise<UserSettings> {
    const result = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Settings not found', 404);
    }

    return result.rows[0];
  }

  // Update user settings
  static async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const allowedFields = ['price_tracking_enabled', 'notification_time', 'expiring_soon_days', 'expiring_today_alerts', 'expired_alerts', 'theme'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [userId, ...fields.map(field => (updates as any)[field])];

    const result = await query(
      `UPDATE user_settings SET ${setClause} WHERE user_id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Request a password reset — sends email with 6-digit code (user enters code in app)
  static async requestPasswordReset(email: string): Promise<void> {
    const userResult = await query(
      'SELECT id, full_name FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    // Always return success to avoid leaking whether the email exists
    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];

    // Invalidate any existing unused tokens for this user
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // Generate 6-digit code for in-app entry
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const tokenHash = hashToken(code);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    if (!isEmailEnabled) {
      console.warn('Email is disabled — reset code generated but not sent');
      return;
    }

    const template = emailTemplates.passwordResetCode(code, user.full_name);
    await sendEmail(email, template.subject, template.html, template.text);
  }

  // Reset the password using either (email + code) or (token) from link
  static async resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    if (userResult.rows.length === 0) {
      throw new AppError('Invalid or expired reset code', 400);
    }
    const userId = userResult.rows[0].id;
    const tokenHash = hashToken(code);

    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE user_id = $1 AND token_hash = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError('Invalid or expired reset code', 400);
    }

    const resetToken = tokenResult.rows[0];
    if (resetToken.used_at) {
      throw new AppError('This reset code has already been used', 400);
    }
    if (new Date(resetToken.expires_at) < new Date()) {
      throw new AppError('This reset code has expired', 400);
    }

    const newHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);
    await query('UPDATE devices SET refresh_token_hash = NULL WHERE user_id = $1', [userId]);
  }

  // Reset the password using a long token (e.g. from email link / web page)
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);

    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const resetToken = tokenResult.rows[0];
    if (resetToken.used_at) {
      throw new AppError('This reset token has already been used', 400);
    }
    if (new Date(resetToken.expires_at) < new Date()) {
      throw new AppError('This reset token has expired', 400);
    }

    const newHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, resetToken.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);
    await query('UPDATE devices SET refresh_token_hash = NULL WHERE user_id = $1', [resetToken.user_id]);
  }

  // Permanently delete the user account and all associated data
  static async deleteAccount(userId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Find all groups where this user is an owner
      const ownedGroupsResult = await client.query(
        `SELECT g.id
         FROM groups g
         JOIN group_memberships gm ON gm.group_id = g.id
         WHERE gm.user_id = $1 AND gm.role = 'owner' AND g.deleted_at IS NULL`,
        [userId]
      );

      for (const group of ownedGroupsResult.rows) {
        // Check for other members in this group
        const otherMemberResult = await client.query(
          `SELECT user_id FROM group_memberships
           WHERE group_id = $1 AND user_id != $2
           ORDER BY joined_at ASC
           LIMIT 1`,
          [group.id, userId]
        );

        if (otherMemberResult.rows.length > 0) {
          // Transfer group ownership to the longest-standing other member
          const newOwnerId = otherMemberResult.rows[0].user_id;
          await client.query(
            `UPDATE groups SET created_by = $1 WHERE id = $2`,
            [newOwnerId, group.id]
          );
          await client.query(
            `UPDATE group_memberships SET role = 'owner' WHERE group_id = $1 AND user_id = $2`,
            [group.id, newOwnerId]
          );
        }
        // Groups with no other members will cascade-delete when user is deleted
        // (groups.created_by → users(id) ON DELETE CASCADE)
      }

      // Delete the user — FK cascades handle the rest:
      //   devices → sync_log
      //   user_settings
      //   group_memberships (remaining)
      //   invitations (invited_by / invited_user_id)
      //   food_items (created_by) → food_item_events
      //   shopping_items (created_by)
      //   wish_items (created_by)
      //   groups (created_by, solo-owner groups) → all group data
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

