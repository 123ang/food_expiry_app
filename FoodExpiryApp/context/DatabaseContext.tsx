import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { initDatabase, getDatabase, resetDatabase, getCurrentDate } from '../database/database';
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository';
import { Category, Location, FoodItem, FoodItemWithDetails } from '../database/models';
import { simpleNotificationService } from '../services/SimpleNotificationService';

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
  getByStatus: (status: 'fresh' | 'expiring_soon' | 'expired') => Promise<FoodItemWithDetails[]>;

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

  // Data version tracking for detecting changes
  dataVersion: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItemWithDetails[]>([]);
  const [dashboardCounts, setDashboardCounts] = useState({
    total: 0,
    expiring_soon: 0,
    expired: 0,
    fresh: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [dataVersion, setDataVersion] = useState(1);

  // Cache refs with proper typing
  const categoriesCache = useRef<CacheEntry<Category[]> | null>(null);
  const locationsCache = useRef<CacheEntry<Location[]> | null>(null);
  const foodItemsCache = useRef<CacheEntry<FoodItemWithDetails[]> | null>(null);
  const dashboardCountsCache = useRef<CacheEntry<{
    total: number;
    expiring_soon: number;
    expired: number;
    fresh: number;
  }> | null>(null);

  // Function to increment data version when data changes
  const incrementDataVersion = () => {
    setDataVersion(prev => prev + 1);
  };

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
    } else {
      if (categoriesCache.current) categoriesCache.current.isValid = false;
      if (locationsCache.current) locationsCache.current.isValid = false;
      if (foodItemsCache.current) foodItemsCache.current.isValid = false;
      if (dashboardCountsCache.current) dashboardCountsCache.current.isValid = false;
    }
  };

  const loadCategories = async (): Promise<Category[]> => {
    const cached = getCacheEntry(categoriesCache);
    if (cached) {
      return cached;
    }

    const data = await CategoryRepository.getAll();
    setCacheEntry(categoriesCache, data);
    return data;
  };

  const loadLocations = async (): Promise<Location[]> => {
    const cached = getCacheEntry(locationsCache);
    if (cached) {
      return cached;
    }

    const data = await LocationRepository.getAll();
    setCacheEntry(locationsCache, data);
    return data;
  };

  const loadFoodItems = async (): Promise<FoodItemWithDetails[]> => {
    const cached = getCacheEntry(foodItemsCache);
    if (cached) {
      return cached;
    }

    const data = await FoodItemRepository.getAllWithDetails();
    setCacheEntry(foodItemsCache, data);
    return data;
  };

  const loadData = async () => {
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
      setError(error instanceof Error ? error : new Error('Failed to load data'));
    }
  };

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const startTime = Date.now();
        
        await initDatabase();
        
        // Load data with performance monitoring - load categories and locations in parallel
        const loadStartTime = Date.now();
        
        // Load essential data first (categories and locations) in parallel
        const [categoriesData, locationsData] = await Promise.all([
          CategoryRepository.getAll(),
          LocationRepository.getAll()
        ]);
        
        // Set categories and locations immediately for faster UI rendering
        setCategories(categoriesData);
        setLocations(locationsData);
        
        // Cache the data immediately
        setCacheEntry(categoriesCache, categoriesData);
        setCacheEntry(locationsCache, locationsData);
        
        // Then load food items
        const foodItemsData = await FoodItemRepository.getAllWithDetails();
        setFoodItems(foodItemsData);
        setCacheEntry(foodItemsCache, foodItemsData);
        
        const loadEndTime = Date.now();
        
        // Load dashboard counts with minimal delay to avoid blocking UI
        setTimeout(async () => {
          await refreshDashboardCounts();
        }, 50);
        
        const totalTime = Date.now() - startTime;
        
        setIsLoading(false);
        setIsReady(true);
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Failed to setup database'));
        setIsLoading(false);
        setIsReady(false);
      }
    };

    setupDatabase();
  }, []);

  // Refresh functions with cache management
  const refreshCategories = async () => {
    try {
      // Clear cache to force fresh data load
      invalidateCache([CACHE_KEYS.CATEGORIES]);
      
      setIsLoading(true);
      const data = await loadCategories();
      setCategories(data);
      setCacheEntry(categoriesCache, data);
      incrementDataVersion();
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocations = async () => {
    try {
      // Clear cache to force fresh data load
      invalidateCache([CACHE_KEYS.LOCATIONS]);
      
      setIsLoading(true);
      const data = await loadLocations();
      setLocations(data);
      setCacheEntry(locationsCache, data);
      incrementDataVersion();
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
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

  const refreshDashboardCounts = async (): Promise<void> => {
    const cached = getCacheEntry(dashboardCountsCache);
    if (cached) {
      return;
    }

    try {
      const currentDate = getCurrentDate();
      const db = await getDatabase();
      
      if (!db) {
        // If database not available, set default counts
        const defaultCounts = {
          total: 0,
          expired: 0,
          expiring_soon: 0,
          fresh: 0
        };
        setDashboardCounts(defaultCounts);
        setCacheEntry(dashboardCountsCache, defaultCounts);
        return;
      }
      
      const countsResult = await db.getAllAsync(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN date(expiry_date) < date(?) THEN 1 END) as expired,
          COUNT(CASE WHEN date(expiry_date) BETWEEN date(?) AND date(?, '+3 days') THEN 1 END) as expiring_soon,
          COUNT(CASE WHEN date(expiry_date) > date(?, '+3 days') THEN 1 END) as fresh
        FROM food_items
      `, [currentDate, currentDate, currentDate, currentDate]);
      
      const counts = countsResult[0] as any;
      const dashboardData = {
        total: counts.total || 0,
        expired: counts.expired || 0,
        expiring_soon: counts.expiring_soon || 0,
        fresh: counts.fresh || 0
      };
      
      setDashboardCounts(dashboardData);
      setCacheEntry(dashboardCountsCache, dashboardData);
    } catch (error) {
      // Silent error handling in production - set default counts
      const defaultCounts = {
        total: 0,
        expired: 0,
        expiring_soon: 0,
        fresh: 0
      };
      setDashboardCounts(defaultCounts);
    }
  };

  const refreshAll = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear all cache first to ensure fresh data
      clearCache();
      
      // Reload all data in parallel
      const [categoriesData, locationsData, foodItemsData] = await Promise.all([
        loadCategories(),
        loadLocations(),
        loadFoodItems()
      ]);
      
      // Update state
      setCategories(categoriesData);
      setLocations(locationsData);
      setFoodItems(foodItemsData);
      
      // Update cache
      setCacheEntry(categoriesCache, categoriesData);
      setCacheEntry(locationsCache, locationsData);
      setCacheEntry(foodItemsCache, foodItemsData);
      
      // Calculate dashboard counts
      const total = foodItemsData.length;
      const expiring_soon = foodItemsData.filter(item => item.status === 'expiring_soon').length;
      const expired = foodItemsData.filter(item => item.status === 'expired').length;
      const fresh = foodItemsData.filter(item => item.status === 'fresh').length;
      
      const counts = { total, expiring_soon, expired, fresh };
      setDashboardCounts(counts);
      setCacheEntry(dashboardCountsCache, counts);
      
      incrementDataVersion();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh data');
      setError(error);
      throw error;
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
      throw error;
    }
  };

  const createFoodItem = async (item: FoodItem): Promise<number> => {
    await ensureDatabaseReady();
    
    try {
      const id = await FoodItemRepository.create(item);
      
      // Refresh data to show the new item
      await refreshAll();
      
      return id;
    } catch (error) {
      throw error;
    }
  };

  const updateFoodItem = async (item: FoodItem): Promise<void> => {
    try {
      await FoodItemRepository.update(item);
      
      // Refresh data to show updated item
      await refreshAll();
    } catch (error) {
      throw error;
    }
  };

  const deleteFoodItem = async (id: number) => {
    await FoodItemRepository.delete(id);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
    
    // Refresh data
    await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
    
    // Increment data version to notify screens of changes
    incrementDataVersion();
  };

  // Add getByStatus function with caching
  const getByStatus = async (status: 'fresh' | 'expiring_soon' | 'expired'): Promise<FoodItemWithDetails[]> => {
    try {
      // Try cache first
      const cached = getCacheEntry(foodItemsCache);
      if (cached) {
        return cached.filter(item => item.status === status);
      }
      
      // If no cache, load fresh data
      const items = await FoodItemRepository.getAllWithDetails();
      setCacheEntry(foodItemsCache, items);
      setFoodItems(items);
      
      return items.filter(item => item.status === status);
    } catch (error) {
      throw error;
    }
  };

  const resetDatabaseData = async (): Promise<void> => {
    try {
      await resetDatabase();
      await refreshAll();
    } catch (error) {
      throw error;
    }
  };

  // Ensure database is ready before operations
  const ensureDatabaseReady = async (): Promise<void> => {
    if (!isReady) {
      // Wait up to 5 seconds for database to be ready
      for (let i = 0; i < 50; i++) {
        if (isReady) {
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Database not ready after timeout');
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
    resetDatabase: resetDatabaseData,
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
      // For a fresh install, we only need categories and locations to be available
      // Food items can be empty initially
      const hasCachedCategories = isCacheValid(categoriesCache) || categories.length > 0;
      const hasCachedLocations = isCacheValid(locationsCache) || locations.length > 0;
      
      return hasCachedCategories && hasCachedLocations;
    },
    dataVersion: dataVersion
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 