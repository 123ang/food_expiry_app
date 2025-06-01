import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { initDatabase, getDatabase, resetDatabase, getCurrentDate } from '../database/database';
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository';
import { Category, Location, FoodItem, FoodItemWithDetails } from '../database/models';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  CATEGORIES: 'categories',
  LOCATIONS: 'locations',
  FOOD_ITEMS: 'foodItems',
  DASHBOARD_COUNTS: 'dashboardCounts'
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isValid: boolean;
}

interface CacheState {
  [CACHE_KEYS.CATEGORIES]: CacheEntry<Category[]>;
  [CACHE_KEYS.LOCATIONS]: CacheEntry<Location[]>;
  [CACHE_KEYS.FOOD_ITEMS]: CacheEntry<FoodItemWithDetails[]>;
  [CACHE_KEYS.DASHBOARD_COUNTS]: CacheEntry<{
    total: number;
    expiring_soon: number;
    expired: number;
    fresh: number;
  }>;
}

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
  resetDatabase: () => Promise<void>;

  // Cache management
  clearCache: () => void;
  invalidateCache: (keys?: string[]) => void;
  getCacheStatus: () => {
    categories: { cached: boolean; age: number };
    locations: { cached: boolean; age: number };
    foodItems: { cached: boolean; age: number };
    dashboardCounts: { cached: boolean; age: number };
  };
  isDataAvailable: () => boolean;
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

  // Individual cache refs for each data type
  const categoriesCache = useRef<CacheEntry<Category[]> | null>(null);
  const locationsCache = useRef<CacheEntry<Location[]> | null>(null);
  const foodItemsCache = useRef<CacheEntry<FoodItemWithDetails[]> | null>(null);
  const dashboardCountsCache = useRef<CacheEntry<{
    total: number;
    expiring_soon: number;
    expired: number;
    fresh: number;
  }> | null>(null);

  // Cache utility functions
  const isCacheValid = (cacheRef: React.MutableRefObject<CacheEntry<any> | null>): boolean => {
    const entry = cacheRef.current;
    if (!entry || !entry.isValid) return false;
    
    const now = Date.now();
    const isExpired = now - entry.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      entry.isValid = false;
      return false;
    }
    
    return true;
  };

  const setCacheEntry = <T,>(cacheRef: React.MutableRefObject<CacheEntry<T> | null>, data: T): void => {
    cacheRef.current = {
      data,
      timestamp: Date.now(),
      isValid: true
    };
  };

  const getCacheEntry = <T,>(cacheRef: React.MutableRefObject<CacheEntry<T> | null>): T | null => {
    if (!isCacheValid(cacheRef)) return null;
    return cacheRef.current?.data || null;
  };

  const clearCache = (): void => {
    categoriesCache.current = null;
    locationsCache.current = null;
    foodItemsCache.current = null;
    dashboardCountsCache.current = null;
    console.log('Cache cleared');
  };

  const invalidateCache = (keys?: string[]): void => {
    if (keys) {
      keys.forEach(key => {
        switch (key) {
          case CACHE_KEYS.CATEGORIES:
            if (categoriesCache.current) categoriesCache.current.isValid = false;
            break;
          case CACHE_KEYS.LOCATIONS:
            if (locationsCache.current) locationsCache.current.isValid = false;
            break;
          case CACHE_KEYS.FOOD_ITEMS:
            if (foodItemsCache.current) foodItemsCache.current.isValid = false;
            break;
          case CACHE_KEYS.DASHBOARD_COUNTS:
            if (dashboardCountsCache.current) dashboardCountsCache.current.isValid = false;
            break;
        }
      });
      console.log('Cache invalidated for keys:', keys);
    } else {
      if (categoriesCache.current) categoriesCache.current.isValid = false;
      if (locationsCache.current) locationsCache.current.isValid = false;
      if (foodItemsCache.current) foodItemsCache.current.isValid = false;
      if (dashboardCountsCache.current) dashboardCountsCache.current.isValid = false;
      console.log('All cache invalidated');
    }
  };

  const loadData = async () => {
    // Load categories with caching
    const loadCategories = async (): Promise<Category[]> => {
      const cached = getCacheEntry(categoriesCache);
      if (cached) {
        console.log('Using cached categories');
        return cached;
      }

      try {
        const data = await CategoryRepository.getAll();
        setCacheEntry(categoriesCache, data);
        console.log('Categories loaded from database and cached');
        return data;
      } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
      }
    };

    // Load locations with caching
    const loadLocations = async (): Promise<Location[]> => {
      const cached = getCacheEntry(locationsCache);
      if (cached) {
        console.log('Using cached locations');
        return cached;
      }

      try {
        const data = await LocationRepository.getAll();
        setCacheEntry(locationsCache, data);
        console.log('Locations loaded from database and cached');
        return data;
      } catch (error) {
        console.error('Error loading locations:', error);
        throw error;
      }
    };

    // Load food items with caching
    const loadFoodItems = async (): Promise<FoodItemWithDetails[]> => {
      const cached = getCacheEntry(foodItemsCache);
      if (cached) {
        console.log('Using cached food items');
        return cached;
      }

      try {
        const data = await FoodItemRepository.getAllWithDetails();
        setCacheEntry(foodItemsCache, data);
        console.log('Food items loaded from database and cached');
        return data;
      } catch (error) {
        console.error('Error loading food items:', error);
        throw error;
      }
    };

    try {
      const [categoriesData, locationsData, foodItemsData] = await Promise.all([
        loadCategories(),
        loadLocations(),
        loadFoodItems(),
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);
      setFoodItems(foodItemsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error : new Error('Failed to load data'));
    }
  };

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const startTime = Date.now();
        console.log('Starting database setup...');
        
        await initDatabase();
        
        // Load data with performance monitoring
        const loadStartTime = Date.now();
        await loadData();
        const loadEndTime = Date.now();
        
        console.log(`Data loaded in ${loadEndTime - loadStartTime}ms`);
        
        // Load dashboard counts separately to avoid blocking main data
        setTimeout(async () => {
          await refreshDashboardCounts();
        }, 100);
        
        const totalTime = Date.now() - startTime;
        console.log(`Database setup completed in ${totalTime}ms`);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up database:', error);
        setError(error instanceof Error ? error : new Error('Failed to setup database'));
        setIsLoading(false);
      }
    };

    setupDatabase();
  }, []);

  // Refresh functions with cache management
  const refreshCategories = async () => {
    try {
      // Invalidate cache first
      invalidateCache([CACHE_KEYS.CATEGORIES]);
      
      const data = await CategoryRepository.getAll();
      setCategories(data);
      
      // Update cache with fresh data
      setCacheEntry(categoriesCache, data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
    }
  };

  const refreshLocations = async () => {
    try {
      // Invalidate cache first
      invalidateCache([CACHE_KEYS.LOCATIONS]);
      
      const data = await LocationRepository.getAll();
      setLocations(data);
      
      // Update cache with fresh data
      setCacheEntry(locationsCache, data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    }
  };

  const refreshFoodItems = async () => {
    try {
      // Invalidate cache first
      invalidateCache([CACHE_KEYS.FOOD_ITEMS]);
      
      const data = await FoodItemRepository.getAllWithDetails();
      setFoodItems(data);
      
      // Update cache with fresh data
      setCacheEntry(foodItemsCache, data);
      
      // Also refresh dashboard counts when food items are updated
      await refreshDashboardCounts();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch food items'));
    }
  };

  const refreshDashboardCounts = async () => {
    try {
      // Check cache first
      const cached = getCacheEntry(dashboardCountsCache);
      if (cached) {
        console.log('Using cached dashboard counts');
        setDashboardCounts(cached);
        return;
      }
      
      // Calculate counts from food items
      const items = await FoodItemRepository.getAllWithDetails();
      const today = getCurrentDate();
      
      const counts = {
        total: items.length,
        expired: items.filter(item => item.days_until_expiry < 0).length,
        expiring_soon: items.filter(item => item.days_until_expiry >= 0 && item.days_until_expiry <= 5).length,
        fresh: items.filter(item => item.days_until_expiry > 5).length
      };
      
      setDashboardCounts(counts);
      
      // Update cache with fresh data
      setCacheEntry(dashboardCountsCache, counts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard counts'));
    }
  };

  const refreshAll = async () => {
    try {
      setIsLoading(true);
      
      // Clear all cache to force fresh data
      clearCache();
      
      // Load fresh data
      await loadData();
      
      // Refresh dashboard counts
      await refreshDashboardCounts();
      
      console.log('All data refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh all data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh all data'));
    } finally {
      setIsLoading(false);
    }
  };

  // Category operations with cache management
  const getCategory = async (id: number) => {
    return CategoryRepository.getById(id);
  };

  const createCategory = async (category: Category) => {
    const id = await CategoryRepository.create(category);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.CATEGORIES, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data
    await Promise.all([refreshCategories(), refreshFoodItems()]);
    return id;
  };

  const updateCategory = async (category: Category) => {
    await CategoryRepository.update(category);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.CATEGORIES, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data
    await Promise.all([refreshCategories(), refreshFoodItems()]);
  };

  const deleteCategory = async (id: number) => {
    await CategoryRepository.delete(id);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.CATEGORIES, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data
    await Promise.all([refreshCategories(), refreshFoodItems()]);
  };

  // Location operations with cache management
  const getLocation = async (id: number) => {
    return LocationRepository.getById(id);
  };

  const createLocation = async (location: Location) => {
    const id = await LocationRepository.create(location);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.LOCATIONS, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data
    await Promise.all([refreshLocations(), refreshFoodItems()]);
    return id;
  };

  const updateLocation = async (location: Location) => {
    await LocationRepository.update(location);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.LOCATIONS, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data
    await Promise.all([refreshLocations(), refreshFoodItems()]);
  };

  const deleteLocation = async (id: number) => {
    await LocationRepository.delete(id);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.LOCATIONS, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data
    await Promise.all([refreshLocations(), refreshFoodItems()]);
  };

  // Food item operations with cache management
  const getFoodItem = async (id: number): Promise<FoodItemWithDetails | null> => {
    try {
      // Try to find in cached data first
      const cached = getCacheEntry(foodItemsCache);
      if (cached) {
        const found = cached.find(item => item.id === id);
        if (found) return found;
      }
      
      // If not in cache, fetch all items with details and find the one we need
      const items = await FoodItemRepository.getAllWithDetails();
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error('Error getting food item:', error);
      throw error;
    }
  };

  const createFoodItem = async (item: FoodItem) => {
    const id = await FoodItemRepository.create(item);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
    
    // Refresh data
    await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
    return id;
  };

  const updateFoodItem = async (item: FoodItem) => {
    try {
      console.log('Updating food item:', item.id);
      await FoodItemRepository.update(item);
      
      // Invalidate related caches
      invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
      
      // Force refresh of all related data
      await Promise.all([
        refreshFoodItems(), 
        refreshDashboardCounts()
      ]);
      
      console.log('Food item updated and data refreshed');
    } catch (error) {
      console.error('Error updating food item:', error);
      throw error;
    }
  };

  const deleteFoodItem = async (id: number) => {
    await FoodItemRepository.delete(id);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
    
    // Refresh data
    await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
  };

  // Add getByStatus function with caching
  const getByStatus = async (status: 'expired' | 'expiring_soon' | 'fresh') => {
    try {
      // For status queries, we can use cached food items if available
      const cached = getCacheEntry(foodItemsCache);
      if (cached) {
        console.log('Using cached food items for status filter');
        // Filter cached data by status
        const filtered = cached.filter(item => {
          if (status === 'expired') return item.days_until_expiry < 0;
          if (status === 'expiring_soon') return item.days_until_expiry >= 0 && item.days_until_expiry <= 5;
          if (status === 'fresh') return item.days_until_expiry > 5;
          return false;
        });
        return filtered;
      }
      
      // If no cache, get all items and filter
      const items = await FoodItemRepository.getAllWithDetails();
      const filtered = items.filter(item => {
        if (status === 'expired') return item.days_until_expiry < 0;
        if (status === 'expiring_soon') return item.days_until_expiry >= 0 && item.days_until_expiry <= 5;
        if (status === 'fresh') return item.days_until_expiry > 5;
        return false;
      });
      return filtered;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch items by status'));
      return [];
    }
  };

  const resetDatabaseHandler = async () => {
    try {
      setIsLoading(true);
      console.log('Starting database reset...');
      await resetDatabase();
      clearCache();
      await loadData();
      console.log('Database reset and data refreshed');
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to reset database:', err);
      setError(err instanceof Error ? err : new Error('Failed to reset database'));
      setIsLoading(false);
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
    resetDatabase: resetDatabaseHandler,
    clearCache,
    invalidateCache,
    getCacheStatus: () => ({
      categories: { cached: isCacheValid(categoriesCache), age: Date.now() - (categoriesCache.current?.timestamp || 0) },
      locations: { cached: isCacheValid(locationsCache), age: Date.now() - (locationsCache.current?.timestamp || 0) },
      foodItems: { cached: isCacheValid(foodItemsCache), age: Date.now() - (foodItemsCache.current?.timestamp || 0) },
      dashboardCounts: { cached: isCacheValid(dashboardCountsCache), age: Date.now() - (dashboardCountsCache.current?.timestamp || 0) }
    }),
    isDataAvailable: () => {
      // Check if essential data is available either from cache or current state
      const hasCachedCategories = isCacheValid(categoriesCache) || categories.length > 0;
      const hasCachedLocations = isCacheValid(locationsCache) || locations.length > 0;
      const hasCachedFoodItems = isCacheValid(foodItemsCache) || foodItems.length > 0;
      
      return hasCachedCategories && hasCachedLocations && hasCachedFoodItems;
    }
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 