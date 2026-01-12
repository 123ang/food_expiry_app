import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../context/LanguageContext';
import { Category, Location, User } from './models';
import * as FileSystem from 'expo-file-system/legacy';
import { ALL_THEMES, getTranslatedThemes as translateThemesConst } from '../constants/categoryThemes';
import { getCurrentDateTimeISO, toGMT8ISO } from '../utils/dateUtils';

// --- DEBUG LOGGING ADDED ---
// To ensure the database is initialized, call `await initDatabase()` at the very start of your app (e.g., in App.tsx or your main entry point, before any database usage).
// For React Native/Expo, you can use useEffect in App.tsx:
// useEffect(() => { initDatabase(); }, []);
// Make sure to await or handle the promise if you need to block UI until ready.
// --- END DEBUG LOGGING INSTRUCTIONS ---

// Database configuration
const DATABASE_VERSION = 15;
const DATABASE_NAME = 'expiry_alert.db';
const VERSION_KEY = 'database_version';

// Database operation queue to prevent concurrent operations and locks
class DatabaseQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  // Increased timeout to 120 seconds to allow heavy initialization operations (e.g., initDatabase)
  private static readonly OPERATION_TIMEOUT = 120000; // 120 seconds timeout
  private activeOperations: Map<string, { startTime: number; operation: string }> = new Map();
  private operationCounter = 0;

  async add<T>(operation: () => Promise<T>, operationName?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueStartTime = Date.now();
      const operationId = `op_${++this.operationCounter}`;
      const opName = operationName || 'unknown';
      
      // Queue operation added
      
      // Track active operations
      this.activeOperations.set(operationId, {
        startTime: queueStartTime,
        operation: opName
      });
      
      // Add timeout to prevent stuck operations
      const timeoutId = setTimeout(() => {
        // Database operation timeout
        this.logActiveOperations();
        this.activeOperations.delete(operationId);
        reject(new Error(`Database operation "${opName}" timed out after ${DatabaseQueue.OPERATION_TIMEOUT}ms`));
      }, DatabaseQueue.OPERATION_TIMEOUT);
      
      this.queue.push(async () => {
        const waitTime = Date.now() - queueStartTime;
        // Starting operation
        const operationStartTime = Date.now();
        
        try {
          const result = await operation();
          const operationDuration = Date.now() - operationStartTime;
          const totalDuration = Date.now() - queueStartTime;
          
          // Operation completed
          
          if (operationDuration > 100) {
            // Operation took longer than expected
          }
          
          this.activeOperations.delete(operationId);
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error: any) {
          const totalDuration = Date.now() - queueStartTime;
          // Database operation failed
          
          // Log what operation was running when the lock occurred
          if (error.message && error.message.includes('database is locked')) {
            // Database lock detected
            this.logActiveOperations();
          }
          
          this.activeOperations.delete(operationId);
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private logActiveOperations(): void {
    if (this.activeOperations.size > 0) {
      // Active operations detected
      this.activeOperations.forEach((info, id) => {
        const duration = Date.now() - info.startTime;
        // Operation running for duration
      });
    } else {
      // No active operations
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

            // Processing queue
    
    // Warn about queue backlog
    if (this.queue.length > 10) {
      
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
          // Add a minimal delay between operations to prevent locks (reduced to 1ms)
          if (this.queue.length > 0) {
            // Waiting before next operation
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        } catch (error) {
          
        }
      }
    }
    
          // Queue processing completed
    this.isProcessing = false;
  }
}

const dbQueue = new DatabaseQueue();

// Wrap database operations with queue
export const queuedDatabaseOperation = <T>(operation: () => Promise<T>, operationName?: string): Promise<T> => {
  return dbQueue.add(operation, operationName);
};

// Fallback storage for when SQLite is not available
interface FallbackStorage {
  categories: Category[];
  locations: Location[];
  foodItems: any[];
}

let db: SQLite.SQLiteDatabase | null = null;
let useFallbackStorage = false;

// Cache database status to avoid repeated checks
let databaseStatusCache: {
  isAvailable: boolean;
  lastChecked: number;
  database: SQLite.SQLiteDatabase | null;
} = {
  isAvailable: false,
  lastChecked: 0,
  database: null
};

const DB_STATUS_CACHE_DURATION = 5000; // 5 seconds cache

// Database version management
const getCurrentDatabaseVersion = async (): Promise<number> => {
  try {
    const version = await AsyncStorage.getItem(VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    return 0;
  }
};

// Utility function to log database version and table status
export const logDatabaseStatus = async (): Promise<void> => {
  try {
    const currentVersion = await getCurrentDatabaseVersion();
    const database = await getDatabase();
    if (database) {
      try {
        // Check if wish_items table exists and has data
        const wishItemsCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM wish_items') as any;
        // Check if shopping_items table exists and has data
        const shoppingItemsCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM shopping_items') as any;
        // Check table schema for wish_items
        try {
          const wishItemsSchema = await database.getAllAsync("PRAGMA table_info(wish_items)");
        } catch (error) {
        }
        
        // Check table schema for shopping_items
        try {
          const shoppingItemsSchema = await database.getAllAsync("PRAGMA table_info(shopping_items)");
        } catch (error) {
        }
        
      } catch (error) {
      }
    } else {
    }
  } catch (error) {
  }
};

// Enhanced function to check if tables were dropped and recreated
export const checkTableResetStatus = async (): Promise<{
  currentVersion: number;
  targetVersion: number;
  migrationNeeded: boolean;
  wishItemsTableExists: boolean;
  shoppingItemsTableExists: boolean;
  wishItemsCount: number;
  shoppingItemsCount: number;
  wishItemsSchema: any[];
  shoppingItemsSchema: any[];
}> => {
  try {
    const currentVersion = await getCurrentDatabaseVersion();
    const database = await getDatabase();
    
    const result = {
      currentVersion,
      targetVersion: DATABASE_VERSION,
      migrationNeeded: currentVersion < DATABASE_VERSION,
      wishItemsTableExists: false,
      shoppingItemsTableExists: false,
      wishItemsCount: 0,
      shoppingItemsCount: 0,
      wishItemsSchema: [],
      shoppingItemsSchema: []
    };
    
    if (database) {
      try {
        // Check wish_items table
        const wishItemsCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM wish_items') as any;
        result.wishItemsTableExists = wishItemsCount !== null;
        result.wishItemsCount = wishItemsCount?.count || 0;
        
        // Check shopping_items table
        const shoppingItemsCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM shopping_items') as any;
        result.shoppingItemsTableExists = shoppingItemsCount !== null;
        result.shoppingItemsCount = shoppingItemsCount?.count || 0;
        
        // Get schemas
        try {
          result.wishItemsSchema = await database.getAllAsync("PRAGMA table_info(wish_items)");
        } catch (error) {
          // Table doesn't exist
        }
        
        try {
          result.shoppingItemsSchema = await database.getAllAsync("PRAGMA table_info(shopping_items)");
        } catch (error) {
          // Table doesn't exist
        }
      } catch (error) {
      }
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

const setDatabaseVersion = async (version: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(VERSION_KEY, version.toString());
  } catch (error) {
    // Silent error handling
  }
};

// Safe database backup before migrations
const backupUserData = async (database: SQLite.SQLiteDatabase): Promise<any> => {
  try {
    // Get ALL categories (both default and user-created) with proper structure
    const categories = await database.getAllAsync('SELECT * FROM categories ORDER BY id');
    // Get ALL locations (both default and user-created) with proper structure  
    const locations = await database.getAllAsync('SELECT * FROM locations ORDER BY id');
    // Get all food items
    const foodItems = await database.getAllAsync('SELECT * FROM food_items');
    
    const backup = {
      categories: categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        translation_key: cat.translation_key,
        created_at: cat.created_at,
        isUserCreated: cat.id > 8 // Categories with ID > 8 are user-created
      })),
      locations: locations.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        icon: loc.icon,
        translation_key: loc.translation_key,
        created_at: loc.created_at,
        isUserCreated: loc.id > 4 // Locations with ID > 4 are user-created
      })),
      foodItems,
      timestamp: getCurrentDateTimeISO(),
      language: await getStoredLanguage()
    };
    
    // Store backup in AsyncStorage for persistence across app updates
    await AsyncStorage.setItem('database_backup', JSON.stringify(backup));
    await AsyncStorage.setItem('categories_backup', JSON.stringify(backup.categories));
    await AsyncStorage.setItem('locations_backup', JSON.stringify(backup.locations));
    
    return backup;
  } catch (error) {
    
    return null;
  }
};

// Restore user data from backup with smart category/location preservation
const restoreUserDataFromBackup = async (database: SQLite.SQLiteDatabase): Promise<boolean> => {
  try {
    const backupData = await AsyncStorage.getItem('database_backup');
    if (!backupData) return false;
    
    const backup = JSON.parse(backupData);
    
    // 1. First, ensure default categories exist but DON'T overwrite existing ones
    await preserveExistingCategoriesAndLocations(database, backup.language);
    
    // 2. Restore user-created categories (ID > 8)
    for (const category of backup.categories) {
      if (category.isUserCreated || category.id > 8) {
        await database.runAsync(
          'INSERT OR REPLACE INTO categories (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [category.id, category.name, category.icon, category.translation_key, category.created_at]
        );
      } else {
        // For default categories, preserve if they exist, otherwise insert default
        const existing = await database.getFirstAsync('SELECT * FROM categories WHERE id = ?', [category.id]);
        if (!existing) {
          await database.runAsync(
            'INSERT INTO categories (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
            [category.id, category.name, category.icon, category.translation_key, category.created_at]
          );
        }
      }
    }
    
    // 3. Restore user-created locations (ID > 4)
    for (const location of backup.locations) {
      if (location.isUserCreated || location.id > 4) {
        await database.runAsync(
          'INSERT OR REPLACE INTO locations (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [location.id, location.name, location.icon, location.translation_key, location.created_at]
        );
      } else {
        // For default locations, preserve if they exist, otherwise insert default
        const existing = await database.getFirstAsync('SELECT * FROM locations WHERE id = ?', [location.id]);
        if (!existing) {
          await database.runAsync(
            'INSERT INTO locations (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
            [location.id, location.name, location.icon, location.translation_key, location.created_at]
          );
        }
      }
    }
    
    // 4. Restore food items
    for (const item of backup.foodItems) {
      await database.runAsync(
        'INSERT OR REPLACE INTO food_items (id, name, quantity, category_id, location_id, expiry_date, reminder_days, notes, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.name, item.quantity, item.category_id, item.location_id, item.expiry_date, item.reminder_days, item.notes, item.image_uri, item.created_at]
      );
    }
    
    return true;
  } catch (error) {
    
    return false;
  }
};

// New function to preserve existing categories and locations during updates
const preserveExistingCategoriesAndLocations = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  try {
    // For authenticated users: Skip local creation - defaults will be pulled from PostgreSQL
    // Only create defaults locally for offline users
    try {
      const activeUser = await getActiveLocalUser();
      if (activeUser && activeUser.is_active) {
        // Check if user has any categories/locations with group_id (synced from PostgreSQL)
        const syncedCategories = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories WHERE group_id IS NOT NULL') as any;
        if (syncedCategories && (syncedCategories.count || 0) > 0) {
          // User has synced data - skip local creation
          return;
        }
      }
    } catch (error) {
      // If check fails, proceed with local creation (offline mode)
    }

    const defaultCategories = getDefaultCategories(language);
    const defaultLocations = getDefaultLocations(language);
    
    // Only insert default categories if they don't exist (preserve existing ones)
    for (let i = 0; i < defaultCategories.length; i++) {
      const category = defaultCategories[i];
      const categoryId = i + 1; // IDs 1-8 for default categories
      
      const existing = await database.getFirstAsync('SELECT * FROM categories WHERE id = ?', [categoryId]) as any;
      if (!existing) {
        // Only insert if it doesn't exist
        await database.runAsync(
          'INSERT INTO categories (id, name, icon, translation_key) VALUES (?, ?, ?, ?)',
          [categoryId, category.name, category.icon, category.translationKey || null]
        );
      } else if (category.translationKey && !existing.translation_key) {
        // Update existing categories to add translation key if missing
        await database.runAsync(
          'UPDATE categories SET translation_key = ? WHERE id = ?',
          [category.translationKey, categoryId]
        );
      }
    }
    
    // Only insert default locations if they don't exist (preserve existing ones)
    for (let i = 0; i < defaultLocations.length; i++) {
      const location = defaultLocations[i];
      const locationId = i + 1; // IDs 1-4 for default locations
      
      const existing = await database.getFirstAsync('SELECT * FROM locations WHERE id = ?', [locationId]) as any;
      if (!existing) {
        // Only insert if it doesn't exist
        await database.runAsync(
          'INSERT INTO locations (id, name, icon, translation_key) VALUES (?, ?, ?, ?)',
          [locationId, location.name, location.icon, location.translationKey || null]
        );
      } else if (location.translationKey && !existing.translation_key) {
        // Update existing locations to add translation key if missing
        await database.runAsync(
          'UPDATE locations SET translation_key = ? WHERE id = ?',
          [location.translationKey, locationId]
        );
      }
    }
  } catch (error) {
    
  }
};

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
      db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.getAllAsync('SELECT 1');
    } catch (openError) {
      try {
        if (db) {
          try {
            await db.closeAsync();
          } catch (closeError) {
          }
          db = null;
        }
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await db.getAllAsync('SELECT 1');
      } catch (secondAttemptError) {
        try {
          if (db) {
            try {
              await backupUserData(db);
            } catch (backupError) {
            }
          }
        } catch (backupOuterError) {
        }
        try {
          if (db) {
            await db.closeAsync();
            db = null;
          }
          await SQLite.deleteDatabaseAsync(DATABASE_NAME);
          db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        } catch (recreateError) {
          await ensureFallbackStorage();
          return null;
        }
      }
    }
    // Final verification
    try {
      await db.getAllAsync('SELECT 1');
    } catch (verifyError) {
      await ensureFallbackStorage();
      return null;
    }
  }
  // Removed verbose logging - only log if database is null (error case)
  // 
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
export const resetDatabase = async (): Promise<void> => {
  try {
    // Ensure the database connection is closed before deletion
    await closeDatabase();

    // Delete the database file to ensure a clean reset
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    
    if (dbInfo.exists) {
      await FileSystem.deleteAsync(dbPath);
    }

    // Also clear any fallback storage
    await AsyncStorage.removeItem('fallback_data');

    // Clear versioning and other metadata from AsyncStorage
    await AsyncStorage.removeItem(VERSION_KEY);
    await AsyncStorage.removeItem('last_image_validation');

    // Re-initialize the database completely
    await initDatabase();

  } catch (error) {
    
    throw error;
  }
};

// Safe database getter with fallback handling and caching
export const getDatabaseSafely = async (): Promise<SQLite.SQLiteDatabase | null> => {
  const now = Date.now();
  
  // Use cached status if it's still valid
  if (now - databaseStatusCache.lastChecked < DB_STATUS_CACHE_DURATION) {
    return databaseStatusCache.database;
  }
  
  try {
    const database = await getDatabase();
    
    // Update cache with success
    databaseStatusCache = {
      isAvailable: database !== null,
      lastChecked: now,
      database: database
    };
    
    return database;
  } catch (error) {
    
    
    // Update cache with failure
    databaseStatusCache = {
      isAvailable: false,
      lastChecked: now,
      database: null
    };
    
    // Fallback to AsyncStorage mode
    await ensureFallbackStorage();
    return null;
  }
};

// Function to invalidate database cache (call when database status might change)
export const invalidateDatabaseCache = (): void => {
  databaseStatusCache = {
    isAvailable: false,
    lastChecked: 0,
    database: null
  };
};

// Function to check if we're using fallback storage (with caching)
export const isUsingFallbackStorage = (): boolean => {
  // If we have a recent database status cache, use that
  const now = Date.now();
  if (now - databaseStatusCache.lastChecked < DB_STATUS_CACHE_DURATION) {
    return !databaseStatusCache.isAvailable;
  }
  
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
  // Create tables (one statement per call)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supabase_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT DEFAULT CURRENT_TIMESTAMP,
      subscription_type TEXT CHECK (subscription_type IN ('free', 'family')),
      subscription_expires_at TEXT
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      translation_key TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      translation_key TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit TEXT DEFAULT 'unit',
      category_id INTEGER,
      location_id INTEGER,
      group_id TEXT,
      cloud_id TEXT UNIQUE,
      expiry_date TEXT NOT NULL,
      reminder_days INTEGER NOT NULL DEFAULT 3,
      notes TEXT,
      image_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
      FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit TEXT,
      image_uri TEXT,
      done BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      cloud_id TEXT,
      group_id TEXT,
      sync_status TEXT DEFAULT 'pending'
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS wish_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER,
      notes TEXT,
      price TEXT,
      rating INTEGER CHECK (rating >= 0 AND rating <= 5),
      image_uri TEXT,
      done BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  const createIndexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_food_items_expiry ON food_items(expiry_date)',
    'CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_food_items_location ON food_items(location_id)',
    'CREATE INDEX IF NOT EXISTS idx_shopping_items_done ON shopping_items(done)',
    'CREATE INDEX IF NOT EXISTS idx_wish_items_done ON wish_items(done)',
    'CREATE INDEX IF NOT EXISTS idx_shopping_items_created ON shopping_items(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_wish_items_created ON wish_items(created_at)'
  ];

  for (const query of createIndexQueries) {
    await database.execAsync(query);
  }

  // Add translation_key columns if they don't exist (for existing databases)
  try {
    await database.execAsync('ALTER TABLE categories ADD COLUMN translation_key TEXT');
  } catch (error) {
    // Column already exists or other error, continue
  }

  try {
    await database.execAsync('ALTER TABLE locations ADD COLUMN translation_key TEXT');
  } catch (error) {
    // Column already exists or other error, continue
  }

  // Add group_id column to food_items if it doesn't exist
  try {
    await database.execAsync('ALTER TABLE food_items ADD COLUMN group_id TEXT');
  } catch (error) {
    // Column already exists or other error, continue
  }

  // Add cloud_id column to food_items if it doesn't exist
  try {
    await database.execAsync('ALTER TABLE food_items ADD COLUMN cloud_id TEXT UNIQUE');
  } catch (error) {
    // Column already exists or other error, continue
  }

  // Add unit column to food_items if it doesn't exist
  try {
    await database.execAsync('ALTER TABLE food_items ADD COLUMN unit TEXT DEFAULT \'unit\'');
  } catch (error) {
    // Column already exists or other error, continue
  }

  // Add new columns to shopping_items if they don't exist
  try {
    await database.execAsync('ALTER TABLE shopping_items ADD COLUMN group_id TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE shopping_items ADD COLUMN quantity INTEGER DEFAULT 1');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE shopping_items ADD COLUMN unit TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE shopping_items ADD COLUMN updated_at TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE shopping_items ADD COLUMN cloud_id TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE shopping_items ADD COLUMN sync_status TEXT DEFAULT \'pending\'');
  } catch (error) {
    // Column already exists, continue
  }

  // Add new columns to wish_items if they don't exist
  try {
    await database.execAsync('ALTER TABLE wish_items ADD COLUMN group_id TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE wish_items ADD COLUMN updated_at TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE wish_items ADD COLUMN cloud_id TEXT');
  } catch (error) {
    // Column already exists, continue
  }
  try {
    await database.execAsync('ALTER TABLE wish_items ADD COLUMN sync_status TEXT DEFAULT \'pending\'');
  } catch (error) {
    // Column already exists, continue
  }

  // Create groups table if it doesn't exist (for local group management)
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    // Table already exists or other error, continue
  }
};

const getDefaultCategories = (language: Language): Category[] => {
  // Always use translation keys for default categories instead of language-specific names
  const defaultCategoriesWithKeys = [
    { name: 'category.vegetables', translationKey: 'category.vegetables', icon: '🥬' },
    { name: 'category.fruits', translationKey: 'category.fruits', icon: '🍎' },
    { name: 'category.dairy', translationKey: 'category.dairy', icon: '🥛' },
    { name: 'category.meat', translationKey: 'category.meat', icon: '🥩' },
    { name: 'category.snacks', translationKey: 'category.snacks', icon: '🍿' },
    { name: 'category.desserts', translationKey: 'category.desserts', icon: '🍰' },
    { name: 'category.seafood', translationKey: 'category.seafood', icon: '🐟' },
    { name: 'category.bread', translationKey: 'category.bread', icon: '🍞' }
  ];
  
  return defaultCategoriesWithKeys;
};

const getDefaultLocations = (language: Language): Location[] => {
  // Always use translation keys for default locations instead of language-specific names
  const defaultLocationsWithKeys = [
    { name: 'defaultLocation.fridge', translationKey: 'defaultLocation.fridge', icon: '❄️' },
    { name: 'defaultLocation.freezer', translationKey: 'defaultLocation.freezer', icon: '🧊' },
    { name: 'defaultLocation.pantry', translationKey: 'defaultLocation.pantry', icon: '🏠' },
    { name: 'defaultLocation.counter', translationKey: 'defaultLocation.counter', icon: '📦' }
  ];
  
  return defaultLocationsWithKeys;
};

// Centralized theme data with translation keys for quick setup categories
interface CategoryThemeData {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  categories: Array<{
    translationKey: string;
    icon: string;
  }>;
}

// Re-export helper for other modules
export const getTranslatedThemes = translateThemesConst;

// Create a mapping of category names to their translation keys
const createCategoryTranslationMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  
  // Add default categories (using English names as keys)
  const defaultCategories = getDefaultCategories('en');
  const defaultTranslationKeys = [
    'category.vegetables', 'category.fruits', 'category.dairy', 'category.meat',
    'category.snacks', 'category.desserts', 'category.seafood', 'category.bread'
  ];
  
  defaultCategories.forEach((cat, index) => {
    map[cat.name.toLowerCase()] = defaultTranslationKeys[index];
  });
  
  // Add all themed categories from ALL_THEMES
  ALL_THEMES.forEach(theme => {
    theme.categories.forEach(cat => {
      // We need to get the English name for this translation key
      // We'll create a reverse lookup using the translation system
      const englishName = getEnglishNameFromTranslationKey(cat.translationKey);
      if (englishName) {
        map[englishName.toLowerCase()] = cat.translationKey;
      }
    });
  });
  
  return map;
};

// Helper function to get English name from translation key
const getEnglishNameFromTranslationKey = (translationKey: string): string | null => {
  // This maps translation keys to their English equivalents
  const keyToEnglishMap: Record<string, string> = {
    'category.vegetables': 'Vegetables',
    'category.fruits': 'Fruits',
    'category.dairy': 'Dairy',
    'category.meat': 'Meat',
    'category.snacks': 'Snacks',
    'category.desserts': 'Desserts',
    'category.seafood': 'Seafood',
    'category.bread': 'Bread',
    'category.medications': 'Medications',
    'category.vitamins': 'Vitamins & Supplements',
    'category.firstAid': 'First Aid',
    'category.contactLenses': 'Contact Lenses',
    'category.bloodTestKits': 'Blood Test Kits',
    'category.medicalDevices': 'Medical Devices',
    'category.makeup': 'Makeup',
    'category.skincare': 'Skincare',
    'category.hairCare': 'Hair Care',
    'category.perfume': 'Perfume & Fragrance',
    'category.sunscreen': 'Sunscreen',
    'category.beautyTools': 'Beauty Tools',
    'category.cleaningSupplies': 'Cleaning Supplies',
    'category.laundryProducts': 'Laundry Products',
    'category.batteries': 'Batteries',
    'category.safetyEquipment': 'Safety Equipment',
    'category.paintCoatings': 'Paint & Coatings',
    'category.motorOil': 'Motor Oil',
    'category.fuelAdditives': 'Fuel Additives',
  };

  const englishName = keyToEnglishMap[translationKey];
  if (englishName) {
    return englishName;
  }
  
  return null;
};

// Function to get translated name for a category based on its current name
const getTranslatedCategoryName = (currentName: string, t: (key: string) => string): string => {
  const translationMap = createCategoryTranslationMap();
  const translationKey = translationMap[currentName.toLowerCase()];
  
  if (translationKey) {
    const translated = t(translationKey);
    return translated;
  }
  
  // If no translation key found, return the original name (user-created category)
  return currentName;
};

const insertDefaultData = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  // Check if we already have data
  const categoryCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');
  const locationCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM locations');
  
  if ((categoryCount as any)?.count > 0 && (locationCount as any)?.count > 0) {
    return;
  }

  // For fresh authenticated users: Skip local creation - defaults will be pulled from PostgreSQL
  // Only create defaults locally for offline users
  try {
    const activeUser = await getActiveLocalUser();
    if (activeUser && activeUser.is_active) {
      // User is authenticated - skip local creation, will pull from PostgreSQL
      return;
    }
  } catch (error) {
    // If check fails, proceed with local creation (offline mode)
  }

  const defaultCategories = getDefaultCategories(language);
  const defaultLocations = getDefaultLocations(language);

  // Use batch operations for much faster insertion
  
  await database.withTransactionAsync(async () => {
    for (const category of defaultCategories) {
      await database.runAsync(
        'INSERT OR IGNORE INTO categories (name, icon, translation_key) VALUES (?, ?, ?)',
        [category.name, category.icon, category.translationKey || null]
      );
    }
  });

  
  await database.withTransactionAsync(async () => {
    for (const location of defaultLocations) {
      await database.runAsync(
        'INSERT OR IGNORE INTO locations (name, icon, translation_key) VALUES (?, ?, ?)',
        [location.name, location.icon, location.translationKey || null]
      );
    }
  });
  
  
};

// Function to update existing default categories and locations with translation keys
export const updateExistingDefaultItemsWithTranslationKeys = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Check if this migration has already been completed
    const migrationKey = 'translation_keys_migration_completed';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      // Migration already completed, skip this operation entirely
      return;
    }
    
    // Check if we need to update anything first
    const categoriesNeedingUpdate = await database.getAllAsync(
      'SELECT COUNT(*) as count FROM categories WHERE translation_key IS NULL AND id <= 8'
    );
    const locationsNeedingUpdate = await database.getAllAsync(
      'SELECT COUNT(*) as count FROM locations WHERE translation_key IS NULL AND id <= 4'
    );
    
    if ((categoriesNeedingUpdate[0] as any)?.count === 0 && (locationsNeedingUpdate[0] as any)?.count === 0) {
      // Nothing to update, mark migration as completed and skip
      await AsyncStorage.setItem(migrationKey, 'true');
      return;
    }
    
    const defaultCategories = getDefaultCategories('en'); // Use English as reference
    const defaultLocations = getDefaultLocations('en');
    
    // Update default categories (IDs 1-8) with translation keys using batch operation
    
    await database.withTransactionAsync(async () => {
      for (let i = 0; i < defaultCategories.length; i++) {
        const categoryId = i + 1;
        const category = defaultCategories[i];
        
        if (category.translationKey) {
          await database.runAsync(
            'UPDATE categories SET translation_key = ? WHERE id = ? AND translation_key IS NULL',
            [category.translationKey, categoryId]
          );
        }
      }
    });
    
    // Update default locations (IDs 1-4) with translation keys using batch operation
    
    await database.withTransactionAsync(async () => {
      for (let i = 0; i < defaultLocations.length; i++) {
        const locationId = i + 1;
        const location = defaultLocations[i];
        
        if (location.translationKey) {
          await database.runAsync(
            'UPDATE locations SET translation_key = ? WHERE id = ? AND translation_key IS NULL',
            [location.translationKey, locationId]
          );
        }
      }
    });
    
    // Mark migration as completed successfully
    await AsyncStorage.setItem(migrationKey, 'true');
    
  } catch (error) {
    
    // Don't throw error, just log it to prevent database locks
  }
};

// Migration: for legacy theme categories added before translationKey support.
// If translation_key is NULL but the name column already contains a translation key string (e.g. "category.dairy"),
// copy that into translation_key. The UI layer will then translate by key and ignore the literal name.
const addMissingTranslationKeysForThemedCategories = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Check if this migration has already been completed
    const migrationKey = 'themed_categories_translation_keys_added';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      return;
    }

    // Find categories that are missing translation keys
    const categoriesToUpdate = await database.getAllAsync(
      'SELECT * FROM categories WHERE translation_key IS NULL OR translation_key = ""'
    );

    if (categoriesToUpdate.length > 0) {
      for (const category of categoriesToUpdate) {
        // Try to find a matching translation key based on the name
        const categoryName = (category as {name: string}).name;
        const categoryId = (category as {id: number}).id;
        const translationKey = getEnglishNameFromTranslationKey(categoryName.toLowerCase());
        
        if (translationKey) {
          await database.runAsync(
            'UPDATE categories SET translation_key = ? WHERE id = ?',
            [translationKey, categoryId]
          );
        }
      }
    }

    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    // Non-critical error, continue execution
  }
};

/**
 * Migration to version 7: Fix iOS image system issues after updates
 * This migration specifically addresses the issue where images disappear after iOS updates
 */
const migrateToVersion7 = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Check if this migration has already been completed
    const migrationKey = 'ios_image_recovery_v7';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      return;
    }

    // Get all food items with images
    const foodItems = await database.getAllAsync('SELECT id, image_uri FROM food_items WHERE image_uri IS NOT NULL');
    
    // Filter out emoji images and collect real image URIs
    const imageUris = foodItems
      .filter((item: any) => item.image_uri && !item.image_uri.startsWith('emoji:'))
      .map((item: any) => item.image_uri);
    
    if (imageUris.length > 0) {
      // Import necessary functions from fileStorage
      const { initializeImageStorage } = require('../utils/fileStorage');
      
      // Initialize image storage system
      await initializeImageStorage();
    }
    
    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, 'true');
    
    // Force app to be re-initialized to ensure image system is properly checked
    await AsyncStorage.setItem('app_initialized', 'false');
    
  } catch (error) {
    // Non-critical error, continue execution
  }
};

// Migration to version 15: Add group_id and cloud_id to categories and locations tables
const migrateToVersion15 = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    const migrationKey = 'categories_locations_group_id_cloud_id_v15';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      return;
    }
    // Add group_id and cloud_id columns to categories table
    try {
      await database.execAsync(`
        ALTER TABLE categories ADD COLUMN group_id TEXT;
        ALTER TABLE categories ADD COLUMN cloud_id TEXT UNIQUE;
      `);
    } catch (error: any) {
      // Column might already exist, check error
      if (error.message && error.message.includes('duplicate column')) {
      } else {
        throw error;
      }
    }

    // Add group_id and cloud_id columns to locations table
    try {
      await database.execAsync(`
        ALTER TABLE locations ADD COLUMN group_id TEXT;
        ALTER TABLE locations ADD COLUMN cloud_id TEXT UNIQUE;
      `);
    } catch (error: any) {
      // Column might already exist, check error
      if (error.message && error.message.includes('duplicate column')) {
      } else {
        throw error;
      }
    }

    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    // Don't throw - allow app to continue
  }
};

// Migration to version 13: Set null group_id to Personal group ID for food_items, shopping_items, and wish_items
const migrateToVersion13 = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    const migrationKey = 'null_group_id_migration_v13';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      return;
    }
    // Get Personal group ID from AsyncStorage (set by ApiContext when groups are loaded)
    let personalGroupId = await AsyncStorage.getItem('personal_group_id');
    
    // If not in AsyncStorage, try to get from stored groups
    if (!personalGroupId) {
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
            personalGroupId = personalGroup.id;
          } else if (personalGroup?.groups?.id) {
            personalGroupId = personalGroup.groups.id;
          }
        } catch (parseError) {
        }
      }
    }
    
    if (personalGroupId) {
      // Update food_items with null group_id
      const foodItemsUpdated = await database.runAsync(
        'UPDATE food_items SET group_id = ? WHERE group_id IS NULL',
        [personalGroupId]
      );
      // Update shopping_items with null group_id
      const shoppingItemsUpdated = await database.runAsync(
        'UPDATE shopping_items SET group_id = ? WHERE group_id IS NULL',
        [personalGroupId]
      );
      // Update wish_items with null group_id
      const wishItemsUpdated = await database.runAsync(
        'UPDATE wish_items SET group_id = ? WHERE group_id IS NULL',
        [personalGroupId]
      );
    } else {
      // Don't mark as completed, so it will retry next time
      return;
    }
    
    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    // Don't mark as completed if there was an error, so it can retry
  }
};

export const initDatabase = async (): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    try {
      const database = await getDatabase();
      if (!database) {
        const currentLanguage = await getStoredLanguage();
        return;
      }
      await createTables(database);
      const currentVersion = await getCurrentDatabaseVersion();
      const needsMigration = currentVersion < DATABASE_VERSION;
      if (needsMigration) {
      } else {
        
      }
      if (currentVersion === 0 && database) {
        try {
          const categoryCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');
          const locationCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM locations');
          if ((categoryCount as any)?.count > 0 && (locationCount as any)?.count > 0) {
            await setDatabaseVersion(DATABASE_VERSION);
            return;
          }
        } catch (error) {
        }
      }
      if (needsMigration && currentVersion > 0) {
        await backupUserData(database);
      }
      if (currentVersion < 9) {
        await resetShoppingItemsTable(database);
        await resetWishItemsTable(database);
      }
      const currentLanguage = await getStoredLanguage();
      if (currentVersion === 0) {
        await insertDefaultData(database, currentLanguage);
      } else if (needsMigration) {
        await insertDefaultData(database, currentLanguage);
        await restoreUserDataFromBackup(database);
      } else {
      }
      await updateExistingDefaultItemsWithTranslationKeys(database);
      if (currentVersion < 6) {
        await addMissingTranslationKeysForThemedCategories(database);
      }
      if (currentVersion < 7) {
        await migrateToVersion7(database);
      }
      if (currentVersion < 13) {
        await migrateToVersion13(database);
      }
      if (currentVersion < 14) {
        // Migration v14: String group_id fix will be handled by sync process after groups are loaded
        // This ensures we have group UUIDs available for mapping string values like "personal" to UUIDs
      }
      if (currentVersion < 15) {
        await migrateToVersion15(database);
      }
      if (currentVersion > 0 && currentVersion < DATABASE_VERSION) {
        await migrateToNewCategories(database, currentLanguage);
      }
      await setDatabaseVersion(DATABASE_VERSION);
      const finalVersion = await getCurrentDatabaseVersion();
    } catch (error) {
      try {
        const recovered = await restoreFromFullBackup();
        if (recovered) {
          return;
        }
      } catch (recoveryError) {
      }
      useFallbackStorage = true;
      await ensureFallbackStorage();
    }
  }, 'initDatabase');
};

const migrateToNewCategories = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  try {
    // Check if this migration has already been completed
    const migrationKey = 'new_categories_migration_completed';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      // Migration already completed, skip this operation entirely
      return;
    }
    
    // This function now focuses on preserving existing categories instead of replacing them
    
    // First, backup existing categories and locations to AsyncStorage
    const existingCategories = await database.getAllAsync('SELECT * FROM categories ORDER BY id');
    const existingLocations = await database.getAllAsync('SELECT * FROM locations ORDER BY id');
    
    if (existingCategories.length > 0) {
      await AsyncStorage.setItem('preserved_categories', JSON.stringify(existingCategories));
    }
    
    if (existingLocations.length > 0) {
      await AsyncStorage.setItem('preserved_locations', JSON.stringify(existingLocations));
    }
    
    // Use the new preservation function instead of destructive migration
    await preserveExistingCategoriesAndLocations(database, language);
    
    // Mark migration as completed successfully
    await AsyncStorage.setItem(migrationKey, 'true');
    
  } catch (error) {
    // Migration error - non-critical
    // Continue execution as this is not a critical error
  }
};

// Add this function to drop and recreate wish_items table
export const resetWishItemsTable = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync('DROP TABLE IF EXISTS wish_items');
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS wish_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      notes TEXT,
      price TEXT,
      rating INTEGER CHECK (rating >= 0 AND rating <= 5),
      image_uri TEXT,
      done BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Add this function to drop and recreate shopping_items table
export const resetShoppingItemsTable = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync('DROP TABLE IF EXISTS shopping_items');
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit TEXT,
      image_uri TEXT,
      done BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      cloud_id TEXT,
      group_id TEXT,
      sync_status TEXT DEFAULT 'pending'
    );
  `);
};

// Utility functions - Re-export from dateUtils for backward compatibility
export {
  getCurrentDate,
  addDaysToDate,
  formatDate,
  calculateDaysUntilExpiry,
  getCurrentDateTimeISO,
  toGMT8ISO,
  toGMT8DateString,
  getCurrentDateGMT8
} from '../utils/dateUtils';

// Regular data backup for iOS stability
export const performRegularBackup = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    if (database) {
      await backupUserData(database);
      
      // Also backup to a separate iOS-safe location
      const allData = {
        categories: await database.getAllAsync('SELECT * FROM categories'),
        locations: await database.getAllAsync('SELECT * FROM locations'),
        foodItems: await database.getAllAsync('SELECT * FROM food_items'),
        version: DATABASE_VERSION,
        timestamp: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('full_data_backup', JSON.stringify(allData));
    }
  } catch (error) {
    
  }
};

// Restore from full backup if database is completely lost
export const restoreFromFullBackup = async (): Promise<boolean> => {
  try {
    
    
    const database = await getDatabase();
    if (!database) {
      
      return false;
    }
    
    const fullBackup = await AsyncStorage.getItem('full_data_backup');
    if (!fullBackup) {
      
      
      // No backup found, ensure default data exists
      const currentLanguage = await getStoredLanguage();
      await insertDefaultData(database, currentLanguage);
      return false;
    }
    
    const backup = JSON.parse(fullBackup);
    
    
    // Restore all categories
    for (const category of backup.categories) {
      await database.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
        [category.id, category.name, category.icon, category.translation_key, category.created_at]
      );
    }
    
    // Restore all locations
    for (const location of backup.locations) {
      await database.runAsync(
        'INSERT OR REPLACE INTO locations (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
        [location.id, location.name, location.icon, location.translation_key, location.created_at]
      );
    }
    
    // Restore all food items
    for (const item of backup.foodItems) {
      await database.runAsync(
        'INSERT OR REPLACE INTO food_items (id, name, quantity, category_id, location_id, expiry_date, reminder_days, notes, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.name, item.quantity, item.category_id, item.location_id, item.expiry_date, item.reminder_days, item.notes, item.image_uri, item.created_at]
      );
    }
    
    // Always ensure default data exists after restore
    const currentLanguage = await getStoredLanguage();
    await preserveExistingCategoriesAndLocations(database, currentLanguage);
    
    
    return true;
  } catch (error) {
    
    
    // If restore fails completely, ensure we at least have default data
    try {
      const database = await getDatabase();
      if (database) {
        const currentLanguage = await getStoredLanguage();
        await insertDefaultData(database, currentLanguage);
        
      }
    } catch (fallbackError) {
      
    }
    
    return false;
  }
};

// Utility function to clear database locks
export const clearDatabaseLocks = async (): Promise<void> => {
  try {
    
    
    // First, try a gentle approach - just invalidate cache and wait
    invalidateDatabaseCache();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Try to get a fresh connection without closing the database
    const testDb = await getDatabase();
    if (testDb) {
      // Test if the database is responsive with a simple query
      try {
        await testDb.getFirstAsync('SELECT 1');
        
        return;
      } catch (testError) {
        
      }
    }
    
    // If gentle approach failed, close and reinitialize
    
    await closeDatabase();
    
    // Wait longer for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear the cache to force fresh connection
    invalidateDatabaseCache();
    
    // Reinitialize the database
    
    await initDatabase();
    
    
  } catch (error) {
    
    // Fall back to using AsyncStorage
    
    useFallbackStorage = true;
    await ensureFallbackStorage();
  }
};

// Helper function to execute database operations with retry logic
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('database is locked') && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('Max retries exceeded');
};

export const updateDefaultDataForLanguage = async (language: Language, t?: (key: string) => string): Promise<void> => {
  // No longer needed - categories and locations use translation keys now
  // This function can be simplified or removed entirely
  return Promise.resolve();
};

// Global database lock error handler
export const handleDatabaseLockError = async (error: any, operation: string): Promise<void> => {
  if (error.message && error.message.includes('database is locked')) {
    
    
    try {
      await clearDatabaseLocks();
      
    } catch (recoveryError) {
      
      // Force fallback storage as last resort
      useFallbackStorage = true;
      await ensureFallbackStorage();
    }
  }
};

// Database lock testing and monitoring functions
export const testDatabaseLock = async (): Promise<void> => {
  
  
  try {
    // Simulate multiple concurrent operations
    const operations = [
      queuedDatabaseOperation(async () => {
        const db = await getDatabaseSafely();
        if (db) {
          await db.getFirstAsync('SELECT COUNT(*) as count FROM food_items');
        }
      }, 'LockTest.read1'),
      
      queuedDatabaseOperation(async () => {
        const db = await getDatabaseSafely();
        if (db) {
          await db.getFirstAsync('SELECT COUNT(*) as count FROM categories');
        }
      }, 'LockTest.read2'),
      
      queuedDatabaseOperation(async () => {
        const db = await getDatabaseSafely();
        if (db) {
          // Simulate a slow operation
          await new Promise(resolve => setTimeout(resolve, 100));
          await db.getFirstAsync('SELECT COUNT(*) as count FROM locations');
        }
      }, 'LockTest.slowRead')
    ];
    
    await Promise.all(operations);
    
  } catch (error) {
    
  }
};

// Get current database status and active operations
export const getDatabaseStatus = (): {
  isReady: boolean;
  usingFallback: boolean;
  cacheStatus: any;
  activeOperations: number;
} => {
  return {
    isReady: db !== null,
    usingFallback: useFallbackStorage,
    cacheStatus: databaseStatusCache,
    activeOperations: (dbQueue as any).activeOperations?.size || 0
  };
};

// Create backup function
export const createBackup = async (): Promise<{ version: number; data: any }> => {
  // This is a read-only operation, but we queue it to avoid conflicts
  return queuedDatabaseOperation(async () => {
    const backupStartTime = Date.now();
    
    
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available for backup');
    }
    
    const backupData = {
      categories: await database.getAllAsync('SELECT * FROM categories'),
      locations: await database.getAllAsync('SELECT * FROM locations'),
      foodItems: await database.getAllAsync('SELECT * FROM food_items'),
      timestamp: new Date().toISOString()
    };
    

    return { version: DATABASE_VERSION, data: backupData };
  }, 'createBackup');
};

export const restoreFromBackup = async (backup: any): Promise<void> => {
  const database = await getDatabase();
  if (!database) {
    throw new Error('Database not available for restore');
  }

  return queuedDatabaseOperation(async () => {
    const restoreStartTime = Date.now();
    
    
    // Restore categories
    if (backup.data && backup.data.categories) {
      for (const category of backup.data.categories) {
        await database.runAsync(
          'INSERT OR REPLACE INTO categories (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [category.id, category.name, category.icon, category.translation_key, category.created_at]
        );
      }
    }
    
    // Restore locations
    if (backup.data && backup.data.locations) {
      for (const location of backup.data.locations) {
        await database.runAsync(
          'INSERT OR REPLACE INTO locations (id, name, icon, translation_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [location.id, location.name, location.icon, location.translation_key, location.created_at]
        );
      }
    }
    
    // Restore food items
    if (backup.data && backup.data.foodItems) {
      for (const item of backup.data.foodItems) {
        await database.runAsync(
          'INSERT OR REPLACE INTO food_items (id, name, quantity, category_id, location_id, expiry_date, reminder_days, notes, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.name, item.quantity, item.category_id, item.location_id, item.expiry_date, item.reminder_days, item.notes, item.image_uri, item.created_at]
        );
      }
    }
    

  }, 'restoreFromBackup');
};

// Emergency recovery function to restore default categories and locations
export const emergencyRestoreDefaults = async (): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    
    
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available for emergency restore');
    }
    
    // Clear existing data
    await database.runAsync('DELETE FROM categories WHERE id <= 8');
    await database.runAsync('DELETE FROM locations WHERE id <= 4');
    
    // Get current language
    const currentLanguage = await getStoredLanguage();
    
    // Insert fresh default data
    await insertDefaultData(database, currentLanguage);
    
    
  }, 'emergencyRestoreDefaults');
};

// Diagnostic function to check and force update translation keys
export const forceUpdateTranslationKeys = async (): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    
    
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available for translation key update');
    }
    
    // Check current state of categories
    const categories = await database.getAllAsync('SELECT id, name, translation_key FROM categories ORDER BY id');
    
    
    // Check current state of locations
    const locations = await database.getAllAsync('SELECT id, name, translation_key FROM locations ORDER BY id');
    
    
    const defaultCategories = getDefaultCategories('en'); // Use English as reference
    const defaultLocations = getDefaultLocations('en');
    
    // Force update default categories (IDs 1-8) with translation keys
    for (let i = 0; i < defaultCategories.length && i < 8; i++) {
      const categoryId = i + 1;
      const category = defaultCategories[i];
      
      if (category.translationKey) {
        await database.runAsync(
          'UPDATE categories SET translation_key = ? WHERE id = ?',
          [category.translationKey, categoryId]
        );
        
      }
    }
    
    // Force update default locations (IDs 1-4) with translation keys
    for (let i = 0; i < defaultLocations.length && i < 4; i++) {
      const locationId = i + 1;
      const location = defaultLocations[i];
      
      if (location.translationKey) {
        await database.runAsync(
          'UPDATE locations SET translation_key = ? WHERE id = ?',
          [location.translationKey, locationId]
        );
        
      }
    }
    
    // Verify the updates
    const updatedCategories = await database.getAllAsync('SELECT id, name, translation_key FROM categories ORDER BY id');
    
    
    const updatedLocations = await database.getAllAsync('SELECT id, name, translation_key FROM locations ORDER BY id');
    
    
    // Reset the migration flag so it can run again if needed
    await AsyncStorage.removeItem('translation_keys_migration_completed');
  }, 'forceUpdateTranslationKeys');
};

// User management functions
export const saveUserToLocal = async (userData: {
  supabase_id: string;
  email: string;
  full_name: string;
  subscription_type?: 'free' | 'family';
  subscription_expires_at?: string;
}): Promise<number> => {
  return queuedDatabaseOperation(async () => {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }

    const now = getCurrentDateTimeISO();
    
    // Check if user already exists
    const existingUser = await database.getFirstAsync(
      'SELECT id FROM users WHERE supabase_id = ?',
      [userData.supabase_id]
    );

    if (existingUser) {
      // Update existing user
      await database.runAsync(
        `UPDATE users SET 
          email = ?, 
          full_name = ?, 
          is_active = 1, 
          updated_at = ?, 
          last_login = ?,
          subscription_type = ?,
          subscription_expires_at = ?
        WHERE supabase_id = ?`,
        [
          userData.email,
          userData.full_name,
          now,
          now,
          userData.subscription_type || null,
          userData.subscription_expires_at || null,
          userData.supabase_id
        ]
      );
      return (existingUser as any).id;
    } else {
      // Insert new user
      const result = await database.runAsync(
        `INSERT INTO users (
          supabase_id, email, full_name, is_active, created_at, updated_at, last_login,
          subscription_type, subscription_expires_at
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          userData.supabase_id,
          userData.email,
          userData.full_name,
          now,
          now,
          now,
          userData.subscription_type || null,
          userData.subscription_expires_at || null
        ]
      );
      return result.lastInsertRowId as number;
    }
  }, 'saveUserToLocal');
};

export const getLocalUser = async (supabase_id: string): Promise<User | null> => {
  return queuedDatabaseOperation(async () => {
    const database = await getDatabase();
    if (!database) {
      return null;
    }

    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE supabase_id = ? AND is_active = 1',
      [supabase_id]
    );

    return user as User | null;
  }, 'getLocalUser');
};

export const getActiveLocalUser = async (): Promise<User | null> => {
  return queuedDatabaseOperation(async () => {
    const database = await getDatabase();
    if (!database) {
      return null;
    }

    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE is_active = 1 ORDER BY last_login DESC LIMIT 1'
    );

    return user as User | null;
  }, 'getActiveLocalUser');
};

export const deactivateUser = async (supabase_id: string): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }

    await database.runAsync(
      'UPDATE users SET is_active = 0, updated_at = ? WHERE supabase_id = ?',
      [getCurrentDateTimeISO(), supabase_id]
    );
  }, 'deactivateUser');
};

export const updateUserSubscription = async (
  supabase_id: string, 
  subscription_type: 'free' | 'family',
  subscription_expires_at?: string
): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }

    await database.runAsync(
      'UPDATE users SET subscription_type = ?, subscription_expires_at = ?, updated_at = ? WHERE supabase_id = ?',
      [subscription_type, subscription_expires_at || null, getCurrentDateTimeISO(), supabase_id]
    );
  }, 'updateUserSubscription');
};

// Clean up duplicate categories and locations from local SQLite database
// This removes entries where the name is a translation key (e.g., "category.bread", "defaultLocation.counter")
// Also removes duplicates where there's both a proper item and one with translation key as name
export const cleanupDuplicateCategoriesAndLocations = async (): Promise<{ categoriesDeleted: number; locationsDeleted: number }> => {
  return queuedDatabaseOperation(async () => {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }

    let categoriesDeleted = 0;
    let locationsDeleted = 0;

    // Delete categories where name starts with "category." (translation keys used as names)
    const categoryResult = await database.runAsync(
      "DELETE FROM categories WHERE name LIKE 'category.%'"
    );
    categoriesDeleted = categoryResult.changes || 0;

    // Delete locations where name starts with "defaultLocation." (translation keys used as names)
    const locationResult = await database.runAsync(
      "DELETE FROM locations WHERE name LIKE 'defaultLocation.%'"
    );
    locationsDeleted = locationResult.changes || 0;

    // Also delete locations with NULL group_id that have the same name as locations with a proper group_id
    // This handles cases where default locations (NULL group_id) duplicate synced locations
    const nullGroupDuplicates = await database.getAllAsync(`
      SELECT l1.id, l1.name, l1.group_id
      FROM locations l1
      INNER JOIN locations l2 ON LOWER(TRIM(l1.name)) = LOWER(TRIM(l2.name))
        AND l1.id != l2.id
      WHERE l1.group_id IS NULL AND l2.group_id IS NOT NULL
    `) as any[];
    
    for (const dup of nullGroupDuplicates) {
      await database.runAsync('DELETE FROM locations WHERE id = ?', [dup.id]);
      locationsDeleted++;
    }

    // Same for categories
    const nullGroupCategoryDuplicates = await database.getAllAsync(`
      SELECT c1.id, c1.name, c1.group_id
      FROM categories c1
      INNER JOIN categories c2 ON LOWER(TRIM(c1.name)) = LOWER(TRIM(c2.name))
        AND c1.id != c2.id
      WHERE c1.group_id IS NULL AND c2.group_id IS NOT NULL
    `) as any[];
    
    for (const dup of nullGroupCategoryDuplicates) {
      await database.runAsync('DELETE FROM categories WHERE id = ?', [dup.id]);
      categoriesDeleted++;
    }

    // Also delete duplicate locations/categories by name matching within the same group
    // If there are multiple items with the same name in the same group, keep the one with cloud_id (synced from server)
    // Delete duplicates where:
    // 1. Same name (case-insensitive)
    // 2. Same group_id (or both NULL)
    // 3. Keep the one with cloud_id, delete the one without (or the one with translation key as name)
    
    // Find duplicate locations: same name, same group_id, different IDs
    // Keep the one with cloud_id, delete others
    const duplicateLocations = await database.getAllAsync(`
      SELECT l1.id, l1.name, l1.group_id, l1.cloud_id, l2.id as other_id, l2.cloud_id as other_cloud_id
      FROM locations l1
      INNER JOIN locations l2 ON LOWER(TRIM(l1.name)) = LOWER(TRIM(l2.name)) 
        AND (l1.group_id = l2.group_id OR (l1.group_id IS NULL AND l2.group_id IS NULL))
        AND l1.id != l2.id
      WHERE l1.name NOT LIKE 'defaultLocation.%'
        AND l2.name NOT LIKE 'defaultLocation.%'
    `) as any[];
    
    // Create a set of IDs to keep (those with cloud_id)
    const locationsToKeep = new Set<number>();
    const locationsToDelete = new Set<number>();
    
    for (const dup of duplicateLocations) {
      // If l1 has cloud_id and l2 doesn't, keep l1, delete l2
      if (dup.cloud_id && !dup.other_cloud_id) {
        locationsToKeep.add(dup.id);
        locationsToDelete.add(dup.other_id);
      }
      // If l2 has cloud_id and l1 doesn't, keep l2, delete l1
      else if (dup.other_cloud_id && !dup.cloud_id) {
        locationsToKeep.add(dup.other_id);
        locationsToDelete.add(dup.id);
      }
      // If both have cloud_id or both don't, keep the one with lower ID (arbitrary but consistent)
      else {
        const keepId = dup.id < dup.other_id ? dup.id : dup.other_id;
        const deleteId = dup.id < dup.other_id ? dup.other_id : dup.id;
        locationsToKeep.add(keepId);
        locationsToDelete.add(deleteId);
      }
    }
    
    // Delete duplicate locations
    for (const id of locationsToDelete) {
      if (!locationsToKeep.has(id)) {
        await database.runAsync('DELETE FROM locations WHERE id = ?', [id]);
        locationsDeleted++;
      }
    }

    // Same logic for categories
    const duplicateCategories = await database.getAllAsync(`
      SELECT c1.id, c1.name, c1.group_id, c1.cloud_id, c2.id as other_id, c2.cloud_id as other_cloud_id
      FROM categories c1
      INNER JOIN categories c2 ON LOWER(TRIM(c1.name)) = LOWER(TRIM(c2.name)) 
        AND (c1.group_id = c2.group_id OR (c1.group_id IS NULL AND c2.group_id IS NULL))
        AND c1.id != c2.id
      WHERE c1.name NOT LIKE 'category.%'
        AND c2.name NOT LIKE 'category.%'
    `) as any[];
    
    const categoriesToKeep = new Set<number>();
    const categoriesToDelete = new Set<number>();
    
    for (const dup of duplicateCategories) {
      if (dup.cloud_id && !dup.other_cloud_id) {
        categoriesToKeep.add(dup.id);
        categoriesToDelete.add(dup.other_id);
      }
      else if (dup.other_cloud_id && !dup.cloud_id) {
        categoriesToKeep.add(dup.other_id);
        categoriesToDelete.add(dup.id);
      }
      else {
        const keepId = dup.id < dup.other_id ? dup.id : dup.other_id;
        const deleteId = dup.id < dup.other_id ? dup.other_id : dup.id;
        categoriesToKeep.add(keepId);
        categoriesToDelete.add(deleteId);
      }
    }
    
    for (const id of categoriesToDelete) {
      if (!categoriesToKeep.has(id)) {
        await database.runAsync('DELETE FROM categories WHERE id = ?', [id]);
        categoriesDeleted++;
      }
    }

    console.log(`[CLEANUP] Deleted ${categoriesDeleted} duplicate categories and ${locationsDeleted} duplicate locations from local DB`);

    return { categoriesDeleted, locationsDeleted };
  }, 'cleanupDuplicateCategoriesAndLocations');
};
