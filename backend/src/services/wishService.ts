import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';
import { WishItem } from '../models';

export class WishService {
  // Get wish items for a group
  static async getWishItems(userId: string, groupId: string): Promise<WishItem[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    let sql = `
      SELECT 
        id,
        group_id,
        created_by,
        name,
        notes,
        price,
        rating,
        image_url,
        created_at,
        updated_at,
        version
      FROM wish_items
      WHERE group_id = $1 
        AND deleted_at IS NULL
    `;

    const params: any[] = [groupId];

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    return result.rows.map((row: any) => ({
      id: row.id,
      group_id: row.group_id,
      created_by: row.created_by,
      name: row.name,
      notes: row.notes || undefined,
      price: row.price ? parseFloat(row.price) : undefined,
      rating: row.rating ? parseInt(row.rating) : 0,
      image_url: row.image_url || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      version: parseInt(row.version) || 1,
    }));
  }

  // Get wish item by ID
  static async getWishItemById(userId: string, itemId: string): Promise<WishItem | null> {
    const result = await query(
      `SELECT 
        id,
        group_id,
        created_by,
        name,
        notes,
        price,
        rating,
        image_url,
        created_at,
        updated_at,
        version
      FROM wish_items
      WHERE id = $1 AND deleted_at IS NULL`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(row.group_id, userId);
    if (!isMember) {
      throw new AppError('Access denied to this item', 403);
    }

    return {
      id: row.id,
      group_id: row.group_id,
      created_by: row.created_by,
      name: row.name,
      notes: row.notes || undefined,
      price: row.price ? parseFloat(row.price) : undefined,
      rating: row.rating ? parseInt(row.rating) : 0,
      image_url: row.image_url || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      version: parseInt(row.version) || 1,
    };
  }

  // Create wish item
  static async createWishItem(userId: string, groupId: string, item: Partial<WishItem>): Promise<WishItem> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    if (!item.name || !item.name.trim()) {
      throw new AppError('Item name is required', 400);
    }

    const result = await query(
      `INSERT INTO wish_items (
        group_id,
        created_by,
        name,
        notes,
        price,
        rating,
        image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        group_id,
        created_by,
        name,
        notes,
        price,
        rating,
        image_url,
        created_at,
        updated_at,
        version`,
      [
        groupId,
        userId,
        item.name.trim(),
        item.notes || null,
        item.price || null,
        item.rating || 0,
        item.image_url || null,
      ]
    );

    const row = result.rows[0];

    return {
      id: row.id,
      group_id: row.group_id,
      created_by: row.created_by,
      name: row.name,
      notes: row.notes || undefined,
      price: row.price ? parseFloat(row.price) : undefined,
      rating: row.rating ? parseInt(row.rating) : 0,
      image_url: row.image_url || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      version: parseInt(row.version) || 1,
    };
  }

  // Update wish item
  static async updateWishItem(userId: string, itemId: string, updates: Partial<WishItem>): Promise<WishItem> {
    // Get the item first to check permissions
    const item = await this.getWishItemById(userId, itemId);
    if (!item) {
      throw new AppError('Wish item not found', 404);
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name.trim());
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes || null);
    }
    if (updates.price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      values.push(updates.price || null);
    }
    if (updates.rating !== undefined) {
      updateFields.push(`rating = $${paramIndex++}`);
      values.push(updates.rating || 0);
    }
    if (updates.image_url !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      values.push(updates.image_url || null);
    }

    if (updateFields.length === 0) {
      return item; // No updates
    }

    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`version = version + 1`);
    values.push(itemId);

    const result = await query(
      `UPDATE wish_items 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        id,
        group_id,
        created_by,
        name,
        notes,
        price,
        rating,
        image_url,
        created_at,
        updated_at,
        version`,
      values
    );

    const row = result.rows[0];

    return {
      id: row.id,
      group_id: row.group_id,
      created_by: row.created_by,
      name: row.name,
      notes: row.notes || undefined,
      price: row.price ? parseFloat(row.price) : undefined,
      rating: row.rating ? parseInt(row.rating) : 0,
      image_url: row.image_url || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      version: parseInt(row.version) || 1,
    };
  }

  // Delete wish item
  static async deleteWishItem(userId: string, itemId: string): Promise<void> {
    // Get the item first to check permissions
    const item = await this.getWishItemById(userId, itemId);
    if (!item) {
      throw new AppError('Wish item not found', 404);
    }

    await query(
      `UPDATE wish_items 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1`,
      [itemId]
    );
  }
}
