import { query } from '../config/database';
import { Category } from '../models';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';

export class CategoryService {
  // Get all categories (default + group-specific)
  static async getCategories(userId: string, groupId?: string): Promise<Category[]> {
    let whereClause: string;
    const params: any[] = [];

    if (groupId) {
      // Check if user is member of the group
      try {
        const isMember = await GroupService.checkGroupPermission(groupId, userId);
        if (!isMember) {
          throw new AppError('Access denied to this group', 403);
        }
      } catch (err: any) {
        // If checkGroupPermission throws an error (e.g., database error), wrap it
        if (err instanceof AppError) {
          throw err;
        }
        throw new AppError('Failed to verify group membership', 500);
      }

      // When group_id is provided, ONLY return categories for that specific group
      // Don't include defaults from other groups
      whereClause = 'WHERE c.deleted_at IS NULL AND c.group_id = $1';
      params.push(groupId);
    } else {
      // When no group_id, return default categories (is_default = true OR group_id IS NULL)
      whereClause = 'WHERE c.deleted_at IS NULL AND (c.is_default = true OR c.group_id IS NULL)';
    }

    const result = await query(
      `SELECT c.* FROM categories c ${whereClause} ORDER BY c.is_default DESC NULLS LAST, c.section NULLS LAST, c.sort_order NULLS LAST, c.name ASC`,
      params
    );

    return result.rows;
  }

  // Get category by ID
  static async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    const result = await query(
      `SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`,
      [categoryId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Category not found', 404);
    }

    const category = result.rows[0];

    // If it's a group-specific category, check permissions
    if (category.group_id) {
      const isMember = await GroupService.checkGroupPermission(category.group_id, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    return category;
  }

  // Create custom category
  static async createCategory(userId: string, groupId: string, categoryData: Partial<Category>): Promise<Category> {
    const { name, icon, color, translation_key } = categoryData;

    if (!name) {
      throw new AppError('Category name is required', 400);
    }

    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    // Check if category with same name already exists in this group
    const existing = await query(
      `SELECT id FROM categories WHERE name = $1 AND group_id = $2 AND deleted_at IS NULL`,
      [name, groupId]
    );

    if (existing.rows.length > 0) {
      throw new AppError('Category with this name already exists in this group', 409);
    }

    const result = await query(
      `INSERT INTO categories (name, icon, color, translation_key, group_id, created_by, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [name, icon || null, color || null, translation_key || null, groupId, userId]
    );

    return result.rows[0];
  }

  // Update category
  static async updateCategory(userId: string, categoryId: string, updates: Partial<Category>): Promise<Category> {
    const category = await this.getCategoryById(userId, categoryId);

    // Cannot update default categories
    if (category.is_default) {
      throw new AppError('Cannot update default categories', 403);
    }

    // Check if user is member of the group
    if (category.group_id) {
      const isMember = await GroupService.checkGroupPermission(category.group_id, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    const allowedFields = ['name', 'icon', 'color', 'translation_key'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [categoryId, ...fields.map(field => (updates as any)[field])];

    const result = await query(
      `UPDATE categories SET ${setClause}, version = version + 1 WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete category (soft delete)
  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.getCategoryById(userId, categoryId);

    // Cannot delete default categories
    if (category.is_default) {
      throw new AppError('Cannot delete default categories', 403);
    }

    // Check if user is member of the group
    if (category.group_id) {
      const isMember = await GroupService.checkGroupPermission(category.group_id, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    await query(
      `UPDATE categories SET deleted_at = NOW() WHERE id = $1`,
      [categoryId]
    );
  }
}

