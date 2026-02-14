import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';
import { ShoppingItem } from '../models';

function mapShoppingRow(row: any): ShoppingItem {
  return {
    id: row.id,
    group_id: row.group_id,
    created_by: row.created_by,
    name: row.name,
    quantity: parseInt(row.quantity) || 1,
    unit: row.unit || undefined,
    where_to_buy: row.where_to_buy || undefined,
    category_id: row.category_id || undefined,
    is_purchased: Boolean(row.is_purchased),
    purchased_at: row.purchased_at ? new Date(row.purchased_at) : undefined,
    purchased_by: row.purchased_by || undefined,
    moved_to_inventory: Boolean(row.moved_to_inventory),
    inventory_item_id: row.inventory_item_id || undefined,
    notes: row.notes || undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    version: parseInt(row.version) || 1,
  };
}

export class ShoppingService {
  // Get shopping items for a group
  static async getShoppingItems(userId: string, groupId: string, includePurchased: boolean = false): Promise<ShoppingItem[]> {
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
        quantity,
        unit,
        where_to_buy,
        category_id,
        is_purchased,
        purchased_at,
        purchased_by,
        moved_to_inventory,
        inventory_item_id,
        notes,
        created_at,
        updated_at,
        version
      FROM shopping_items
      WHERE group_id = $1 
        AND deleted_at IS NULL
    `;

    const params: any[] = [groupId];

    if (!includePurchased) {
      sql += ' AND is_purchased = false';
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    return result.rows.map((row: any) => mapShoppingRow(row));
  }

  // Get shopping item by ID
  static async getShoppingItemById(userId: string, itemId: string): Promise<ShoppingItem | null> {
    const result = await query(
      `SELECT 
        id, group_id, created_by, name, quantity, unit, where_to_buy, category_id,
        is_purchased, purchased_at, purchased_by, moved_to_inventory, inventory_item_id, notes,
        created_at, updated_at, version
      FROM shopping_items
      WHERE id = $1 AND deleted_at IS NULL`,
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

    return mapShoppingRow(row);
  }

  // Create shopping item
  static async createShoppingItem(userId: string, groupId: string, item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    if (!item.name || !item.name.trim()) {
      throw new AppError('Item name is required', 400);
    }

    const result = await query(
      `INSERT INTO shopping_items (
        group_id, created_by, name, quantity, unit, where_to_buy, category_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, group_id, created_by, name, quantity, unit, where_to_buy, category_id,
        is_purchased, purchased_at, purchased_by, moved_to_inventory, inventory_item_id, notes,
        created_at, updated_at, version`,
      [
        groupId,
        userId,
        item.name.trim(),
        item.quantity || 1,
        item.unit || null,
        item.where_to_buy || null,
        item.category_id || null,
        item.notes || null,
      ]
    );

    return mapShoppingRow(result.rows[0]);
  }

  // Update shopping item
  static async updateShoppingItem(userId: string, itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    // Get the item first to check permissions
    const item = await this.getShoppingItemById(userId, itemId);
    if (!item) {
      throw new AppError('Shopping item not found', 404);
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name.trim());
    }
    if (updates.quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex++}`);
      values.push(updates.quantity);
    }
    if (updates.unit !== undefined) {
      updateFields.push(`unit = $${paramIndex++}`);
      values.push(updates.unit || null);
    }
    if (updates.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      values.push(updates.category_id || null);
    }
    if (updates.is_purchased !== undefined) {
      updateFields.push(`is_purchased = $${paramIndex++}`);
      values.push(updates.is_purchased);
      if (updates.is_purchased) {
        updateFields.push(`purchased_at = $${paramIndex++}`);
        values.push(new Date());
        updateFields.push(`purchased_by = $${paramIndex++}`);
        values.push(userId);
      } else {
        updateFields.push(`purchased_at = $${paramIndex++}`);
        values.push(null);
        updateFields.push(`purchased_by = $${paramIndex++}`);
        values.push(null);
        updateFields.push(`moved_to_inventory = $${paramIndex++}`);
        values.push(false);
        updateFields.push(`inventory_item_id = $${paramIndex++}`);
        values.push(null);
      }
    }
    if (updates.where_to_buy !== undefined) {
      updateFields.push(`where_to_buy = $${paramIndex++}`);
      values.push(updates.where_to_buy || null);
    }
    if (updates.moved_to_inventory !== undefined) {
      updateFields.push(`moved_to_inventory = $${paramIndex++}`);
      values.push(updates.moved_to_inventory);
    }
    if (updates.inventory_item_id !== undefined) {
      updateFields.push(`inventory_item_id = $${paramIndex++}`);
      values.push(updates.inventory_item_id || null);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes || null);
    }

    if (updateFields.length === 0) {
      return item; // No updates
    }

    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`version = version + 1`);
    values.push(itemId);

    const result = await query(
      `UPDATE shopping_items 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, group_id, created_by, name, quantity, unit, where_to_buy, category_id,
        is_purchased, purchased_at, purchased_by, moved_to_inventory, inventory_item_id, notes,
        created_at, updated_at, version`,
      values
    );

    return mapShoppingRow(result.rows[0]);
  }

  // Delete shopping item
  static async deleteShoppingItem(userId: string, itemId: string): Promise<void> {
    // Get the item first to check permissions
    const item = await this.getShoppingItemById(userId, itemId);
    if (!item) {
      throw new AppError('Shopping item not found', 404);
    }

    await query(
      `UPDATE shopping_items 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1`,
      [itemId]
    );
  }

  // Toggle purchase status
  static async togglePurchaseStatus(userId: string, itemId: string): Promise<ShoppingItem> {
    const item = await this.getShoppingItemById(userId, itemId);
    if (!item) {
      throw new AppError('Shopping item not found', 404);
    }

    return this.updateShoppingItem(userId, itemId, {
      is_purchased: !item.is_purchased,
    });
  }

  // Clear purchased items
  static async clearPurchasedItems(userId: string, groupId: string): Promise<number> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `UPDATE shopping_items 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE group_id = $1 AND is_purchased = true AND deleted_at IS NULL
      RETURNING id`,
      [groupId]
    );

    return result.rows.length;
  }
}
