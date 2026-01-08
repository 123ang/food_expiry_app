import { query } from '../config/database';
import { Location } from '../models';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';

export class LocationService {
  // Get all locations (default + group-specific)
  static async getLocations(userId: string, groupId?: string): Promise<Location[]> {
    let whereClause = 'WHERE l.deleted_at IS NULL AND (l.is_default = true';
    const params: any[] = [];

    if (groupId) {
      // Check if user is member of the group
      const isMember = await GroupService.checkGroupPermission(groupId, userId);
      if (!isMember) {
        throw new AppError('Access denied to this group', 403);
      }

      whereClause += ' OR l.group_id = $1)';
      params.push(groupId);
    } else {
      whereClause += ')';
    }

    const result = await query(
      `SELECT * FROM locations ${whereClause} ORDER BY l.is_default DESC, l.name ASC`,
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
    const { name, icon, temperature_zone } = locationData;

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
      `INSERT INTO locations (name, icon, temperature_zone, group_id, created_by, is_default)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [name, icon, temperature_zone, groupId, userId]
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

    const allowedFields = ['name', 'icon', 'temperature_zone'];
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

