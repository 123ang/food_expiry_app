import { getDatabase, getCurrentDate, daysDifference, isUsingFallbackStorage, getFallbackStorage } from './database';
import { Category, Location, FoodItem, FoodItemWithDetails, hasId } from './models';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database connection helper with retry logic and fallback support
const getDatabaseSafely = async (retries = 3): Promise<any> => {
  // Check if we're using fallback storage
  if (isUsingFallbackStorage()) {
    console.log('Using fallback storage instead of SQLite');
    return getFallbackStorage();
  }

  for (let i = 0; i < retries; i++) {
    try {
      const db = await getDatabase();
      if (db) {
        // Test the connection with a simple query
        await db.getFirstAsync('SELECT 1');
        return db;
      }
    } catch (error) {
      console.warn(`Database connection attempt ${i + 1}/${retries} failed:`, error);
      
      // Check if this was a fallback storage error
      if (error instanceof Error && error.message.includes('fallback storage')) {
        console.log('SQLite failed, using fallback storage');
        return getFallbackStorage();
      }
      
      if (i === retries - 1) {
        console.error(`All database connection attempts failed, switching to fallback storage`);
        return getFallbackStorage();
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  
  // Final fallback
  console.log('Using fallback storage as last resort');
  return getFallbackStorage();
};

// Category Repository
export const CategoryRepository = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        console.log('Using fallback storage for categories');
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllCategories();
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has getAllCategories method)
      if (typeof db.getAllCategories === 'function') {
        console.log('Using fallback storage for categories (from getDatabaseSafely)');
        return await db.getAllCategories();
      }
      
      // Regular SQLite operation
      const result = await db.getAllAsync('SELECT * FROM categories ORDER BY name') as any[];
      return result.map(row => ({
        id: row.id as number,
        name: row.name as string,
        icon: row.icon as string
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  // Get category by ID
  getById: async (id: number): Promise<Category | null> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        console.log('Using fallback storage for category by ID');
        const fallbackDb = getFallbackStorage();
        const categories = await fallbackDb.getAllCategories();
        return categories.find((cat: any) => cat.id === id) || null;
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has getAllCategories method)
      if (typeof db.getAllCategories === 'function') {
        console.log('Using fallback storage for category by ID (from getDatabaseSafely)');
        const categories = await db.getAllCategories();
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
        console.log('Using fallback storage for creating category');
        const fallbackDb = getFallbackStorage();
        const categories = await fallbackDb.getAllCategories();
        const newId = Math.max(0, ...categories.map((c: any) => c.id || 0)) + 1;
        const newCategory = { ...category, id: newId };
        categories.push(newCategory);
        await AsyncStorage.setItem('categories', JSON.stringify(categories));
        return newId;
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage
      if (typeof db.getAllCategories === 'function') {
        console.log('Using fallback storage for creating category (from getDatabaseSafely)');
        const categories = await db.getAllCategories();
        const newId = Math.max(0, ...categories.map((c: any) => c.id || 0)) + 1;
        const newCategory = { ...category, id: newId };
        categories.push(newCategory);
        await AsyncStorage.setItem('categories', JSON.stringify(categories));
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
        console.log('Using fallback storage for locations');
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.getAllLocations();
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has getAllLocations method)
      if (typeof db.getAllLocations === 'function') {
        console.log('Using fallback storage for locations (from getDatabaseSafely)');
        return await db.getAllLocations();
      }
      
      // Regular SQLite operation
      const result = await db.getAllAsync('SELECT * FROM locations ORDER BY name') as any[];
      return result.map(row => ({
        id: row.id as number,
        name: row.name as string,
        icon: row.icon as string
      }));
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  },

  // Get location by ID
  getById: async (id: number): Promise<Location | null> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        console.log('Using fallback storage for location by ID');
        const fallbackDb = getFallbackStorage();
        const locations = await fallbackDb.getAllLocations();
        return locations.find((loc: any) => loc.id === id) || null;
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has getAllLocations method)
      if (typeof db.getAllLocations === 'function') {
        console.log('Using fallback storage for location by ID (from getDatabaseSafely)');
        const locations = await db.getAllLocations();
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
        console.log('Using fallback storage for getAllWithDetails');
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        const categories = await fallbackDb.getAllCategories();
        const locations = await fallbackDb.getAllLocations();
        
        // Transform fallback data to match expected format
        return items.map((item: any) => {
          const category = categories.find((c: any) => c.id === item.category_id);
          const location = locations.find((l: any) => l.id === item.location_id);
          
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
            days_until_expiry: daysDifference(getCurrentDate(), item.expiry_date)
          };
        });
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has getAllFoodItems method)
      if (typeof db.getAllFoodItems === 'function') {
        console.log('Using fallback storage for getAllWithDetails (from getDatabaseSafely)');
        const items = await db.getAllFoodItems();
        const categories = await db.getAllCategories();
        const locations = await db.getAllLocations();
        
        // Transform fallback data to match expected format
        return items.map((item: any) => {
          const category = categories.find((c: any) => c.id === item.category_id);
          const location = locations.find((l: any) => l.id === item.location_id);
          
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
            days_until_expiry: daysDifference(getCurrentDate(), item.expiry_date)
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
        days_until_expiry: daysDifference(getCurrentDate(), row.expiry_date as string)
      }));
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
        console.log('Using fallback storage for food item by ID');
        const fallbackDb = getFallbackStorage();
        const items = await fallbackDb.getAllFoodItems();
        return items.find((item: any) => item.id === id) || null;
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has getAllFoodItems method)
      if (typeof db.getAllFoodItems === 'function') {
        console.log('Using fallback storage for food item by ID (from getDatabaseSafely)');
        const items = await db.getAllFoodItems();
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
  create: async (item: Omit<FoodItem, 'id'>): Promise<number> => {
    try {
      // Check if we're using fallback storage first
      if (isUsingFallbackStorage()) {
        console.log('Using fallback storage for creating food item');
        const fallbackDb = getFallbackStorage();
        return await fallbackDb.addFoodItem(item);
      }

      // Try to get the SQLite database
      const db = await getDatabaseSafely();
      
      // If getDatabaseSafely returned fallback storage (has addFoodItem method)
      if (typeof db.addFoodItem === 'function') {
        console.log('Using fallback storage for creating food item (from getDatabaseSafely)');
        return await db.addFoodItem(item);
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
      const db = await getDatabaseSafely();
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
      const db = await getDatabaseSafely();
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
        days_until_expiry: daysDifference(getCurrentDate(), row.expiry_date as string)
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
        days_until_expiry: daysDifference(getCurrentDate(), row.expiry_date as string)
      }));
    } catch (error) {
      console.error('Error getting expiring items:', error);
      throw error;
    }
  }
}; 