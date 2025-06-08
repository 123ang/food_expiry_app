import { getDatabase, getCurrentDate, calculateDaysUntilExpiry, isUsingFallbackStorage, getFallbackStorage } from './database';
import { Category, Location, FoodItem, FoodItemWithDetails, hasId } from './models';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database connection helper with retry logic and fallback support
const getDatabaseSafely = async (): Promise<any> => {
  try {
    const db = await getDatabase();
    // Verify the database connection is still valid
    if (db && typeof db.getAllAsync === 'function') {
      return db;
    } else {
      console.warn('Database connection invalid, attempting reconnection...');
      // Try to reconnect
      const newDb = await getDatabase();
      return newDb;
    }
  } catch (error) {
    console.error('Failed to get database, falling back to storage:', error);
    return null;
  }
};

// Category Repository
export const CategoryRepository = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllCategories();
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllCategories();
      }
      
      // Validate database connection before use
      try {
        await db.getAllAsync('SELECT 1'); // Test query to ensure connection is valid
      } catch (connectionError) {
        console.warn('Database connection invalid, falling back to storage');
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllCategories();
      }
      
      // Regular SQLite operation with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const result = await db.getAllAsync('SELECT * FROM categories ORDER BY name') as any[];
          return result.map(row => ({
            id: row.id as number,
            name: row.name as string,
            icon: row.icon as string
          }));
        } catch (statementError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            // If SQLite fails completely, fall back to storage
            console.warn('SQLite operations failed, using fallback storage');
            const fallbackDb = getFallbackStorage();
            return await fallbackDb.getAllCategories();
          }
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Should never reach here, but just in case
      const fallbackDb = getFallbackStorage();
      return await fallbackDb.getAllCategories();
      
    } catch (error) {
      console.error('Error getting categories:', error);
      // As last resort, try fallback storage
      try {
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllCategories();
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        return []; // Return empty array rather than throwing
      }
    }
  },

  // Get category by ID
  getById: async (id: number): Promise<Category | null> => {
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
          icon: result.icon as string
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      throw error;
    }
  },

  // Create a new category
  create: async (category: Omit<Category, 'id'>): Promise<number> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        const data = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
        const newId = Math.max(0, ...data.categories.map((c: any) => c.id || 0)) + 1;
        const newCategory = { ...category, id: newId };
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
        const newCategory = { ...category, id: newId };
        data.categories.push(newCategory);
        await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
        return newId;
      }
      
      // Regular SQLite operation
      const result = await db.runAsync(
        'INSERT INTO categories (name, icon) VALUES (?, ?)',
        [category.name, category.icon]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update an existing category
  update: async (category: Category): Promise<void> => {
    if (!hasId(category)) {
      throw new Error('Category ID is required for update');
    }

    try {
      const db = await getDatabaseSafely();
      if (!db) {
        throw new Error('Database not available');
      }
      await db.runAsync(
        'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
        [category.name, category.icon, category.id]
      );
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete a category
  delete: async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('Invalid category ID');
    }

    try {
      const db = await getDatabaseSafely();
      if (!db) {
        throw new Error('Database not available');
      }
      await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};

// Location Repository
export const LocationRepository = {
  // Get all locations
  getAll: async (): Promise<Location[]> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllLocations();
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllLocations();
      }
      
      // Validate database connection before use
      try {
        await db.getAllAsync('SELECT 1'); // Test query to ensure connection is valid
      } catch (connectionError) {
        console.warn('Database connection invalid, falling back to storage');
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllLocations();
      }
      
      // Regular SQLite operation with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const result = await db.getAllAsync('SELECT * FROM locations ORDER BY name') as any[];
          return result.map(row => ({
            id: row.id as number,
            name: row.name as string,
            icon: row.icon as string
          }));
        } catch (statementError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            // If SQLite fails completely, fall back to storage
            console.warn('SQLite operations failed, using fallback storage');
            const fallbackDb = getFallbackStorage();
            return await fallbackDb.getAllLocations();
          }
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Should never reach here, but just in case
      const fallbackDb = getFallbackStorage();
      return await fallbackDb.getAllLocations();
      
    } catch (error) {
      console.error('Error getting locations:', error);
      // As last resort, try fallback storage
      try {
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllLocations();
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        return []; // Return empty array rather than throwing
      }
    }
  },

  // Get location by ID
  getById: async (id: number): Promise<Location | null> => {
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
          icon: result.icon as string
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting location by ID:', error);
      throw error;
    }
  },

  // Create a new location
  create: async (location: Omit<Location, 'id'>): Promise<number> => {
    try {
      const db = await getDatabaseSafely();
      const result = await db.runAsync(
        'INSERT INTO locations (name, icon) VALUES (?, ?)',
        [location.name, location.icon]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  // Update an existing location
  update: async (location: Location): Promise<void> => {
    if (!hasId(location)) {
      throw new Error('Location ID is required for update');
    }

    try {
      const db = await getDatabaseSafely();
      await db.runAsync(
        'UPDATE locations SET name = ?, icon = ? WHERE id = ?',
        [location.name, location.icon, location.id]
      );
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  // Delete a location
  delete: async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('Invalid location ID');
    }

    try {
      const db = await getDatabaseSafely();
      await db.runAsync('DELETE FROM locations WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }
};

// Food Item Repository
export const FoodItemRepository = {
  // Get all food items with details
  getAllWithDetails: async (): Promise<FoodItemWithDetails[]> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        const categories = await fallbackDb.getAllCategories();
        const locations = await fallbackDb.getAllLocations();
        
        // Transform fallback data to match expected format
        return items.map((item: any) => {
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
        return items.map((item: any) => {
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
      }
      
      // Regular SQLite operation
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
        ORDER BY fi.expiry_date ASC
      `) as any[];

      return result.map(row => {
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
    } catch (error) {
      console.error('Error getting food items with details:', error);
      throw error;
    }
  },

  // Get food item by ID
  getById: async (id: number): Promise<FoodItem | null> => {
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
      console.error('Error getting food item by ID:', error);
      throw error;
    }
  },

  // Create a new food item
  create: async (item: FoodItem): Promise<number> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.addFoodItem(item);
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.addFoodItem(item);
      }
      
      // Regular SQLite operation
      const result = await db.runAsync(
        `INSERT INTO food_items 
         (name, quantity, category_id, location_id, expiry_date, reminder_days, notes, image_uri, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.name,
          item.quantity,
          item.category_id,
          item.location_id,
          item.expiry_date,
          item.reminder_days,
          item.notes,
          item.image_uri,
          item.created_at
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating food item:', error);
      throw error;
    }
  },

  // Update an existing food item
  update: async (item: FoodItem): Promise<void> => {
    if (!hasId(item)) {
      throw new Error('Food item ID is required for update');
    }

    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.updateFoodItem(item);
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      if (!db) {
        // If no database available, try fallback
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.updateFoodItem(item);
      }
      
      await db.runAsync(
        `UPDATE food_items SET 
         name = ?, quantity = ?, category_id = ?, location_id = ?, 
         expiry_date = ?, reminder_days = ?, notes = ?, image_uri = ? 
         WHERE id = ?`,
        [
          item.name,
          item.quantity,
          item.category_id,
          item.location_id,
          item.expiry_date,
          item.reminder_days,
          item.notes,
          item.image_uri,
          item.id
        ]
      );
    } catch (error) {
      console.error('Error updating food item:', error);
      throw error;
    }
  },

  // Delete a food item
  delete: async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('Invalid food item ID');
    }

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
      
      await db.runAsync('DELETE FROM food_items WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting food item:', error);
      throw error;
    }
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
      console.error('Error getting expired items:', error);
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
      console.error('Error getting expiring items:', error);
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
      console.error('Error deleting expired items:', error);
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
            console.error(`Error deleting item ${id}:`, error);
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
            console.error(`Error deleting item ${id}:`, error);
          }
        }
        return deletedCount;
      }
      
      // Create placeholders for the IN clause
      const placeholders = ids.map(() => '?').join(',');
      const result = await db.runAsync(`DELETE FROM food_items WHERE id IN (${placeholders})`, ids);
      return result.changes || 0;
    } catch (error) {
      console.error('Error deleting multiple items:', error);
      throw error;
    }
  }
}; 