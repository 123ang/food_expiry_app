import { query } from '../config/database';
import { Invitation } from '../models';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';
import { sendEmail, emailTemplates } from '../config/email';

export class InvitationService {
  // Send invitation
  static async sendInvitation(groupId: string, invitedBy: string, invitedEmail: string): Promise<Invitation> {
    // Check if user has permission to invite
    const membership = await GroupService.checkGroupPermission(groupId, invitedBy, ['owner', 'admin']);
    if (!membership) {
      throw new AppError('Only group owners and admins can send invitations', 403);
    }

    // Check if group is full
    const isFull = await GroupService.isGroupFull(groupId);
    if (isFull) {
      throw new AppError('Group is full', 400);
    }

    // Check if user is already a member
    const existingMember = await query(
      `SELECT id FROM group_memberships gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1 AND u.email = $2`,
      [groupId, invitedEmail]
    );

    if (existingMember.rows.length > 0) {
      throw new AppError('User is already a member of this group', 400);
    }

    // Check if there's already a pending invitation
    const existingInvitation = await query(
      `SELECT id FROM invitations 
       WHERE group_id = $1 AND invited_email = $2 AND status = 'pending' AND expires_at > NOW()`,
      [groupId, invitedEmail]
    );

    if (existingInvitation.rows.length > 0) {
      throw new AppError('An invitation has already been sent to this email', 400);
    }

    // Get group and inviter details
    const groupResult = await query('SELECT * FROM groups WHERE id = $1', [groupId]);
    const inviterResult = await query('SELECT full_name, email FROM users WHERE id = $1', [invitedBy]);
    
    const group = groupResult.rows[0];
    const inviter = inviterResult.rows[0];

    // Check if invited email is registered
    const invitedUserResult = await query('SELECT id FROM users WHERE email = $1', [invitedEmail]);
    const invitedUserId = invitedUserResult.rows.length > 0 ? invitedUserResult.rows[0].id : null;

    // Create invitation
    const result = await query(
      `INSERT INTO invitations (group_id, invited_by, invited_email, invited_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [groupId, invitedBy, invitedEmail, invitedUserId]
    );

    const invitation = result.rows[0];

    // Send invitation email
    try {
      const webLink = `${process.env.WEB_APP_URL}/join?code=${invitation.invite_code}`;
      const mobileLink = `${process.env.MOBILE_DEEP_LINK_SCHEME}://join?code=${invitation.invite_code}`;
      
      const template = emailTemplates.groupInvitation(
        inviter.full_name || inviter.email,
        group.name,
        invitation.invite_code,
        webLink,
        mobileLink
      );

      await sendEmail(invitedEmail, template.subject, template.html, template.text);
    } catch (error) {
      console.error('❌ Failed to send invitation email:', error);
      // Don't fail the invitation if email fails
    }

    return invitation;
  }

  // Get user's invitations
  static async getUserInvitations(userId: string): Promise<any[]> {
    // Get user's email
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const userEmail = userResult.rows[0].email;

    // Get pending invitations
    const result = await query(
      `SELECT 
        i.*,
        g.name as group_name,
        g.description as group_description,
        u.full_name as invited_by_name,
        u.email as invited_by_email
       FROM invitations i
       JOIN groups g ON i.group_id = g.id
       JOIN users u ON i.invited_by = u.id
       WHERE i.invited_email = $1 AND i.status = 'pending' AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [userEmail]
    );

    return result.rows;
  }

  // Accept invitation
  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    // Get invitation
    const invitationResult = await query(
      `SELECT * FROM invitations WHERE id = $1`,
      [invitationId]
    );

    if (invitationResult.rows.length === 0) {
      throw new AppError('Invitation not found', 404);
    }

    const invitation = invitationResult.rows[0];

    // Check if invitation is for this user
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].email !== invitation.invited_email) {
      throw new AppError('This invitation is not for you', 403);
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      throw new AppError('Invitation has already been responded to', 400);
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    // Check if group is full
    const isFull = await GroupService.isGroupFull(invitation.group_id);
    if (isFull) {
      throw new AppError('Group is full', 400);
    }

    // Check if user is already a member
    const existingMember = await query(
      `SELECT id FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
      [invitation.group_id, userId]
    );

    if (existingMember.rows.length > 0) {
      throw new AppError('You are already a member of this group', 400);
    }

    // Add user to group
    await query(
      `INSERT INTO group_memberships (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [invitation.group_id, userId, 'member']
    );

    // Update invitation status
    await query(
      `UPDATE invitations SET status = 'accepted', responded_at = NOW(), invited_user_id = $1 WHERE id = $2`,
      [userId, invitationId]
    );
  }

  // Decline invitation
  static async declineInvitation(invitationId: string, userId: string): Promise<void> {
    // Get invitation
    const invitationResult = await query(
      `SELECT * FROM invitations WHERE id = $1`,
      [invitationId]
    );

    if (invitationResult.rows.length === 0) {
      throw new AppError('Invitation not found', 404);
    }

    const invitation = invitationResult.rows[0];

    // Check if invitation is for this user
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].email !== invitation.invited_email) {
      throw new AppError('This invitation is not for you', 403);
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw new AppError('Invitation has already been responded to', 400);
    }

    // Update invitation status
    await query(
      `UPDATE invitations SET status = 'declined', responded_at = NOW() WHERE id = $1`,
      [invitationId]
    );
  }

  // Join group via invite code
  static async joinGroupWithCode(inviteCode: string, userId: string): Promise<void> {
    // Get group by invite code
    const group = await GroupService.getGroupByInviteCode(inviteCode);

    // Check if group is full
    const isFull = await GroupService.isGroupFull(group.id);
    if (isFull) {
      throw new AppError('Group is full', 400);
    }

    // Check if user is already a member
    const existingMember = await query(
      `SELECT id FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
      [group.id, userId]
    );

    if (existingMember.rows.length > 0) {
      throw new AppError('You are already a member of this group', 400);
    }

    // Add user to group
    await query(
      `INSERT INTO group_memberships (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [group.id, userId, 'member']
    );

    // Update any pending invitations for this user
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    await query(
      `UPDATE invitations 
       SET status = 'accepted', responded_at = NOW(), invited_user_id = $1 
       WHERE group_id = $2 AND invited_email = $3 AND status = 'pending'`,
      [userId, group.id, userResult.rows[0].email]
    );
  }

  // Verify invite code
  static async verifyInviteCode(inviteCode: string): Promise<{ valid: boolean; group?: any; error?: string }> {
    try {
      const group = await GroupService.getGroupByInviteCode(inviteCode);
      
      // Check if group is full
      const isFull = await GroupService.isGroupFull(group.id);
      if (isFull) {
        return {
          valid: false,
          error: 'Group is full',
        };
      }

      // Get member count
      const memberResult = await query(
        `SELECT COUNT(*) as member_count FROM group_memberships WHERE group_id = $1`,
        [group.id]
      );

      return {
        valid: true,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          member_count: parseInt(memberResult.rows[0].member_count),
          max_members: group.max_members,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid invite code',
      };
    }
  }

  // Expire old invitations (can be run as a cron job)
  static async expireOldInvitations(): Promise<number> {
    const result = await query(
      `UPDATE invitations 
       SET status = 'expired' 
       WHERE status = 'pending' AND expires_at < NOW()
       RETURNING id`
    );

    return result.rowCount || 0;
  }
}

