import { query, getClient } from '../config/database';
import { FoodItem, FoodItemEvent } from '../models';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';

export class FoodItemService {
  // Create food item
  static async createFoodItem(userId: string, itemData: Partial<FoodItem>): Promise<FoodItem> {
    const { group_id, name, brand, quantity, unit, category_id, location_id, purchase_date, expiry_date, notes, image_url, barcode, purchase_price } = itemData;

    if (!group_id || !name) {
      throw new AppError('group_id and name are required', 400);
    }

    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(group_id, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `INSERT INTO food_items (
        group_id, created_by, name, brand, quantity, unit, 
        category_id, location_id, purchase_date, expiry_date, 
        notes, image_url, barcode, purchase_price, 
        original_quantity, remaining_quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $5, $5)
      RETURNING *`,
      [group_id, userId, name, brand, quantity || 1, unit, category_id, location_id, purchase_date, expiry_date, notes, image_url, barcode, purchase_price]
    );

    return result.rows[0];
  }

  // Get food items for a group
  static async getFoodItems(userId: string, groupId: string, filters?: any): Promise<FoodItem[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    let whereClause = 'WHERE fi.group_id = $1 AND fi.deleted_at IS NULL';
    const params: any[] = [groupId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.category_id) {
      whereClause += ` AND fi.category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }

    if (filters?.location_id) {
      whereClause += ` AND fi.location_id = $${paramIndex}`;
      params.push(filters.location_id);
      paramIndex++;
    }

    if (filters?.is_consumed !== undefined) {
      whereClause += ` AND fi.is_consumed = $${paramIndex}`;
      params.push(filters.is_consumed);
      paramIndex++;
    }

    // Filter by expiry status
    if (filters?.status === 'expired') {
      whereClause += ` AND fi.expiry_date < CURRENT_DATE`;
    } else if (filters?.status === 'expiring_soon') {
      whereClause += ` AND fi.expiry_date >= CURRENT_DATE AND fi.expiry_date <= CURRENT_DATE + INTERVAL '7 days'`;
    } else if (filters?.status === 'fresh') {
      whereClause += ` AND fi.expiry_date > CURRENT_DATE + INTERVAL '7 days'`;
    }

    const result = await query(
      `SELECT 
        fi.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        l.name as location_name,
        l.icon as location_icon,
        u.full_name as created_by_name,
        CASE 
          WHEN fi.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN fi.expiry_date >= CURRENT_DATE AND fi.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
          ELSE 'fresh'
        END as status,
        (fi.expiry_date - CURRENT_DATE) as days_until_expiry
       FROM food_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       LEFT JOIN locations l ON fi.location_id = l.id
       LEFT JOIN users u ON fi.created_by = u.id
       ${whereClause}
       ORDER BY fi.expiry_date ASC, fi.created_at DESC`,
      params
    );

    return result.rows;
  }

  // Get single food item
  static async getFoodItemById(userId: string, itemId: string): Promise<FoodItem> {
    const result = await query(
      `SELECT 
        fi.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        l.name as location_name,
        l.icon as location_icon,
        u.full_name as created_by_name,
        CASE 
          WHEN fi.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN fi.expiry_date >= CURRENT_DATE AND fi.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
          ELSE 'fresh'
        END as status,
        (fi.expiry_date - CURRENT_DATE) as days_until_expiry
       FROM food_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       LEFT JOIN locations l ON fi.location_id = l.id
       LEFT JOIN users u ON fi.created_by = u.id
       WHERE fi.id = $1 AND fi.deleted_at IS NULL`,
      [itemId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Food item not found', 404);
    }

    const item = result.rows[0];

    // Check if user has access to this item's group
    const isMember = await GroupService.checkGroupPermission(item.group_id, userId);
    if (!isMember) {
      throw new AppError('Access denied', 403);
    }

    return item;
  }

  // Update food item
  static async updateFoodItem(userId: string, itemId: string, updates: Partial<FoodItem>): Promise<FoodItem> {
    // Get item and check permissions (verify it exists and user has access)
    await this.getFoodItemById(userId, itemId);

    const allowedFields = ['name', 'brand', 'quantity', 'unit', 'category_id', 'location_id', 'purchase_date', 'expiry_date', 'notes', 'image_url', 'barcode', 'purchase_price', 'remaining_quantity'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [itemId, ...fields.map(field => (updates as any)[field])];

    const result = await query(
      `UPDATE food_items SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete food item (soft delete)
  static async deleteFoodItem(userId: string, itemId: string): Promise<void> {
    // Get item and check permissions
    await this.getFoodItemById(userId, itemId);

    await query(
      `UPDATE food_items SET deleted_at = NOW() WHERE id = $1`,
      [itemId]
    );
  }

  // Log food item event (consumption/disposal)
  static async logFoodItemEvent(userId: string, itemId: string, eventData: Partial<FoodItemEvent>): Promise<FoodItemEvent> {
    const { event_type, quantity_affected, disposal_reason, price_at_disposal } = eventData;

    if (!event_type) {
      throw new AppError('event_type is required', 400);
    }

    // Get item and check permissions
    const item = await this.getFoodItemById(userId, itemId);

    // Validate disposal reason for thrown_away events
    if (event_type === 'thrown_away' && !disposal_reason) {
      throw new AppError('disposal_reason is required for thrown_away events', 400);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Insert event (trigger will auto-calculate days_since_purchase and days_before_expiry)
      const eventResult = await client.query(
        `INSERT INTO food_item_events (
          food_item_id, group_id, user_id, event_type, 
          quantity_affected, disposal_reason, price_at_disposal,
          location_at_disposal, category_at_disposal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          itemId,
          item.group_id,
          userId,
          event_type,
          quantity_affected || 1,
          disposal_reason,
          price_at_disposal,
          item.location_id,
          item.category_id
        ]
      );

      // Update food item based on event type
      if (event_type === 'used_completely' || event_type === 'thrown_away' || event_type === 'expired_unused') {
        // Mark as consumed
        await client.query(
          `UPDATE food_items 
           SET is_consumed = true, consumed_at = NOW(), consumed_by = $1, remaining_quantity = 0
           WHERE id = $2`,
          [userId, itemId]
        );
      } else if (event_type === 'used_partially') {
        // Decrease remaining quantity
        const newQuantity = Math.max(0, (item.remaining_quantity || item.quantity) - (quantity_affected || 1));
        await client.query(
          `UPDATE food_items 
           SET remaining_quantity = $1, last_used_at = NOW(), usage_frequency = usage_frequency + 1
           WHERE id = $2`,
          [newQuantity, itemId]
        );
      }

      await client.query('COMMIT');

      return eventResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get event history for a food item
  static async getFoodItemEvents(userId: string, itemId: string): Promise<FoodItemEvent[]> {
    // Get item and check permissions
    await this.getFoodItemById(userId, itemId);

    const result = await query(
      `SELECT 
        fie.*,
        u.full_name as user_name,
        c.name as category_name,
        l.name as location_name
       FROM food_item_events fie
       LEFT JOIN users u ON fie.user_id = u.id
       LEFT JOIN categories c ON fie.category_at_disposal = c.id
       LEFT JOIN locations l ON fie.location_at_disposal = l.id
       WHERE fie.food_item_id = $1
       ORDER BY fie.created_at DESC`,
      [itemId]
    );

    return result.rows;
  }

  // Get items expiring soon (for notifications)
  static async getExpiringItems(userId: string, groupId: string, daysAhead: number = 3): Promise<FoodItem[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `SELECT 
        fi.*,
        c.name as category_name,
        l.name as location_name,
        (fi.expiry_date - CURRENT_DATE) as days_until_expiry
       FROM food_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       LEFT JOIN locations l ON fi.location_id = l.id
       WHERE fi.group_id = $1 
         AND fi.deleted_at IS NULL 
         AND fi.is_consumed = false
         AND fi.expiry_date >= CURRENT_DATE 
         AND fi.expiry_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
       ORDER BY fi.expiry_date ASC`,
      [groupId]
    );

    return result.rows;
  }

  // Get expired items
  static async getExpiredItems(userId: string, groupId: string): Promise<FoodItem[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `SELECT 
        fi.*,
        c.name as category_name,
        l.name as location_name,
        (CURRENT_DATE - fi.expiry_date) as days_expired
       FROM food_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       LEFT JOIN locations l ON fi.location_id = l.id
       WHERE fi.group_id = $1 
         AND fi.deleted_at IS NULL 
         AND fi.is_consumed = false
         AND fi.expiry_date < CURRENT_DATE
       ORDER BY fi.expiry_date ASC`,
      [groupId]
    );

    return result.rows;
  }
}

