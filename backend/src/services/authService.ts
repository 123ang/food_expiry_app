import { query } from '../config/database';
import { User, Device, UserSettings, AuthTokens, JWTPayload } from '../models';
import { hashPassword, verifyPassword, hashToken } from '../utils';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

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

    // Create default "Personal" group
    const groupResult = await query(
      `INSERT INTO groups (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Personal', 'Your personal food management group', user.id]
    );

    // Add user as owner of the group
    await query(
      `INSERT INTO group_memberships (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [groupResult.rows[0].id, user.id, 'owner']
    );

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
}

