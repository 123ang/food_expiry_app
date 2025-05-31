import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase, getDatabase } from '../database/database';
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository';
import { Category, Location, FoodItem, FoodItemWithDetails } from '../database/models';

interface DatabaseContextType {
  // Loading state
  isLoading: boolean;
  error: Error | null;

  // Categories
  categories: Category[];
  getCategory: (id: number) => Promise<Category | null>;
  createCategory: (category: Category) => Promise<number>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Locations
  locations: Location[];
  getLocation: (id: number) => Promise<Location | null>;
  createLocation: (location: Location) => Promise<number>;
  updateLocation: (location: Location) => Promise<void>;
  deleteLocation: (id: number) => Promise<void>;

  // Food Items
  foodItems: FoodItemWithDetails[];
  getFoodItem: (id: number) => Promise<FoodItemWithDetails | null>;
  createFoodItem: (item: FoodItem) => Promise<number>;
  updateFoodItem: (item: FoodItem) => Promise<void>;
  deleteFoodItem: (id: number) => Promise<void>;
  getByStatus: (status: 'expired' | 'expiring_soon' | 'fresh') => Promise<FoodItemWithDetails[]>;

  // Dashboard Data
  dashboardCounts: {
    total: number;
    expiring_soon: number;
    expired: number;
    fresh: number;
  };

  // Refresh functions
  refreshCategories: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshFoodItems: () => Promise<void>;
  refreshDashboardCounts: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // New refreshData function
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

const calculateDaysUntilExpiry = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItemWithDetails[]>([]);
  const [dashboardCounts, setDashboardCounts] = useState({
    total: 0,
    expiring_soon: 0,
    expired: 0,
    fresh: 0
  });

  const loadData = async () => {
    const db = getDatabase();

    // Load categories
    const loadCategories = new Promise<Category[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM categories ORDER BY name',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            console.error('Error loading categories:', error);
            reject(error);
            return false;
          }
        );
      });
    });

    // Load locations
    const loadLocations = new Promise<Location[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM locations ORDER BY name',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            console.error('Error loading locations:', error);
            reject(error);
            return false;
          }
        );
      });
    });

    // Load food items with details
    const loadFoodItems = new Promise<FoodItemWithDetails[]>((resolve, reject) => {
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
          ORDER BY f.expiry_date`,
          [],
          (_, { rows: { _array } }) => {
            const itemsWithDetails = _array.map(item => ({
              ...item,
              days_until_expiry: calculateDaysUntilExpiry(item.expiry_date),
            }));
            resolve(itemsWithDetails);
          },
          (_, error) => {
            console.error('Error loading food items:', error);
            reject(error);
            return false;
          }
        );
      });
    });

    try {
      const [categoriesData, locationsData, foodItemsData] = await Promise.all([
        loadCategories,
        loadLocations,
        loadFoodItems,
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);
      setFoodItems(foodItemsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        await loadData();
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    };

    setupDatabase();
  }, []);

  // Refresh functions
  const refreshCategories = async () => {
    try {
      const data = await CategoryRepository.getAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
    }
  };

  const refreshLocations = async () => {
    try {
      const data = await LocationRepository.getAll();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    }
  };

  const refreshFoodItems = async () => {
    try {
      const data = await FoodItemRepository.getAll();
      setFoodItems(data);
      // Also refresh dashboard counts when food items are updated
      await refreshDashboardCounts();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch food items'));
    }
  };

  const refreshDashboardCounts = async () => {
    try {
      const counts = await FoodItemRepository.getCounts();
      setDashboardCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard counts'));
    }
  };

  const refreshAll = async () => {
    try {
      setIsLoading(true);
      
      // First refresh the base data
      await refreshCategories();
      await refreshLocations();
      
      // Then load all food items with fresh data
      const data = await FoodItemRepository.getAll();
      setFoodItems(data);
      
      // Finally update dashboard counts
      await refreshDashboardCounts();
      
      console.log('All data refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh all data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh all data'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      await loadData();
      await refreshDashboardCounts();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh data'));
    }
  };

  // Category operations
  const getCategory = async (id: number) => {
    return CategoryRepository.getById(id);
  };

  const createCategory = async (category: Category) => {
    const id = await CategoryRepository.create(category);
    await Promise.all([refreshCategories(), refreshFoodItems()]);
    return id;
  };

  const updateCategory = async (category: Category) => {
    await CategoryRepository.update(category);
    await Promise.all([refreshCategories(), refreshFoodItems()]);
  };

  const deleteCategory = async (id: number) => {
    await CategoryRepository.delete(id);
    await Promise.all([refreshCategories(), refreshFoodItems()]);
  };

  // Location operations
  const getLocation = async (id: number) => {
    return LocationRepository.getById(id);
  };

  const createLocation = async (location: Location) => {
    const id = await LocationRepository.create(location);
    await refreshLocations();
    return id;
  };

  const updateLocation = async (location: Location) => {
    await LocationRepository.update(location);
    await refreshLocations();
  };

  const deleteLocation = async (id: number) => {
    await LocationRepository.delete(id);
    await Promise.all([refreshLocations(), refreshFoodItems()]);
  };

  // Food item operations
  const getFoodItem = async (id: number) => {
    return FoodItemRepository.getById(id);
  };

  const createFoodItem = async (item: FoodItem) => {
    const id = await FoodItemRepository.create(item);
    await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
    return id;
  };

  const updateFoodItem = async (item: FoodItem) => {
    await FoodItemRepository.update(item);
    await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
  };

  const deleteFoodItem = async (id: number) => {
    await FoodItemRepository.delete(id);
    await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
  };

  // Add getByStatus function
  const getByStatus = async (status: 'expired' | 'expiring_soon' | 'fresh') => {
    try {
      const data = await FoodItemRepository.getByStatus(status);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch items by status'));
      return [];
    }
  };

  const value: DatabaseContextType = {
    isLoading,
    error,
    categories,
    locations,
    foodItems,
    dashboardCounts,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
    getFoodItem,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    getByStatus,
    refreshCategories,
    refreshLocations,
    refreshFoodItems,
    refreshDashboardCounts,
    refreshAll,
    refreshData
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 