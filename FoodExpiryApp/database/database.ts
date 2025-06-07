import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../context/LanguageContext';
import { Category, Location } from './models';

// Database configuration
const DATABASE_VERSION = 5;
const DATABASE_NAME = 'expiry_alert.db';

// Fallback storage for when SQLite is not available
interface FallbackStorage {
  categories: Category[];
  locations: Location[];
  foodItems: any[];
}

let db: SQLite.SQLiteDatabase | null = null;
let useFallbackStorage = false;

const initializeFallback = async (): Promise<void> => {
  if (useFallbackStorage) {
    return;
  }
  
  try {
    const existing = await AsyncStorage.getItem('fallback_data');
    if (!existing) {
      const fallbackData: FallbackStorage = {
        categories: [],
        locations: [],
        foodItems: []
      };
      await AsyncStorage.setItem('fallback_data', JSON.stringify(fallbackData));
    }
  } catch (error) {
    // Silent fallback
  }
};

const getStoredLanguage = async (): Promise<Language> => {
  try {
    const stored = await AsyncStorage.getItem('app_language');
    return (stored as Language) || 'en';
  } catch (error) {
    return 'en';
  }
};

const ensureFallbackStorage = async (): Promise<void> => {
  try {
    await initializeFallback();
    useFallbackStorage = true;
  } catch (error) {
    throw new Error('Could not initialize fallback storage');
  }
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (useFallbackStorage) {
    return null;
  }

  if (!db) {
    try {
      // Enhanced database opening strategy
      const isDevelopment = __DEV__;
      
      if (isDevelopment) {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      } else {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      }

      // Verify the database connection
      await db.getAllAsync('SELECT 1');
      
    } catch (openError) {
      try {
        // Close any partial connection
        if (db) {
          try {
            await db.closeAsync();
          } catch (closeError) {
            // Ignore close errors
          }
          db = null;
        }
        
        // Attempt to recreate the database
        await SQLite.deleteDatabaseAsync(DATABASE_NAME);
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        
      } catch (recreateError) {
        // If SQLite completely fails, switch to fallback mode
        await ensureFallbackStorage();
        return null;
      }
    }
    
    // Additional verification
    try {
      await db.getAllAsync('SELECT 1');
    } catch (verifyError) {
      // Final fallback
      await ensureFallbackStorage();
      return null;
    }
  }

  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    try {
      await db.closeAsync();
    } catch (error) {
      // Silent error handling
    } finally {
      db = null;
    }
  }
};

// Function to reset database connection completely
export const resetDatabaseConnection = async (): Promise<void> => {
  await closeDatabase();
  useFallbackStorage = false;
  // Force a fresh connection on next access
};

// Safe database getter with fallback handling
export const getDatabaseSafely = async (): Promise<SQLite.SQLiteDatabase | null> => {
  try {
    return await getDatabase();
  } catch (error) {
    // Fallback to AsyncStorage mode
    await ensureFallbackStorage();
    return null;
  }
};

// Function to check if we're using fallback storage
export const isUsingFallbackStorage = (): boolean => {
  return useFallbackStorage;
};

// Function to get fallback storage interface
export const getFallbackStorage = () => {
  return {
    getAllCategories: async (): Promise<Category[]> => {
      try {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        if (fallbackData) {
          const data: FallbackStorage = JSON.parse(fallbackData);
          return data.categories;
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    
    getAllLocations: async (): Promise<Location[]> => {
      try {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        if (fallbackData) {
          const data: FallbackStorage = JSON.parse(fallbackData);
          return data.locations;
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    
    getAllFoodItems: async (): Promise<any[]> => {
      try {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        if (fallbackData) {
          const data: FallbackStorage = JSON.parse(fallbackData);
          return data.foodItems;
        }
        return [];
      } catch (error) {
        return [];
      }
    },

    addFoodItem: async (item: any): Promise<number> => {
      try {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        const data = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
        const newId = Math.max(0, ...data.foodItems.map((item: any) => item.id || 0)) + 1;
        const newItem = { ...item, id: newId };
        data.foodItems.push(newItem);
        await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
        return newId;
      } catch (error) {
        throw error;
      }
    },

    updateFoodItem: async (item: any): Promise<void> => {
      try {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        const data = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
        const index = data.foodItems.findIndex((i: any) => i.id === item.id);
        if (index !== -1) {
          data.foodItems[index] = item;
          await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
        }
      } catch (error) {
        throw error;
      }
    },

    deleteFoodItem: async (id: number): Promise<void> => {
      try {
        const fallbackData = await AsyncStorage.getItem('fallback_data');
        const data = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
        data.foodItems = data.foodItems.filter((item: any) => item.id !== id);
        await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
      } catch (error) {
        throw error;
      }
    }
  };
};

// Function to calculate days difference between two dates
export const daysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const createTables = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  const createTableQueries = [
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    
    `CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    
    `CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      category_id INTEGER,
      location_id INTEGER,
      expiry_date TEXT NOT NULL,
      reminder_days INTEGER DEFAULT 3,
      notes TEXT,
      image_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
      FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL
    );`,
    
    `CREATE INDEX IF NOT EXISTS idx_food_items_expiry ON food_items(expiry_date);`,
    `CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_id);`,
    `CREATE INDEX IF NOT EXISTS idx_food_items_location ON food_items(location_id);`
  ];

  for (const query of createTableQueries) {
    await database.execAsync(query);
  }
};

const getDefaultCategories = (language: Language): Category[] => {
  const categoriesMap: Record<Language, Category[]> = {
    en: [
      { name: 'Vegetables', icon: '🥬' },
      { name: 'Fruits', icon: '🍎' },
      { name: 'Dairy', icon: '🥛' },
      { name: 'Meat', icon: '🥩' },
      { name: 'Snacks', icon: '🍿' },
      { name: 'Desserts', icon: '🍰' },
      { name: 'Seafood', icon: '🐟' },
      { name: 'Bread', icon: '🍞' }
    ],
    zh: [
      { name: '蔬菜', icon: '🥬' },
      { name: '水果', icon: '🍎' },
      { name: '乳制品', icon: '🥛' },
      { name: '肉类', icon: '🥩' },
      { name: '零食', icon: '🍿' },
      { name: '甜点', icon: '🍰' },
      { name: '海鲜', icon: '🐟' },
      { name: '面包', icon: '🍞' }
    ],
    ja: [
      { name: '野菜', icon: '🥬' },
      { name: '果物', icon: '🍎' },
      { name: '乳製品', icon: '🥛' },
      { name: '肉', icon: '🥩' },
      { name: 'スナック', icon: '🍿' },
      { name: 'デザート', icon: '🍰' },
      { name: '海産物', icon: '🐟' },
      { name: 'パン', icon: '🍞' }
    ]
  };
  
  try {
    return categoriesMap[language] || categoriesMap.en;
  } catch (error) {
    return categoriesMap.en;
  }
};

const getDefaultLocations = (language: Language): Location[] => {
  const locationsMap: Record<Language, Location[]> = {
    en: [
      { name: 'Fridge', icon: '❄️' },
      { name: 'Freezer', icon: '🧊' },
      { name: 'Pantry', icon: '🏠' },
      { name: 'Cabinet', icon: '📦' }
    ],
    zh: [
      { name: '冰箱', icon: '❄️' },
      { name: '冷冻室', icon: '🧊' },
      { name: '储藏室', icon: '🏠' },
      { name: '橱柜', icon: '📦' }
    ],
    ja: [
      { name: '冷蔵庫', icon: '❄️' },
      { name: '冷凍庫', icon: '🧊' },
      { name: 'パントリー', icon: '🏠' },
      { name: 'キャビネット', icon: '📦' }
    ]
  };
  
  return locationsMap[language] || locationsMap.en;
};

const insertDefaultData = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  // Check if we already have data
  const categoryCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');
  const locationCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM locations');
  
  if ((categoryCount as any)?.count > 0 && (locationCount as any)?.count > 0) {
    return;
  }

  const defaultCategories = getDefaultCategories(language);
  const defaultLocations = getDefaultLocations(language);

  // Insert categories
  for (const category of defaultCategories) {
    await database.runAsync(
      'INSERT OR IGNORE INTO categories (name, icon) VALUES (?, ?)',
      [category.name, category.icon]
    );
  }

  // Insert locations
  for (const location of defaultLocations) {
    await database.runAsync(
      'INSERT OR IGNORE INTO locations (name, icon) VALUES (?, ?)',
      [location.name, location.icon]
    );
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    
    if (!database) {
      // Using fallback storage
      const currentLanguage = await getStoredLanguage();
      await updateDefaultDataForLanguage(currentLanguage);
      return;
    }

    await createTables(database);
    
    const currentLanguage = await getStoredLanguage();
    await insertDefaultData(database, currentLanguage);
    
    // Run migration to add new categories for existing databases
    await migrateToNewCategories(database, currentLanguage);
  } catch (error) {
    throw error;
  }
};

const migrateToNewCategories = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  try {
    // Check if we have more than 8 categories (need to remove extra ones)
    const categoryCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');
    const count = (categoryCount as any)?.count || 0;
    
    if (count > 8) {
      // Remove extra categories (keep only the first 8)
      await database.runAsync('DELETE FROM categories WHERE id > 8');
    } else if (count < 8) {
      // Add missing categories if we have less than 8
      const defaultCategories = getDefaultCategories(language);
      
      for (let i = count; i < defaultCategories.length; i++) {
        const category = defaultCategories[i];
        await database.runAsync(
          'INSERT INTO categories (name, icon) VALUES (?, ?)',
          [category.name, category.icon]
        );
      }
    }
  } catch (error) {
    // Silent error handling for migration
    console.log('Migration completed or skipped:', error);
  }
};

export const resetDatabase = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    
    if (!database) {
      // Reset fallback storage
      const fallbackData: FallbackStorage = {
        categories: [],
        locations: [],
        foodItems: []
      };
      await AsyncStorage.setItem('fallback_data', JSON.stringify(fallbackData));
      await initDatabase();
      return;
    }

    // Drop all tables
    await database.execAsync('DROP TABLE IF EXISTS food_items');
    await database.execAsync('DROP TABLE IF EXISTS categories');
    await database.execAsync('DROP TABLE IF EXISTS locations');
    
    // Recreate tables and insert default data
    await initDatabase();
  } catch (error) {
    throw error;
  }
};

// Utility functions
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const addDaysToDate = (date: string, days: number): string => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate.toISOString().split('T')[0];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to update default data when language changes
export const updateDefaultDataForLanguage = async (language: Language): Promise<void> => {
  try {
    const database = await getDatabase();
    
    if (!database) {
      // Handle fallback storage
      const fallbackData = await AsyncStorage.getItem('fallback_data');
      const data: FallbackStorage = fallbackData ? JSON.parse(fallbackData) : { categories: [], locations: [], foodItems: [] };
      
      // Always update default categories and locations with new language
      const defaultCategories = getDefaultCategories(language);
      
      // Preserve existing user-created categories (those with id > default count)
      const existingUserCategories = data.categories.filter(cat => 
        cat.id && cat.id > defaultCategories.length
      );
      
      // Combine default categories with user-created ones
      data.categories = [
        ...defaultCategories.map((cat, index) => ({
          ...cat,
          id: index + 1,
          created_at: getCurrentDate()
        })),
        ...existingUserCategories
      ];
      
      data.locations = getDefaultLocations(language).map((loc, index) => ({
        ...loc,
        id: index + 1,
        created_at: getCurrentDate()
      }));
      
      await AsyncStorage.setItem('fallback_data', JSON.stringify(data));
      return;
    }

    // Update existing default categories and add new ones if they don't exist
    const defaultCategories = getDefaultCategories(language);
    for (let i = 0; i < defaultCategories.length; i++) {
      const category = defaultCategories[i];
      const categoryId = i + 1;
      
      // Check if category exists
      const existingCategory = await database.getFirstAsync(
        'SELECT id FROM categories WHERE id = ?',
        [categoryId]
      );
      
      if (existingCategory) {
        // Update existing category
        await database.runAsync(
          'UPDATE categories SET name = ? WHERE id = ?',
          [category.name, categoryId]
        );
      } else {
        // Insert new category
        await database.runAsync(
          'INSERT INTO categories (name, icon) VALUES (?, ?)',
          [category.name, category.icon]
        );
      }
    }

    // Update existing default locations (IDs 1-4) with new language  
    const defaultLocations = getDefaultLocations(language);
    for (let i = 0; i < defaultLocations.length; i++) {
      const location = defaultLocations[i];
      await database.runAsync(
        'UPDATE locations SET name = ? WHERE id = ?',
        [location.name, i + 1]
      );
    }
  } catch (error) {
    // Silent error handling
  }
}; 