import * as SQLite from 'expo-sqlite';

// Database name
const DATABASE_NAME = 'foodexpiry.db';

// Open or create the database
export const getDatabase = () => {
  return SQLite.openDatabase(DATABASE_NAME);
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
          (1, 'Vegetables', 'carrot'),
          (2, 'Fruits', 'apple-alt'),
          (3, 'Dairy', 'egg'),
          (4, 'Meat', 'drumstick-bite'),
          (5, 'Snacks', 'cookie'),
          (6, 'Desserts', 'ice-cream'),
          (7, 'Seafood', 'fish'),
          (8, 'Bread', 'bread-slice');`,
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
          (1, 'Fridge', 'door-closed'),
          (2, 'Freezer', 'snowflake'),
          (3, 'Pantry', 'box'),
          (4, 'Cabinet', 'cabinet-filing');`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error inserting default locations:', error);
            reject(error);
            return false;
          }
        );

        // Insert default food items if they don't exist
        const today = getCurrentDate();
        const tomorrow = formatDate(new Date(Date.now() + 86400000)); // +1 day
        const nextWeek = formatDate(new Date(Date.now() + 7 * 86400000)); // +7 days
        const lastWeek = formatDate(new Date(Date.now() - 7 * 86400000)); // -7 days
        const nextMonth = formatDate(new Date(Date.now() + 30 * 86400000)); // +30 days

        tx.executeSql(
          `INSERT OR IGNORE INTO food_items (
            id, name, category_id, location_id, expiry_date, reminder_days, notes, created_at
          ) VALUES 
          (1, 'Fresh Milk', 3, 1, ?, 2, 'Full cream milk', ?),
          (2, 'Chicken Breast', 4, 2, ?, 3, 'Raw chicken breast - 500g', ?),
          (3, 'Apples', 2, 1, ?, 2, 'Red apples - 6 pcs', ?),
          (4, 'Bread', 8, 3, ?, 1, 'Whole wheat bread', ?),
          (5, 'Salmon Fillet', 7, 2, ?, 2, 'Fresh salmon - 2 pieces', ?),
          (6, 'Yogurt', 3, 1, ?, 2, 'Greek yogurt - 500g', ?),
          (7, 'Carrots', 1, 1, ?, 3, 'Baby carrots', ?),
          (8, 'Chocolate Cookies', 5, 3, ?, 5, 'Homemade cookies', ?),
          (9, 'Ice Cream', 6, 2, ?, 7, 'Vanilla flavor', ?),
          (10, 'Expired Cheese', 3, 1, ?, 2, 'Cheddar cheese block', ?);`,
          [
            tomorrow, today,           // Milk
            nextWeek, today,          // Chicken
            nextWeek, today,          // Apples
            tomorrow, today,          // Bread
            nextMonth, today,         // Salmon
            nextWeek, today,          // Yogurt
            nextWeek, today,          // Carrots
            nextMonth, today,         // Cookies
            nextMonth, today,         // Ice Cream
            lastWeek, today,          // Expired Cheese
          ],
          () => {},
          (_, error): boolean => {
            console.error('Error inserting default food items:', error);
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
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
};

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get current date formatted as YYYY-MM-DD
export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

// Calculate days difference between two dates
export const daysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 