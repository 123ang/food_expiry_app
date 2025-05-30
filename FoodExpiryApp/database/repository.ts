import { getDatabase, getCurrentDate, daysDifference } from './database';
import { Category, Location, FoodItem, FoodItemWithDetails } from './models';

// Category Repository
export const CategoryRepository = {
  // Get all categories
  getAll: (): Promise<Category[]> => {
    return new Promise<Category[]>((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM categories ORDER BY name',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            console.error('Error getting categories:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get category by ID
  getById: (id: number): Promise<Category | null> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM categories WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows._array[0]);
            } else {
              resolve(null);
            }
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Create a new category
  create: (category: Category): Promise<number> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO categories (name, icon) VALUES (?, ?)',
          [category.name, category.icon],
          (_, { insertId }) => {
            resolve(insertId);
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Update an existing category
  update: (category: Category): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!category.id) {
        reject(new Error('Category ID is required for update'));
        return;
      }

      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
          [category.name, category.icon, category.id],
          () => {
            resolve();
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Delete a category
  delete: (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM categories WHERE id = ?',
          [id],
          () => {
            resolve();
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

// Location Repository
export const LocationRepository = {
  // Get all locations
  getAll: (): Promise<Location[]> => {
    return new Promise<Location[]>((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM locations ORDER BY name',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            console.error('Error getting locations:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get location by ID
  getById: (id: number): Promise<Location | null> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM locations WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows._array[0]);
            } else {
              resolve(null);
            }
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Create a new location
  create: (location: Location): Promise<number> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO locations (name, icon) VALUES (?, ?)',
          [location.name, location.icon],
          (_, { insertId }) => {
            resolve(insertId);
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Update an existing location
  update: (location: Location): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!location.id) {
        reject(new Error('Location ID is required for update'));
        return;
      }

      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE locations SET name = ?, icon = ? WHERE id = ?',
          [location.name, location.icon, location.id],
          () => {
            resolve();
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Delete a location
  delete: (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM locations WHERE id = ?',
          [id],
          () => {
            resolve();
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

// Food Item Repository
export const FoodItemRepository = {
  // Get all food items with details
  getAll: (): Promise<FoodItemWithDetails[]> => {
    return new Promise<FoodItemWithDetails[]>((resolve, reject) => {
      const db = getDatabase();
      const today = getCurrentDate();
      
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            f.*, 
            c.name as category_name, 
            c.icon as category_icon,
            l.name as location_name, 
            l.icon as location_icon
          FROM food_items f
          LEFT JOIN categories c ON f.category_id = c.id
          LEFT JOIN locations l ON f.location_id = l.id
          ORDER BY f.expiry_date ASC`,
          [],
          (_, { rows }) => {
            const items: FoodItemWithDetails[] = rows._array.map(item => {
              const daysUntil = daysDifference(today, item.expiry_date);
              let status: 'expired' | 'expiring_soon' | 'fresh' = 'fresh';
              
              if (daysUntil < 0) {
                status = 'expired';
              } else if (daysUntil <= 5) {
                status = 'expiring_soon';
              }
              
              return {
                ...item,
                days_until_expiry: daysUntil,
                status
              };
            });
            
            resolve(items);
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get food items by status
  getByStatus: (status: 'expired' | 'expiring_soon' | 'fresh'): Promise<FoodItemWithDetails[]> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const today = getCurrentDate();
      let whereClause = '';
      
      if (status === 'expired') {
        whereClause = `WHERE f.expiry_date < '${today}'`;
      } else if (status === 'expiring_soon') {
        // Items expiring in the next 5 days
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
        const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];
        whereClause = `WHERE f.expiry_date >= '${today}' AND f.expiry_date <= '${fiveDaysLaterStr}'`;
      } else {
        // Fresh items (expiring in more than 5 days)
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
        const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];
        whereClause = `WHERE f.expiry_date > '${fiveDaysLaterStr}'`;
      }
      
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            f.*, 
            c.name as category_name, 
            c.icon as category_icon,
            l.name as location_name, 
            l.icon as location_icon
          FROM food_items f
          LEFT JOIN categories c ON f.category_id = c.id
          LEFT JOIN locations l ON f.location_id = l.id
          ${whereClause}
          ORDER BY f.expiry_date ASC`,
          [],
          (_, { rows }) => {
            const items: FoodItemWithDetails[] = rows._array.map(item => {
              const daysUntil = daysDifference(today, item.expiry_date);
              
              return {
                ...item,
                days_until_expiry: daysUntil,
                status
              };
            });
            
            resolve(items);
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get food item by ID
  getById: (id: number): Promise<FoodItemWithDetails | null> => {
    return new Promise<FoodItemWithDetails | null>((resolve, reject) => {
      const db = getDatabase();
      const today = getCurrentDate();
      
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            f.*, 
            c.name as category_name, 
            c.icon as category_icon,
            l.name as location_name, 
            l.icon as location_icon
          FROM food_items f
          LEFT JOIN categories c ON f.category_id = c.id
          LEFT JOIN locations l ON f.location_id = l.id
          WHERE f.id = ?`,
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const item = rows._array[0];
              const daysUntil = daysDifference(today, item.expiry_date);
              let status: 'expired' | 'expiring_soon' | 'fresh' = 'fresh';
              
              if (daysUntil < 0) {
                status = 'expired';
              } else if (daysUntil <= 5) {
                status = 'expiring_soon';
              }
              
              resolve({
                ...item,
                days_until_expiry: daysUntil,
                status
              });
            } else {
              resolve(null);
            }
          },
          (_, error): boolean => {
            console.error('Error getting food item:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Create a new food item
  create: (item: Partial<FoodItem>): Promise<number> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const foodItem: FoodItem = {
        name: item.name || '',
        quantity: item.quantity || 1,
        category_id: item.category_id || null,
        location_id: item.location_id || null,
        expiry_date: item.expiry_date || getCurrentDate(),
        reminder_days: item.reminder_days || 0,
        notes: item.notes || null,
        image_uri: item.image_uri || null,
        created_at: item.created_at || getCurrentDate()
      };
      
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO food_items (
            name, quantity, category_id, location_id, expiry_date, 
            reminder_days, notes, image_uri, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            foodItem.name,
            foodItem.quantity,
            foodItem.category_id,
            foodItem.location_id,
            foodItem.expiry_date,
            foodItem.reminder_days,
            foodItem.notes,
            foodItem.image_uri,
            foodItem.created_at
          ],
          (_, { insertId }) => {
            resolve(insertId);
          },
          (_, error): boolean => {
            console.error('Error adding food item:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Update an existing food item
  update: (item: Partial<FoodItem>): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!item.id) {
        reject(new Error('Food item ID is required for update'));
        return;
      }

      const db = getDatabase();
      const foodItem: FoodItem = {
        name: item.name || '',
        quantity: item.quantity || 1,
        category_id: item.category_id || null,
        location_id: item.location_id || null,
        expiry_date: item.expiry_date || getCurrentDate(),
        reminder_days: item.reminder_days || 0,
        notes: item.notes || null,
        image_uri: item.image_uri || null,
        created_at: item.created_at || getCurrentDate()
      };
      
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE food_items SET 
            name = ?, 
            quantity = ?,
            category_id = ?, 
            location_id = ?, 
            expiry_date = ?, 
            reminder_days = ?, 
            notes = ?, 
            image_uri = ? 
          WHERE id = ?`,
          [
            foodItem.name,
            foodItem.quantity,
            foodItem.category_id,
            foodItem.location_id,
            foodItem.expiry_date,
            foodItem.reminder_days,
            foodItem.notes,
            foodItem.image_uri,
            item.id
          ],
          () => {
            resolve();
          },
          (_, error): boolean => {
            console.error('Error updating food item:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Delete a food item
  delete: (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM food_items WHERE id = ?',
          [id],
          () => {
            resolve();
          },
          (_, error): boolean => {
            console.error('Error deleting food item:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get counts for dashboard
  getCounts: (): Promise<{ total: number, expiring_soon: number, expired: number, fresh: number }> => {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const today = getCurrentDate();
      
      // Calculate date 5 days from now
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
      const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];
      
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN expiry_date < ? THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN expiry_date >= ? AND expiry_date <= ? THEN 1 ELSE 0 END) as expiring_soon,
            SUM(CASE WHEN expiry_date > ? THEN 1 ELSE 0 END) as fresh
          FROM food_items`,
          [today, today, fiveDaysLaterStr, fiveDaysLaterStr],
          (_, { rows }) => {
            resolve(rows._array[0]);
          },
          (_, error): boolean => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get food items by category
  getByCategory: (categoryId: number): Promise<FoodItemWithDetails[]> => {
    return new Promise<FoodItemWithDetails[]>((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            f.*,
            c.name as category_name,
            c.icon as category_icon,
            l.name as location_name,
            l.icon as location_icon
          FROM food_items f
          LEFT JOIN categories c ON f.category_id = c.id
          LEFT JOIN locations l ON f.location_id = l.id
          WHERE f.category_id = ?
          ORDER BY f.expiry_date`,
          [categoryId],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            console.error('Error getting food items by category:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Get food items by location
  getByLocation: (locationId: number): Promise<FoodItemWithDetails[]> => {
    return new Promise<FoodItemWithDetails[]>((resolve, reject) => {
      const db = getDatabase();
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            f.*,
            c.name as category_name,
            c.icon as category_icon,
            l.name as location_name,
            l.icon as location_icon
          FROM food_items f
          LEFT JOIN categories c ON f.category_id = c.id
          LEFT JOIN locations l ON f.location_id = l.id
          WHERE f.location_id = ?
          ORDER BY f.expiry_date`,
          [locationId],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            console.error('Error getting food items by location:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }
}; 