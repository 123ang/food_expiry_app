import { getDatabase, getCurrentDate, calculateDaysUntilExpiry, isUsingFallbackStorage, getFallbackStorage, queuedDatabaseOperation } from './database';
import { Category, Location, FoodItem, FoodItemWithDetails, hasId } from './models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentDateTimeISO } from '../utils/dateUtils';

// Generic Repository interface
interface Repository<T> {
  getAll: (group_id?: string) => Promise<T[]>;
  getById: (id: number) => Promise<T | null>;
  create: (item: Omit<T, 'id'>) => Promise<number>;
  update: (item: T) => Promise<void>;
  delete: (id: number) => Promise<void>;
}

// Interface for sync related operations
interface SyncRepository<T> {
  getItemsForSync: (groupId: string, lastSyncTime: string) => Promise<T[]>;
  updateSyncStatus: (id: number, status: 'pending' | 'synced' | 'conflict') => Promise<void>;
  updateFromCloud: (cloudItem: any) => Promise<number>;
  getByCloudId: (cloudId: string) => Promise<T | null>;
}

// Combined interface for repositories that support sync
interface SyncableRepository<T> extends Repository<T>, SyncRepository<T> {}

// Simplified database getter that uses the cached version from database.ts
const getDatabaseSafely = async (): Promise<any> => {
  try {
    return await getDatabase();
  } catch (error) {
    
    return null;
  }
};

// Category Repository
export const CategoryRepository: SyncableRepository<Category> = {
  // Get all categories (optionally filtered by group_id)
  getAll: async (group_id?: string): Promise<Category[]> => {
    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackDb = getFallbackStorage();
          const allCategories = await fallbackDb.getAllCategories();
          // Filter by group_id if provided
          if (group_id) {
            return allCategories.filter((cat: any) => cat.group_id === group_id || cat.group_id === null);
          }
          return allCategories;
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          const allCategories = await fallbackDb.getAllCategories();
          if (group_id) {
            return allCategories.filter((cat: any) => cat.group_id === group_id || cat.group_id === null);
          }
          return allCategories;
        }
        
        // Validate database connection before use
        try {
          await db.getAllAsync('SELECT 1'); // Test query to ensure connection is valid
        } catch (connectionError) {
          
          const fallbackDb = getFallbackStorage();
          const allCategories = await fallbackDb.getAllCategories();
          if (group_id) {
            return allCategories.filter((cat: any) => cat.group_id === group_id || cat.group_id === null);
          }
          return allCategories;
        }
        
        // Regular SQLite operation with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount < maxRetries) {
          try {
            // Build query with optional group_id filter
            let query = 'SELECT * FROM categories';
            const params: any[] = [];
            
            if (group_id) {
              // Only include categories for this specific group (exclude NULL group_id to prevent duplicates)
              query += ' WHERE group_id = ?';
              params.push(group_id);
            }
            
            query += ' ORDER BY name';
            
            const result = await db.getAllAsync(query, params) as any[];
            return result.map(row => ({
              id: row.id as number,
              name: row.name as string,
              icon: row.icon as string,
              translationKey: row.translation_key as string | undefined,
              group_id: row.group_id as string | undefined,
              cloud_id: row.cloud_id as string | undefined
            }));
          } catch (statementError) {
            retryCount++;
            if (retryCount >= maxRetries) {
              // If SQLite fails completely, fall back to storage
              
              const fallbackDb = getFallbackStorage();
              const allCategories = await fallbackDb.getAllCategories();
              if (group_id) {
                return allCategories.filter((cat: any) => cat.group_id === group_id || cat.group_id === null);
              }
              return allCategories;
            }
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Should never reach here, but just in case
        const fallbackDb = getFallbackStorage();
        const allCategories = await fallbackDb.getAllCategories();
        if (group_id) {
          return allCategories.filter((cat: any) => cat.group_id === group_id || cat.group_id === null);
        }
        return allCategories;
        
      } catch (error) {
        
        // As last resort, try fallback storage
        try {
          const fallbackDb = getFallbackStorage();
          const allCategories = await fallbackDb.getAllCategories();
          if (group_id) {
            return allCategories.filter((cat: any) => cat.group_id === group_id || cat.group_id === null);
          }
          return allCategories;
        } catch (fallbackError) {
          
          return []; // Return empty array rather than throwing
        }
      }
    }, 'Category.getAll');
  },

  // Get category by ID
  getById: async (id: number): Promise<Category | null> => {
    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackDb = getFallbackStorage();
          const categories = await fallbackDb.getAllCategories();
          return categories.find((cat: any) => cat.id === id) || null;
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          const categories = await fallbackDb.getAllCategories();
          return categories.find((cat: any) => cat.id === id) || null;
        }
        
        // Regular SQLite operation
        const result = await db.getFirstAsync('SELECT * FROM categories WHERE id = ?', [id]) as any;
        
        if (result) {
          return {
            id: result.id as number,
            name: result.name as string,
            icon: result.icon as string,
            translationKey: result.translation_key as string | undefined
          };
        }
        return null;
      } catch (error) {
        
        throw error;
      }
    }, `Category.getById(id:${id})`);
  },

  // Create a new category
  create: async (item: Omit<Category, 'id'>): Promise<number> => {
    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackData = await AsyncStorage.getItem('fallback_data');
          const data = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
          const newId = Math.max(0, ...data.categories.map((c: any) => c.id || 0)) + 1;
          const newCategory = { ...item, id: newId };
          data.categories.push(newCategory);
          await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
          return newId;
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackData = await AsyncStorage.getItem('fallback_data');
          const data = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
          const newId = Math.max(0, ...data.categories.map((c: any) => c.id || 0)) + 1;
          const newCategory = { ...item, id: newId };
          data.categories.push(newCategory);
          await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
          return newId;
        }
        
        // Regular SQLite operation
        const result = await db.runAsync(
          'INSERT INTO categories (name, icon, translation_key) VALUES (?, ?, ?)',
          [item.name, item.icon, item.translationKey || null]
        );
        return result.lastInsertRowId;
      } catch (error) {
        
        throw error;
      }
    }, `Category.create("${item.name}")`);
  },

  // Update an existing category
  update: async (item: Category): Promise<void> => {
    if (!hasId(item)) {
      throw new Error('Category ID is required for update');
    }

    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get the existing category to check if it's a default one
        const existing = await db.getFirstAsync(
          'SELECT * FROM categories WHERE id = ?',
          [item.id]
        ) as any;

        if (!existing) {
          throw new Error('Category not found');
        }

        // For default categories (id <= 8), if the name has been edited (not a translation key),
        // clear the translation_key field
        if (item.id <= 8 && !item.name.startsWith('category.')) {
          await db.runAsync(
            'UPDATE categories SET name = ?, icon = ?, translation_key = NULL WHERE id = ?',
            [item.name, item.icon, item.id]
          );
        } else {
          // For user-created categories or unedited default categories
          await db.runAsync(
            'UPDATE categories SET name = ?, icon = ?, translation_key = ? WHERE id = ?',
            [item.name, item.icon, item.name.startsWith('category.') ? item.name : null, item.id]
          );
        }
      } catch (error) {
        throw new Error(`Failed to update category: ${error}`);
      }
    });
  },

  // Delete a category
  delete: async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('Invalid category ID');
    }

    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Track deletion for sync before deleting
        try {
          // Get the cloud_id if available before deletion
          const item = await db.getFirstAsync('SELECT cloud_id, group_id FROM categories WHERE id = ?', [id]);
          if (item) {
            // Track the deletion for sync
            await db.runAsync(
              'INSERT INTO deleted_items (table_name, item_id, cloud_id, group_id, deleted_at) VALUES (?, ?, ?, ?, ?)',
              ['categories', id, item.cloud_id, item.group_id, getCurrentDateTimeISO()]
            );
          }
        } catch (e) {
          console.warn('Could not track category deletion for sync:', e);
        }
        
        // Now delete the actual item
        await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
      } catch (error) {
        
        throw error;
      }
    }, `Category.delete(id:${id})`);
  },
  
  // Get items for sync
  getItemsForSync: async (groupId: string, lastSyncTime: string): Promise<Category[]> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Get items modified since last sync or with pending sync status
        const items = await db.getAllAsync(
          `SELECT * FROM categories WHERE 
           (updated_at > ? OR sync_status = 'pending' OR sync_status = 'conflict') AND
           group_id = ?`,
          [lastSyncTime, groupId]
        );
        
        return items.map((item: any) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          translationKey: item.translation_key,
          cloud_id: item.cloud_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          sync_status: item.sync_status
        }));
      } catch (error) {
        console.error('Error getting items for sync:', error);
        throw error;
      }
    }, 'Category.getItemsForSync');
  },
  
  // Update sync status
  updateSyncStatus: async (id: number, status: 'pending' | 'synced' | 'conflict'): Promise<void> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        await db.runAsync(
          'UPDATE categories SET sync_status = ? WHERE id = ?',
          [status, id]
        );
      } catch (error) {
        console.error('Error updating sync status:', error);
        throw error;
      }
    }, `Category.updateSyncStatus(id:${id})`);
  },
  
  // Update from cloud data
  updateFromCloud: async (cloudItem: any): Promise<number> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Check if item with this cloud_id already exists
        const existingItem = await db.getFirstAsync(
          'SELECT id, updated_at FROM categories WHERE cloud_id = ?',
          [cloudItem.cloud_id]
        );
        
        if (existingItem) {
          // Update existing item
          // Compare timestamps to prevent overwriting newer local changes
          if (new Date(cloudItem.updated_at) >= new Date(existingItem.updated_at)) {
            await db.runAsync(
              `UPDATE categories SET 
               name = ?, icon = ?, translation_key = ?, group_id = ?, updated_at = ?, sync_status = 'synced' 
               WHERE id = ?`,
              [cloudItem.name, cloudItem.icon, cloudItem.translation_key, cloudItem.group_id || null, cloudItem.updated_at, existingItem.id]
            );
          } else {
            // Local copy is newer, mark as conflict
            await db.runAsync(
              'UPDATE categories SET sync_status = ? WHERE id = ?',
              ['conflict', existingItem.id]
            );
          }
          return existingItem.id;
        } else {
          // Insert new item
          const result = await db.runAsync(
            `INSERT INTO categories 
             (name, icon, translation_key, cloud_id, group_id, created_at, updated_at, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [cloudItem.name, cloudItem.icon, cloudItem.translation_key, 
             cloudItem.cloud_id, cloudItem.group_id || null, cloudItem.created_at, cloudItem.updated_at]
          );
          return result.lastInsertRowId;
        }
      } catch (error) {
        console.error('Error updating from cloud:', error);
        throw error;
      }
    }, 'Category.updateFromCloud');
  },
  
  // Get category by cloud ID
  getByCloudId: async (cloudId: string): Promise<Category | null> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        const result = await db.getFirstAsync('SELECT * FROM categories WHERE cloud_id = ?', [cloudId]);
        
        if (result) {
          return {
            id: result.id,
            name: result.name,
            icon: result.icon,
            translationKey: result.translation_key,
            cloud_id: result.cloud_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
            sync_status: result.sync_status
          };
        }
        return null;
      } catch (error) {
        console.error('Error getting item by cloud_id:', error);
        throw error;
      }
    }, `Category.getByCloudId(${cloudId})`);
  }
};

// Location Repository
export const LocationRepository: SyncableRepository<Location> = {
  // Get all locations (optionally filtered by group_id)
  getAll: async (group_id?: string): Promise<Location[]> => {
    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackDb = getFallbackStorage();
          const allLocations = await fallbackDb.getAllLocations();
          // Filter by group_id if provided
          if (group_id) {
            return allLocations.filter((loc: any) => loc.group_id === group_id || loc.group_id === null);
          }
          return allLocations;
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          const allLocations = await fallbackDb.getAllLocations();
          if (group_id) {
            return allLocations.filter((loc: any) => loc.group_id === group_id || loc.group_id === null);
          }
          return allLocations;
        }
        
        // Validate database connection before use
        try {
          await db.getAllAsync('SELECT 1'); // Test query to ensure connection is valid
        } catch (connectionError) {
          
          const fallbackDb = getFallbackStorage();
          const allLocations = await fallbackDb.getAllLocations();
          if (group_id) {
            return allLocations.filter((loc: any) => loc.group_id === group_id || loc.group_id === null);
          }
          return allLocations;
        }
        
        // Regular SQLite operation with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount < maxRetries) {
          try {
            // Build query with optional group_id filter
            let query = 'SELECT * FROM locations';
            const params: any[] = [];
            
            if (group_id) {
              // Only include locations for this specific group (exclude NULL group_id to prevent duplicates)
              query += ' WHERE group_id = ?';
              params.push(group_id);
            }
            
            query += ' ORDER BY name';
            
            const result = await db.getAllAsync(query, params) as any[];
            return result.map(row => ({
              id: row.id as number,
              name: row.name as string,
              icon: row.icon as string,
              translationKey: row.translation_key as string | undefined,
              group_id: row.group_id as string | undefined,
              cloud_id: row.cloud_id as string | undefined
            }));
          } catch (statementError) {
            retryCount++;
            if (retryCount >= maxRetries) {
              // If SQLite fails completely, fall back to storage
              
              const fallbackDb = getFallbackStorage();
              const allLocations = await fallbackDb.getAllLocations();
              if (group_id) {
                return allLocations.filter((loc: any) => loc.group_id === group_id || loc.group_id === null);
              }
              return allLocations;
            }
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Should never reach here, but just in case
        const fallbackDb = getFallbackStorage();
        const allLocations = await fallbackDb.getAllLocations();
        if (group_id) {
          return allLocations.filter((loc: any) => loc.group_id === group_id || loc.group_id === null);
        }
        return allLocations;
        
      } catch (error) {
        
        // As last resort, try fallback storage
        try {
          const fallbackDb = getFallbackStorage();
          const allLocations = await fallbackDb.getAllLocations();
          if (group_id) {
            return allLocations.filter((loc: any) => loc.group_id === group_id || loc.group_id === null);
          }
          return allLocations;
        } catch (fallbackError) {
          
          return []; // Return empty array rather than throwing
        }
      }
    }, 'Location.getAll');
  },

  // Get location by ID
  getById: async (id: number): Promise<Location | null> => {
    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackDb = getFallbackStorage();
          const locations = await fallbackDb.getAllLocations();
          return locations.find((loc: any) => loc.id === id) || null;
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          const locations = await fallbackDb.getAllLocations();
          return locations.find((loc: any) => loc.id === id) || null;
        }
        
        // Regular SQLite operation
        const result = await db.getFirstAsync('SELECT * FROM locations WHERE id = ?', [id]) as any;
        
        if (result) {
          return {
            id: result.id as number,
            name: result.name as string,
            icon: result.icon as string,
            translationKey: result.translation_key as string | undefined
          };
        }
        return null;
      } catch (error) {
        
        throw error;
      }
    }, `Location.getById(id:${id})`);
  },

  // Create a new location
  create: async (item: Omit<Location, 'id'>): Promise<number> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        const result = await db.runAsync(
          'INSERT INTO locations (name, icon) VALUES (?, ?)',
          [item.name, item.icon]
        );
        return result.lastInsertRowId;
      } catch (error) {
        
        throw error;
      }
    }, `Location.create("${item.name}")`);
  },

  // Update an existing location
  update: async (item: Location): Promise<void> => {
    if (!hasId(item)) {
      throw new Error('Location ID is required for update');
    }

    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get the existing location to check if it's a default one
        const existing = await db.getFirstAsync(
          'SELECT * FROM locations WHERE id = ?',
          [item.id]
        ) as any;

        if (!existing) {
          throw new Error('Location not found');
        }

        // For default locations (id <= 4), if the name has been edited (not a translation key),
        // clear the translation_key field
        if (item.id <= 4 && !item.name.startsWith('locations.')) {
          await db.runAsync(
            'UPDATE locations SET name = ?, icon = ?, translation_key = NULL WHERE id = ?',
            [item.name, item.icon, item.id]
          );
        } else {
          // For user-created locations or unedited default locations
          await db.runAsync(
            'UPDATE locations SET name = ?, icon = ?, translation_key = ? WHERE id = ?',
            [item.name, item.icon, item.name.startsWith('locations.') ? item.name : null, item.id]
          );
        }
      } catch (error) {
        throw new Error(`Failed to update location: ${error}`);
      }
    });
  },

  // Delete a location
  delete: async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('Invalid location ID');
    }

    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Track deletion for sync before deleting
        try {
          // Get the cloud_id if available before deletion
          const item = await db.getFirstAsync('SELECT cloud_id, group_id FROM locations WHERE id = ?', [id]);
          if (item) {
            // Track the deletion for sync
            await db.runAsync(
              'INSERT INTO deleted_items (table_name, item_id, cloud_id, group_id, deleted_at) VALUES (?, ?, ?, ?, ?)',
              ['locations', id, item.cloud_id, item.group_id, getCurrentDateTimeISO()]
            );
          }
        } catch (e) {
          console.warn('Could not track location deletion for sync:', e);
        }
        
        // Now delete the actual item
        await db.runAsync('DELETE FROM locations WHERE id = ?', [id]);
      } catch (error) {
        
        throw error;
      }
    }, `Location.delete(id:${id})`);
  },
  
  // Get items for sync
  getItemsForSync: async (groupId: string, lastSyncTime: string): Promise<Location[]> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Get items modified since last sync or with pending sync status
        const items = await db.getAllAsync(
          `SELECT * FROM locations WHERE 
           (updated_at > ? OR sync_status = 'pending' OR sync_status = 'conflict') AND
           group_id = ?`,
          [lastSyncTime, groupId]
        );
        
        return items.map((item: any) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          translationKey: item.translation_key,
          cloud_id: item.cloud_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          sync_status: item.sync_status
        }));
      } catch (error) {
        console.error('Error getting items for sync:', error);
        throw error;
      }
    }, 'Location.getItemsForSync');
  },
  
  // Update sync status
  updateSyncStatus: async (id: number, status: 'pending' | 'synced' | 'conflict'): Promise<void> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        await db.runAsync(
          'UPDATE locations SET sync_status = ? WHERE id = ?',
          [status, id]
        );
      } catch (error) {
        console.error('Error updating sync status:', error);
        throw error;
      }
    }, `Location.updateSyncStatus(id:${id})`);
  },
  
  // Update from cloud data
  updateFromCloud: async (cloudItem: any): Promise<number> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Check if item with this cloud_id already exists
        const existingItem = await db.getFirstAsync(
          'SELECT id, updated_at FROM locations WHERE cloud_id = ?',
          [cloudItem.cloud_id]
        );
        
        if (existingItem) {
          // Update existing item
          // Compare timestamps to prevent overwriting newer local changes
          if (new Date(cloudItem.updated_at) >= new Date(existingItem.updated_at)) {
            await db.runAsync(
              `UPDATE locations SET 
               name = ?, icon = ?, translation_key = ?, group_id = ?, updated_at = ?, sync_status = 'synced' 
               WHERE id = ?`,
              [cloudItem.name, cloudItem.icon, cloudItem.translation_key, cloudItem.group_id || null, cloudItem.updated_at, existingItem.id]
            );
          } else {
            // Local copy is newer, mark as conflict
            await db.runAsync(
              'UPDATE locations SET sync_status = ? WHERE id = ?',
              ['conflict', existingItem.id]
            );
          }
          return existingItem.id;
        } else {
          // Insert new item
          const result = await db.runAsync(
            `INSERT INTO locations 
             (name, icon, translation_key, cloud_id, group_id, created_at, updated_at, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [cloudItem.name, cloudItem.icon, cloudItem.translation_key, 
             cloudItem.cloud_id, cloudItem.group_id || null, cloudItem.created_at, cloudItem.updated_at]
          );
          return result.lastInsertRowId;
        }
      } catch (error) {
        console.error('Error updating from cloud:', error);
        throw error;
      }
    }, 'Location.updateFromCloud');
  },
  
  // Get location by cloud ID
  getByCloudId: async (cloudId: string): Promise<Location | null> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        const result = await db.getFirstAsync('SELECT * FROM locations WHERE cloud_id = ?', [cloudId]);
        
        if (result) {
          return {
            id: result.id,
            name: result.name,
            icon: result.icon,
            translationKey: result.translation_key,
            cloud_id: result.cloud_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
            sync_status: result.sync_status
          };
        }
        return null;
      } catch (error) {
        console.error('Error getting item by cloud_id:', error);
        throw error;
      }
    }, `Location.getByCloudId(${cloudId})`);
  }
};

// Food Item Repository
export const FoodItemRepository = {
  // Helper function to get Personal group ID from AsyncStorage or local cache
  // This is used to default null group_id values to Personal group
  getPersonalGroupId: async (): Promise<string | null> => {
    try {
      // Try to get from AsyncStorage (stored by ApiContext when groups are loaded)
      const personalGroupId = await AsyncStorage.getItem('personal_group_id');
      if (personalGroupId) {
        return personalGroupId;
      }
      
      // Try to get from stored user groups (stored by ApiContext)
      const storedGroups = await AsyncStorage.getItem('user_groups');
      if (storedGroups) {
        try {
          const groups = JSON.parse(storedGroups);
          const personalGroup = Array.isArray(groups) 
            ? groups.find((g: any) => {
                const name = g.name?.toLowerCase() || g.groups?.name?.toLowerCase();
                return name === 'personal';
              })
            : null;
          
          if (personalGroup?.id) {
            // Store it for future use
            await AsyncStorage.setItem('personal_group_id', personalGroup.id);
            return personalGroup.id;
          }
          if (personalGroup?.groups?.id) {
            // Store it for future use
            await AsyncStorage.setItem('personal_group_id', personalGroup.groups.id);
            return personalGroup.groups.id;
          }
        } catch (parseError) {
          // Invalid JSON, continue
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },

  // Get all food items with details
  getAllWithDetails: async (group_id?: string): Promise<FoodItemWithDetails[]> => {
    // Starting getAllWithDetails operation
    const startTime = Date.now();
    
    return queuedDatabaseOperation(async () => {
      // Checking fallback storage
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        // Using fallback storage
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        const categories = await fallbackDb.getAllCategories();
        const locations = await fallbackDb.getAllLocations();
        
        // Filter items by group_id if provided
        let filteredItems = items;
        if (group_id) {
          filteredItems = items.filter((item: any) => item.group_id === group_id);
        }
        
        // Processing items from fallback
        // Transform fallback data to match expected format
        const result: FoodItemWithDetails[] = filteredItems.map((item: any) => {
          const category = categories.find((c: any) => c.id === item.category_id);
          const location = locations.find((l: any) => l.id === item.location_id);
          const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
          
          // Calculate status based on days until expiry
          let status: 'fresh' | 'expiring_soon' | 'expired';
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 3) {
            status = 'expiring_soon';
          } else {
            status = 'fresh';
          }
          
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            category_id: item.category_id,
            location_id: item.location_id,
            group_id: item.group_id,
            cloud_id: item.cloud_id || null,
            expiry_date: item.expiry_date,
            reminder_days: item.reminder_days,
            notes: item.notes,
            image_uri: item.image_uri,
            created_at: item.created_at,
            category_name: category?.name || 'Unknown',
            category_icon: category?.icon || 'unknown',
            location_name: location?.name || 'Unknown',
            location_icon: location?.icon || 'unknown',
            days_until_expiry: daysUntilExpiry,
            status: status
          };
        });
        
        const totalTime = Date.now() - startTime;
        
        return result as FoodItemWithDetails[];
      }

      
      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        const categories = await fallbackDb.getAllCategories();
        const locations = await fallbackDb.getAllLocations();
        // Transform fallback data to match expected format
        const result = items.map((item: any) => {
          const category = categories.find((c: any) => c.id === item.category_id);
          const location = locations.find((l: any) => l.id === item.location_id);
          const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
          
          // Calculate status based on days until expiry
          let status: 'fresh' | 'expiring_soon' | 'expired';
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 3) {
            status = 'expiring_soon';
          } else {
            status = 'fresh';
          }
          
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            category_id: item.category_id,
            location_id: item.location_id,
            group_id: item.group_id,
            cloud_id: item.cloud_id || null,
            expiry_date: item.expiry_date,
            reminder_days: item.reminder_days,
            notes: item.notes,
            image_uri: item.image_uri,
            created_at: item.created_at,
            category_name: category?.name || 'Unknown',
            category_icon: category?.icon || 'unknown',
            location_name: location?.name || 'Unknown',
            location_icon: location?.icon || 'unknown',
            days_until_expiry: daysUntilExpiry,
            status: status
          };
        });
        
        // Filter by group_id if provided
        let filteredResult = result;
        if (group_id) {
          filteredResult = result.filter(item => item.group_id === group_id);
        }
        
        const totalTime = Date.now() - startTime;

        return filteredResult;
      }
      
      
      const sqlStart = Date.now();
      // Regular SQLite operation
      let query = `
        SELECT 
          fi.*,
          c.name as category_name,
          c.icon as category_icon,
          l.name as location_name,
          l.icon as location_icon
        FROM food_items fi
        LEFT JOIN categories c ON fi.category_id = c.id
        LEFT JOIN locations l ON fi.location_id = l.id
      `;
      
      const params: any[] = [];
      if (group_id) {
        query += ' WHERE fi.group_id = ?';
        params.push(group_id);
      }
      
      query += ' ORDER BY fi.expiry_date ASC';
      
      const result = await db.getAllAsync(query, params) as any[];
      

      
      const processStart = Date.now();
      const processedResult: FoodItemWithDetails[] = result.map(row => {
        const daysUntilExpiry = calculateDaysUntilExpiry(row.expiry_date);
        
        // Calculate status based on days until expiry
        let status: 'fresh' | 'expiring_soon' | 'expired';
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 3) {
          status = 'expiring_soon';
        } else {
          status = 'fresh';
        }
        
        return {
          id: row.id as number,
          name: row.name as string,
          quantity: row.quantity as number,
          category_id: row.category_id as number | null,
          location_id: row.location_id as number | null,
          group_id: row.group_id as string | null,
          cloud_id: row.cloud_id as string | null,
          expiry_date: row.expiry_date as string,
          reminder_days: row.reminder_days as number,
          notes: row.notes as string | null,
          image_uri: row.image_uri as string | null,
          created_at: row.created_at as string,
          category_name: row.category_name as string,
          category_icon: row.category_icon as string,
          location_name: row.location_name as string,
          location_icon: row.location_icon as string,
          days_until_expiry: daysUntilExpiry,
          status: status
        };
      });

      
      const totalTime = Date.now() - startTime;
      
      return processedResult;
    }, 'FoodItem.getAllWithDetails');
  },

  // Get food item by ID
  getById: async (id: number): Promise<FoodItem | null> => {
    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackDb = getFallbackStorage();
          const items = await fallbackDb.getAllFoodItems();
          return items.find((item: any) => item.id === id) || null;
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          const items = await fallbackDb.getAllFoodItems();
          return items.find((item: any) => item.id === id) || null;
        }
        
        // Regular SQLite operation
        const result = await db.getFirstAsync('SELECT * FROM food_items WHERE id = ?', [id]) as any;
        
        if (result) {
          return {
            id: result.id as number,
            name: result.name as string,
            quantity: result.quantity as number,
            category_id: result.category_id as number | null,
            location_id: result.location_id as number | null,
            expiry_date: result.expiry_date as string,
            reminder_days: result.reminder_days as number,
            notes: result.notes as string | null,
            image_uri: result.image_uri as string | null,
            created_at: result.created_at as string
          };
        }
        return null;
      } catch (error) {
        
        throw error;
      }
    }, `FoodItem.getById(id:${id})`);
  },

  // Create a new food item
  create: async (item: FoodItem): Promise<number> => {
    const startTime = Date.now();
    const timestamp = getCurrentDateTimeISO();
    
    // If group_id is null, default to Personal group ID
    let finalGroupId = item.group_id;
    
    if (!finalGroupId) {
      // Try to get Personal group ID using the helper function
      const personalGroupId = await FoodItemRepository.getPersonalGroupId();
      if (personalGroupId) {
        finalGroupId = personalGroupId;
      } else {
        // If still null, allow it - migration will fix existing items
        // New items should always have group_id set from Dashboard, but this is a safety net
      }
    }
    
    // Generate a cloud_id for new items if not provided
    const itemWithCloudId = {
      ...item,
      cloud_id: item.cloud_id || `food_${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
      created_at: item.created_at || timestamp,
      group_id: finalGroupId || null // May still be null if Personal group not found yet
    };
    
    return queuedDatabaseOperation(async () => {
      const dbOpStart = Date.now();
      
      try {
        
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          
          const fallbackDb = getFallbackStorage();
          const result = await fallbackDb.addFoodItem(itemWithCloudId);
          return result;
        }

        
        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          const result = await fallbackDb.addFoodItem(itemWithCloudId);
          return result;
        }
        
        
        const sqlStart = Date.now();
        
        // Try the insert operation with automatic lock recovery
        let result;
        try {
          result = await db.runAsync(
            `INSERT INTO food_items 
             (name, quantity, category_id, location_id, group_id, cloud_id, expiry_date, reminder_days, notes, image_uri, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemWithCloudId.name,
              itemWithCloudId.quantity,
              itemWithCloudId.category_id,
              itemWithCloudId.location_id,
              itemWithCloudId.group_id,
              itemWithCloudId.cloud_id,
              itemWithCloudId.expiry_date,
              itemWithCloudId.reminder_days,
              itemWithCloudId.notes,
              itemWithCloudId.image_uri,
              itemWithCloudId.created_at,
              timestamp // Updated timestamp for sync tracking
            ]
          );
        } catch (insertError: any) {
          // Check if it's a database lock error
          if (insertError.message && insertError.message.includes('database is locked')) {
            
            
            // Import the recovery function
            const { clearDatabaseLocks, invalidateDatabaseCache } = await import('./database');
            
            // Clear database locks and invalidate cache
            await clearDatabaseLocks();
            invalidateDatabaseCache();
            
            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get a fresh database connection and retry
            
            const freshDb = await getDatabaseSafely();
            if (!freshDb) {
              throw new Error('Failed to get fresh database connection after lock recovery');
            }
            
            result = await freshDb.runAsync(
              `INSERT INTO food_items 
               (name, quantity, category_id, location_id, group_id, cloud_id, expiry_date, reminder_days, notes, image_uri, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                itemWithCloudId.name,
                itemWithCloudId.quantity,
                itemWithCloudId.category_id,
                itemWithCloudId.location_id,
                itemWithCloudId.group_id,
                itemWithCloudId.cloud_id,
                itemWithCloudId.expiry_date,
                itemWithCloudId.reminder_days,
                itemWithCloudId.notes,
                itemWithCloudId.image_uri,
                itemWithCloudId.created_at,
                timestamp
              ]
            );
          } else {
            // Re-throw non-lock errors
            throw insertError;
          }
        }
        return result.lastInsertRowId;
      } catch (error) {
        console.error(`Create operation failed after ${Date.now() - dbOpStart}ms:`, error);
        throw error;
      }
    }, `FoodItem.create("${item.name}")`);
  },

  // Update an existing food item
  update: async (item: FoodItem): Promise<void> => {
    if (!hasId(item)) {
      throw new Error('Food item ID is required for update');
    }

    
    const startTime = Date.now();
    const timestamp = getCurrentDateTimeISO();

    return queuedDatabaseOperation(async () => {
      const dbOpStart = Date.now();
      
      try {
        
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          
          const fallbackDb = getFallbackStorage();
          await fallbackDb.updateFoodItem(item);
          return;
        }

        
        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          await fallbackDb.updateFoodItem(item);
          return;
        }
        
        
        const sqlStart = Date.now();
        
        // If no cloud_id exists, generate one
        if (!item.cloud_id) {
          item.cloud_id = `food_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Try the update operation with automatic lock recovery
        try {
          await db.runAsync(
            `UPDATE food_items SET 
             name = ?, quantity = ?, category_id = ?, location_id = ?, group_id = ?, cloud_id = ?, 
             expiry_date = ?, reminder_days = ?, notes = ?, image_uri = ?, updated_at = ?
             WHERE id = ?`,
            [
              item.name,
              item.quantity,
              item.category_id,
              item.location_id,
              item.group_id,
              item.cloud_id,
              item.expiry_date,
              item.reminder_days,
              item.notes,
              item.image_uri,
              timestamp, // Add updated timestamp for sync tracking
              item.id
            ]
          );
        } catch (updateError: any) {
          // Check if it's a database lock error
          if (updateError.message && updateError.message.includes('database is locked')) {
            
            
            // Import the recovery function
            const { clearDatabaseLocks, invalidateDatabaseCache } = await import('./database');
            
            // Clear database locks and invalidate cache
            await clearDatabaseLocks();
            
            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get a fresh database connection and retry
            
            const freshDb = await getDatabaseSafely();
            if (!freshDb) {
              throw new Error('Failed to get fresh database connection after lock recovery');
            }
            
            await freshDb.runAsync(
              `UPDATE food_items SET 
               name = ?, quantity = ?, category_id = ?, location_id = ?, group_id = ?, cloud_id = ?, 
               expiry_date = ?, reminder_days = ?, notes = ?, image_uri = ?, updated_at = ?
               WHERE id = ?`,
              [
                item.name,
                item.quantity,
                item.category_id,
                item.location_id,
                item.group_id,
                item.cloud_id,
                item.expiry_date,
                item.reminder_days,
                item.notes,
                item.image_uri,
                timestamp, // Add updated timestamp for sync tracking
                item.id
              ]
            );
          } else {
            // Re-throw non-lock errors
            throw updateError;
          }
        }

      } catch (error) {
        console.error(`Update operation failed after ${Date.now() - dbOpStart}ms:`, error);
        throw error;
      }
    }, `FoodItem.update(${item.id})`);
  },

  // Delete a food item
  delete: async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('Invalid food item ID');
    }

    return queuedDatabaseOperation(async () => {
      try {
        // Check if we're using fallback storage first
        if (isUsingFallbackStorage()) {
          const fallbackDb = getFallbackStorage();
          return await fallbackDb.deleteFoodItem(id);
        }

        // Try to get the SQLite database
        const db = await getDatabaseSafely();
        
        if (!db) {
          // If no database available, try fallback
          const fallbackDb = getFallbackStorage();
          return await fallbackDb.deleteFoodItem(id);
        }
        
        // Track deletion for sync before deleting
        try {
          // Get the cloud_id if available before deletion
          const item = await db.getFirstAsync('SELECT cloud_id, group_id FROM food_items WHERE id = ?', [id]);
          if (item) {
            // Track the deletion for sync
            await db.runAsync(
              'INSERT INTO deleted_items (table_name, item_id, cloud_id, group_id, deleted_at) VALUES (?, ?, ?, ?, ?)',
              ['food_items', id, item.cloud_id, item.group_id, getCurrentDateTimeISO()]
            );
          }
        } catch (e) {
          console.warn('Could not track food item deletion for sync:', e);
        }
        
        await db.runAsync('DELETE FROM food_items WHERE id = ?', [id]);
      } catch (error) {
        
        throw error;
      }
    }, `FoodItem.delete(id:${id})`);
  },
  
  // Get food items for sync
  getItemsForSync: async (groupId: string, lastSyncTime: string): Promise<FoodItem[]> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Get items modified since last sync or with pending sync status for this group
        const items = await db.getAllAsync(
          `SELECT * FROM food_items WHERE 
           (updated_at > ? OR sync_status = 'pending' OR sync_status = 'conflict') AND
           group_id = ?`,
          [lastSyncTime, groupId]
        );
        
        return items as FoodItem[];
      } catch (error) {
        console.error('Error getting food items for sync:', error);
        throw error;
      }
    }, 'FoodItem.getItemsForSync');
  },
  
  // Update sync status for food item
  updateSyncStatus: async (id: number, status: 'pending' | 'synced' | 'conflict'): Promise<void> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        await db.runAsync(
          'UPDATE food_items SET sync_status = ? WHERE id = ?',
          [status, id]
        );
      } catch (error) {
        console.error('Error updating food item sync status:', error);
        throw error;
      }
    }, `FoodItem.updateSyncStatus(id:${id})`);
  },
  
  // Update food item from cloud data
  updateFromCloud: async (cloudItem: any): Promise<number> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        // Check if item with this cloud_id already exists
        const existingItem = await db.getFirstAsync(
          'SELECT id, updated_at FROM food_items WHERE cloud_id = ?',
          [cloudItem.cloud_id]
        );
        
        if (existingItem) {
          // Compare timestamps to prevent overwriting newer local changes
          if (new Date(cloudItem.updated_at) >= new Date(existingItem.updated_at)) {
            await db.runAsync(
              `UPDATE food_items SET 
               name = ?, quantity = ?, category_id = ?, location_id = ?, 
               expiry_date = ?, reminder_days = ?, notes = ?, image_uri = ?, 
               updated_at = ?, sync_status = 'synced' 
               WHERE id = ?`,
              [
                cloudItem.name, cloudItem.quantity, cloudItem.category_id, cloudItem.location_id,
                cloudItem.expiry_date, cloudItem.reminder_days, cloudItem.notes, cloudItem.image_uri,
                cloudItem.updated_at, existingItem.id
              ]
            );
          } else {
            // Local copy is newer, mark as conflict
            await db.runAsync(
              'UPDATE food_items SET sync_status = ? WHERE id = ?',
              ['conflict', existingItem.id]
            );
          }
          return existingItem.id;
        } else {
          // Insert new item
          const result = await db.runAsync(
            `INSERT INTO food_items 
             (name, quantity, category_id, location_id, group_id, cloud_id,
              expiry_date, reminder_days, notes, image_uri, created_at, updated_at, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              cloudItem.name, cloudItem.quantity, cloudItem.category_id, cloudItem.location_id,
              cloudItem.group_id, cloudItem.cloud_id, cloudItem.expiry_date, cloudItem.reminder_days,
              cloudItem.notes, cloudItem.image_uri, cloudItem.created_at, cloudItem.updated_at
            ]
          );
          return result.lastInsertRowId;
        }
      } catch (error) {
        console.error('Error updating food item from cloud:', error);
        throw error;
      }
    }, 'FoodItem.updateFromCloud');
  },
  
  // Get food item by cloud ID
  getByCloudId: async (cloudId: string): Promise<FoodItem | null> => {
    return queuedDatabaseOperation(async () => {
      try {
        const db = await getDatabaseSafely();
        if (!db) {
          throw new Error('Database not available');
        }
        
        const result = await db.getFirstAsync('SELECT * FROM food_items WHERE cloud_id = ?', [cloudId]);
        
        return result as FoodItem | null;
      } catch (error) {
        console.error('Error getting food item by cloud_id:', error);
        throw error;
      }
    }, `FoodItem.getByCloudId(${cloudId})`);
  },

  // Get expired items
  getExpiredItems: async (): Promise<FoodItemWithDetails[]> => {
    try {
      const db = await getDatabaseSafely();
      if (!db) {
        // If no database available, return empty array for now
        // TODO: implement fallback storage for expired items
        return [];
      }
      const today = getCurrentDate();
      const result = await db.getAllAsync(`
        SELECT 
          fi.*,
          c.name as category_name,
          c.icon as category_icon,
          l.name as location_name,
          l.icon as location_icon
        FROM food_items fi
        LEFT JOIN categories c ON fi.category_id = c.id
        LEFT JOIN locations l ON fi.location_id = l.id
        WHERE fi.expiry_date < ?
        ORDER BY fi.expiry_date ASC
      `, [today]) as any[];

      return result.map(row => ({
        id: row.id as number,
        name: row.name as string,
        quantity: row.quantity as number,
        category_id: row.category_id as number | null,
        location_id: row.location_id as number | null,
        group_id: row.group_id as string | null,
        cloud_id: row.cloud_id as string | null,
        expiry_date: row.expiry_date as string,
        reminder_days: row.reminder_days as number,
        notes: row.notes as string | null,
        image_uri: row.image_uri as string | null,
        created_at: row.created_at as string,
        category_name: row.category_name as string,
        category_icon: row.category_icon as string,
        location_name: row.location_name as string,
        location_icon: row.location_icon as string,
        days_until_expiry: calculateDaysUntilExpiry(row.expiry_date)
      }));
    } catch (error) {
      
      throw error;
    }
  },

  // Get items expiring soon
  getExpiringItems: async (days: number = 7): Promise<FoodItemWithDetails[]> => {
    try {
      const db = await getDatabaseSafely();
      if (!db) {
        // If no database available, return empty array for now
        // TODO: implement fallback storage for expiring items
        return [];
      }
      const today = getCurrentDate();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const targetDate = futureDate.toISOString().split('T')[0];

      const result = await db.getAllAsync(`
        SELECT 
          fi.*,
          c.name as category_name,
          c.icon as category_icon,
          l.name as location_name,
          l.icon as location_icon
        FROM food_items fi
        LEFT JOIN categories c ON fi.category_id = c.id
        LEFT JOIN locations l ON fi.location_id = l.id
        WHERE fi.expiry_date >= ? AND fi.expiry_date <= ?
        ORDER BY fi.expiry_date ASC
      `, [today, targetDate]) as any[];

      return result.map(row => ({
        id: row.id as number,
        name: row.name as string,
        quantity: row.quantity as number,
        category_id: row.category_id as number | null,
        location_id: row.location_id as number | null,
        group_id: row.group_id as string | null,
        cloud_id: row.cloud_id as string | null,
        expiry_date: row.expiry_date as string,
        reminder_days: row.reminder_days as number,
        notes: row.notes as string | null,
        image_uri: row.image_uri as string | null,
        created_at: row.created_at as string,
        category_name: row.category_name as string,
        category_icon: row.category_icon as string,
        location_name: row.location_name as string,
        location_icon: row.location_icon as string,
        days_until_expiry: calculateDaysUntilExpiry(row.expiry_date)
      }));
    } catch (error) {
      
      throw error;
    }
  },

  // Delete all expired items
  deleteAllExpired: async (): Promise<number> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        const today = getCurrentDate();
        const expiredItems = items.filter((item: any) => item.expiry_date < today);
        
        for (const item of expiredItems) {
          await fallbackDb.deleteFoodItem(item.id);
        }
        return expiredItems.length;
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        const today = getCurrentDate();
        const expiredItems = items.filter((item: any) => item.expiry_date < today);
        
        for (const item of expiredItems) {
          await fallbackDb.deleteFoodItem(item.id);
        }
        return expiredItems.length;
      }
      
      const today = getCurrentDate();
      const result = await db.runAsync('DELETE FROM food_items WHERE expiry_date < ?', [today]);
      return result.changes || 0;
    } catch (error) {
      
      throw error;
    }
  },

  // Delete multiple items by IDs (for "used/removed" items)
  deleteMultiple: async (ids: number[]): Promise<number> => {
    if (!ids || ids.length === 0) {
      return 0;
    }

    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        let deletedCount = 0;
        
        for (const id of ids) {
          try {
            await fallbackDb.deleteFoodItem(id);
            deletedCount++;
          } catch (error) {
            
          }
        }
        return deletedCount;
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        let deletedCount = 0;
        
        for (const id of ids) {
          try {
            await fallbackDb.deleteFoodItem(id);
            deletedCount++;
          } catch (error) {
            
          }
        }
        return deletedCount;
      }
      
      // Create placeholders for the IN clause
      const placeholders = ids.map(() => '?').join(',');
      const result = await db.runAsync(`DELETE FROM food_items WHERE id IN (${placeholders})`, ids);
      return result.changes || 0;
    } catch (error) {
      
      throw error;
    }
  }
}; 
