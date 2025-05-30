import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDatabase } from '../database/database';
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository';
import { Category, Location, FoodItem, FoodItemWithDetails } from '../database/models';

interface DatabaseContextType {
  // Data
  categories: Category[];
  locations: Location[];
  foodItems: FoodItemWithDetails[];
  expiringItems: FoodItemWithDetails[];
  freshItems: FoodItemWithDetails[];
  expiredItems: FoodItemWithDetails[];
  counts: {
    total: number;
    expiring_soon: number;
    expired: number;
    fresh: number;
  };
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Category operations
  addCategory: (category: Category) => Promise<number>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  
  // Location operations
  addLocation: (location: Location) => Promise<number>;
  updateLocation: (location: Location) => Promise<void>;
  deleteLocation: (id: number) => Promise<void>;
  
  // Food item operations
  addFoodItem: (item: FoodItem) => Promise<number>;
  updateFoodItem: (item: FoodItem) => Promise<void>;
  deleteFoodItem: (id: number) => Promise<void>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItemWithDetails[]>([]);
  const [expiringItems, setExpiringItems] = useState<FoodItemWithDetails[]>([]);
  const [freshItems, setFreshItems] = useState<FoodItemWithDetails[]>([]);
  const [expiredItems, setExpiredItems] = useState<FoodItemWithDetails[]>([]);
  const [counts, setCounts] = useState<{
    total: number;
    expiring_soon: number;
    expired: number;
    fresh: number;
  }>({ total: 0, expiring_soon: 0, expired: 0, fresh: 0 });

  // Initialize database
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsInitialized(true);
        await refreshData();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Refresh all data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, locationsData, foodItemsData, countsData] = await Promise.all([
        CategoryRepository.getAll(),
        LocationRepository.getAll(),
        FoodItemRepository.getAll(),
        FoodItemRepository.getCounts()
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);
      setFoodItems(foodItemsData);
      setCounts(countsData);

      // Filter items by status
      setExpiringItems(foodItemsData.filter(item => item.status === 'expiring_soon'));
      setFreshItems(foodItemsData.filter(item => item.status === 'fresh'));
      setExpiredItems(foodItemsData.filter(item => item.status === 'expired'));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Category operations
  const addCategory = async (category: Category) => {
    const id = await CategoryRepository.create(category);
    await refreshData();
    return id;
  };

  const updateCategory = async (category: Category) => {
    await CategoryRepository.update(category);
    await refreshData();
  };

  const deleteCategory = async (id: number) => {
    await CategoryRepository.delete(id);
    await refreshData();
  };

  // Location operations
  const addLocation = async (location: Location) => {
    const id = await LocationRepository.create(location);
    await refreshData();
    return id;
  };

  const updateLocation = async (location: Location) => {
    await LocationRepository.update(location);
    await refreshData();
  };

  const deleteLocation = async (id: number) => {
    await LocationRepository.delete(id);
    await refreshData();
  };

  // Food item operations
  const addFoodItem = async (item: FoodItem) => {
    const id = await FoodItemRepository.create(item);
    await refreshData();
    return id;
  };

  const updateFoodItem = async (item: FoodItem) => {
    await FoodItemRepository.update(item);
    await refreshData();
  };

  const deleteFoodItem = async (id: number) => {
    await FoodItemRepository.delete(id);
    await refreshData();
  };

  const value = {
    // Data
    categories,
    locations,
    foodItems,
    expiringItems,
    freshItems,
    expiredItems,
    counts,
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Location operations
    addLocation,
    updateLocation,
    deleteLocation,
    
    // Food item operations
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    
    // Refresh data
    refreshData
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};