import { getDatabase, getCurrentDate, calculateDaysUntilExpiry, isUsingFallbackStorage, getFallbackStorage, queuedDatabaseOperation } from '../database/database';
import { Category, Location, FoodItem, ShoppingItem, WishItem } from '../database/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentDateTimeISO } from '../utils/dateUtils';

// Types for sync operations
interface LocalChanges {
  categories: any[];
  locations: any[];
  foodItems: any[];
  wishItems: any[];
  shoppingItems: any[];
  lastSyncTime: string | null;
  deletedItems?: {
    foodItems: number[];
    categories: number[];
    locations: number[];
    wishItems: number[];
    shoppingItems: number[];
  };
}

interface CloudChanges {
  categories: any[];
  locations: any[];
  foodItems: any[];
  wishItems: any[];
  shoppingItems: any[];
  syncTime: string;
  images?: Record<string, string>; // Base64 encoded images keyed by image_uri
}

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

/**
 * Service to handle synchronization between local SQLite database and cloud
 */
export class SyncService {
  private lastSyncTime: Date | null = null;
  private syncInProgress: boolean = false;
  private apiUrl: string = 'https://your-api-domain.com/api/sync.php'; // Update with your actual API URL
  private apiToken: string | null = null;
  
  constructor() {
    // Initialize last sync time from AsyncStorage
    this.loadLastSyncTime();
    this.loadApiToken();
  }
  
  private async loadLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem('last_sync_time');
      this.lastSyncTime = timestamp ? new Date(timestamp) : null;
    } catch (error) {
      // Silent error handling
    }
  }
  
  private async saveLastSyncTime() {
    try {
      const now = new Date();
      await AsyncStorage.setItem('last_sync_time', now.toISOString());
      this.lastSyncTime = now;
    } catch (error) {
      // Silent error handling
    }
  }
  
  private async loadApiToken() {
    try {
      this.apiToken = await AsyncStorage.getItem('user_api_token');
    } catch (error) {
      // Silent error handling
    }
  }
  
  /**
   * Main sync function - performs bidirectional sync
   */
  async syncDatabase(userId: string, groupId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        error: 'Sync already in progress',
        syncedAt: null,
        stats: null
      };
    }
    
    // Check if API token is available before attempting sync
    if (!this.apiToken) {
      return {
        success: false,
        error: 'API token not available. Please log in.',
        syncedAt: null,
        stats: null
      };
    }
    
    this.syncInProgress = true;
    
    try {
      // 1. Gather local changes since last sync
      const localChanges = await this.collectLocalChanges();
      
      // 2. Collect local images that need to be synced
      const imageData = await this.collectLocalImages(localChanges.foodItems);
      
      // 3. Send local changes to cloud and get cloud changes
      const cloudChanges = await this.exchangeWithCloud(localChanges, imageData, userId, groupId);
      
      // 4. Apply cloud changes to local database
      const appliedChanges = await this.applyCloudChanges(cloudChanges);
      
      // 5. Update sync timestamp
      await this.saveLastSyncTime();
      
      this.syncInProgress = false;
      
      return {
        success: true,
        syncedAt: new Date(),
        stats: {
          uploaded: {
            categories: localChanges.categories.length,
            locations: localChanges.locations.length,
            foodItems: localChanges.foodItems.length,
            wishItems: localChanges.wishItems.length,
            shoppingItems: localChanges.shoppingItems.length,
            images: Object.keys(imageData).length,
          },
          downloaded: {
            categories: cloudChanges.categories.length,
            locations: cloudChanges.locations.length,
            foodItems: cloudChanges.foodItems.length,
            wishItems: cloudChanges.wishItems.length,
            shoppingItems: cloudChanges.shoppingItems.length,
            images: appliedChanges.imagesDownloaded,
          }
        }
      };
    } catch (error) {
      this.syncInProgress = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: null,
        stats: null
      };
    }
  }
  
  /**
   * Collect all local changes since last sync
   */
  private async collectLocalChanges(): Promise<LocalChanges> {
    const db = await getDatabase();
    const lastSync = this.lastSyncTime?.toISOString() || '1970-01-01T00:00:00Z';
    
    // Track deleted items
    const deletedItems = {
      foodItems: [],
      categories: [],
      locations: [],
      wishItems: [],
      shoppingItems: [],
    };
    
    // Collect changes from each table
    let categories = [];
    let locations = [];
    let foodItems = [];
    let wishItems = [];
    let shoppingItems = [];
    
    if (db) {
      try {
        // Get deleted items from local tracking table if it exists
        try {
          const deletedRecords = await db.getAllAsync('SELECT * FROM deleted_items WHERE deleted_at > ?', [lastSync]);
          deletedRecords.forEach(record => {
            const id = record.item_id;
            switch(record.table_name) {
              case 'food_items': deletedItems.foodItems.push(id); break;
              case 'categories': deletedItems.categories.push(id); break;
              case 'locations': deletedItems.locations.push(id); break;
              case 'wish_items': deletedItems.wishItems.push(id); break;
              case 'shopping_items': deletedItems.shoppingItems.push(id); break;
            }
          });
        } catch (err) {
          // Table might not exist yet, that's okay
          // Deleted items table will be created later
        }
        
        // Get modified categories
        categories = await db.getAllAsync(
          'SELECT * FROM categories WHERE created_at > ? OR updated_at > ?',
          [lastSync, lastSync]
        );
        
        // Get modified locations
        locations = await db.getAllAsync(
          'SELECT * FROM locations WHERE created_at > ? OR updated_at > ?',
          [lastSync, lastSync]
        );
        
        // Get modified food items
        foodItems = await db.getAllAsync(
          'SELECT * FROM food_items WHERE created_at > ? OR updated_at > ?',
          [lastSync, lastSync]
        );
        
        // Get modified shopping items
        shoppingItems = await db.getAllAsync(
          'SELECT * FROM shopping_items WHERE created_at > ? OR updated_at > ?',
          [lastSync, lastSync]
        );
        
        // Get modified wish items
        wishItems = await db.getAllAsync(
          'SELECT * FROM wish_items WHERE created_at > ? OR updated_at > ?',
          [lastSync, lastSync]
        );
      } catch (error) {
        throw new Error(`Failed to collect local changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Fallback storage handling
      try {
        const fallbackDb = getFallbackStorage();
        categories = await fallbackDb.getAllCategories();
        locations = await fallbackDb.getAllLocations();
        foodItems = await fallbackDb.getAllFoodItems();
        // Fallback doesn't support shopping and wish items yet
      } catch (error) {
        throw new Error(`Failed to collect local changes from fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      categories,
      locations,
      foodItems,
      wishItems,
      shoppingItems,
      deletedItems,
      lastSyncTime: this.lastSyncTime?.toISOString() || null
    };
  }
  
  /**
   * Collect local images that need to be synced
   * Returns a map of image_uri to base64 encoded image data
   */
  private async collectLocalImages(foodItems: any[]): Promise<Record<string, string>> {
    const imageData: Record<string, string> = {};
    
    // Get unique image URIs from food items that need syncing
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
          
          imageData[uri] = base64Data;
        }
      } catch (error) {
        // Silently skip images that can't be read
      }
    }
    
    return imageData;
  }
  
  /**
   * Exchange data with cloud server
   */
  private async exchangeWithCloud(
    localChanges: LocalChanges, 
    imageData: Record<string, string>,
    userId: string,
    groupId: string
  ): Promise<CloudChanges> {
    if (!this.apiToken) {
      throw new Error('API token not available. Please log in.');
    }
    
    try {
      // Prepare data package for API
      const syncData = {
        user_id: userId,
        group_id: groupId,
        categories: localChanges.categories,
        locations: localChanges.locations,
        food_items: localChanges.foodItems,
        wish_items: localChanges.wishItems,
        shopping_items: localChanges.shoppingItems,
        deleted_items: localChanges.deletedItems,
        last_sync_time: localChanges.lastSyncTime,
        images: imageData
      };
      
      // Call the API
      const response = await fetch(`${this.apiUrl}?action=sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify(syncData)
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Unknown error from server');
      }
      
      return {
        categories: responseData.data.categories || [],
        locations: responseData.data.locations || [],
        foodItems: responseData.data.food_items || [],
        wishItems: responseData.data.wish_items || [],
        shoppingItems: responseData.data.shopping_items || [],
        syncTime: responseData.data.sync_time,
        images: responseData.data.images || {}
      };
    } catch (error) {
      throw new Error(`Failed to exchange data with cloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Apply cloud changes to local database
   */
  private async applyCloudChanges(cloudChanges: CloudChanges): Promise<{
    imagesDownloaded: number;
  }> {
    const db = await getDatabase();
    if (!db) {
      throw new Error('Database not available');
    }
    
    let imagesDownloaded = 0;
    
    try {
      // Use a transaction for atomicity
      await db.withTransactionAsync(async () => {
        // Ensure we have a deleted_items tracking table
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS deleted_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            deleted_at TEXT NOT NULL
          )
        `);
        
        // Update categories
        for (const category of cloudChanges.categories) {
          await db.runAsync(
            'INSERT OR REPLACE INTO categories (id, name, icon, translation_key, created_at, updated_at, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [category.id, category.name, category.icon, category.translation_key, category.created_at, category.updated_at || category.created_at, category.cloud_id]
          );
        }
        
        // Update locations
        for (const location of cloudChanges.locations) {
          await db.runAsync(
            'INSERT OR REPLACE INTO locations (id, name, icon, translation_key, created_at, updated_at, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [location.id, location.name, location.icon, location.translation_key, location.created_at, location.updated_at || location.created_at, location.cloud_id]
          );
        }
        
        // Update food items and handle image downloads
        for (const item of cloudChanges.foodItems) {
          // Check if this item has an image that needs downloading
          if (item.image_uri && cloudChanges.images && cloudChanges.images[item.image_uri]) {
            // Download and store the image locally
            const localUri = await this.saveImageLocally(item.image_uri, cloudChanges.images[item.image_uri]);
            
            // Update the image_uri to point to local file
            if (localUri) {
              item.image_uri = localUri;
              imagesDownloaded++;
            }
          }
          
          await db.runAsync(
            `INSERT OR REPLACE INTO food_items 
            (id, name, quantity, category_id, location_id, group_id, cloud_id,
            expiry_date, reminder_days, notes, image_uri, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id, item.name, item.quantity, item.category_id, item.location_id,
              item.group_id, item.cloud_id, item.expiry_date, item.reminder_days,
              item.notes, item.image_uri, item.created_at, item.updated_at || item.created_at
            ]
          );
        }
        
        // Update shopping items
        for (const item of cloudChanges.shoppingItems) {
          await db.runAsync(
            'INSERT OR REPLACE INTO shopping_items (id, name, image_uri, done, created_at, updated_at, group_id, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.name, item.image_uri, item.done ? 1 : 0, item.created_at, item.updated_at || item.created_at, item.group_id, item.cloud_id]
          );
        }
        
        // Update wish items
        for (const item of cloudChanges.wishItems) {
          await db.runAsync(
            'INSERT OR REPLACE INTO wish_items (id, name, notes, price, rating, image_uri, done, created_at, updated_at, group_id, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.name, item.notes, item.price, item.rating, item.image_uri, item.done ? 1 : 0, item.created_at, item.updated_at || item.created_at, item.group_id, item.cloud_id]
          );
        }
      });
      
      return { imagesDownloaded };
    } catch (error) {
      throw new Error(`Failed to apply cloud changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Save a base64 encoded image to local file system
   * @returns The local URI of the saved image
   */
  private async saveImageLocally(originalUri: string, base64Data: string): Promise<string | null> {
    try {
      // Create a unique filename based on the original URI
      const filename = `${uuidv4()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}images/${filename}`;
      
      // Ensure the images directory exists
      const dirUri = `${FileSystem.documentDirectory}images`;
      const dirInfo = await FileSystem.getInfoAsync(dirUri);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
      }
      
      // Write the base64 data to file
      await FileSystem.writeAsStringAsync(localUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      return localUri;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Updates all repository schemas to add necessary sync columns
   */
  async updateDatabaseForSync(): Promise<void> {
    try {
      // Import and run migrations (only add sync columns, skip Supabase-specific setup)
      const { addSyncColumnsToDatabase, createSyncIndexes } = await import('../database/migrations');
      const columnsAdded = await addSyncColumnsToDatabase();
      const indexesCreated = await createSyncIndexes();
      
      if (!columnsAdded || !indexesCreated) {
        throw new Error('Failed to run sync migrations');
      }
    } catch (error) {
      throw new Error(`Failed to update database for sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Track a deleted item for syncing
   */
  async trackDeletedItem(tableName: string, itemId: number): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    
    try {
      await db.runAsync(
        'INSERT INTO deleted_items (table_name, item_id, deleted_at) VALUES (?, ?, ?)',
        [tableName, itemId, getCurrentDateTimeISO()]
      );
    } catch (error) {
      // Table might not exist yet
      try {
        // Create the table first
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS deleted_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            deleted_at TEXT NOT NULL
          )
        `);
        
        // Try insert again
        await db.runAsync(
          'INSERT INTO deleted_items (table_name, item_id, deleted_at) VALUES (?, ?, ?)',
          [tableName, itemId, getCurrentDateTimeISO()]
        );
      } catch (e) {
        // Silent error handling
      }
    }
  }
}

// Create a singleton instance
export const syncService = new SyncService();
