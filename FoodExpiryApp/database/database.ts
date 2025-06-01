import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db: SQLite.SQLiteDatabase;
let useFallbackStorage = false;

// Database name with platform-specific handling
const DATABASE_NAME = Platform.OS === 'android' ? 'foodexpiry_v3.db' : 'foodexpiry.db';

// AsyncStorage keys for fallback
const STORAGE_KEYS = {
  CATEGORIES: 'fallback_categories',
  LOCATIONS: 'fallback_locations',
  FOOD_ITEMS: 'fallback_food_items',
  INITIALIZED: 'fallback_initialized'
};

// Fallback storage functions
const fallbackStorage = {
  async initFallback() {
    console.log('Initializing fallback AsyncStorage...');
    
    // Check if already initialized
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (initialized) {
      console.log('Fallback storage already initialized');
      return;
    }

    // Initialize with default data
    const defaultCategories = [
      { id: 1, name: 'Vegetables', icon: 'vegetables' },
      { id: 2, name: 'Fruits', icon: 'apple' },
      { id: 3, name: 'Dairy', icon: 'dairy' },
      { id: 4, name: 'Meat', icon: 'meat' },
      { id: 5, name: 'Snacks', icon: 'snacks' },
      { id: 6, name: 'Desserts', icon: 'dessert' },
      { id: 7, name: 'Seafood', icon: 'seafood' },
      { id: 8, name: 'Bread', icon: 'bread' }
    ];

    const defaultLocations = [
      { id: 1, name: 'Fridge', icon: 'fridge' },
      { id: 2, name: 'Freezer', icon: 'freezer' },
      { id: 3, name: 'Pantry', icon: 'pantry' },
      { id: 4, name: 'Counter', icon: 'counter' },
      { id: 5, name: 'Cabinet', icon: 'cabinet' }
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(defaultLocations));
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    
    console.log('Fallback storage initialized successfully');
  },

  async getAllCategories() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  },

  async getAllLocations() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return data ? JSON.parse(data) : [];
  },

  async getAllFoodItems() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_ITEMS);
    return data ? JSON.parse(data) : [];
  },

  async saveFoodItems(items: any[]) {
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(items));
  },

  async addFoodItem(item: any) {
    const items = await this.getAllFoodItems();
    const newId = Math.max(0, ...items.map((i: any) => i.id || 0)) + 1;
    const newItem = { ...item, id: newId };
    items.push(newItem);
    await this.saveFoodItems(items);
    return newId;
  },

  async updateFoodItem(updatedItem: any) {
    const items = await this.getAllFoodItems();
    const index = items.findIndex((item: any) => item.id === updatedItem.id);
    if (index !== -1) {
      items[index] = updatedItem;
      await this.saveFoodItems(items);
    }
  },

  async deleteFoodItem(id: number) {
    const items = await this.getAllFoodItems();
    const filtered = items.filter((item: any) => item.id !== id);
    await this.saveFoodItems(filtered);
  }
};

// Open or create the database with production-specific handling
export const getDatabase = async () => {
  // If already using fallback, return a mock object
  if (useFallbackStorage) {
    console.log('Using fallback storage mode');
    throw new Error('Using fallback storage - SQLite unavailable');
  }

  if (!db) {
    console.log('Opening database for the first time...');
    console.log('Platform:', Platform.OS);
    console.log('Database name:', DATABASE_NAME);
    
    try {
      // For production builds, use different approach
      if (__DEV__) {
        console.log('Development mode - using standard database opening');
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      } else {
        console.log('Production mode - using fallback database opening');
        // Try to open with minimal options for production
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      }
      
      console.log('Database opened successfully');
      
      // Verify the connection works
      await db.getFirstAsync('SELECT 1');
      console.log('Database connection verified');
      
    } catch (error) {
      console.error('Database opening failed:', error);
      
      // Fallback: try to delete and recreate database
      try {
        console.log('Attempting database recreation...');
        const fallbackName = `foodexpiry_fallback_${Date.now()}.db`;
        db = await SQLite.openDatabaseAsync(fallbackName);
        console.log('Fallback database created successfully');
        await db.getFirstAsync('SELECT 1');
        console.log('Fallback database verified');
      } catch (fallbackError) {
        console.error('Fallback database creation also failed:', fallbackError);
        console.log('Switching to AsyncStorage fallback mode');
        useFallbackStorage = true;
        await fallbackStorage.initFallback();
        throw new Error('SQLite unavailable - using fallback storage');
      }
    }
  }
  
  // Always verify the database is still connected
  if (db) {
    try {
      await db.getFirstAsync('SELECT 1');
    } catch (error) {
      console.warn('Database connection lost, attempting recovery...', error);
      
      try {
        // Try to reopen the database
        const recoveryName = `foodexpiry_recovery_${Date.now()}.db`;
        db = await SQLite.openDatabaseAsync(recoveryName);
        await db.getFirstAsync('SELECT 1');
        console.log('Database recovered successfully');
        
        // Force re-initialization after recovery
        await initDatabase();
      } catch (recoveryError) {
        console.error('Database recovery failed:', recoveryError);
        console.log('Switching to AsyncStorage fallback mode');
        useFallbackStorage = true;
        await fallbackStorage.initFallback();
        throw new Error('Database recovery failed - using fallback storage');
      }
    }
  }
  
  return db;
};

// Check if we're using fallback storage
export const isUsingFallbackStorage = () => useFallbackStorage;

// Get fallback storage helper
export const getFallbackStorage = () => fallbackStorage;

// Initialize the database with tables
export const initDatabase = async () => {
  const database = await getDatabase();
  
  try {
    // Create categories table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL
      );
    `);

    // Create storage locations table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL
      );
    `);

    // Create food items table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        category_id INTEGER,
        location_id INTEGER,
        expiry_date TEXT NOT NULL,
        reminder_days INTEGER DEFAULT 0,
        notes TEXT,
        image_uri TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
        FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL
      );
    `);

    // Insert default categories if they don't exist
    await database.execAsync(`
      DELETE FROM categories WHERE id IN (1,2,3,4,5,6,7,8);
      INSERT INTO categories (id, name, icon) VALUES 
      (1, 'Vegetables', 'vegetables'),
      (2, 'Fruits', 'apple'),
      (3, 'Dairy', 'dairy'),
      (4, 'Meat', 'meat'),
      (5, 'Snacks', 'snacks'),
      (6, 'Desserts', 'dessert'),
      (7, 'Seafood', 'seafood'),
      (8, 'Bread', 'bread');
    `);

    // Insert default locations if they don't exist
    await database.execAsync(`
      DELETE FROM locations WHERE id IN (1,2,3,4,5);
      INSERT INTO locations (id, name, icon) VALUES 
      (1, 'Fridge', 'fridge'),
      (2, 'Freezer', 'freezer'),
      (3, 'Pantry', 'pantry'),
      (4, 'Counter', 'counter'),
      (5, 'Cabinet', 'cabinet');
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Reset database - drops all tables and recreates them
export const resetDatabase = async () => {
  const database = await getDatabase();
  
  try {
    console.log('Resetting database...');
    
    // Drop all tables
    await database.execAsync('DROP TABLE IF EXISTS food_items');
    await database.execAsync('DROP TABLE IF EXISTS categories');
    await database.execAsync('DROP TABLE IF EXISTS locations');
    
    console.log('Tables dropped, reinitializing...');
    
    // Reinitialize with fresh data
    await initDatabase();
    
    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current date formatted as YYYY-MM-DD
export const getCurrentDate = () => {
  const date = new Date();
  return formatDate(date);
};

// Calculate days difference between two dates
export const daysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 