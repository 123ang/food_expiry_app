import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { initDatabase, getDatabase, resetDatabase, getCurrentDate, performRegularBackup, restoreFromFullBackup } from '../database/database';
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository';
import { Category, Location, FoodItem, FoodItemWithDetails } from '../database/models';
import { simpleNotificationService } from '../services/SimpleNotificationService';
import { initializeImageStorage, validateDatabaseImageLinks, cleanupOrphanedImages } from '../utils/fileStorage';
import { autoFixCorruptedData } from '../utils/categoryRecovery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  deleteAllExpired: () => Promise<number>;
  deleteMultipleItems: (ids: number[]) => Promise<number>;
  getByStatus: (status: 'fresh' | 'expiring_soon' | 'expired') => Promise<FoodItemWithDetails[]>;
  getFoodItemsByGroup: (group_id?: string) => Promise<FoodItemWithDetails[]>;

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
  
  // Smart dashboard function (no database queries)
  ensureDashboardCounts: () => void;

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

  // Debounce mechanism to prevent rapid successive refresh calls
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshAllDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Validate and restore categories/locations if they were lost during app updates
  const validateAndRestoreCategoriesAndLocations = async (): Promise<void> => {
    try {
      // Check if categories were lost (common issue on iOS updates)
      const currentCategories = await CategoryRepository.getAll();
      const currentLocations = await LocationRepository.getAll();
      
      // If we have very few categories (< 4) or they all have default icons, check for backup
      if (currentCategories.length < 4 || currentCategories.every((cat: Category) => cat.icon === '🍎')) {
        
        
        // Try to restore from preserved categories backup
        const preservedCategories = await AsyncStorage.getItem('preserved_categories');
        if (preservedCategories) {
          const categories = JSON.parse(preservedCategories);
          // Categories found for restoration
          
          // Note: Actual restoration would require database access here
          // For now, we'll refresh the data to trigger proper category loading
          await refreshCategories();
        }
      }
      
      // Similar check for locations
      if (currentLocations.length < 3) {
        
        
        const preservedLocations = await AsyncStorage.getItem('preserved_locations');
        if (preservedLocations) {
          const locations = JSON.parse(preservedLocations);
          // Locations found for restoration
          
          await refreshLocations();
        }
      }
      

    } catch (error) {
      
      // Non-critical error, continue execution
    }
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
    // Invalidating caches
    
    if (!keys || keys.includes(CACHE_KEYS.CATEGORIES)) {
      if (categoriesCache.current) {
        categoriesCache.current.isValid = false;
        
      }
    }
    
    if (!keys || keys.includes(CACHE_KEYS.LOCATIONS)) {
      if (locationsCache.current) {
        locationsCache.current.isValid = false;
        
      }
    }
    
    if (!keys || keys.includes(CACHE_KEYS.FOOD_ITEMS)) {
      if (foodItemsCache.current) {
        foodItemsCache.current.isValid = false;
        
      }
    }
    
    if (!keys || keys.includes(CACHE_KEYS.DASHBOARD_COUNTS)) {
      if (dashboardCountsCache.current) {
        dashboardCountsCache.current.isValid = false;
        
      }
    }
    
    // Force data version update to trigger UI refreshes
    incrementDataVersion();
  };

  const loadCategories = async (): Promise<Category[]> => {
    try {
      const cached = getCacheEntry(categoriesCache);
      if (cached) {
        return cached;
      }

      const categories = await CategoryRepository.getAll();
      setCacheEntry(categoriesCache, categories);
      return categories;
    } catch (error) {
      
      throw error;
    }
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



  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const startTime = Date.now();
        
        // Initialize database (this includes proper skip logic for existing installations)
        await initDatabase();
        
        // Check if this is first-time setup or if we need to run expensive operations
        const isFirstTime = await AsyncStorage.getItem('app_initialized') !== 'true';
        
        if (isFirstTime) {
          // First-time initialization detected
          
          // Initialize image storage (only on first run)
          await initializeImageStorage();
          
          // Check and restore categories/locations if they were lost (only on first run)
          await validateAndRestoreCategoriesAndLocations();
          
          // Auto-fix any corrupted data (only on first run)
          await autoFixCorruptedData();
          
          // Mark app as initialized
          await AsyncStorage.setItem('app_initialized', 'true');
          // First-time setup completed
        } else {
          // Existing installation - skipping expensive initialization steps
        }
        
        // Load data with performance monitoring - load categories and locations in parallel
        const loadStartTime = Date.now();
        
        // Load essential data first (categories and locations) in parallel
        // Add fallback data if database fails
        let categoriesData: Category[] = [];
        let locationsData: Location[] = [];
        
        try {
          categoriesData = await CategoryRepository.getAll();
        } catch (error) {
          
          
        }
        
        try {
          locationsData = await LocationRepository.getAll();
        } catch (error) {
          
        }
        
        // Set categories and locations immediately for faster UI rendering
        setCategories(categoriesData);
        setLocations(locationsData);
        
        // Cache the data immediately
        setCacheEntry(categoriesCache, categoriesData);
        setCacheEntry(locationsCache, locationsData);
        
        // Then load food items with fallback
        let foodItemsData: FoodItemWithDetails[] = [];
        try {
          foodItemsData = await FoodItemRepository.getAllWithDetails();
        } catch (error) {
          
          foodItemsData = [];
        }
        setFoodItems(foodItemsData);
        setCacheEntry(foodItemsCache, foodItemsData);
        
        const loadEndTime = Date.now();
        
        // Load dashboard counts with minimal delay to avoid blocking UI
        setTimeout(async () => {
          await refreshDashboardCounts();
        }, 50);
        
        // Only run expensive background operations if we have food items with images
        const hasImages = foodItemsData.some(item => item.image_uri && !item.image_uri.startsWith('emoji:'));
        
        if (hasImages) {
          // Validate and cleanup images (after 1 second, only if there are images)
          setTimeout(async () => {
            try {
              // Get all image URIs from database (filter out null/undefined and emojis)
              const allImageUris = foodItemsData
                .map(item => item.image_uri)
                .filter((uri): uri is string => uri !== null && uri !== undefined && !uri.startsWith('emoji:'));
              
              // Validate image links
              const validation = await validateDatabaseImageLinks(allImageUris);
              if (validation.broken.length > 0) {
                
              }
              if (validation.repaired.length > 0) {
                
              }
              
              // Cleanup orphaned images
              await cleanupOrphanedImages(allImageUris);
            } catch (error) {
              
            }
          }, 1000);
        }
        
        // Perform backup only occasionally (not every startup)
        const lastBackup = await AsyncStorage.getItem('last_startup_backup');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastBackup || (now - parseInt(lastBackup)) > oneDay) {
          // Perform backup for iOS stability (after 2 seconds, only once per day)
          setTimeout(async () => {
            try {
              await performRegularBackup();
              await AsyncStorage.setItem('last_startup_backup', now.toString());
            } catch (error) {
              
            }
          }, 2000);
        }
        
        const totalTime = Date.now() - startTime;
        
        
        setIsLoading(false);
        setIsReady(true);
      } catch (error) {
        
        
        // Try to restore from backup if available
        try {
          const restored = await restoreFromFullBackup();
          if (restored) {
            
            // Retry loading data after restoration
            const [categoriesData, locationsData, foodItemsData] = await Promise.all([
              CategoryRepository.getAll(),
              LocationRepository.getAll(),
              FoodItemRepository.getAllWithDetails()
            ]);
            
            setCategories(categoriesData);
            setLocations(locationsData);
            setFoodItems(foodItemsData);
            
            setIsLoading(false);
            setIsReady(true);
            return;
          }
        } catch (restoreError) {
          
        }
        
        setError(error instanceof Error ? error : new Error('Failed to setup database'));
        setIsLoading(false);
        setIsReady(false);
      }
    };

    setupDatabase();
    
    // Listen for language change events to refresh cache
    const languageChangeListener = DeviceEventEmitter.addListener(
      'languageChanged',
      async (data) => {
        try {
          
          
          // Only clear cache once and refresh categories/locations since they may use translation keys
          clearCache();
          
          // Small delay to ensure everything is settled
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Refresh categories and locations since they may have translation keys
          await refreshCategories();
          await refreshLocations();
          
          setDataVersion(prev => prev + 1);
        } catch (error) {
          
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      languageChangeListener.remove();
    };
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
    
    const startTime = Date.now();
    
    // Check if we already have fresh cached data
    const cachedFoodItems = getCacheEntry(foodItemsCache);
    if (cachedFoodItems && isCacheValid(foodItemsCache)) {
      
      return;
    }
    
    // Debounce rapid successive calls
    if (refreshDebounceRef.current) {
      
      return;
    }
    
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
    }, 500); // 500ms debounce
    
    try {
      
      // Invalidate cache first
      invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
      
      
      const loadStart = Date.now();
      const data = await FoodItemRepository.getAllWithDetails();
      // Data loaded successfully
      
      
      setFoodItems(data);
      setCacheEntry(foodItemsCache, data);
      
      
      const countsStart = Date.now();
      // Calculate dashboard counts from the loaded data instead of separate DB query
      const total = data.length;
      const expiring_soon = data.filter(item => item.status === 'expiring_soon').length;
      const expired = data.filter(item => item.status === 'expired').length;
      const fresh = data.filter(item => item.status === 'fresh').length;
      
      const counts = { total, expiring_soon, expired, fresh };
      setDashboardCounts(counts);
      setCacheEntry(dashboardCountsCache, counts);
      // Dashboard counts calculated
      
      const totalTime = Date.now() - startTime;
      
    } catch (err) {
      const totalTime = Date.now() - startTime;
      
      setError(err instanceof Error ? err : new Error('Failed to fetch food items'));
    }
  };

  // Smart dashboard counts getter - calculates from existing data without database queries
  const ensureDashboardCounts = (): void => {
    // If we already have valid cached dashboard counts, do nothing
    const cached = getCacheEntry(dashboardCountsCache);
    if (cached) {
      return;
    }

    // Calculate from existing food items if available
    const cachedFoodItems = getCacheEntry(foodItemsCache);
    if (cachedFoodItems) {
      
      
      const total = cachedFoodItems.length;
      const expiring_soon = cachedFoodItems.filter(item => item.status === 'expiring_soon').length;
      const expired = cachedFoodItems.filter(item => item.status === 'expired').length;
      const fresh = cachedFoodItems.filter(item => item.status === 'fresh').length;
      
      const counts = { total, expiring_soon, expired, fresh };
      setDashboardCounts(counts);
      setCacheEntry(dashboardCountsCache, counts);
      return;
    }

    // Use current foodItems state if cache is empty
    if (foodItems.length > 0) {
      
      
      const total = foodItems.length;
      const expiring_soon = foodItems.filter(item => item.status === 'expiring_soon').length;
      const expired = foodItems.filter(item => item.status === 'expired').length;
      const fresh = foodItems.filter(item => item.status === 'fresh').length;
      
      const counts = { total, expiring_soon, expired, fresh };
      setDashboardCounts(counts);
      setCacheEntry(dashboardCountsCache, counts);
      return;
    }

    // No data available - dashboard will load it when needed
    
  };

  const refreshDashboardCounts = async (): Promise<void> => {

    ensureDashboardCounts();
  };

  const refreshAll = async (): Promise<void> => {
    
    
    // Debounce rapid successive calls
    if (refreshAllDebounceRef.current) {
      
      return;
    }
    
    refreshAllDebounceRef.current = setTimeout(() => {
      refreshAllDebounceRef.current = null;
    }, 1000); // 1 second debounce for refreshAll
    
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
    
    // Refresh data sequentially to avoid database conflicts
    await refreshCategories();
    // Small delay before refreshing food items
    await new Promise(resolve => setTimeout(resolve, 10));
    await refreshFoodItems();
    return id;
  };

  const updateCategory = async (category: Category) => {
    await CategoryRepository.update(category);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.CATEGORIES, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data sequentially to avoid database conflicts
    await refreshCategories();
    await new Promise(resolve => setTimeout(resolve, 10));
    await refreshFoodItems();
  };

  const deleteCategory = async (id: number) => {
    await CategoryRepository.delete(id);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.CATEGORIES, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data sequentially to avoid database conflicts
    await refreshCategories();
    await new Promise(resolve => setTimeout(resolve, 10));
    await refreshFoodItems();
  };

  // Location operations with cache management
  const getLocation = async (id: number) => {
    return LocationRepository.getById(id);
  };

  const createLocation = async (location: Location) => {
    const id = await LocationRepository.create(location);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.LOCATIONS, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data sequentially to avoid database conflicts
    await refreshLocations();
    await new Promise(resolve => setTimeout(resolve, 10));
    await refreshFoodItems();
    return id;
  };

  const updateLocation = async (location: Location) => {
    await LocationRepository.update(location);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.LOCATIONS, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data sequentially to avoid database conflicts
    await refreshLocations();
    await new Promise(resolve => setTimeout(resolve, 10));
    await refreshFoodItems();
  };

  const deleteLocation = async (id: number) => {
    await LocationRepository.delete(id);
    
    // Invalidate related caches
    invalidateCache([CACHE_KEYS.LOCATIONS, CACHE_KEYS.FOOD_ITEMS]);
    
    // Refresh data sequentially to avoid database conflicts
    await refreshLocations();
    await new Promise(resolve => setTimeout(resolve, 10));
    await refreshFoodItems();
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

  const rescheduleLocalNotifications = async (): Promise<void> => {
    try {
      const latestItems = await FoodItemRepository.getAllWithDetails();
      await simpleNotificationService.checkAllFoodItemsForExpiry(latestItems);
    } catch (error) {
      // Notification refresh must not block local data writes.
    }
  };

  const createFoodItem = async (item: FoodItem): Promise<number> => {
    
    const startTime = Date.now();
    
    try {
      
      const createStart = Date.now();
      const id = await FoodItemRepository.create(item);

      
      
      const cacheStart = Date.now();
      invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
      
      
      const refreshStart = Date.now();
      await refreshFoodItems();
      
      
      incrementDataVersion();
      
      
      setTimeout(() => performRegularBackup(), 1000);
      void rescheduleLocalNotifications();
      
      const totalTime = Date.now() - startTime;
      
      
      return id;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      throw error;
    }
  };

  const updateFoodItem = async (item: FoodItem): Promise<void> => {
    
    const startTime = Date.now();
    
    try {
      
      const updateStart = Date.now();
      await FoodItemRepository.update(item);
      
      
      const cacheStart = Date.now();
      invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
      
      
      const refreshStart = Date.now();
      await refreshFoodItems();
      
      
      incrementDataVersion();
      
      
      setTimeout(() => performRegularBackup(), 1000);
      void rescheduleLocalNotifications();
      
      const totalTime = Date.now() - startTime;
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
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
    
    // Trigger backup after data modification
    setTimeout(() => performRegularBackup(), 1000);
    void rescheduleLocalNotifications();
  };

  const deleteAllExpired = async (): Promise<number> => {
    try {
      const deletedCount = await FoodItemRepository.deleteAllExpired();
      
      // Invalidate related caches
      invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
      
      // Refresh data
      await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
      
      // Increment data version to notify screens of changes
      incrementDataVersion();
      void rescheduleLocalNotifications();
      
      return deletedCount;
    } catch (error) {
      throw error;
    }
  };

  const deleteMultipleItems = async (ids: number[]): Promise<number> => {
    try {
      const deletedCount = await FoodItemRepository.deleteMultiple(ids);
      
      // Invalidate related caches
      invalidateCache([CACHE_KEYS.FOOD_ITEMS, CACHE_KEYS.DASHBOARD_COUNTS]);
      
      // Refresh data
      await Promise.all([refreshFoodItems(), refreshDashboardCounts()]);
      
      // Increment data version to notify screens of changes
      incrementDataVersion();
      void rescheduleLocalNotifications();
      
      return deletedCount;
    } catch (error) {
      throw error;
    }
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

  // Add getFoodItemsByGroup function
  const getFoodItemsByGroup = async (group_id?: string): Promise<FoodItemWithDetails[]> => {
    try {
      // Always get fresh data for group filtering since cache doesn't support group filtering
      const items = await FoodItemRepository.getAllWithDetails(group_id);
      return items;
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
    deleteAllExpired,
    deleteMultipleItems,
    getByStatus,
    getFoodItemsByGroup,
    refreshCategories,
    refreshLocations,
    refreshFoodItems,
    refreshDashboardCounts,
    refreshAll,
    ensureDashboardCounts,
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
