import * as SQLite from 'expo-sqlite';

let db: SQLite.WebSQLDatabase;

// Database name
const DATABASE_NAME = 'foodexpiry.db';

// Open or create the database
export const getDatabase = () => {
  if (!db) {
    db = SQLite.openDatabase(DATABASE_NAME);
  }
  return db;
};

// Initialize the database with tables
export const initDatabase = () => {
  const db = getDatabase();
  
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Create categories table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT NOT NULL
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating categories table:', error);
            reject(error);
            return false;
          }
        );

        // Create storage locations table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT NOT NULL
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating locations table:', error);
            reject(error);
            return false;
          }
        );

        // Create food items table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS food_items (
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
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating food_items table:', error);
            reject(error);
            return false;
          }
        );

        // Insert default categories if they don't exist
        tx.executeSql(
          `INSERT OR IGNORE INTO categories (id, name, icon) VALUES 
          (1, 'Vegetables', 'leaf'),
          (2, 'Fruits', 'apple'),
          (3, 'Dairy', 'glass'),
          (4, 'Meat', 'cutlery'),
          (5, 'Snacks', 'coffee'),
          (6, 'Desserts', 'birthday-cake'),
          (7, 'Seafood', 'anchor'),
          (8, 'Bread', 'shopping-basket');`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error inserting default categories:', error);
            reject(error);
            return false;
          }
        );

        // Insert default locations if they don't exist
        tx.executeSql(
          `INSERT OR IGNORE INTO locations (id, name, icon) VALUES 
          (1, 'Fridge', 'building'),
          (2, 'Freezer', 'snowflake-o'),
          (3, 'Pantry', 'archive'),
          (4, 'Cabinet', 'inbox');`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error inserting default locations:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
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