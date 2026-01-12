import { supabase } from '../lib/supabase';
import { FoodItemRepository, CategoryRepository, LocationRepository } from '../database/repository';
import { getDatabase, getCurrentDate } from '../database/database';
import { runSyncMigrations } from '../database/migrations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import { getCurrentDateTimeISO } from '../utils/dateUtils';

// Types for sync operations
interface SyncResult {
  success: boolean;
  error?: string;
  syncedAt: Date | null;
  stats: {
    uploaded: {
      categories: number;
      locations: number;
      foodItems: number;
      wishItems: number;
      shoppingItems: number;
      images: number;
    };
    downloaded: {
      categories: number;
      locations: number;
      foodItems: number;
      wishItems: number;
      shoppingItems: number;
      images: number;
    };
  } | null;
}

interface LocalSyncData {
  categories: any[];
  locations: any[];
  foodItems: any[];
  wishItems: any[];
  shoppingItems: any[];
  deletedItems: {
    categories: string[];
    locations: string[];
    foodItems: string[];
    wishItems: string[];
    shoppingItems: string[];
  };
  images: Record<string, string>; // Base64 encoded images
}

/**
 * Service to handle synchronization between local SQLite database and Supabase
 */
export class SupabaseSyncService {
  private lastSyncTime: Date | null = null;
  private syncInProgress: boolean = false;
  private imagesDirectory: string;
  
  constructor() {
    // Initialize images directory
    this.imagesDirectory = `${FileSystem.documentDirectory}images`;
    
    // Initialize last sync time from AsyncStorage
    this.loadLastSyncTime();
  }
  
  private async loadLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem('last_sync_time');
      this.lastSyncTime = timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  }
  
  private async saveLastSyncTime(syncTime?: Date) {
    try {
      const now = syncTime || new Date();
      await AsyncStorage.setItem('last_sync_time', now.toISOString());
      this.lastSyncTime = now;
    } catch (error) {
      console.error('Error saving last sync time:', error);
    }
  }
  
  /**
   * Updates all repository schemas to add necessary sync columns
   */
  async updateDatabaseForSync(): Promise<void> {
    try {
      const success = await runSyncMigrations();
      
      if (!success) {
        throw new Error('Failed to run sync migrations');
      }
    } catch (error) {
      console.error('Error updating database for sync:', error);
      throw new Error(`Failed to update database for sync: ${error.message}`);
    }
  }
  
  /**
   * Main sync function - performs bidirectional sync with Supabase
   */
  async syncDatabase(userId: string, groupId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    this.syncInProgress = true;
    
    try {
      // Ensure we have the necessary sync columns and indexes
      await this.updateDatabaseForSync();
      
      // Ensure images directory exists
      await this.ensureImagesDirectoryExists();
      
      // 1. Collect local changes
      const localChanges = await this.collectLocalChanges(groupId);
      
      // 2. Upload local changes to Supabase
      const uploadResult = await this.uploadToSupabase(localChanges, userId, groupId);
      
      // 3. Download changes from Supabase
      const downloadResult = await this.downloadFromSupabase(userId, groupId);
      
      // 4. Update the sync log
      await this.recordSyncOperation(userId, groupId, {
        uploaded: uploadResult,
        downloaded: downloadResult
      });
      
      // 5. Update timestamp
      const syncTime = new Date();
      await this.saveLastSyncTime(syncTime);
      
      this.syncInProgress = false;
      
      return {
        success: true,
        syncedAt: syncTime,
        stats: {
          uploaded: {
            categories: uploadResult.categories,
            locations: uploadResult.locations,
            foodItems: uploadResult.foodItems,
            wishItems: uploadResult.wishItems,
            shoppingItems: uploadResult.shoppingItems,
            images: uploadResult.images
          },
          downloaded: {
            categories: downloadResult.categories,
            locations: downloadResult.locations,
            foodItems: downloadResult.foodItems,
            wishItems: downloadResult.wishItems,
            shoppingItems: downloadResult.shoppingItems,
            images: downloadResult.images
          }
        }
      };
    } catch (error) {
      console.error('Supabase sync failed:', error);
      this.syncInProgress = false;
      return {
        success: false,
        error: error.message,
        syncedAt: null,
        stats: null
      };
    }
  }
  
  /**
   * Collect local changes that need to be synced to Supabase
   */
  private async collectLocalChanges(groupId: string): Promise<LocalSyncData> {
    const lastSyncTimeStr = this.lastSyncTime?.toISOString() || '1970-01-01T00:00:00Z';
    
    // Collect items to sync from each table
    const categories = await CategoryRepository.getItemsForSync(groupId, lastSyncTimeStr);
    const locations = await LocationRepository.getItemsForSync(groupId, lastSyncTimeStr);
    const foodItems = await FoodItemRepository.getItemsForSync(groupId, lastSyncTimeStr);
    
    // Collect deleted items
    const deletedItems = await this.getDeletedItems(groupId);
    
    // Collect images that need to be synced
    const images = await this.collectLocalImages(foodItems);
    
    return {
      categories,
      locations,
      foodItems,
      wishItems: [], // Not implementing yet
      shoppingItems: [], // Not implementing yet
      deletedItems,
      images
    };
  }
  
  /**
   * Get list of items that were deleted locally since last sync
   */
  private async getDeletedItems(groupId: string): Promise<{
    categories: string[];
    locations: string[];
    foodItems: string[];
    wishItems: string[];
    shoppingItems: string[];
  }> {
    const db = await getDatabase();
    if (!db) {
      return {
        categories: [],
        locations: [],
        foodItems: [],
        wishItems: [],
        shoppingItems: []
      };
    }
    
    const lastSyncTimeStr = this.lastSyncTime?.toISOString() || '1970-01-01T00:00:00Z';
    
    try {
      // Get deleted items from tracking table
      const deletedItemsResult = await db.getAllAsync(
        'SELECT * FROM deleted_items WHERE deleted_at > ? AND group_id = ?',
        [lastSyncTimeStr, groupId]
      );
      
      // Categorize by table
      const result = {
        categories: [],
        locations: [],
        foodItems: [],
        wishItems: [],
        shoppingItems: []
      };
      
      for (const item of deletedItemsResult) {
        if (!item.cloud_id) continue;
        
        switch (item.table_name) {
          case 'categories':
            result.categories.push(item.cloud_id);
            break;
          case 'locations':
            result.locations.push(item.cloud_id);
            break;
          case 'food_items':
            result.foodItems.push(item.cloud_id);
            break;
          case 'wish_items':
            result.wishItems.push(item.cloud_id);
            break;
          case 'shopping_items':
            result.shoppingItems.push(item.cloud_id);
            break;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting deleted items:', error);
      return {
        categories: [],
        locations: [],
        foodItems: [],
        wishItems: [],
        shoppingItems: []
      };
    }
  }
  
  /**
   * Collect local images that need to be synced to Supabase
   */
  private async collectLocalImages(foodItems: any[]): Promise<Record<string, string>> {
    const imageData: Record<string, string> = {};
    
    // Get unique image URIs from food items
    const imageUris = foodItems
      .filter(item => item.image_uri && !item.image_uri.startsWith('http') && !item.image_uri.startsWith('emoji:'))
      .map(item => item.image_uri);
    
    // Remove duplicates
    const uniqueUris = [...new Set(imageUris)];
    
    // Read each image file and convert to base64
    for (const uri of uniqueUris) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        
        if (fileInfo.exists) {
          // Read the file as base64
          const base64Data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          // Add file extension information (needed for Supabase Storage)
          const extension = this.getFileExtensionFromUri(uri);
          imageData[uri] = `data:image/${extension};base64,${base64Data}`;
        }
      } catch (error) {
        console.warn(`Could not read image at ${uri}:`, error);
      }
    }
    
    
    return imageData;
  }
  
  /**
   * Get file extension from URI
   */
  private getFileExtensionFromUri(uri: string): string {
    const match = uri.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'jpg';
  }
  
  /**
   * Ensure the images directory exists
   */
  private async ensureImagesDirectoryExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.imagesDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.imagesDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creating images directory:', error);
      throw error;
    }
  }
  
  /**
   * Upload local changes to Supabase
   */
  private async uploadToSupabase(
    localChanges: LocalSyncData,
    userId: string,
    groupId: string
  ): Promise<{
    categories: number;
    locations: number;
    foodItems: number;
    wishItems: number;
    shoppingItems: number;
    images: number;
  }> {
    // Initialize counters
    const result = {
      categories: 0,
      locations: 0,
      foodItems: 0,
      wishItems: 0,
      shoppingItems: 0,
      images: 0
    };
    
    // Get user session to ensure we're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated with Supabase');
    }
    
    // 1. Upload images first
    const imageMap = await this.uploadImages(localChanges.images, userId, groupId);
    result.images = Object.keys(imageMap).length;
    
    // 2. Upload categories
    await Promise.all(localChanges.categories.map(async (category) => {
      try {
        // Format the category for Supabase
        const supabaseCategory = {
          id: category.cloud_id,
          name: category.name,
          icon: category.icon,
          translation_key: category.translationKey,
          created_by: userId,
          group_id: groupId,
          created_at: new Date(category.created_at).toISOString(),
          updated_at: new Date(category.updated_at).toISOString()
        };
        
        // Insert or update
        const { error } = await supabase
          .from('categories')
          .upsert(supabaseCategory);
        
        if (error) throw error;
        
        // Update local sync status
        await CategoryRepository.updateSyncStatus(category.id, 'synced');
        result.categories++;
      } catch (error) {
        console.error('Error uploading category to Supabase:', error);
        // Mark as conflict if there was an error
        await CategoryRepository.updateSyncStatus(category.id, 'conflict');
      }
    }));
    
    // 3. Upload locations
    await Promise.all(localChanges.locations.map(async (location) => {
      try {
        // Format the location for Supabase
        const supabaseLocation = {
          id: location.cloud_id,
          name: location.name,
          icon: location.icon,
          translation_key: location.translationKey,
          created_by: userId,
          group_id: groupId,
          created_at: new Date(location.created_at).toISOString(),
          updated_at: new Date(location.updated_at).toISOString()
        };
        
        // Insert or update
        const { error } = await supabase
          .from('locations')
          .upsert(supabaseLocation);
        
        if (error) throw error;
        
        // Update local sync status
        await LocationRepository.updateSyncStatus(location.id, 'synced');
        result.locations++;
      } catch (error) {
        console.error('Error uploading location to Supabase:', error);
        // Mark as conflict if there was an error
        await LocationRepository.updateSyncStatus(location.id, 'conflict');
      }
    }));
    
    // 4. Upload food items
    await Promise.all(localChanges.foodItems.map(async (item) => {
      try {
        // Check if this item has an image that was uploaded
        let imageUrl = item.image_uri;
        if (imageUrl && imageMap[imageUrl]) {
          imageUrl = imageMap[imageUrl]; // Replace with Supabase storage URL
        }
        
        // Format the food item for Supabase
        const supabaseItem = {
          id: item.cloud_id,
          name: item.name,
          quantity: item.quantity,
          category_id: await this.getCategoryCloudId(item.category_id),
          location_id: await this.getLocationCloudId(item.location_id),
          group_id: groupId,
          created_by: userId,
          expiry_date: item.expiry_date,
          reminder_days: item.reminder_days,
          notes: item.notes,
          image_url: imageUrl,
          created_at: new Date(item.created_at).toISOString(),
          updated_at: new Date(item.updated_at).toISOString()
        };
        
        // Insert or update
        const { error } = await supabase
          .from('food_items')
          .upsert(supabaseItem);
        
        if (error) throw error;
        
        // Update local sync status
        await FoodItemRepository.updateSyncStatus(item.id, 'synced');
        result.foodItems++;
      } catch (error) {
        console.error('Error uploading food item to Supabase:', error);
        // Mark as conflict if there was an error
        await FoodItemRepository.updateSyncStatus(item.id, 'conflict');
      }
    }));
    
    // 5. Process deletions
    await this.processDeletes(localChanges.deletedItems);
    
    return result;
  }
  
  /**
   * Upload images to Supabase Storage
   * Returns a map of local URIs to Supabase Storage URLs
   */
  private async uploadImages(
    images: Record<string, string>,
    userId: string,
    groupId: string
  ): Promise<Record<string, string>> {
    
    const result: Record<string, string> = {};
    
    for (const [localUri, base64Data] of Object.entries(images)) {
      try {
        // Extract base64 data without the data URL prefix
        const base64Content = base64Data.split(';base64,').pop();
        if (!base64Content) continue;
        
        // Create a unique file name
        const extension = this.getFileExtensionFromUri(localUri);
        const fileName = `${groupId}/${uuidv4()}.${extension}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('food-images')
          .upload(fileName, base64Content, {
            contentType: `image/${extension}`,
            upsert: true
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('food-images')
          .getPublicUrl(fileName);
        
        // Map local URI to Supabase URL
        result[localUri] = publicUrl;
      } catch (error) {
        console.error(`Error uploading image ${localUri}:`, error);
      }
    }
    
    return result;
  }
  
  /**
   * Process deleted items in Supabase
   */
  private async processDeletes(deletedItems: LocalSyncData['deletedItems']): Promise<void> {
    // Delete food items
    if (deletedItems.foodItems.length > 0) {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .in('id', deletedItems.foodItems);
      
      if (error) {
        console.error('Error deleting food items from Supabase:', error);
      }
    }
    
    // Delete categories
    if (deletedItems.categories.length > 0) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', deletedItems.categories);
      
      if (error) {
        console.error('Error deleting categories from Supabase:', error);
      }
    }
    
    // Delete locations
    if (deletedItems.locations.length > 0) {
      const { error } = await supabase
        .from('locations')
        .delete()
        .in('id', deletedItems.locations);
      
      if (error) {
        console.error('Error deleting locations from Supabase:', error);
      }
    }
    
    // Delete wish items
    if (deletedItems.wishItems.length > 0) {
      const { error } = await supabase
        .from('wish_items')
        .delete()
        .in('id', deletedItems.wishItems);
      
      if (error) {
        console.error('Error deleting wish items from Supabase:', error);
      }
    }
    
    // Delete shopping items
    if (deletedItems.shoppingItems.length > 0) {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .in('id', deletedItems.shoppingItems);
      
      if (error) {
        console.error('Error deleting shopping items from Supabase:', error);
      }
    }
  }
  
  /**
   * Download changes from Supabase
   */
  private async downloadFromSupabase(
    userId: string,
    groupId: string
  ): Promise<{
    categories: number;
    locations: number;
    foodItems: number;
    wishItems: number;
    shoppingItems: number;
    images: number;
  }> {
    // Initialize counters
    const result = {
      categories: 0,
      locations: 0,
      foodItems: 0,
      wishItems: 0,
      shoppingItems: 0,
      images: 0
    };
    
    const lastSyncTimeStr = this.lastSyncTime?.toISOString() || '1970-01-01T00:00:00Z';
    
    // 1. Download categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('group_id', groupId)
      .or(`updated_at.gt.${lastSyncTimeStr}`)
      .order('updated_at', { ascending: false });
    
    if (catError) {
      console.error('Error fetching categories from Supabase:', catError);
    } else {
      // Apply category changes to local database
      for (const category of categories || []) {
        try {
          await CategoryRepository.updateFromCloud({
            name: category.name,
            icon: category.icon,
            translation_key: category.translation_key,
            cloud_id: category.id,
            created_at: category.created_at,
            updated_at: category.updated_at
          });
          result.categories++;
        } catch (error) {
          console.error(`Error applying category ${category.name}:`, error);
        }
      }
    }
    
    // 2. Download locations
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .eq('group_id', groupId)
      .or(`updated_at.gt.${lastSyncTimeStr}`)
      .order('updated_at', { ascending: false });
    
    if (locError) {
      console.error('Error fetching locations from Supabase:', locError);
    } else {
      // Apply location changes to local database
      for (const location of locations || []) {
        try {
          await LocationRepository.updateFromCloud({
            name: location.name,
            icon: location.icon,
            translation_key: location.translation_key,
            cloud_id: location.id,
            created_at: location.created_at,
            updated_at: location.updated_at
          });
          result.locations++;
        } catch (error) {
          console.error(`Error applying location ${location.name}:`, error);
        }
      }
    }
    
    // 3. Download food items
    const { data: foodItems, error: foodError } = await supabase
      .from('food_items')
      .select('*')
      .eq('group_id', groupId)
      .or(`updated_at.gt.${lastSyncTimeStr}`)
      .order('updated_at', { ascending: false });
    
    if (foodError) {
      console.error('Error fetching food items from Supabase:', foodError);
    } else {
      // Download images and apply food item changes to local database
      for (const item of foodItems || []) {
        try {
          // If item has an image_url, download it
          let localImageUri = item.image_url;
          if (item.image_url && item.image_url.startsWith('http')) {
            localImageUri = await this.downloadImage(item.image_url);
            if (localImageUri) result.images++;
          }
          
          // Map category and location IDs from cloud to local
          const categoryId = item.category_id ? 
            await this.getLocalCategoryId(item.category_id) : null;
          
          const locationId = item.location_id ?
            await this.getLocalLocationId(item.location_id) : null;
          
          // Apply food item to local database
          await FoodItemRepository.updateFromCloud({
            name: item.name,
            quantity: item.quantity,
            category_id: categoryId,
            location_id: locationId,
            group_id: groupId,
            cloud_id: item.id,
            expiry_date: item.expiry_date,
            reminder_days: item.reminder_days || 3,
            notes: item.notes,
            image_uri: localImageUri,
            created_at: item.created_at,
            updated_at: item.updated_at
          });
          result.foodItems++;
        } catch (error) {
          console.error(`Error applying food item ${item.name}:`, error);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Download an image from a URL and save it locally
   */
  private async downloadImage(url: string): Promise<string | null> {
    try {
      // Create a unique filename
      const filename = `${uuidv4()}.jpg`;
      const localUri = `${this.imagesDirectory}/${filename}`;
      
      // Download the image
      const { uri } = await FileSystem.downloadAsync(url, localUri);
      
      return uri;
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Map a local category ID to its cloud ID
   */
  private async getCategoryCloudId(categoryId: number | null): Promise<string | null> {
    if (!categoryId) return null;
    
    try {
      const category = await CategoryRepository.getById(categoryId);
      return category?.cloud_id || null;
    } catch (error) {
      console.error('Error getting category cloud ID:', error);
      return null;
    }
  }
  
  /**
   * Map a local location ID to its cloud ID
   */
  private async getLocationCloudId(locationId: number | null): Promise<string | null> {
    if (!locationId) return null;
    
    try {
      const location = await LocationRepository.getById(locationId);
      return location?.cloud_id || null;
    } catch (error) {
      console.error('Error getting location cloud ID:', error);
      return null;
    }
  }
  
  /**
   * Map a cloud category ID to its local ID
   */
  private async getLocalCategoryId(cloudId: string): Promise<number | null> {
    try {
      const category = await CategoryRepository.getByCloudId(cloudId);
      return category?.id || null;
    } catch (error) {
      console.error('Error getting local category ID:', error);
      return null;
    }
  }
  
  /**
   * Map a cloud location ID to its local ID
   */
  private async getLocalLocationId(cloudId: string): Promise<number | null> {
    try {
      const location = await LocationRepository.getByCloudId(cloudId);
      return location?.id || null;
    } catch (error) {
      console.error('Error getting local location ID:', error);
      return null;
    }
  }
  
  /**
   * Record a sync operation in the sync_log table
   */
  private async recordSyncOperation(
    userId: string,
    groupId: string,
    stats: {
      uploaded: {
        categories: number;
        locations: number;
        foodItems: number;
        wishItems: number;
        shoppingItems: number;
        images: number;
      };
      downloaded: {
        categories: number;
        locations: number;
        foodItems: number;
        wishItems: number;
        shoppingItems: number;
        images: number;
      };
    }
  ): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    
    try {
      const totalUploaded = 
        stats.uploaded.categories + 
        stats.uploaded.locations + 
        stats.uploaded.foodItems + 
        stats.uploaded.wishItems + 
        stats.uploaded.shoppingItems;
      
      const totalDownloaded = 
        stats.downloaded.categories + 
        stats.downloaded.locations + 
        stats.downloaded.foodItems + 
        stats.downloaded.wishItems + 
        stats.downloaded.shoppingItems;
      
      await db.runAsync(
        `INSERT INTO sync_log 
         (user_id, group_id, sync_time, status, items_uploaded, items_downloaded, 
          images_uploaded, images_downloaded)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          groupId,
          getCurrentDateTimeISO(),
          'success',
          totalUploaded,
          totalDownloaded,
          stats.uploaded.images,
          stats.downloaded.images
        ]
      );
    } catch (error) {
      console.error('Error recording sync operation:', error);
    }
  }
  
  /**
   * Track a deleted item for sync
   */
  async trackDeletedItem(tableName: string, itemId: number, groupId: string): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    
    try {
      // Get the cloud_id if available before tracking
      let cloudId = null;
      try {
        const item = await db.getFirstAsync(`SELECT cloud_id FROM ${tableName} WHERE id = ?`, [itemId]);
        if (item) {
          cloudId = item.cloud_id;
        }
      } catch (e) {
        console.warn(`Could not get cloud_id for ${tableName}:${itemId}`, e);
      }
      
      // Track the deletion
      await db.runAsync(
        'INSERT INTO deleted_items (table_name, item_id, cloud_id, group_id, deleted_at) VALUES (?, ?, ?, ?, ?)',
        [tableName, itemId, cloudId, groupId, getCurrentDateTimeISO()]
      );
    } catch (error) {
      // Create the table if it doesn't exist yet
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS deleted_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            cloud_id TEXT,
            group_id TEXT,
            deleted_at TEXT NOT NULL
          )
        `);
        
        // Try insert again
        await db.runAsync(
          'INSERT INTO deleted_items (table_name, item_id, cloud_id, group_id, deleted_at) VALUES (?, ?, ?, ?, ?)',
          [tableName, itemId, null, groupId, getCurrentDateTimeISO()]
        );
      } catch (e) {
        console.error('Error tracking deleted item:', e);
      }
    }
  }
  
  /**
   * Clear the sync log (for debugging/testing)
   */
  async clearSyncLog(): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    
    try {
      await db.runAsync('DELETE FROM sync_log');
      await db.runAsync('DELETE FROM deleted_items');
      await AsyncStorage.removeItem('last_sync_time');
      this.lastSyncTime = null;
    } catch (error) {
      console.error('Error clearing sync log:', error);
    }
  }
}

// Create a singleton instance
export const supabaseSyncService = new SupabaseSyncService();

