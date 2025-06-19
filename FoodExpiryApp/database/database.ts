import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../context/LanguageContext';
import { Category, Location } from './models';
import * as FileSystem from 'expo-file-system';

// Database configuration
const DATABASE_VERSION = 5;
const DATABASE_NAME = 'expiry_alert.db';
const VERSION_KEY = 'database_version';

// Fallback storage for when SQLite is not available
interface FallbackStorage {
  categories: Category[];
  locations: Location[];
  foodItems: any[];
}

let db: SQLite.SQLiteDatabase | null = null;
let useFallbackStorage = false;

// Database version management
const getCurrentDatabaseVersion = async (): Promise<number> => {
  try {
    const version = await AsyncStorage.getItem(VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    return 0;
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
        created_at: cat.created_at,
        isUserCreated: cat.id > 8 // Categories with ID > 8 are user-created
      })),
      locations: locations.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        icon: loc.icon,
        created_at: loc.created_at,
        isUserCreated: loc.id > 4 // Locations with ID > 4 are user-created
      })),
      foodItems,
      timestamp: new Date().toISOString(),
      language: await getStoredLanguage()
    };
    
    // Store backup in AsyncStorage for persistence across app updates
    await AsyncStorage.setItem('database_backup', JSON.stringify(backup));
    await AsyncStorage.setItem('categories_backup', JSON.stringify(backup.categories));
    await AsyncStorage.setItem('locations_backup', JSON.stringify(backup.locations));
    
    return backup;
  } catch (error) {
    console.error('Failed to backup user data:', error);
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
          'INSERT OR REPLACE INTO categories (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
          [category.id, category.name, category.icon, category.created_at]
        );
      } else {
        // For default categories, preserve if they exist, otherwise insert default
        const existing = await database.getFirstAsync('SELECT * FROM categories WHERE id = ?', [category.id]);
        if (!existing) {
          await database.runAsync(
            'INSERT INTO categories (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
            [category.id, category.name, category.icon, category.created_at]
          );
        }
      }
    }
    
    // 3. Restore user-created locations (ID > 4)
    for (const location of backup.locations) {
      if (location.isUserCreated || location.id > 4) {
        await database.runAsync(
          'INSERT OR REPLACE INTO locations (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
          [location.id, location.name, location.icon, location.created_at]
        );
      } else {
        // For default locations, preserve if they exist, otherwise insert default
        const existing = await database.getFirstAsync('SELECT * FROM locations WHERE id = ?', [location.id]);
        if (!existing) {
          await database.runAsync(
            'INSERT INTO locations (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
            [location.id, location.name, location.icon, location.created_at]
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
    console.error('Failed to restore user data from backup:', error);
    return false;
  }
};

// New function to preserve existing categories and locations during updates
const preserveExistingCategoriesAndLocations = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  try {
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
    console.error('Error preserving existing categories and locations:', error);
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
      // Try to open existing database first
      db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      // Test the connection
      await db.getAllAsync('SELECT 1');
      
    } catch (openError) {
      // Database open error, attempting recovery
      
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
        
        // Try to open database again (it might be corrupted, not missing)
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        
        // Test the connection again
        await db.getAllAsync('SELECT 1');
        
      } catch (secondAttemptError) {
        // Second attempt failed, checking for corruption
        
        // Only as a LAST RESORT, and only if we can backup data first
        try {
          // Try to backup any existing data before recreating
          if (db) {
            await backupUserData(db);
          }
                  } catch (backupError) {
            // Could not backup data before recreation
        }
        
        try {
          // Close and recreate only as last resort
          if (db) {
            await db.closeAsync();
            db = null;
          }
          
          await SQLite.deleteDatabaseAsync(DATABASE_NAME);
          db = await SQLite.openDatabaseAsync(DATABASE_NAME);
          
        } catch (recreateError) {
          // If SQLite completely fails, switch to fallback mode
          await ensureFallbackStorage();
          return null;
        }
      }
    }
    
    // Final verification
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
    console.error('Failed to reset database:', error);
    throw error;
  }
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
      translation_key TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    
    `CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      translation_key TEXT,
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

export const ALL_THEMES: CategoryThemeData[] = [
  {
    id: 'food',
    nameKey: 'theme.food',
    descKey: 'theme.foodDesc',
    icon: '🍎',
    categories: [
      { translationKey: 'category.vegetables', icon: '🥬' },
      { translationKey: 'category.fruits', icon: '🍎' },
      { translationKey: 'category.dairy', icon: '🥛' },
      { translationKey: 'category.meat', icon: '🥩' },
      { translationKey: 'category.snacks', icon: '🍿' },
      { translationKey: 'category.desserts', icon: '🍰' },
      { translationKey: 'category.seafood', icon: '🐟' },
      { translationKey: 'category.bread', icon: '🍞' },
    ]
  },
  {
    id: 'health',
    nameKey: 'theme.health',
    descKey: 'theme.healthDesc',
    icon: '💊',
    categories: [
      { translationKey: 'category.medications', icon: '💊' },
      { translationKey: 'category.vitamins', icon: '🍀' },
      { translationKey: 'category.firstAid', icon: '🩹' },
      { translationKey: 'category.contactLenses', icon: '👓' },
      { translationKey: 'category.bloodTestKits', icon: '🩸' },
      { translationKey: 'category.medicalDevices', icon: '⚕️' },
    ]
  },
  {
    id: 'beauty',
    nameKey: 'theme.beauty',
    descKey: 'theme.beautyDesc',
    icon: '💄',
    categories: [
      { translationKey: 'category.makeup', icon: '💄' },
      { translationKey: 'category.skincare', icon: '🧴' },
      { translationKey: 'category.hairCare', icon: '🧼' },
      { translationKey: 'category.perfume', icon: '🌸' },
      { translationKey: 'category.sunscreen', icon: '🌞' },
      { translationKey: 'category.beautyTools', icon: '🧽' },
    ]
  },
  {
    id: 'household',
    nameKey: 'theme.household',
    descKey: 'theme.householdDesc',
    icon: '🧹',
    categories: [
      { translationKey: 'category.cleaningSupplies', icon: '🧹' },
      { translationKey: 'category.laundryProducts', icon: '🧺' },
      { translationKey: 'category.batteries', icon: '🔋' },
      { translationKey: 'category.safetyEquipment', icon: '🧯' },
    ]
  },
  {
    id: 'automotive',
    nameKey: 'theme.automotive',
    descKey: 'theme.automotiveDesc',
    icon: '🛢️',
    categories: [
      { translationKey: 'category.paintCoatings', icon: '🎨' },
      { translationKey: 'category.motorOil', icon: '🛢️' },
      { translationKey: 'category.fuelAdditives', icon: '⛽' },
    ]
  }
];

// Function to get theme data with translations applied
export const getTranslatedThemes = (t: (key: string) => string) => {
  return ALL_THEMES.map(theme => ({
    id: theme.id,
    name: t(theme.nameKey),
    description: t(theme.descKey),
    icon: theme.icon,
    categories: theme.categories.map(cat => ({
      name: t(cat.translationKey),
      icon: cat.icon,
      translationKey: cat.translationKey // Keep for future reference
    }))
  }));
};

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

  const defaultCategories = getDefaultCategories(language);
  const defaultLocations = getDefaultLocations(language);

  // Insert categories
  for (const category of defaultCategories) {
    await database.runAsync(
      'INSERT OR IGNORE INTO categories (name, icon, translation_key) VALUES (?, ?, ?)',
      [category.name, category.icon, category.translationKey || null]
    );
  }

  // Insert locations
  for (const location of defaultLocations) {
    await database.runAsync(
      'INSERT OR IGNORE INTO locations (name, icon, translation_key) VALUES (?, ?, ?)',
      [location.name, location.icon, location.translationKey || null]
    );
  }
};

// Function to update existing default categories and locations with translation keys
const updateExistingDefaultItemsWithTranslationKeys = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    const defaultCategories = getDefaultCategories('en'); // Use English as reference
    const defaultLocations = getDefaultLocations('en');
    
    // Update default categories (IDs 1-8) with translation keys
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
    
    // Update default locations (IDs 1-4) with translation keys
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
    
  } catch (error) {
    console.error('Error updating existing items with translation keys:', error);
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

    // Check database version for migrations
    const currentVersion = await getCurrentDatabaseVersion();
    const needsMigration = currentVersion < DATABASE_VERSION;
    
    // Backup user data before any major changes
    if (needsMigration && currentVersion > 0) {
      // Migrating database from current version to target version
      await backupUserData(database);
    }

    await createTables(database);
    
    const currentLanguage = await getStoredLanguage();
    
    // If this is a new installation or migration, handle accordingly
    if (currentVersion === 0) {
      // Fresh installation
      await insertDefaultData(database, currentLanguage);
    } else if (needsMigration) {
      // Migration needed - preserve user data
      await insertDefaultData(database, currentLanguage);
      await restoreUserDataFromBackup(database);
    } else {
      // Existing installation, just ensure default data exists
      await insertDefaultData(database, currentLanguage);
    }
    
    // Update existing default items with translation keys if they don't have them
    await updateExistingDefaultItemsWithTranslationKeys(database);
    
    // Run category migration for existing databases
    await migrateToNewCategories(database, currentLanguage);
    
    // Update database version
    await setDatabaseVersion(DATABASE_VERSION);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

const migrateToNewCategories = async (database: SQLite.SQLiteDatabase, language: Language): Promise<void> => {
  try {
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
    
  } catch (error) {
    console.warn('Category migration warning (non-critical):', error);
    // Continue execution as this is not a critical error
  }
};

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
    console.error('Failed to reset database:', error);
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
    console.error('Regular backup failed:', error);
  }
};

// Restore from full backup if database is completely lost
export const restoreFromFullBackup = async (): Promise<boolean> => {
  try {
    const database = await getDatabase();
    if (!database) return false;
    
    const fullBackup = await AsyncStorage.getItem('full_data_backup');
    if (!fullBackup) return false;
    
    const backup = JSON.parse(fullBackup);
    
    // Restore all categories
    for (const category of backup.categories) {
      await database.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
        [category.id, category.name, category.icon, category.created_at]
      );
    }
    
    // Restore all locations
    for (const location of backup.locations) {
      await database.runAsync(
        'INSERT OR REPLACE INTO locations (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
        [location.id, location.name, location.icon, location.created_at]
      );
    }
    
    // Restore all food items
    for (const item of backup.foodItems) {
      await database.runAsync(
        'INSERT OR REPLACE INTO food_items (id, name, quantity, category_id, location_id, expiry_date, reminder_days, notes, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.name, item.quantity, item.category_id, item.location_id, item.expiry_date, item.reminder_days, item.notes, item.image_uri, item.created_at]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Full backup restore failed:', error);
    return false;
  }
};

// Helper function to update default data when language changes
export const updateDefaultDataForLanguage = async (language: Language, t?: (key: string) => string): Promise<void> => {
  // No longer needed - categories and locations use translation keys now
  // This function can be simplified or removed entirely
  return Promise.resolve();
}; 