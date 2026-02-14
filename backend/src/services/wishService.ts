import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';
import { WishItem } from '../models';

const RATING_MIN = 1;
const RATING_MAX = 5;
const RATING_DEFAULT = 3;

function validateRating(rating: number | undefined): number {
  const r = rating ?? RATING_DEFAULT;
  if (r < RATING_MIN || r > RATING_MAX) {
    throw new AppError(`Rating (desire level) must be between ${RATING_MIN} and ${RATING_MAX}`, 400);
  }
  return r;
}

function mapWishRow(row: any): WishItem {
  return {
    id: row.id,
    group_id: row.group_id,
    created_by: row.created_by,
    name: row.name,
    notes: row.notes || undefined,
    price: row.price != null ? parseFloat(row.price) : undefined,
    currency_code: row.currency_code || undefined,
    rating: row.rating != null ? parseInt(row.rating, 10) : RATING_DEFAULT,
    image_url: row.image_url || undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    version: parseInt(row.version, 10) || 1,
  };
}

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
        id, group_id, created_by, name, notes, price, currency_code, rating, image_url,
        created_at, updated_at, version
      FROM wish_items
      WHERE group_id = $1 
        AND deleted_at IS NULL
    `;

    const params: any[] = [groupId];

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    return result.rows.map((row: any) => mapWishRow(row));
  }

  // Get wish item by ID
  static async getWishItemById(userId: string, itemId: string): Promise<WishItem | null> {
    const result = await query(
      `SELECT id, group_id, created_by, name, notes, price, currency_code, rating, image_url,
        created_at, updated_at, version
      FROM wish_items WHERE id = $1 AND deleted_at IS NULL`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const isMember = await GroupService.checkGroupPermission(row.group_id, userId);
    if (!isMember) {
      throw new AppError('Access denied to this item', 403);
    }

    return mapWishRow(row);
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

    const rating = validateRating(item.rating != null ? Number(item.rating) : undefined);

    const result = await query(
      `INSERT INTO wish_items (
        group_id, created_by, name, notes, price, currency_code, rating, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, group_id, created_by, name, notes, price, currency_code, rating, image_url,
        created_at, updated_at, version`,
      [
        groupId,
        userId,
        item.name.trim(),
        item.notes || null,
        item.price != null ? item.price : null,
        item.currency_code || null,
        rating,
        item.image_url || null,
      ]
    );

    return mapWishRow(result.rows[0]);
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
      const rating = validateRating(Number(updates.rating));
      updateFields.push(`rating = $${paramIndex++}`);
      values.push(rating);
    }
    if (updates.currency_code !== undefined) {
      updateFields.push(`currency_code = $${paramIndex++}`);
      values.push(updates.currency_code || null);
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
      RETURNING id, group_id, created_by, name, notes, price, currency_code, rating, image_url,
        created_at, updated_at, version`,
      values
    );

    return mapWishRow(result.rows[0]);
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
