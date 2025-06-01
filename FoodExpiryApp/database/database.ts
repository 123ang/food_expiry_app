import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

// Database name
const DATABASE_NAME = 'foodexpiry.db';

// Open or create the database
export const getDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return db;
};

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