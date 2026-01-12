import { query } from '../config/database';
import { Group, GroupMembership } from '../models';
import { AppError } from '../middleware/errorHandler';

export class GroupService {
  // Create new group
  static async createGroup(userId: string, name: string, description?: string): Promise<Group> {
    // Create the group with default max_members = 100 (for regular groups)
    const groupResult = await query(
      `INSERT INTO groups (name, description, created_by, max_members)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, userId, 100]
    );

    const group = groupResult.rows[0];

    // Add creator as owner
    await query(
      `INSERT INTO group_memberships (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [group.id, userId, 'owner']
    );

    // Note: Default categories and locations are no longer created here
    // They will be pushed from the mobile app's local database when the group is created

    return group;
  }

  // Get user's groups
  static async getUserGroups(userId: string): Promise<(Group & { role: string; member_count: number })[]> {
    const result = await query(
      `SELECT 
        g.*,
        gm.role,
        COUNT(gm2.id) as member_count
       FROM groups g
       JOIN group_memberships gm ON g.id = gm.group_id
       LEFT JOIN group_memberships gm2 ON g.id = gm2.group_id
       WHERE gm.user_id = $1 AND g.deleted_at IS NULL
       GROUP BY g.id, gm.role
       ORDER BY g.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Get group by ID
  static async getGroupById(groupId: string, userId: string): Promise<Group & { role: string; member_count: number }> {
    const result = await query(
      `SELECT 
        g.*,
        gm.role,
        COUNT(gm2.id) as member_count
       FROM groups g
       JOIN group_memberships gm ON g.id = gm.group_id
       LEFT JOIN group_memberships gm2 ON g.id = gm2.group_id
       WHERE g.id = $1 AND gm.user_id = $2 AND g.deleted_at IS NULL
       GROUP BY g.id, gm.role`,
      [groupId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Group not found or access denied', 404);
    }

    return result.rows[0];
  }

  // Update group
  static async updateGroup(groupId: string, userId: string, updates: Partial<Group>): Promise<Group> {
    // Check if user is owner or admin
    const membership = await this.checkGroupPermission(groupId, userId, ['owner', 'admin']);
    if (!membership) {
      throw new AppError('Only group owners and admins can update the group', 403);
    }

    const allowedFields = ['name', 'description'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [groupId, ...fields.map(field => (updates as any)[field])];

    const result = await query(
      `UPDATE groups SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete group and all related data (hard delete)
  static async deleteGroup(groupId: string, userId: string): Promise<void> {
    // Only owner can delete
    const membership = await this.checkGroupPermission(groupId, userId, ['owner']);
    if (!membership) {
      throw new AppError('Only the group owner can delete the group', 403);
    }

    // Delete all related data in order (respecting foreign key constraints)
    // 1. Delete food items
    await query(
      `DELETE FROM food_items WHERE group_id = $1`,
      [groupId]
    );

    // 2. Delete shopping items
    await query(
      `DELETE FROM shopping_items WHERE group_id = $1`,
      [groupId]
    );

    // 3. Delete wish items
    await query(
      `DELETE FROM wish_items WHERE group_id = $1`,
      [groupId]
    );

    // 4. Delete categories
    await query(
      `DELETE FROM categories WHERE group_id = $1`,
      [groupId]
    );

    // 5. Delete locations
    await query(
      `DELETE FROM locations WHERE group_id = $1`,
      [groupId]
    );

    // 6. Delete group memberships
    await query(
      `DELETE FROM group_memberships WHERE group_id = $1`,
      [groupId]
    );

    // 7. Finally, delete the group itself
    await query(
      `DELETE FROM groups WHERE id = $1`,
      [groupId]
    );
  }

  // Get group members
  static async getGroupMembers(groupId: string, userId: string): Promise<any[]> {
    // Check if user is member of the group
    const isMember = await this.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied', 403);
    }

    const result = await query(
      `SELECT 
        gm.id,
        gm.role,
        gm.joined_at,
        u.id as user_id,
        u.email,
        u.full_name,
        u.avatar_url
       FROM group_memberships gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY 
         CASE gm.role 
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'member' THEN 3
         END,
         gm.joined_at ASC`,
      [groupId]
    );

    return result.rows;
  }

  // Remove member from group
  static async removeMember(groupId: string, userId: string, memberUserId: string): Promise<void> {
    // Check if user is owner or admin
    const membership = await this.checkGroupPermission(groupId, userId, ['owner', 'admin']);
    if (!membership) {
      throw new AppError('Only group owners and admins can remove members', 403);
    }

    // Cannot remove the owner
    const memberCheck = await query(
      `SELECT role FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
      [groupId, memberUserId]
    );

    if (memberCheck.rows.length === 0) {
      throw new AppError('Member not found in group', 404);
    }

    if (memberCheck.rows[0].role === 'owner') {
      throw new AppError('Cannot remove the group owner', 400);
    }

    // Remove member
    await query(
      `DELETE FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
      [groupId, memberUserId]
    );
  }

  // Update member role
  static async updateMemberRole(groupId: string, userId: string, memberUserId: string, newRole: string): Promise<void> {
    // Only owner can change roles
    const membership = await this.checkGroupPermission(groupId, userId, ['owner']);
    if (!membership) {
      throw new AppError('Only the group owner can change member roles', 403);
    }

    // Cannot change owner's role
    const memberCheck = await query(
      `SELECT role FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
      [groupId, memberUserId]
    );

    if (memberCheck.rows.length === 0) {
      throw new AppError('Member not found in group', 404);
    }

    if (memberCheck.rows[0].role === 'owner') {
      throw new AppError('Cannot change the owner\'s role', 400);
    }

    // Validate new role
    if (!['admin', 'member'].includes(newRole)) {
      throw new AppError('Invalid role. Must be admin or member', 400);
    }

    // Update role
    await query(
      `UPDATE group_memberships SET role = $1 WHERE group_id = $2 AND user_id = $3`,
      [newRole, groupId, memberUserId]
    );
  }

  // Check if user has permission in group
  static async checkGroupPermission(groupId: string, userId: string, allowedRoles?: string[]): Promise<GroupMembership | null> {
    try {
      const result = await query(
        `SELECT * FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const membership = result.rows[0];

      if (allowedRoles && !allowedRoles.includes(membership.role)) {
        return null;
      }

      return membership;
    } catch (err: any) {
      // Log the error for debugging
      console.error('Error checking group permission:', err);
      // Re-throw as AppError to be handled by the caller
      throw new AppError('Failed to check group permission', 500);
    }
  }

  // Get group by invite code
  static async getGroupByInviteCode(inviteCode: string): Promise<Group> {
    const result = await query(
      `SELECT * FROM groups WHERE invite_code = $1 AND deleted_at IS NULL`,
      [inviteCode]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid invite code', 404);
    }

    return result.rows[0];
  }

  // Check if group is full
  static async isGroupFull(groupId: string): Promise<boolean> {
    const result = await query(
      `SELECT 
        g.max_members,
        COUNT(gm.id) as current_members
       FROM groups g
       LEFT JOIN group_memberships gm ON g.id = gm.group_id
       WHERE g.id = $1
       GROUP BY g.id, g.max_members`,
      [groupId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Group not found', 404);
    }

    const { max_members, current_members } = result.rows[0];
    // Default to 100 if null (for regular groups), Personal groups have max_members = 1
    const max = max_members ? parseInt(max_members.toString()) : 100;
    const current = parseInt(current_members.toString()) || 0;
    return current >= max;
  }
}

