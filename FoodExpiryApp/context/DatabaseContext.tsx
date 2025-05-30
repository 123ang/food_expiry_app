import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase } from '../database/database';
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
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

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

  // Initialize database and load initial data
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        await refreshAll();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize database'));
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
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
    await Promise.all([
      refreshCategories(),
      refreshLocations(),
      refreshFoodItems(),
      refreshDashboardCounts()
    ]);
  };

  // Category operations
  const getCategory = async (id: number) => {
    return CategoryRepository.getById(id);
  };

  const createCategory = async (category: Category) => {
    const id = await CategoryRepository.create(category);
    await refreshCategories();
    return id;
  };

  const updateCategory = async (category: Category) => {
    await CategoryRepository.update(category);
    await refreshCategories();
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
    refreshCategories,
    refreshLocations,
    refreshFoodItems,
    refreshDashboardCounts,
    refreshAll
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}; 