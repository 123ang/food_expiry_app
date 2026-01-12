import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { saveUserToLocal, getLocalUser, getActiveLocalUser, deactivateUser, updateUserSubscription, getDatabase, cleanupDuplicateCategoriesAndLocations } from '../database/database';
import { User as LocalUser } from '../database/models';
import { useDatabase } from './DatabaseContext';
import NetInfo from '@react-native-community/netinfo';
import authService from '../services/AuthService';
import apiClient from '../services/ApiClient';
import { pullShoppingItemsFromServer, pullWishItemsFromServer } from '../database/shoppingRepository';
import { FoodItemRepository, CategoryRepository, LocationRepository } from '../database/repository';
import { getCurrentDateTimeISO, getCurrentDate } from '../utils/dateUtils';
import * as FileSystem from 'expo-file-system';

// Define types
interface ApiContextType {
  // Authentication - simplified for single login
  user: LocalUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Groups & Sync
  currentGroup: Group | null;
  userGroups: GroupMembership[];
  createGroup: (name: string, description?: string) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>; // Delete group and all related data
  setCurrentGroup: (group: Group) => Promise<void>; // Allow manual group selection
  
  // Sync
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  syncToServer: () => Promise<void>;
  clearSyncData: () => Promise<void>;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code?: string | null;
  max_members?: number;
  created_at: string;
  updated_at: string;
}

interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  groups: Group;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Helper functions for session storage
const getStoredSession = async (email: string) => {
  try {
    const sessionKey = `api_session_${email}`;
    const storedSession = await AsyncStorage.getItem(sessionKey);
    if (storedSession) {
      return JSON.parse(storedSession);
    }
    return null;
  } catch (error) {
    return null;
  }
};

const storeSession = async (email: string, token: string, userId: string) => {
  try {
    const sessionKey = `api_session_${email}`;
    const sessionData = {
      token,
      userId,
      expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
    await AsyncStorage.setItem(sessionKey, JSON.stringify(sessionData));
  } catch (error) {
    // Error storing session
  }
};

const clearStoredSession = async (email: string) => {
  try {
    const sessionKey = `api_session_${email}`;
    await AsyncStorage.removeItem(sessionKey);
  } catch (error) {
    // Error clearing stored session
  }
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [userGroups, setUserGroups] = useState<GroupMembership[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const database = useDatabase();

  // Simplified authentication state
  const isAuthenticated = !!user;

  // Use Supabase client instead of custom API requests

  // Check for existing local user and validate tokens for auto-login
  const checkLocalUser = async () => {
    try {
      // Wait a bit for ApiClient to finish loading tokens from AsyncStorage
      // Since ApiClient constructor calls loadTokens() async, we give it time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const activeUser = await getActiveLocalUser();
      
      if (!activeUser) {
        setLoading(false);
        return;
      }
      
      // Check if tokens exist and are valid
      const accessToken = apiClient.getAccessToken();
      if (!accessToken) {
        // Clear invalid user data if no token
        await deactivateUser(activeUser.supabase_id);
        setLoading(false);
        return;
      }
      
      // Validate token by fetching current user from backend
      try {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          // Update local user with latest data
          const localUser: LocalUser = {
            id: activeUser.id, // Keep existing local id
            supabase_id: userResponse.user.id,
            email: userResponse.user.email,
            full_name: userResponse.user.full_name || userResponse.user.email,
            subscription_type: 'free' as const,
            is_active: true,
            created_at: activeUser.created_at || getCurrentDateTimeISO(),
            updated_at: getCurrentDateTimeISO(),
            last_login: getCurrentDateTimeISO()
          };
          await saveUserToLocal(localUser);
          setUser(localUser);
          
          // Auto-load user data (groups, etc.)
          await loadUserData(userResponse.user.id);
        } else {
          // Token is invalid, clear user data
          await deactivateUser(activeUser.supabase_id);
          await apiClient.clearTokens();
        }
      } catch (tokenError) {
        // Token validation failed, clear user data
        await deactivateUser(activeUser.supabase_id);
        await apiClient.clearTokens();
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for local user - this will also load user data if found
        await checkLocalUser();
      } catch (error) {
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout

    initializeAuth();

    return () => clearTimeout(timeoutId);
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Auto-sync when currentGroup changes (pull data from PostgreSQL)
  // Only runs after groups have been loaded
  useEffect(() => {
    const autoSyncOnGroupChange = async () => {
      // Wait until groups are loaded before syncing
      if (!currentGroup || !user || !isOnline || syncStatus === 'syncing' || userGroups.length === 0) {
        if (userGroups.length === 0) {
        }
        return;
      }

      try {
        // ============================================
        // LOG CATEGORIES AND LOCATIONS ON GROUP CHANGE
        // ============================================
        console.log(`\n[GROUP CHANGE] Switching to group: ${currentGroup.name} (${currentGroup.id})`);
        
        // Get categories from PostgreSQL
        try {
          const categoriesResponse = await apiClient.get<{ categories: any[] }>(`/categories?group_id=${currentGroup.id}`);
          const serverCategories = categoriesResponse.data?.categories || [];
          console.log(`[GROUP CHANGE] PostgreSQL Categories (${serverCategories.length}):`, JSON.stringify(serverCategories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            group_id: cat.group_id,
            translation_key: cat.translation_key,
            icon: cat.icon
          })), null, 2));
        } catch (catErr) {
          console.log(`[GROUP CHANGE] Error fetching PostgreSQL categories:`, catErr);
        }
        
        // Get categories from local database
        try {
          const localCategories = await CategoryRepository.getAll(currentGroup.id);
          console.log(`[GROUP CHANGE] Local Categories (${localCategories.length}):`, JSON.stringify(localCategories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            group_id: cat.group_id,
            cloud_id: cat.cloud_id,
            translation_key: cat.translationKey,
            icon: cat.icon
          })), null, 2));
        } catch (catErr) {
          console.log(`[GROUP CHANGE] Error fetching local categories:`, catErr);
        }
        
        // Get locations from PostgreSQL
        try {
          const locationsResponse = await apiClient.get<{ locations: any[] }>(`/locations?group_id=${currentGroup.id}`);
          const serverLocations = locationsResponse.data?.locations || [];
          console.log(`[GROUP CHANGE] PostgreSQL Locations (${serverLocations.length}):`, JSON.stringify(serverLocations.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            group_id: loc.group_id,
            translation_key: loc.translation_key,
            icon: loc.icon
          })), null, 2));
        } catch (locErr) {
          console.log(`[GROUP CHANGE] Error fetching PostgreSQL locations:`, locErr);
        }
        
        // Get locations from local database
        try {
          const localLocations = await LocationRepository.getAll(currentGroup.id);
          console.log(`[GROUP CHANGE] Local Locations (${localLocations.length}):`, JSON.stringify(localLocations.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            group_id: loc.group_id,
            cloud_id: loc.cloud_id,
            translation_key: loc.translationKey,
            icon: loc.icon
          })), null, 2));
        } catch (locErr) {
          console.log(`[GROUP CHANGE] Error fetching local locations:`, locErr);
        }
        
        console.log(`[GROUP CHANGE] ============================================\n`);
        
        // If local database has no categories/locations for this group, pull from PostgreSQL
        // This ensures UI shows data even if sync button hasn't been clicked yet
        const localCategoriesCount = await CategoryRepository.getAll(currentGroup.id).then(cats => cats.length).catch(() => 0);
        const localLocationsCount = await LocationRepository.getAll(currentGroup.id).then(locs => locs.length).catch(() => 0);
        
        if (localCategoriesCount === 0 || localLocationsCount === 0) {
          console.log(`[GROUP CHANGE] Local database is empty for this group - pulling from PostgreSQL...`);
          try {
            // Pull categories from PostgreSQL
            const categoriesResponse = await apiClient.get<{ categories: any[] }>(`/categories?group_id=${currentGroup.id}`);
            let serverCategories = categoriesResponse.data?.categories || [];
            
            // Filter out categories with translation keys as names (duplicates)
            serverCategories = serverCategories.filter((cat: any) => {
              if (cat.group_id && cat.group_id !== currentGroup.id) return false;
              if (cat.name && cat.name.startsWith('category.')) return false;
              return true;
            });
            
            // Import categories to local database
            for (const serverCategory of serverCategories) {
              const existingCategory = await CategoryRepository.getByCloudId(serverCategory.id);
              const categoryGroupId = serverCategory.group_id || currentGroup.id;
              
              if (!existingCategory) {
                await CategoryRepository.updateFromCloud({
                  cloud_id: serverCategory.id,
                  name: serverCategory.name,
                  icon: serverCategory.icon || '📦',
                  translation_key: serverCategory.translation_key || null,
                  group_id: categoryGroupId,
                  created_at: serverCategory.created_at || getCurrentDateTimeISO(),
                  updated_at: serverCategory.updated_at || getCurrentDateTimeISO(),
                });
              }
            }
            
            // Pull locations from PostgreSQL
            const locationsResponse = await apiClient.get<{ locations: any[] }>(`/locations?group_id=${currentGroup.id}`);
            let serverLocations = locationsResponse.data?.locations || [];
            
            // Filter out locations with translation keys as names (duplicates)
            serverLocations = serverLocations.filter((loc: any) => {
              if (loc.group_id && loc.group_id !== currentGroup.id) return false;
              if (loc.name && loc.name.startsWith('defaultLocation.')) return false;
              return true;
            });
            
            // Import locations to local database
            for (const serverLocation of serverLocations) {
              const existingLocation = await LocationRepository.getByCloudId(serverLocation.id);
              const locationGroupId = serverLocation.group_id || currentGroup.id;
              
              if (!existingLocation) {
                await LocationRepository.updateFromCloud({
                  cloud_id: serverLocation.id,
                  name: serverLocation.name,
                  icon: serverLocation.icon || '📍',
                  translation_key: serverLocation.translation_key || null,
                  group_id: locationGroupId,
                  created_at: serverLocation.created_at || getCurrentDateTimeISO(),
                  updated_at: serverLocation.updated_at || getCurrentDateTimeISO(),
                });
              }
            }
            
            // Refresh database context to update UI
            await database.refreshCategories();
            await database.refreshLocations();
            
            console.log(`[GROUP CHANGE] Pulled ${serverCategories.length} categories and ${serverLocations.length} locations from PostgreSQL`);
          } catch (pullErr) {
            console.log(`[GROUP CHANGE] Error pulling categories/locations:`, pullErr);
          }
        }
        
        // Pull food items from PostgreSQL server - Groups are already loaded
        
        
        const response = await apiClient.get<{ items: any[] }>(`/food-items?group_id=${currentGroup.id}`);
        const serverItems = response.data?.items || [];
        
        // Get food items from local SQLite database
        const localItems = await FoodItemRepository.getAllWithDetails(currentGroup.id);
        
        // Log comparison for debugging
        
        if (serverItems.length > 0) {
        } else {
        }
        if (localItems.length > 0) {
        }
        
        // Note: Categories and locations are NOT auto-synced here
        // They should be loaded from local database, and only synced when user clicks sync button
        // This ensures local database is the source of truth for UI display
        
        // Now import food items with proper UUID to integer ID mapping
        // Use updateFromCloud to prevent duplicates - it checks by cloud_id
        let importedCount = 0;
        let updatedCount = 0;
        for (const serverItem of serverItems) {
          try {
            // Check if item already exists locally by cloud_id
          const existingLocal = localItems.find((li: any) => li.cloud_id === serverItem.id);
            
            // Also check for potential duplicates by name + expiry_date + group_id
            // This handles cases where local item doesn't have cloud_id yet
            const potentialDuplicate = localItems.find((li: any) => 
              !li.cloud_id && // Local item doesn't have cloud_id
              li.name.toLowerCase().trim() === serverItem.name.toLowerCase().trim() &&
              li.expiry_date === (serverItem.expiry_date?.split('T')[0] || getCurrentDate()) &&
              li.group_id === currentGroup.id
            );
            
            if (potentialDuplicate && !existingLocal) {
              // Found a local item that matches server item - update it with cloud_id instead of creating duplicate
              // Map category UUID to local integer ID
              let localCategoryId: number | null = potentialDuplicate.category_id ?? null;
              if (serverItem.category_id && !localCategoryId) {
                const localCategory = await CategoryRepository.getByCloudId(serverItem.category_id);
                if (localCategory) {
                  localCategoryId = localCategory.id ?? null;
                }
              }
              
              // Map location UUID to local integer ID
              let localLocationId: number | null = potentialDuplicate.location_id ?? null;
              if (serverItem.location_id && !localLocationId) {
                const localLocation = await LocationRepository.getByCloudId(serverItem.location_id);
                if (localLocation) {
                  localLocationId = localLocation.id ?? null;
                }
              }
              
              // Download image if needed
              let localImageUri: string | null = potentialDuplicate.image_uri;
              if (serverItem.image_url && !localImageUri) {
                if (serverItem.image_url.startsWith('http://') || serverItem.image_url.startsWith('https://')) {
                  try {
                    let imageUrl = serverItem.image_url;
                    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
                      const { API_URL } = require('../services/ApiClient');
                      const baseUrl = API_URL.replace('/api', '');
                      imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
                      imageUrl = imageUrl.replace(/http:\/\/127\.0\.0\.1:\d+/, baseUrl);
                    }
                    
                    const timestamp = Date.now();
                    const randomId = Math.random().toString(36).substring(2, 15);
                    const filename = `img_${timestamp}_${randomId}.jpg`;
                    const imagesDir = `${(FileSystem as any).documentDirectory || ''}images/`;
                    
                    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
                    if (!dirInfo.exists) {
                      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
                    }
                    
                    const localUri = `${imagesDir}${filename}`;
                    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
                    localImageUri = downloadResult.uri;
                  } catch (imageError) {
                    localImageUri = null;
                  }
                } else {
                  localImageUri = serverItem.image_url;
                }
              }
              
              // Update existing local item with cloud_id and server data
              await FoodItemRepository.update({
                ...potentialDuplicate,
                cloud_id: serverItem.id,
                category_id: localCategoryId,
                location_id: localLocationId,
                image_uri: localImageUri,
              } as any);
              updatedCount++;
              
              continue; // Skip to next item
            }
            
          if (!existingLocal) {
            // Import from server - map UUID category_id and location_id to local integer IDs
              // Map category UUID to local integer ID
              let localCategoryId: number | null = null;
              if (serverItem.category_id) {
                const localCategory = await CategoryRepository.getByCloudId(serverItem.category_id);
                if (localCategory) {
                  localCategoryId = localCategory.id ?? null;
                } else {
                  // Try to find by cloud_id in current group's categories
                  const allLocalCategories = await CategoryRepository.getAll(currentGroup.id);
                  const foundCategory = allLocalCategories.find(cat => cat.cloud_id === serverItem.category_id);
                  if (foundCategory) {
                    localCategoryId = foundCategory.id ?? null;
                  }
                }
              }
              
              // Map location UUID to local integer ID
              let localLocationId: number | null = null;
              if (serverItem.location_id) {
                const localLocation = await LocationRepository.getByCloudId(serverItem.location_id);
                if (localLocation) {
                  localLocationId = localLocation.id ?? null;
                } else {
                  // Try to find by cloud_id in current group's locations
                  const allLocalLocations = await LocationRepository.getAll(currentGroup.id);
                  const foundLocation = allLocalLocations.find(loc => loc.cloud_id === serverItem.location_id);
                  if (foundLocation) {
                    localLocationId = foundLocation.id ?? null;
                  }
                }
              }
              
              // Download image if it's a URL
              let localImageUri: string | null = null;
              if (serverItem.image_url) {
                if (serverItem.image_url.startsWith('http://') || serverItem.image_url.startsWith('https://')) {
                  // Download image from URL
                  try {
                    // Replace localhost with the correct API base URL
                    let imageUrl = serverItem.image_url;
                    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
                      // Get the API base URL (without /api)
                      const { API_URL } = require('../services/ApiClient');
                      const baseUrl = API_URL.replace('/api', '');
                      imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
                      imageUrl = imageUrl.replace(/http:\/\/127\.0\.0\.1:\d+/, baseUrl);
                    }
                    const timestamp = Date.now();
                    const randomId = Math.random().toString(36).substring(2, 15);
                    const filename = `img_${timestamp}_${randomId}.jpg`;
                    const imagesDir = `${(FileSystem as any).documentDirectory || ''}images/`;
                    
                    // Ensure images directory exists
                    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
                    if (!dirInfo.exists) {
                      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
                    }
                    
                    const localUri = `${imagesDir}${filename}`;
                    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
                    localImageUri = downloadResult.uri;
                  } catch (imageError) {
                    // Continue without image if download fails
                    localImageUri = null;
                  }
                } else {
                  // Already a local path
                  localImageUri = serverItem.image_url;
                }
              }
              // Use updateFromCloud instead of create to prevent duplicates
              await FoodItemRepository.updateFromCloud({
                cloud_id: serverItem.id,
                name: serverItem.name,
                quantity: serverItem.quantity || 1,
                category_id: localCategoryId,
                location_id: localLocationId,
                group_id: currentGroup.id,
                expiry_date: serverItem.expiry_date?.split('T')[0] || getCurrentDate(),
                reminder_days: serverItem.reminder_days || 3,
                notes: serverItem.notes || null,
                image_uri: localImageUri,
                created_at: serverItem.created_at || getCurrentDateTimeISO(),
                updated_at: serverItem.updated_at || getCurrentDateTimeISO(),
              });
              importedCount++;
            } else {
              // Item already exists locally - update it with latest server data
              
              
              // Map category and location IDs
              let localCategoryId: number | null = existingLocal.category_id ?? null;
              if (serverItem.category_id && !localCategoryId) {
                const localCategory = await CategoryRepository.getByCloudId(serverItem.category_id);
                if (localCategory) {
                  localCategoryId = localCategory.id ?? null;
                }
              }
              
              let localLocationId: number | null = existingLocal.location_id ?? null;
              if (serverItem.location_id && !localLocationId) {
                const localLocation = await LocationRepository.getByCloudId(serverItem.location_id);
                if (localLocation) {
                  localLocationId = localLocation.id ?? null;
                }
              }
              
              // Download image if needed
              let localImageUri: string | null = existingLocal.image_uri;
              if (serverItem.image_url && !localImageUri) {
                if (serverItem.image_url.startsWith('http://') || serverItem.image_url.startsWith('https://')) {
                  try {
                    let imageUrl = serverItem.image_url;
                    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
                      const { API_URL } = require('../services/ApiClient');
                      const baseUrl = API_URL.replace('/api', '');
                      imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
                      imageUrl = imageUrl.replace(/http:\/\/127\.0\.0\.1:\d+/, baseUrl);
                    }
                    
                    const timestamp = Date.now();
                    const randomId = Math.random().toString(36).substring(2, 15);
                    const filename = `img_${timestamp}_${randomId}.jpg`;
                    const imagesDir = `${(FileSystem as any).documentDirectory || ''}images/`;
                    
                    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
                    if (!dirInfo.exists) {
                      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
                    }
                    
                    const localUri = `${imagesDir}${filename}`;
                    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
                    localImageUri = downloadResult.uri;
                  } catch (imageError) {
                    localImageUri = null;
                  }
                } else {
                  localImageUri = serverItem.image_url;
                }
              }
              
              // Update existing item
              await FoodItemRepository.updateFromCloud({
                cloud_id: serverItem.id,
                name: serverItem.name,
                quantity: serverItem.quantity || 1,
                category_id: localCategoryId,
                location_id: localLocationId,
                group_id: currentGroup.id,
                expiry_date: serverItem.expiry_date?.split('T')[0] || getCurrentDate(),
                reminder_days: serverItem.reminder_days || 3,
                notes: serverItem.notes || null,
                image_uri: localImageUri,
                created_at: serverItem.created_at || getCurrentDateTimeISO(),
                updated_at: serverItem.updated_at || getCurrentDateTimeISO(),
              });
              updatedCount++;
              
            }
            } catch (err) {
            }
          }
        
        if (importedCount > 0 || updatedCount > 0) {
        }
        
        // STEP 3: Clean up duplicates and orphaned items to ensure one source of truth
        // Remove local items that don't exist in cloud (for this group) and don't have cloud_id
        const serverItemIds = new Set(serverItems.map((si: any) => si.id));
        const localItemsAfterSync = await FoodItemRepository.getAllWithDetails(currentGroup.id);
        let removedCount = 0;
        let duplicateRemovedCount = 0;
        
        // Track items by cloud_id to find duplicates
        const itemsByCloudId = new Map<string, any[]>();
        const itemsByNameDateGroup = new Map<string, any[]>();
        
        for (const localItem of localItemsAfterSync) {
          // Group by cloud_id
          if (localItem.cloud_id) {
            if (!itemsByCloudId.has(localItem.cloud_id)) {
              itemsByCloudId.set(localItem.cloud_id, []);
            }
            itemsByCloudId.get(localItem.cloud_id)!.push(localItem);
          }
          
          // Group by name + expiry_date + group_id
          const nameKey = `${localItem.name.toLowerCase().trim()}_${localItem.expiry_date}_${localItem.group_id || 'null'}`;
          if (!itemsByNameDateGroup.has(nameKey)) {
            itemsByNameDateGroup.set(nameKey, []);
          }
          itemsByNameDateGroup.get(nameKey)!.push(localItem);
        }
        
        // Remove duplicates by cloud_id (keep the first one, remove others)
        for (const [cloudId, items] of itemsByCloudId.entries()) {
          if (items.length > 1) {
            // Keep the first item (prefer one with more complete data)
            const toKeep = items.reduce((best, current) => {
              if ((current.category_id || current.location_id) && !(best.category_id || best.location_id)) {
                return current;
              }
              return best;
            }, items[0]);
            
            // Remove the others
            for (const item of items) {
              if (item.id !== toKeep.id) {
                await FoodItemRepository.delete(item.id);
                duplicateRemovedCount++;
              }
            }
          }
        }
        
        // Remove duplicates by name+date+group (keep one with cloud_id, remove others without cloud_id)
        for (const [nameKey, items] of itemsByNameDateGroup.entries()) {
          if (items.length > 1) {
            // Find items with cloud_id
            const itemsWithCloudId = items.filter(item => item.cloud_id);
            const itemsWithoutCloudId = items.filter(item => !item.cloud_id);
            
            if (itemsWithCloudId.length > 0 && itemsWithoutCloudId.length > 0) {
              // Keep items with cloud_id, remove ones without
              
              for (const item of itemsWithoutCloudId) {
                
                await FoodItemRepository.delete(item.id);
                duplicateRemovedCount++;
              }
            } else if (itemsWithoutCloudId.length > 1) {
              // Multiple items without cloud_id - keep the first one, remove others
              
              for (let i = 1; i < items.length; i++) {
                await FoodItemRepository.delete(items[i].id);
                duplicateRemovedCount++;
              }
            }
          }
        }
        
        // Remove orphaned items (local items without cloud_id that don't match any server item)
        const finalLocalItems = await FoodItemRepository.getAllWithDetails(currentGroup.id);
        for (const localItem of finalLocalItems) {
          if (!localItem.cloud_id) {
            // Check if this item matches any server item by name + expiry_date
            const matchesServer = serverItems.some((si: any) => 
              si.name.toLowerCase().trim() === localItem.name.toLowerCase().trim() &&
              (si.expiry_date?.split('T')[0] || getCurrentDate()) === localItem.expiry_date &&
              si.group_id === currentGroup.id
            );
            
            if (!matchesServer) {
              // This is an orphaned item - it doesn't exist in cloud and doesn't have cloud_id
              // Only remove if it's been there for a while (more than 1 hour) to avoid removing items being created
              const itemAge = new Date().getTime() - new Date(localItem.created_at || getCurrentDateTimeISO()).getTime();
              const oneHour = 60 * 60 * 1000;
              
              if (itemAge > oneHour) {
                
                await FoodItemRepository.delete(localItem.id);
                removedCount++;
              } else {
                
              }
            }
          } else if (!serverItemIds.has(localItem.cloud_id)) {
            // Item has cloud_id but doesn't exist in server - this shouldn't happen, but clean it up
            
            await FoodItemRepository.delete(localItem.id);
            removedCount++;
          }
        }
        
        if (duplicateRemovedCount > 0 || removedCount > 0) {
        } else {
        }
        
        // STEP 4: Final verification - ensure local DB matches PostgreSQL
        const verificationLocalItems = await FoodItemRepository.getAllWithDetails(currentGroup.id);
        const finalServerItemIds = new Set(serverItems.map((si: any) => si.id));
        const finalLocalItemCloudIds = new Set(verificationLocalItems.filter(item => item.cloud_id).map(item => item.cloud_id));
        
        // Check for items in cloud that are missing locally
        const missingInLocal: string[] = [];
        for (const serverItem of serverItems) {
          if (!finalLocalItemCloudIds.has(serverItem.id)) {
            missingInLocal.push(serverItem.id);
          }
        }
        
        // Check for items in local that don't exist in cloud (should only be new items without cloud_id)
        const extraInLocal = verificationLocalItems.filter(item => 
          item.cloud_id && !finalServerItemIds.has(item.cloud_id)
        );
        
        if (missingInLocal.length > 0) {
        }
        
        if (extraInLocal.length > 0) {
          // Remove items with cloud_id that don't exist in server
          for (const item of extraInLocal) {
            await FoodItemRepository.delete(item.id);
          }
        }
        
        // Final count comparison
        const finalCount = verificationLocalItems.length - extraInLocal.length;
        
        
        
        // STEP 5: Sync ALL user groups to ensure one source of truth across all groups
        for (const group of userGroups) {
          if (group.group_id === currentGroup.id) {
            // Already synced this group above
            continue;
          }
          
          try {
            
            const groupResponse = await apiClient.get<{ items: any[] }>(`/food-items?group_id=${group.group_id}`);
            const groupServerItems = groupResponse.data?.items || [];
            const groupLocalItems = await FoodItemRepository.getAllWithDetails(group.group_id);
            
            // Sync items for this group
            for (const serverItem of groupServerItems) {
              const existingLocal = groupLocalItems.find((li: any) => li.cloud_id === serverItem.id);
              if (!existingLocal) {
                // Import from server
                let localCategoryId: number | null = null;
                if (serverItem.category_id) {
                  const localCategory = await CategoryRepository.getByCloudId(serverItem.category_id);
                  if (localCategory) localCategoryId = localCategory.id ?? null;
                }
                
                let localLocationId: number | null = null;
                if (serverItem.location_id) {
                  const localLocation = await LocationRepository.getByCloudId(serverItem.location_id);
                  if (localLocation) localLocationId = localLocation.id ?? null;
                }
                
                await FoodItemRepository.updateFromCloud({
                  cloud_id: serverItem.id,
                  name: serverItem.name,
                  quantity: serverItem.quantity || 1,
                  category_id: localCategoryId,
                  location_id: localLocationId,
                  group_id: group.group_id,
                  expiry_date: serverItem.expiry_date?.split('T')[0] || getCurrentDate(),
                  reminder_days: serverItem.reminder_days || 3,
                  notes: serverItem.notes || null,
                  image_uri: null,
                  created_at: serverItem.created_at || getCurrentDateTimeISO(),
                  updated_at: serverItem.updated_at || getCurrentDateTimeISO(),
                });
              } else {
                // Update existing
                await FoodItemRepository.updateFromCloud({
                  cloud_id: serverItem.id,
                  name: serverItem.name,
                  quantity: serverItem.quantity || 1,
                  category_id: existingLocal.category_id,
                  location_id: existingLocal.location_id,
                  group_id: group.group_id,
                  expiry_date: serverItem.expiry_date?.split('T')[0] || getCurrentDate(),
                  reminder_days: serverItem.reminder_days || 3,
                  notes: serverItem.notes || null,
                  image_uri: existingLocal.image_uri,
                  created_at: serverItem.created_at || getCurrentDateTimeISO(),
                  updated_at: serverItem.updated_at || getCurrentDateTimeISO(),
                });
              }
            }
            
            // Remove local items from this group that don't exist in cloud
            // Also match local items without cloud_id to server items by name+date
            const groupServerItemIds = new Set(groupServerItems.map((si: any) => si.id));
            for (const localItem of groupLocalItems) {
              if (localItem.cloud_id && !groupServerItemIds.has(localItem.cloud_id)) {
                
                await FoodItemRepository.delete(localItem.id);
              } else if (!localItem.cloud_id) {
                // Try to match local item without cloud_id to server item by name+date
                const matchingServerItem = groupServerItems.find((si: any) => 
                  si.name.toLowerCase().trim() === localItem.name.toLowerCase().trim() &&
                  (si.expiry_date?.split('T')[0] || getCurrentDate()) === localItem.expiry_date
                );
                
                if (matchingServerItem) {
                  // Found match - update local item with cloud_id
                  
                  let localCategoryId: number | null = localItem.category_id ?? null;
                  if (matchingServerItem.category_id && !localCategoryId) {
                    const localCategory = await CategoryRepository.getByCloudId(matchingServerItem.category_id);
                    if (localCategory) localCategoryId = localCategory.id ?? null;
                  }
                  
                  let localLocationId: number | null = localItem.location_id ?? null;
                  if (matchingServerItem.location_id && !localLocationId) {
                    const localLocation = await LocationRepository.getByCloudId(matchingServerItem.location_id);
                    if (localLocation) localLocationId = localLocation.id ?? null;
                  }
                  
                  await FoodItemRepository.update({
                    ...localItem,
                    cloud_id: matchingServerItem.id,
                    category_id: localCategoryId,
                    location_id: localLocationId,
                  } as any);
                } else {
                  // No match - this is an orphaned item, remove if old enough
                  const itemAge = new Date().getTime() - new Date(localItem.created_at || getCurrentDateTimeISO()).getTime();
                  const oneHour = 60 * 60 * 1000;
                  
                  if (itemAge > oneHour) {
                    
                    await FoodItemRepository.delete(localItem.id);
                  }
                }
              }
            }
          } catch (groupSyncError) {
          }
        }
        
        // STEP 6: Clean up duplicates across ALL groups (not just current group)
        // This ensures items from other groups are also cleaned up
        const allLocalItems = await FoodItemRepository.getAllWithDetails(); // Get all items from all groups
        // Debug: Log all "test" items to see why they're not being detected as duplicates
        const testItems = allLocalItems.filter(item => item.name.toLowerCase() === 'test');
        if (testItems.length > 0) {
        }
        
        let allGroupsDuplicateCount = 0;
        
        // Track items by cloud_id across all groups
        const allItemsByCloudId = new Map<string, any[]>();
        const allItemsByNameDateGroup = new Map<string, any[]>();
        
        for (const item of allLocalItems) {
          // Group by cloud_id
          if (item.cloud_id) {
            if (!allItemsByCloudId.has(item.cloud_id)) {
              allItemsByCloudId.set(item.cloud_id, []);
            }
            allItemsByCloudId.get(item.cloud_id)!.push(item);
          }
          
          // Group by name + expiry_date + group_id
          const nameKey = `${item.name.toLowerCase().trim()}_${item.expiry_date}_${item.group_id || 'null'}`;
          if (!allItemsByNameDateGroup.has(nameKey)) {
            allItemsByNameDateGroup.set(nameKey, []);
          }
          allItemsByNameDateGroup.get(nameKey)!.push(item);
        }
        
        // Remove duplicates by cloud_id across all groups
        for (const [cloudId, items] of allItemsByCloudId.entries()) {
          if (items.length > 1) {
            const toKeep = items.reduce((best, current) => {
              if ((current.category_id || current.location_id) && !(best.category_id || best.location_id)) {
                return current;
              }
              return best;
            }, items[0]);
            
            for (const item of items) {
              if (item.id !== toKeep.id) {
                await FoodItemRepository.delete(item.id);
                allGroupsDuplicateCount++;
              }
            }
          }
        }
        
        // Remove duplicates by name+date+group across all groups
        for (const [nameKey, items] of allItemsByNameDateGroup.entries()) {
          if (items.length > 1) {
            const itemsWithCloudId = items.filter(item => item.cloud_id);
            const itemsWithoutCloudId = items.filter(item => !item.cloud_id);
            
            if (itemsWithCloudId.length > 0 && itemsWithoutCloudId.length > 0) {
              
              for (const item of itemsWithoutCloudId) {
                
                await FoodItemRepository.delete(item.id);
                allGroupsDuplicateCount++;
              }
            } else if (itemsWithoutCloudId.length > 1) {
              
              for (let i = 1; i < items.length; i++) {
                await FoodItemRepository.delete(items[i].id);
                allGroupsDuplicateCount++;
              }
            }
          }
        }
        
        // Also check for duplicates by name+group (ignoring expiry_date) - items with same name in same group but different dates
        // This catches cases where same item was created multiple times with different expiry dates
        // Also handle cases where group_id might be a string like "personal" instead of UUID
        const itemsByNameGroup = new Map<string, any[]>();
        const itemsByNameOnly = new Map<string, any[]>(); // Track by name only for cross-group duplicate detection
        
        for (const item of allLocalItems) {
          const nameGroupKey = `${item.name.toLowerCase().trim()}_${item.group_id || 'null'}`;
          if (!itemsByNameGroup.has(nameGroupKey)) {
            itemsByNameGroup.set(nameGroupKey, []);
          }
          itemsByNameGroup.get(nameGroupKey)!.push(item);
          
          // Also track by name only (for detecting duplicates across groups with same name+date)
          const nameOnlyKey = `${item.name.toLowerCase().trim()}_${item.expiry_date}`;
          if (!itemsByNameOnly.has(nameOnlyKey)) {
            itemsByNameOnly.set(nameOnlyKey, []);
          }
          itemsByNameOnly.get(nameOnlyKey)!.push(item);
        }
        
        // For items with same name+group, if one has cloud_id and others don't, remove the ones without cloud_id
        // This catches cases where same item was created multiple times with different expiry dates
        for (const [nameGroupKey, items] of itemsByNameGroup.entries()) {
          if (items.length > 1) {
            const itemsWithCloudId = items.filter(item => item.cloud_id);
            const itemsWithoutCloudId = items.filter(item => !item.cloud_id);
            
            // If we have items with cloud_id and items without, remove duplicates without cloud_id
            // This ensures that if cloud has an item, we only keep the local item that matches it
            if (itemsWithCloudId.length > 0 && itemsWithoutCloudId.length > 0) {
              
              for (const item of itemsWithoutCloudId) {
                
                await FoodItemRepository.delete(item.id);
                allGroupsDuplicateCount++;
              }
            } else if (itemsWithoutCloudId.length > 1) {
              // Multiple items without cloud_id - keep the most recent one
              
              const sortedByDate = itemsWithoutCloudId.sort((a, b) => {
                const dateA = new Date(a.created_at || getCurrentDateTimeISO()).getTime();
                const dateB = new Date(b.created_at || getCurrentDateTimeISO()).getTime();
                return dateB - dateA; // Most recent first
              });
              for (let i = 1; i < sortedByDate.length; i++) {
                await FoodItemRepository.delete(sortedByDate[i].id);
                allGroupsDuplicateCount++;
              }
            }
          }
        }
        
        // Check for duplicates by name+date across different groups (catches items with same name+date but different group_id formats)
        // This handles cases where group_id might be "personal" (string) vs UUID, or items accidentally created in wrong group
        for (const [nameDateKey, items] of itemsByNameOnly.entries()) {
          if (items.length > 1) {
            const itemsWithCloudId = items.filter(item => item.cloud_id);
            const itemsWithoutCloudId = items.filter(item => !item.cloud_id);
            
            // If we have items with same name+date but different groups, and one has cloud_id, remove the ones without cloud_id
            // This ensures we keep the item that matches the cloud (which has the correct group_id)
            if (itemsWithCloudId.length > 0 && itemsWithoutCloudId.length > 0) {
              // Check if items are in different groups
              const uniqueGroups = new Set(items.map(item => item.group_id));
              if (uniqueGroups.size > 1) {
                
                
                
                for (const item of itemsWithoutCloudId) {
                  
                  await FoodItemRepository.delete(item.id);
                  allGroupsDuplicateCount++;
                }
              }
            }
          }
        }
        
        if (allGroupsDuplicateCount > 0) {
        } else {
        }
        
        // Fix items with string group_id (like "personal") to use correct UUID
        let fixedGroupIdCount = 0;
        
        // Create a map of group names to UUIDs
        const groupNameToUuid = new Map<string, string>();
        for (const group of userGroups) {
          const groupName = group.groups.name.toLowerCase();
          groupNameToUuid.set(groupName, group.group_id);
        }
        
        // Find items with string group_id values (not UUIDs)
        const itemsWithStringGroupId = allLocalItems.filter(item => {
          if (!item.group_id) return false;
          // Check if group_id is a string (not a UUID format)
          // UUIDs are 36 characters with dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.group_id);
          return !isUuid;
        });
        
        if (itemsWithStringGroupId.length > 0) {
          for (const item of itemsWithStringGroupId) {
            const groupName = (item.group_id || '').toLowerCase();
            const correctUuid = groupNameToUuid.get(groupName);
            
            if (correctUuid) {
              
              await FoodItemRepository.update({
                ...item,
                group_id: correctUuid,
              } as any);
              fixedGroupIdCount++;
            } else {
              
            }
          }
        }
        
        if (fixedGroupIdCount > 0) {
        } else {
        }
        
        // Refresh local data to update dashboard (this will also refresh categories and locations)
        await database.refreshAll();
        // Also pull shopping and wish items
        await pullShoppingItemsFromServer(currentGroup.id);
        await pullWishItemsFromServer(currentGroup.id);
        
      } catch (syncError) {
        // Error auto-syncing on group change - user can manually sync if needed
      }
    };

    // Only auto-sync if we're authenticated, have a group, and groups are loaded
    if (isAuthenticated && currentGroup && isOnline && userGroups.length > 0) {
      autoSyncOnGroupChange();
    }
  }, [currentGroup?.id, isAuthenticated, isOnline, userGroups.length]); // Sync when group changes or groups are loaded

  const loadUserData = async (userId: string) => {
    try {
      // Get groups from PostgreSQL backend where the user is a member
      // Backend returns: { groups: (Group & { role: string; member_count: number })[] }
      const response = await apiClient.get<{ groups: (Group & { role: string; member_count: number })[] }>('/groups');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const backendGroups = response.data?.groups || [];
      
      // Map backend groups to GroupMembership format for compatibility
      const memberships: GroupMembership[] = backendGroups.map(group => ({
        id: `${group.id}-${userId}`, // Create membership ID
        group_id: group.id,
        user_id: userId,
        role: group.role as 'owner' | 'admin' | 'member',
        joined_at: group.created_at,
        groups: {
          id: group.id,
          name: group.name,
          description: group.description,
          created_by: group.created_by,
          invite_code: null,
          max_members: 4,
          created_at: group.created_at,
          updated_at: group.updated_at
        }
      }));
      
      // Set user groups from PostgreSQL data FIRST
      setUserGroups(memberships);
      // Check food items in PostgreSQL for ALL groups (once) to see what exists and decide default group
      const groupsWithItems: { groupId: string; itemCount: number; membership: GroupMembership }[] = [];
      
      for (const membership of memberships) {
        try {
          const foodItemsResponse = await apiClient.get<{ items: any[] }>(`/food-items?group_id=${membership.group_id}`);
          const items = foodItemsResponse.data?.items || [];
          
          if (items.length > 0) {
            groupsWithItems.push({ 
              groupId: membership.group_id, 
              itemCount: items.length,
              membership 
            });
          }
        } catch (err) {
        }
      }
      
      // Set current group: Check for manually selected group first, then prioritize groups with items
      if (memberships.length > 0) {
        let selectedGroup = memberships[0].groups;
        
        // First, check if user has manually selected a group (stored in AsyncStorage)
        try {
          const manuallySelectedGroupId = await AsyncStorage.getItem('manually_selected_group_id');
          if (manuallySelectedGroupId) {
            const manuallySelectedGroup = memberships.find(m => m.group_id === manuallySelectedGroupId);
            if (manuallySelectedGroup) {
              selectedGroup = manuallySelectedGroup.groups;
              
              setCurrentGroup(selectedGroup);
              
              // Store Personal group ID in AsyncStorage for repository functions to use
              const personalGroup = memberships.find(m => 
                m.groups.name.toLowerCase() === 'personal'
              );
              if (personalGroup?.groups?.id) {
                await AsyncStorage.setItem('personal_group_id', personalGroup.groups.id);
              }
              
              return; // Exit early, don't auto-select
            } else {
              // Manually selected group no longer exists, clear it
              await AsyncStorage.removeItem('manually_selected_group_id');
              
            }
          }
        } catch (storageError) {
        }
        
        // No manually selected group, auto-select based on item count
        if (groupsWithItems.length > 0) {
          // If there are groups with items, prefer the one with most items
          const groupWithMostItems = groupsWithItems.sort((a, b) => b.itemCount - a.itemCount)[0];
          selectedGroup = groupWithMostItems.membership.groups;
          
        } else {
          // No groups have items, prefer Personal group as default
          const personalGroup = memberships.find(m => 
            m.groups.name.toLowerCase() === 'personal'
          );
          if (personalGroup) {
            selectedGroup = personalGroup.groups;
            
          } else {
            selectedGroup = memberships[0].groups;
            
          }
        }
        
        
        setCurrentGroup(selectedGroup);
        
        // Store Personal group ID in AsyncStorage for repository functions to use
        const personalGroup = memberships.find(m => 
          m.groups.name.toLowerCase() === 'personal'
        );
        if (personalGroup?.groups?.id) {
          await AsyncStorage.setItem('personal_group_id', personalGroup.groups.id);
        }
        
        // Auto-pull will be handled by useEffect when currentGroup is set
      } else {
        // Create default Personal group if none exists
        const newGroup = await createGroup('Personal', 'Your personal food management group');
        if (newGroup?.id) {
          await AsyncStorage.setItem('personal_group_id', newGroup.id);
        }
      }
    } catch (error) {
      // As a fallback, create a Personal group
      try {
        if (!currentGroup) {
          await createGroup('Personal', 'Your personal food management group');
        }
      } catch (fallbackError) {
        // Error creating fallback group
      }
    }
  };

  const signUp = async (email: string, password: string, userData: any): Promise<void> => {
    try {
      // Sign up with PostgreSQL backend via AuthService
      const result = await authService.register(
        email.trim().toLowerCase(),
        password,
        userData.full_name || email
      );
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Registration failed');
      }
      
      // Save to local database (store PostgreSQL user ID in supabase_id field for compatibility)
      const localUserData: {
        supabase_id: string;
        email: string;
        full_name: string;
        subscription_type?: 'free' | 'family';
        subscription_expires_at?: string;
      } = {
        supabase_id: result.user.id, // PostgreSQL user ID (UUID string)
        email: result.user.email,
        full_name: result.user.full_name || email,
        subscription_type: 'free' as const,
      };
      
      await saveUserToLocal(localUserData);
      
      // Retrieve the saved user to get the complete User object with ID
      const savedUser = await getLocalUser(result.user.id);
      if (!savedUser) {
        throw new Error('Failed to retrieve saved user');
      }
      
      // Set user state
      setUser(savedUser);
      
      // Load user data (groups, etc.)
      await loadUserData(result.user.id);
      
      // Clean up any local defaults without group_id (created during initDatabase before registration)
      // These are duplicates - we only want the ones pulled from PostgreSQL with group_id
      try {
        const db = await getDatabase();
        if (db) {
          // Delete categories without group_id (local defaults) - they'll be replaced by synced ones
          await db.runAsync('DELETE FROM categories WHERE group_id IS NULL');
          // Delete locations without group_id (local defaults) - they'll be replaced by synced ones
          await db.runAsync('DELETE FROM locations WHERE group_id IS NULL');
          // Refresh database context
          await database.refreshAll();
        }
      } catch (cleanupErr) {
        // Continue even if cleanup fails
      }
    } catch (error: any) {
      // Re-throw with a clearer error message
      if (error?.message?.includes('already') || error?.message?.includes('exists')) {
        throw new Error('An account with this email already exists. Please try signing in instead.');
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Sign in with PostgreSQL backend via AuthService
      const result = await authService.login(
        email.trim().toLowerCase(),
        password
      );
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Save to local database (store PostgreSQL user ID in supabase_id field for compatibility)
      const localUserData: {
        supabase_id: string;
        email: string;
        full_name: string;
        subscription_type?: 'free' | 'family';
        subscription_expires_at?: string;
      } = {
        supabase_id: result.user.id, // PostgreSQL user ID (UUID string)
        email: result.user.email,
        full_name: result.user.full_name || email,
        subscription_type: 'free' as const,
      };
      
      await saveUserToLocal(localUserData);
      
      // Retrieve the saved user to get the complete User object with ID
      const savedUser = await getLocalUser(result.user.id);
      if (!savedUser) {
        throw new Error('Failed to retrieve saved user');
      }
      
      // Set user state
      setUser(savedUser);
      
      // Load user data (groups, etc.)
      await loadUserData(result.user.id);
    } catch (error: any) {
      // Re-throw with a clearer error message
      if (error?.message?.includes('invalid') || error?.message?.includes('incorrect')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Sign out from PostgreSQL backend via AuthService
      const result = await authService.logout();
      
      // Clear local user data
      if (user) {
        try {
          await deactivateUser(user.supabase_id);
        } catch (deactivateError) {
          // Don't throw here - the sign out was successful, just local cleanup failed
        }
      }
      
      // Clear all state
      setUser(null);
      setToken(null);
      setCurrentGroup(null);
      setUserGroups([]);
      
      // Clear manually selected group
      try {
        await AsyncStorage.removeItem('manually_selected_group_id');
        await AsyncStorage.removeItem('personal_group_id');
      } catch (storageError) {
        // Ignore storage errors on logout
      }
    } catch (error) {
      // Even if logout API fails, clear local state
      setUser(null);
      setToken(null);
      setCurrentGroup(null);
      setUserGroups([]);
      
      // Clear manually selected group
      try {
        await AsyncStorage.removeItem('manually_selected_group_id');
        await AsyncStorage.removeItem('personal_group_id');
      } catch (storageError) {
        // Ignore storage errors on logout
      }
      throw error;
    }
  };

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    const currentUserId = user?.supabase_id; // PostgreSQL user ID stored here
    if (!currentUserId) {
      throw new Error('Must have a user to create a group');
    }

    try {
      // Create the group in PostgreSQL backend (this now automatically creates default categories and locations)
      const response = await apiClient.post<{ message: string; group: Group }>('/groups', {
        name,
        description: description || null
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.group) {
        throw new Error('Failed to create group');
      }
      
      const newGroup: Group = {
        id: response.data.group.id,
        name: response.data.group.name,
        description: response.data.group.description,
        created_by: currentUserId,
        invite_code: response.data.group.invite_code || null,
        max_members: response.data.group.max_members || 4,
        created_at: response.data.group.created_at,
        updated_at: response.data.group.updated_at
      };
      
      // Create default categories and locations directly in PostgreSQL for the new group
      try {
        // Create 8 default categories in PostgreSQL
        const defaultCategories = [
          { name: 'Vegetables', translationKey: 'category.vegetables', icon: '🥬' },
          { name: 'Fruits', translationKey: 'category.fruits', icon: '🍎' },
          { name: 'Dairy', translationKey: 'category.dairy', icon: '🥛' },
          { name: 'Meat', translationKey: 'category.meat', icon: '🥩' },
          { name: 'Snacks', translationKey: 'category.snacks', icon: '🍿' },
          { name: 'Desserts', translationKey: 'category.desserts', icon: '🍰' },
          { name: 'Seafood', translationKey: 'category.seafood', icon: '🐟' },
          { name: 'Bread', translationKey: 'category.bread', icon: '🍞' },
        ];
        
        for (const cat of defaultCategories) {
          try {
            const categoryPayload: any = {
              group_id: newGroup.id,
              name: cat.name,
              icon: cat.icon,
              translation_key: cat.translationKey,
            };
            
            const catResponse = await apiClient.post<{ category: any }>('/categories', categoryPayload);
            if (catResponse.data?.category) {
              // Create in local database with cloud_id and group_id
              await CategoryRepository.create({
                name: cat.name,
                icon: cat.icon,
                translationKey: cat.translationKey,
                group_id: newGroup.id,
                cloud_id: catResponse.data.category.id,
                sync_status: 'synced' as const,
              });
            }
          } catch (catErr) {
            console.log('Failed to create category:', cat.name, catErr);
          }
        }
        
        // Create 4 default locations in PostgreSQL
        const defaultLocations = [
          { name: 'Fridge', translationKey: 'defaultLocation.fridge', icon: '❄️' },
          { name: 'Freezer', translationKey: 'defaultLocation.freezer', icon: '🧊' },
          { name: 'Pantry', translationKey: 'defaultLocation.pantry', icon: '🏠' },
          { name: 'Counter', translationKey: 'defaultLocation.counter', icon: '📦' },
        ];
        
        for (const loc of defaultLocations) {
          try {
            const locationPayload: any = {
              group_id: newGroup.id,
              name: loc.name,
              icon: loc.icon,
              translation_key: loc.translationKey,
            };
            
            const locResponse = await apiClient.post<{ location: any }>('/locations', locationPayload);
            if (locResponse.data?.location) {
              // Create in local database with cloud_id and group_id
              await LocationRepository.create({
                name: loc.name,
                icon: loc.icon,
                translationKey: loc.translationKey,
                group_id: newGroup.id,
                cloud_id: locResponse.data.location.id,
                sync_status: 'synced' as const,
              });
            }
          } catch (locErr) {
            console.log('Failed to create location:', loc.name, locErr);
          }
        }
        
        // Refresh local database to include the new categories and locations
        await database.refreshAll();
        
        // Clean up any duplicates in local database
        await cleanupDuplicateCategoriesAndLocations();
      } catch (syncErr) {
        console.log('Error creating default categories/locations:', syncErr);
      }

      // Reload user data to update the groups
      await loadUserData(currentUserId);

      return newGroup;
    } catch (error) {
      throw error;
    }
  };

  // Function to manually set the current group (called when user selects a group)
  const updateCurrentGroup = async (group: Group): Promise<void> => {
    try {
      // Store the manually selected group ID in AsyncStorage
      await AsyncStorage.setItem('manually_selected_group_id', group.id);
      
      setCurrentGroup(group);
    } catch (error) {
      // Still update the state even if storage fails
      setCurrentGroup(group);
    }
  };

  // Delete group and all related data from both local and PostgreSQL
  const deleteGroup = async (groupId: string): Promise<void> => {
    const currentUserId = user?.supabase_id;
    if (!currentUserId) {
      throw new Error('Must be authenticated to delete a group');
    }

    try {
      // First, delete from PostgreSQL (this will delete all related data on the server)
      await apiClient.delete(`/groups/${groupId}`);

      // Then, delete all related data from local database
      const db = await getDatabase();
      if (db) {
        // Delete in order to respect foreign key constraints
        // 1. Delete food items
        await db.runAsync('DELETE FROM food_items WHERE group_id = ?', [groupId]);
        
        // 2. Delete shopping items
        await db.runAsync('DELETE FROM shopping_items WHERE group_id = ?', [groupId]);
        
        // 3. Delete wish items
        await db.runAsync('DELETE FROM wish_items WHERE group_id = ?', [groupId]);
        
        // 4. Delete categories
        await db.runAsync('DELETE FROM categories WHERE group_id = ?', [groupId]);
        
        // 5. Delete locations
        await db.runAsync('DELETE FROM locations WHERE group_id = ?', [groupId]);
      }

      // Refresh local database
      await database.refreshAll();

      // Reload user data to update the groups list
      await loadUserData(currentUserId);

      // If the deleted group was the current group, switch to another group
      if (currentGroup?.id === groupId) {
        const remainingGroups = userGroups.filter(m => m.groups.id !== groupId);
        if (remainingGroups.length > 0) {
          await updateCurrentGroup(remainingGroups[0].groups);
        } else {
          setCurrentGroup(null);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Sync button handler - Performs bidirectional sync:
   * 1. PULLS from PostgreSQL: Updates local database with server data (categories, locations, food items)
   * 2. PUSHES to PostgreSQL: Sends local changes to server (items created offline without cloud_id)
   * 
   * This ensures:
   * - Items created offline (without cloud_id) are pushed to PostgreSQL when user clicks sync
   * - Local database is updated with latest server data
   * - Both directions are synchronized
   */
  const syncToServer = async (): Promise<void> => {
    if (!isOnline) {
      Alert.alert('Offline Mode', 'You are currently offline. Please connect to the internet to sync.');
      return;
    }
    
    if (!user || !currentGroup) {
      Alert.alert('Not Authenticated', 'Please sign in to sync your data.');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      const groupId = currentGroup.id;
      
      // Import sync functions
      const { syncPendingShoppingItems, syncPendingWishItems, pullShoppingItemsFromServer, pullWishItemsFromServer } = require('../database/shoppingRepository');
      const { FoodItemRepository } = require('../database/repository');
      
      let syncResults = {
        shoppingPushed: 0,
        wishPushed: 0,
        shoppingPulled: 0,
        wishPulled: 0,
        foodItemsPushed: 0,
        foodItemsPulled: 0,
      };

      // 1. Sync shopping items - COMPARE POSTGRESQL VS LOCAL
      try {
        // Get shopping items from PostgreSQL
        const shoppingResponse = await apiClient.get<{ items: any[] }>(`/shopping-items?group_id=${groupId}`);
        const serverShoppingItems = shoppingResponse.data?.items || [];
        
        // Get shopping items from local database
        const db = await getDatabase();
        if (!db) {
          throw new Error('Database not available');
        }
        const localShoppingItems = await db.getAllAsync("SELECT * FROM shopping_items WHERE group_id = ? OR group_id IS NULL", [groupId]) as any[];
        
        console.log(`[SYNC DEBUG] Shopping Items Comparison for group ${groupId}:`);
        console.log(`[SYNC DEBUG] PostgreSQL has ${serverShoppingItems.length} shopping items:`, JSON.stringify(serverShoppingItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          group_id: item.group_id,
          is_purchased: item.is_purchased
        })), null, 2));
        console.log(`[SYNC DEBUG] Local DB has ${localShoppingItems.length} shopping items:`, JSON.stringify(localShoppingItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          group_id: item.group_id,
          sync_status: item.sync_status,
          cloud_id: item.cloud_id,
          done: item.done
        })), null, 2));
        
        const shoppingSync = await syncPendingShoppingItems(groupId);
        syncResults.shoppingPushed = shoppingSync.synced;
        const shoppingPulled = await pullShoppingItemsFromServer(groupId);
        syncResults.shoppingPulled = shoppingPulled;
      } catch (err: any) {
        console.log(`[SYNC DEBUG] Error syncing shopping items:`, err?.message || err);
      }
      
      // 2. Sync wish items
      try {
        const wishSync = await syncPendingWishItems(groupId);
        syncResults.wishPushed = wishSync.synced;
        const wishPulled = await pullWishItemsFromServer(groupId);
        syncResults.wishPulled = wishPulled;
      } catch (err) {
        // Error syncing wish items
      }
      
      // 3. Sync food items - Push local items to server
      try {
        // Get food items from local SQLite database
        const localItems = await FoodItemRepository.getAllWithDetails(groupId);
        
        // Get food items from PostgreSQL database
        const response = await apiClient.get<{ items: any[] }>(`/food-items?group_id=${groupId}`);
        const serverItems = response.data?.items || [];
        
        // Log comparison for debugging - BEFORE SYNC
        if (serverItems.length > 0) {
        } else {
          
        }
        if (localItems.length > 0) {
        }
        
        // Helper function to check if cloud_id is a valid PostgreSQL UUID format
        const isValidUUID = (id: string | null | undefined): boolean => {
          if (!id) return false;
          // PostgreSQL UUIDs are in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        };

        // STEP 1: Sync categories and locations
        // PULL: Get all categories/locations from PostgreSQL and update local database
        // PUSH: Send any local categories/locations (created offline) to PostgreSQL
        // This ensures they have cloud_ids that food items can reference
        try {
          // PULL: Get all categories from server and update local database
          const categoriesResponse = await apiClient.get<{ categories: any[] }>(`/categories?group_id=${groupId}`);
          let serverCategories = categoriesResponse.data?.categories || [];
          
          // Filter to only include categories that match the requested group_id
          // Also skip categories with translation keys as names (duplicates)
          serverCategories = serverCategories.filter((cat: any) => {
            // Only import if it matches the requested group_id
            if (cat.group_id && cat.group_id !== groupId) {
              return false;
            }
            // Skip categories with translation keys as names (duplicates)
            if (cat.name && cat.name.startsWith('category.')) {
              return false;
            }
            return true;
          });
          
          // If no categories found, try getting default categories (without group_id)
          let finalServerCategories = serverCategories;
          if (serverCategories.length === 0) {
            const defaultCategoriesResponse = await apiClient.get<{ categories: any[] }>(`/categories`);
            const defaultCategories = defaultCategoriesResponse.data?.categories || [];
            // Filter defaults to only those without group_id or matching current group
            finalServerCategories = defaultCategories.filter((cat: any) => {
              if (cat.group_id && cat.group_id !== groupId) {
                return false;
              }
              if (cat.name && cat.name.startsWith('category.')) {
                return false;
              }
              return true;
            });
          }
          
          // Get local categories filtered by group_id
          const localCategories = await CategoryRepository.getAll(groupId);
          
          console.log(`[SYNC DEBUG] Categories Comparison for group ${groupId}:`);
          console.log(`[SYNC DEBUG] PostgreSQL has ${finalServerCategories.length} categories:`, JSON.stringify(finalServerCategories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            group_id: cat.group_id,
            translation_key: cat.translation_key
          })), null, 2));
          console.log(`[SYNC DEBUG] Local DB has ${localCategories.length} categories:`, JSON.stringify(localCategories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            group_id: cat.group_id,
            cloud_id: cat.cloud_id,
            translation_key: cat.translation_key
          })), null, 2));
          
          // Pull ALL categories from server and update local database
          // This ensures local has all categories from PostgreSQL
          for (const serverCategory of finalServerCategories) {
            const existingCategory = await CategoryRepository.getByCloudId(serverCategory.id);
            const categoryGroupId = serverCategory.group_id || groupId;
            
            if (!existingCategory) {
              // Import new category from PostgreSQL
              await CategoryRepository.updateFromCloud({
                cloud_id: serverCategory.id,
                name: serverCategory.name,
                icon: serverCategory.icon || '📦',
                translation_key: serverCategory.translation_key || null,
                group_id: categoryGroupId,
                created_at: serverCategory.created_at || getCurrentDateTimeISO(),
                updated_at: serverCategory.updated_at || getCurrentDateTimeISO(),
              });
            } else {
              // Update existing category with latest data from server
              await CategoryRepository.updateFromCloud({
                cloud_id: serverCategory.id,
                name: serverCategory.name,
                icon: serverCategory.icon || '📦',
                translation_key: serverCategory.translation_key || null,
                group_id: categoryGroupId,
                created_at: serverCategory.created_at || getCurrentDateTimeISO(),
                updated_at: serverCategory.updated_at || getCurrentDateTimeISO(),
              });
            }
          }
          
          // PUSH: Send any local categories created offline (without cloud_id) to PostgreSQL
          for (const localCategory of localCategories) {
            if (!localCategory.cloud_id || !isValidUUID(localCategory.cloud_id)) {
              // Check if it exists on server by name
              const matchingServerCategory = finalServerCategories.find(
                sc => sc.name.toLowerCase().trim() === localCategory.name.toLowerCase().trim() && 
                      (sc.group_id === groupId || (!sc.group_id && groupId === currentGroup.id))
              );
              
              if (!matchingServerCategory) {
                // Not found on server - push to server
                try {
                  const categoryPayload: any = {
                    group_id: groupId,
                    name: localCategory.name,
                  };
                  if (localCategory.icon) categoryPayload.icon = localCategory.icon;
                  if (localCategory.translationKey) categoryPayload.translation_key = localCategory.translationKey;
                  
                  const catResponse = await apiClient.post<{ category: any }>('/categories', categoryPayload);
                  if (catResponse.data?.category?.id) {
                    // Update local category with cloud_id
                    await CategoryRepository.update({
                      ...localCategory,
                      cloud_id: catResponse.data.category.id,
                      group_id: groupId,
                    });
                  }
                } catch (err) {
                }
              }
            }
          }
          
          // Pull ALL locations from server and update local database
          // This ensures local has all locations from PostgreSQL
          const locationsResponse = await apiClient.get<{ locations: any[] }>(`/locations?group_id=${groupId}`);
          let serverLocations = locationsResponse.data?.locations || [];
          
          // Filter to only include locations that match the requested group_id
          // Also skip locations with translation keys as names (duplicates)
          serverLocations = serverLocations.filter((loc: any) => {
            // Only import if it matches the requested group_id
            if (loc.group_id && loc.group_id !== groupId) {
              return false;
            }
            // Skip locations with translation keys as names (duplicates)
            if (loc.name && loc.name.startsWith('defaultLocation.')) {
              return false;
            }
            return true;
          });
          
          // If no locations found, try getting default locations (without group_id)
          let finalServerLocations = serverLocations;
          if (serverLocations.length === 0) {
            const defaultLocationsResponse = await apiClient.get<{ locations: any[] }>(`/locations`);
            const defaultLocations = defaultLocationsResponse.data?.locations || [];
            // Filter defaults to only those without group_id or matching current group
            finalServerLocations = defaultLocations.filter((loc: any) => {
              if (loc.group_id && loc.group_id !== groupId) {
                return false;
              }
              if (loc.name && loc.name.startsWith('defaultLocation.')) {
                return false;
              }
              return true;
            });
          }
          
          // Pull ALL locations from server and update local database
          for (const serverLocation of finalServerLocations) {
            const existingLocation = await LocationRepository.getByCloudId(serverLocation.id);
            const locationGroupId = serverLocation.group_id || groupId;
            
            if (!existingLocation) {
              // Import new location from PostgreSQL
              await LocationRepository.updateFromCloud({
                cloud_id: serverLocation.id,
                name: serverLocation.name,
                icon: serverLocation.icon || '📍',
                translation_key: serverLocation.translation_key || null,
                group_id: locationGroupId,
                created_at: serverLocation.created_at || getCurrentDateTimeISO(),
                updated_at: serverLocation.updated_at || getCurrentDateTimeISO(),
              });
            } else {
              // Update existing location with latest data from server
              await LocationRepository.updateFromCloud({
                cloud_id: serverLocation.id,
                name: serverLocation.name,
                icon: serverLocation.icon || '📍',
                translation_key: serverLocation.translation_key || null,
                group_id: locationGroupId,
                created_at: serverLocation.created_at || getCurrentDateTimeISO(),
                updated_at: serverLocation.updated_at || getCurrentDateTimeISO(),
              });
            }
          }
          
          // PUSH: Send any local locations created offline (without cloud_id) to PostgreSQL
          const localLocations = await LocationRepository.getAll(groupId);
          for (const localLocation of localLocations) {
            if (!localLocation.cloud_id || !isValidUUID(localLocation.cloud_id)) {
              // Check if it exists on server by name
              const matchingServerLocation = finalServerLocations.find(
                sl => sl.name.toLowerCase().trim() === localLocation.name.toLowerCase().trim() && 
                      (sl.group_id === groupId || (!sl.group_id && groupId === currentGroup.id))
              );
              
              if (!matchingServerLocation) {
                // Not found on server - push to server
                try {
                  const locationPayload: any = {
                    group_id: groupId,
                    name: localLocation.name,
                  };
                  if (localLocation.icon) locationPayload.icon = localLocation.icon;
                  if (localLocation.translationKey) locationPayload.translation_key = localLocation.translationKey;
                  
                  const locResponse = await apiClient.post<{ location: any }>('/locations', locationPayload);
                  if (locResponse.data?.location?.id) {
                    // Update local location with cloud_id
                    await LocationRepository.update({
                      ...localLocation,
                      cloud_id: locResponse.data.location.id,
                      group_id: groupId,
                    });
                  }
                } catch (err) {
                }
              }
            }
          }
        } catch (err) {
        }

        // STEP 2: Fix group_id values BEFORE syncing food items
        let fixedGroupIdCount = 0;
        
        // Create a map of group names to UUIDs
        const groupNameToUuid = new Map<string, string>();
        for (const group of userGroups) {
          const groupName = group.groups.name.toLowerCase();
          groupNameToUuid.set(groupName, group.group_id);
        }
        
        // Find items with string group_id values (not UUIDs) and fix them
        const itemsToFix = localItems.filter((item: any) => {
          if (!item.group_id) return false;
          // Check if group_id is a string (not a UUID format)
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.group_id);
          return !isUuid;
        });
        
        if (itemsToFix.length > 0) {
          for (const item of itemsToFix) {
            const groupName = (item.group_id || '').toLowerCase();
            const correctUuid = groupNameToUuid.get(groupName);
            
            if (correctUuid) {
              
              await FoodItemRepository.update({
                ...item,
                group_id: correctUuid,
              } as any);
              fixedGroupIdCount++;
              // Update the item in localItems array so it uses the correct group_id
              item.group_id = correctUuid;
            }
          }
        }
        
        if (fixedGroupIdCount > 0) {
        }

        // STEP 3: Sync food items
        // PUSH: Send local food items created offline (without cloud_id) to PostgreSQL
        // PULL: Get food items from PostgreSQL that don't exist locally
        // Get fresh list of local categories and locations with their cloud_ids for current group
        const allLocalCategories = await CategoryRepository.getAll(groupId);
        const allLocalLocations = await LocationRepository.getAll(groupId);
        
        // Create maps for quick lookup
        const categoryIdToCloudId = new Map<number, string>();
        const locationIdToCloudId = new Map<number, string>();
        
        for (const cat of allLocalCategories) {
          if (cat.id && cat.cloud_id && isValidUUID(cat.cloud_id)) {
            categoryIdToCloudId.set(cat.id, cat.cloud_id);
          }
        }
        
        for (const loc of allLocalLocations) {
          if (loc.id && loc.cloud_id && isValidUUID(loc.cloud_id)) {
            locationIdToCloudId.set(loc.id, loc.cloud_id);
          }
        }
        
        // PUSH: For each local food item created offline (without cloud_id), push to PostgreSQL
        for (const item of localItems) {
          // Process items that don't have a cloud_id OR have an invalid (non-UUID) cloud_id
          // These are items created offline that need to be synced to server
          if (!item.cloud_id || !isValidUUID(item.cloud_id)) {
            try {
              const hasInvalidCloudId = item.cloud_id && !isValidUUID(item.cloud_id);
              
              // First, try to find matching item on server by name and expiry_date
              // This avoids creating duplicates if the item already exists on server
              let foundOnServer = false;
              if (item.expiry_date) {
                const matchingServerItem = serverItems.find(
                  si => si.name.toLowerCase().trim() === item.name.toLowerCase().trim() &&
                        si.expiry_date === item.expiry_date &&
                        si.group_id === groupId
                );
                
                if (matchingServerItem) {
                  // Found on server - update local with cloud_id
                await FoodItemRepository.update({
                  ...item,
                    cloud_id: matchingServerItem.id,
                  });
                  foundOnServer = true;
                }
              }
              
              // If not found on server, push to server
              if (!foundOnServer) {
                // Build payload, omitting null/undefined values
                const payload: any = {
                  group_id: groupId,
                  name: item.name,
                };
                
                if (item.quantity !== undefined && item.quantity !== null) {
                  payload.quantity = item.quantity;
                }
                
                // Unit defaults to "unit" if not provided
                payload.unit = item.unit || 'unit';
                
                // Look up category and location cloud_ids from local database
                let categoryCloudId: string | undefined;
                let locationCloudId: string | undefined;
                
                if (item.category_id) {
                  categoryCloudId = categoryIdToCloudId.get(item.category_id);
                  if (categoryCloudId) {
                    payload.category_id = categoryCloudId;
                  }
                }
                
                if (item.location_id) {
                  locationCloudId = locationIdToCloudId.get(item.location_id);
                  if (locationCloudId) {
                    payload.location_id = locationCloudId;
                  }
                }
                
                if (item.expiry_date) {
                  payload.expiry_date = item.expiry_date;
                }
                
                if (item.notes) {
                  payload.notes = item.notes;
                }
                
                // Handle image upload - if image_uri is a local file, upload it first
                // IMPORTANT: Local items have image_uri (local file path), PostgreSQL has image_url (server URL)
                if (item.image_uri) {
                  // Check if it's a local file path (file:// or not http/https/emoji)
                  const isLocalFile = item.image_uri.startsWith('file://') || 
                                      (!item.image_uri.startsWith('http://') && 
                                       !item.image_uri.startsWith('https://') && 
                                       !item.image_uri.startsWith('emoji:'));
                  
                  if (isLocalFile) {
                    try {
                      // Upload the image to the server
                      const formData = new FormData();
                      const imageFile = {
                        uri: item.image_uri,
                        type: 'image/jpeg',
                        name: `image_${Date.now()}.jpg`,
                      };
                      formData.append('image', imageFile as any);
                      const uploadResponse = await apiClient.uploadFile('/upload/image', formData);
                      
                      if (uploadResponse.error) {
                        // Continue without image_url if upload fails
                      } else if (uploadResponse.data?.file?.url) {
                        // Store server URL in PostgreSQL (image_url field)
                        payload.image_url = uploadResponse.data.file.url;
                      } else {
                        // Don't set image_url if upload failed - let PostgreSQL handle it
                      }
                    } catch (uploadError) {
                      // Continue without image_url if upload fails - local image_uri is still valid
                    }
                  } else if (item.image_uri.startsWith('http://') || item.image_uri.startsWith('https://')) {
                    // Already a server URL - use it directly for PostgreSQL
                    payload.image_url = item.image_uri;
                  }
                  // Note: emoji: images are skipped (no image_url in PostgreSQL)
                }
                
                const response = await apiClient.post<{ item: any }>('/food-items', payload);
                
                if (response.error) {
                  throw new Error(response.error);
                }
                
                if (response.data?.item?.id) {
                  // Update local item with cloud_id from PostgreSQL (this replaces any invalid cloud_id)
                  // IMPORTANT: Keep the local image_uri as the local file path, don't overwrite it with server URL
                  // PostgreSQL has the server URL in image_url, local DB has the local file path in image_uri
                  await FoodItemRepository.update({
                    ...item,
                    cloud_id: response.data.item.id,
                    // Keep the original local image_uri - don't replace it with server URL
                    image_uri: item.image_uri,
                  });
                  syncResults.foodItemsPushed++;
                }
              }
            } catch (err) {
              // Error syncing item
            }
          } else {
            // Item already has cloud_id, but check if it has a local image that needs uploading
            if (item.image_uri) {
              const isLocalFile = item.image_uri.startsWith('file://') || 
                                  (!item.image_uri.startsWith('http://') && 
                                   !item.image_uri.startsWith('https://') && 
                                   !item.image_uri.startsWith('emoji:'));
              
              if (isLocalFile) {
                // Check if server item has image_url - if not, or if it's a local file path, upload the local image
                const serverItem = serverItems.find(si => si.id === item.cloud_id);
                const serverImageUrl = serverItem?.image_url;
                
                // Check if server image_url is missing OR is a local file path (should be a server URL)
                const needsUpload = !serverImageUrl || 
                                   serverImageUrl.startsWith('file://') ||
                                   (!serverImageUrl.startsWith('http://') && !serverImageUrl.startsWith('https://'));
                
                if (needsUpload) {
                  try {
                    
                    // Upload the image to the server
                    const formData = new FormData();
                    const imageFile = {
                      uri: item.image_uri,
                      type: 'image/jpeg',
                      name: `image_${Date.now()}.jpg`,
                    };
                    formData.append('image', imageFile as any);
                    const uploadResponse = await apiClient.uploadFile('/upload/image', formData);
                    
                    if (uploadResponse.error) {
                    } else if (uploadResponse.data?.file?.url) {
                      // Update the item on server with the image URL
                      const updatePayload: any = {
                        image_url: uploadResponse.data.file.url,
                      };
                      
                      const updateResponse = await apiClient.patch<{ item: any }>(`/food-items/${item.cloud_id}`, updatePayload);
                      
                      if (updateResponse.error) {
                      } else {
                      }
                    } else {
                    }
                  } catch (uploadError) {
                  }
                } else {
                }
              }
            }
          }
        }
        
        // Pull any new categories and locations from server that don't exist locally
        // This ensures we have all server categories/locations locally
        try {
          // Try to get categories with group_id first, then without group_id for defaults
          let categoriesResponse = await apiClient.get<{ categories: any[] }>(`/categories?group_id=${groupId}`);
          let serverCategories = categoriesResponse.data?.categories || [];
          
          // Filter to only include categories that match the requested group_id
          // Also skip categories with translation keys as names (duplicates)
          serverCategories = serverCategories.filter((cat: any) => {
            // Only import if it matches the requested group_id
            if (cat.group_id && cat.group_id !== groupId) {
              return false;
            }
            // Skip categories with translation keys as names (duplicates)
            if (cat.name && cat.name.startsWith('category.')) {
              return false;
            }
            return true;
          });
          
          // If no categories found, try getting default categories (without group_id)
          if (serverCategories.length === 0) {
            categoriesResponse = await apiClient.get<{ categories: any[] }>(`/categories`);
            const defaultCategories = categoriesResponse.data?.categories || [];
            // Filter defaults to only those without group_id or matching current group
            serverCategories = defaultCategories.filter((cat: any) => {
              if (cat.group_id && cat.group_id !== groupId) {
                return false;
              }
              if (cat.name && cat.name.startsWith('category.')) {
                return false;
              }
              return true;
            });
          }
          for (const serverCategory of serverCategories) {
            const existingCategory = await CategoryRepository.getByCloudId(serverCategory.id);
            if (!existingCategory) {
              // Import category from PostgreSQL - use current group_id if server doesn't have one
              const categoryGroupId = serverCategory.group_id || groupId;
              const localCategoryId = await CategoryRepository.updateFromCloud({
                cloud_id: serverCategory.id,
                name: serverCategory.name,
                icon: serverCategory.icon || '📦',
                translation_key: serverCategory.translation_key || null,
                group_id: categoryGroupId,
                created_at: serverCategory.created_at || getCurrentDateTimeISO(),
                updated_at: serverCategory.updated_at || getCurrentDateTimeISO(),
              });
            }
          }
          
          // Try to get locations with group_id first, then without group_id for defaults
          let locationsResponse = await apiClient.get<{ locations: any[] }>(`/locations?group_id=${groupId}`);
          let serverLocations = locationsResponse.data?.locations || [];
          
          // Filter to only include locations that match the requested group_id
          // Also skip locations with translation keys as names (duplicates)
          serverLocations = serverLocations.filter((loc: any) => {
            // Only import if it matches the requested group_id
            if (loc.group_id && loc.group_id !== groupId) {
              return false;
            }
            // Skip locations with translation keys as names (duplicates)
            if (loc.name && loc.name.startsWith('defaultLocation.')) {
              return false;
            }
            return true;
          });
          
          // If no locations found, try getting default locations (without group_id)
          let finalServerLocations = serverLocations;
          if (serverLocations.length === 0) {
            locationsResponse = await apiClient.get<{ locations: any[] }>(`/locations`);
            const defaultLocations = locationsResponse.data?.locations || [];
            // Filter defaults to only those without group_id or matching current group
            finalServerLocations = defaultLocations.filter((loc: any) => {
              if (loc.group_id && loc.group_id !== groupId) {
                return false;
              }
              if (loc.name && loc.name.startsWith('defaultLocation.')) {
                return false;
              }
              return true;
            });
          }
          
          // Get local locations filtered by group_id
          const localLocations = await LocationRepository.getAll(groupId);
          
          console.log(`[SYNC DEBUG] Locations Comparison for group ${groupId}:`);
          console.log(`[SYNC DEBUG] PostgreSQL has ${finalServerLocations.length} locations:`, JSON.stringify(finalServerLocations.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            group_id: loc.group_id,
            translation_key: loc.translation_key
          })), null, 2));
          console.log(`[SYNC DEBUG] Local DB has ${localLocations.length} locations:`, JSON.stringify(localLocations.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            group_id: loc.group_id,
            cloud_id: loc.cloud_id,
            translation_key: loc.translation_key
          })), null, 2));
          
          for (const serverLocation of finalServerLocations) {
            const existingLocation = await LocationRepository.getByCloudId(serverLocation.id);
            // Use current group ID as fallback if server location has no group_id
            const locationGroupId = serverLocation.group_id || groupId;
            if (!existingLocation) {
              // Import location from PostgreSQL
              await LocationRepository.updateFromCloud({
                cloud_id: serverLocation.id,
                name: serverLocation.name,
                icon: serverLocation.icon || '📍',
                translation_key: serverLocation.translation_key || null,
                group_id: locationGroupId,
                created_at: serverLocation.created_at || getCurrentDateTimeISO(),
                updated_at: serverLocation.updated_at || getCurrentDateTimeISO(),
              });
            } else {
              // Update existing location to ensure it has the latest data
              await LocationRepository.updateFromCloud({
                cloud_id: serverLocation.id,
                name: serverLocation.name,
                icon: serverLocation.icon || '📍',
                translation_key: serverLocation.translation_key || null,
                group_id: locationGroupId,
                created_at: serverLocation.created_at || getCurrentDateTimeISO(),
                updated_at: serverLocation.updated_at || getCurrentDateTimeISO(),
              });
            }
          }
        } catch (syncErr) {
        }
        
        // PULL: Get food items from PostgreSQL that don't exist locally - map UUID category_id and location_id to local integer IDs
        for (const serverItem of serverItems) {
          const existingLocal = localItems.find((li: any) => li.cloud_id === serverItem.id);
          if (!existingLocal) {
            // Import from server - map UUID category_id and location_id to local integer IDs
            try {
              // Map category UUID to local integer ID
              let localCategoryId: number | null = null;
              if (serverItem.category_id) {
                const localCategory = await CategoryRepository.getByCloudId(serverItem.category_id);
                if (localCategory) {
                  localCategoryId = localCategory.id ?? null;
                }
              }
              
              // Map location UUID to local integer ID
              let localLocationId: number | null = null;
              if (serverItem.location_id) {
                const localLocation = await LocationRepository.getByCloudId(serverItem.location_id);
                if (localLocation) {
                  localLocationId = localLocation.id ?? null;
                }
              }
              
              // Download image if it's a URL
              let localImageUri: string | null = null;
              if (serverItem.image_url) {
                if (serverItem.image_url.startsWith('http://') || serverItem.image_url.startsWith('https://')) {
                  // Download image from URL
                  try {
                    // Replace localhost with the correct API base URL
                    let imageUrl = serverItem.image_url;
                    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
                      // Get the API base URL (without /api)
                      const { API_URL } = require('../services/ApiClient');
                      const baseUrl = API_URL.replace('/api', '');
                      imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
                      imageUrl = imageUrl.replace(/http:\/\/127\.0\.0\.1:\d+/, baseUrl);
                    }
                    const timestamp = Date.now();
                    const randomId = Math.random().toString(36).substring(2, 15);
                    const filename = `img_${timestamp}_${randomId}.jpg`;
                    const imagesDir = `${(FileSystem as any).documentDirectory || ''}images/`;
                    
                    // Ensure images directory exists
                    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
                    if (!dirInfo.exists) {
                      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
                    }
                    
                    const localUri = `${imagesDir}${filename}`;
                    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
                    localImageUri = downloadResult.uri;
                  } catch (imageError) {
                    // Continue without image if download fails
                    localImageUri = null;
                  }
                } else {
                  // Already a local path
                  localImageUri = serverItem.image_url;
                }
              }
              await FoodItemRepository.create({
                name: serverItem.name,
                quantity: serverItem.quantity || 1,
                category_id: localCategoryId,
                location_id: localLocationId,
                group_id: groupId,
                cloud_id: serverItem.id,
                expiry_date: serverItem.expiry_date?.split('T')[0] || getCurrentDate(),
                reminder_days: serverItem.reminder_days || 3,
                notes: serverItem.notes || null,
                image_uri: localImageUri,
              } as any);
              syncResults.foodItemsPulled++;
            } catch (err) {
            }
          }
        }
        
        // Log comparison for debugging - AFTER SYNC
        const localItemsAfter = await FoodItemRepository.getAllWithDetails(groupId);
        const responseAfter = await apiClient.get<{ items: any[] }>(`/food-items?group_id=${groupId}`);
        const serverItemsAfter = responseAfter.data?.items || [];
      } catch (err) {
        // Error syncing food items
      }
      
      // Clean up duplicate categories and locations from local DB
      await cleanupDuplicateCategoriesAndLocations();
      
      // Refresh local data
      await database.refreshAll();
      setLastSyncTime(new Date(getCurrentDateTimeISO()));
      
      setSyncStatus('idle');
      
      const totalPushed = syncResults.shoppingPushed + syncResults.wishPushed + syncResults.foodItemsPushed;
      const totalPulled = syncResults.shoppingPulled + syncResults.wishPulled + syncResults.foodItemsPulled;
      
      if (totalPushed > 0 || totalPulled > 0) {
        Alert.alert(
          'Sync Complete', 
          `Uploaded: ${totalPushed} items\nDownloaded: ${totalPulled} items`
        );
      } else {
        Alert.alert('Sync Complete', 'Everything is up to date!');
      }
    } catch (error) {
      setSyncStatus('error');
      Alert.alert('Sync Error', error instanceof Error ? error.message : 'An error occurred while syncing your data. Please try again later.');
    }
  };
  
  // Function to clear sync data (for debugging)
  const clearSyncData = async (): Promise<void> => {
    try {
      // Clear sync data - this would need to be implemented via the PostgreSQL API
      setLastSyncTime(null);
      Alert.alert('Sync Data Cleared', 'Sync history cleared.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear sync data');
    }
  };

  const value: ApiContextType = {
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    currentGroup,
    userGroups,
    createGroup,
    deleteGroup,
    setCurrentGroup: updateCurrentGroup,
    syncStatus,
    lastSyncTime,
    syncToServer,
    clearSyncData
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};
