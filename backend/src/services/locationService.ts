import { query } from '../config/database';
import { Location } from '../models';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';

export class LocationService {
  // Get all locations (default + group-specific)
  static async getLocations(userId: string, groupId?: string): Promise<Location[]> {
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

      // When group_id is provided, ONLY return locations for that specific group
      // Don't include defaults from other groups
      whereClause = 'WHERE l.deleted_at IS NULL AND l.group_id = $1';
      params.push(groupId);
    } else {
      // When no group_id, return default locations (is_default = true OR group_id IS NULL)
      whereClause = 'WHERE l.deleted_at IS NULL AND (l.is_default = true OR l.group_id IS NULL)';
    }

    const result = await query(
      `SELECT l.* FROM locations l ${whereClause} ORDER BY l.is_default DESC NULLS LAST, l.group_id NULLS FIRST, l.name ASC`,
      params
    );

    return result.rows;
  }

  // Get location by ID
  static async getLocationById(userId: string, locationId: string): Promise<Location> {
    const result = await query(
      `SELECT * FROM locations WHERE id = $1 AND deleted_at IS NULL`,
      [locationId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Location not found', 404);
    }

    const location = result.rows[0];

    // If it's a group-specific location, check permissions
    if (location.group_id) {
      const isMember = await GroupService.checkGroupPermission(location.group_id, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    return location;
  }

  // Create custom location
  static async createLocation(userId: string, groupId: string, locationData: Partial<Location>): Promise<Location> {
    const { name, icon } = locationData;

    if (!name) {
      throw new AppError('Location name is required', 400);
    }

    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    // Check if location with same name already exists in this group
    const existing = await query(
      `SELECT id FROM locations WHERE name = $1 AND group_id = $2 AND deleted_at IS NULL`,
      [name, groupId]
    );

    if (existing.rows.length > 0) {
      throw new AppError('Location with this name already exists in this group', 409);
    }

    const result = await query(
      `INSERT INTO locations (name, icon, translation_key, group_id, created_by, is_default)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [name, icon, null, groupId, userId]
    );

    return result.rows[0];
  }

  // Update location
  static async updateLocation(userId: string, locationId: string, updates: Partial<Location>): Promise<Location> {
    const location = await this.getLocationById(userId, locationId);

    // Cannot update default locations
    if (location.is_default) {
      throw new AppError('Cannot update default locations', 403);
    }

    // Check if user is member of the group
    if (location.group_id) {
      const isMember = await GroupService.checkGroupPermission(location.group_id, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    const allowedFields = ['name', 'icon', 'translation_key'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [locationId, ...fields.map(field => (updates as any)[field])];

    const result = await query(
      `UPDATE locations SET ${setClause}, version = version + 1 WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete location (soft delete)
  static async deleteLocation(userId: string, locationId: string): Promise<void> {
    const location = await this.getLocationById(userId, locationId);

    // Cannot delete default locations
    if (location.is_default) {
      throw new AppError('Cannot delete default locations', 403);
    }

    // Check if user is member of the group
    if (location.group_id) {
      const isMember = await GroupService.checkGroupPermission(location.group_id, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    await query(
      `UPDATE locations SET deleted_at = NOW() WHERE id = $1`,
      [locationId]
    );
  }
}

