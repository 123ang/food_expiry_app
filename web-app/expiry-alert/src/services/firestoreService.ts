import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface FoodItem {
  id?: string;
  name: string;
  expiryDate: string;
  categoryId: string;
  locationId: string;
  quantity: string;
  notes: string;
  addedDate: string;
  userId: string;
  status?: 'fresh' | 'expiring-soon' | 'expired';
  daysUntilExpiry?: number;
  reminderDays?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  userId: string;
  createdAt: string;
  createdAtTimestamp?: any;
  updatedAt?: any;
}

export interface Location {
  id?: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  createdAtTimestamp?: any;
  updatedAt?: any;
}

export interface DashboardStats {
  total: number;
  fresh: number;
  expiringSoon: number;
  expired: number;
}

// Collection names
const COLLECTIONS = {
  FOOD_ITEMS: 'foodItems',
  CATEGORIES: 'categories',
  LOCATIONS: 'locations'
};

// Food Items Service
export class FoodItemsService {
  static async addItem(item: Omit<FoodItem, 'id' | 'addedDate'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.FOOD_ITEMS), {
        ...item,
        userId,
        addedDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        reminderDays: item.reminderDays || 3
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding food item:', error);
      throw error;
    }
  }

  static async updateItem(id: string, updates: Partial<FoodItem>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating food item:', error);
      throw error;
    }
  }

  static async deleteItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.FOOD_ITEMS, id));
    } catch (error) {
      console.error('Error deleting food item:', error);
      throw error;
    }
  }

  static async getUserItems(userId: string): Promise<FoodItem[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.FOOD_ITEMS),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];

      // Calculate status and days until expiry for each item
      const itemsWithStatus = items.map(item => {
        const { status, daysUntilExpiry } = calculateItemStatus(item.expiryDate);
        return { ...item, status, daysUntilExpiry };
      });

      // Sort by creation date manually to avoid index issues
      return itemsWithStatus.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.addedDate);
        const dateB = b.createdAt?.toDate?.() || new Date(b.addedDate);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting user items:', error);
      throw error;
    }
  }

  static async getItem(id: string): Promise<FoodItem | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.FOOD_ITEMS, id));
      if (docSnap.exists()) {
        const item = { id: docSnap.id, ...docSnap.data() } as FoodItem;
        const { status, daysUntilExpiry } = calculateItemStatus(item.expiryDate);
        return { ...item, status, daysUntilExpiry };
      }
      return null;
    } catch (error) {
      console.error('Error getting food item:', error);
      throw error;
    }
  }

  static async getItemsByStatus(userId: string, status: 'fresh' | 'expiring-soon' | 'expired'): Promise<FoodItem[]> {
    try {
      const items = await this.getUserItems(userId);
      return items.filter(item => item.status === status);
    } catch (error) {
      console.error('Error getting items by status:', error);
      throw error;
    }
  }

  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const items = await this.getUserItems(userId);
      const stats: DashboardStats = {
        total: items.length,
        fresh: items.filter(item => item.status === 'fresh').length,
        expiringSoon: items.filter(item => item.status === 'expiring-soon').length,
        expired: items.filter(item => item.status === 'expired').length
      };
      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Cleanup expired items (older than specified days)
  static async cleanupExpiredItems(userId: string, daysOld: number = 30): Promise<number> {
    try {
      const items = await this.getUserItems(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const itemsToDelete = items.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        return expiryDate < cutoffDate && item.status === 'expired';
      });

      if (itemsToDelete.length === 0) {
        return 0;
      }

      // Use batch delete for better performance
      const batch = writeBatch(db);
      itemsToDelete.forEach(item => {
        if (item.id) {
          const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, item.id);
          batch.delete(docRef);
        }
      });

      await batch.commit();
      return itemsToDelete.length;
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      throw error;
    }
  }

  // Real-time listener for user's food items
  static subscribeToUserItems(userId: string, callback: (items: FoodItem[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.FOOD_ITEMS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];

      // Calculate status for each item
      const itemsWithStatus = items.map(item => {
        const { status, daysUntilExpiry } = calculateItemStatus(item.expiryDate);
        return { ...item, status, daysUntilExpiry };
      });

      callback(itemsWithStatus);
    });
  }
}

// Categories Service
export class CategoriesService {
  static async addCategory(category: Omit<Category, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
        ...category,
        userId,
        createdAt: new Date().toISOString(),
        createdAtTimestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  static async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CATEGORIES),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      // Sort by creation date manually to avoid index issues
      return categories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user categories:', error);
      throw error;
    }
  }

  static async getCategory(id: string): Promise<Category | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.CATEGORIES, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Category;
      }
      return null;
    } catch (error) {
      console.error('Error getting category:', error);
      throw error;
    }
  }

  // Create default categories for new users with multilingual support
  static async createDefaultCategories(userId: string, language: string = 'en'): Promise<void> {
    const defaultCategories = {
      en: [
        { name: 'Fruits', description: 'Fresh fruits', icon: '🍇', color: '#FF6B6B' },
        { name: 'Vegetables', description: 'Fresh vegetables', icon: '🥕', color: '#4ECDC4' },
        { name: 'Dairy', description: 'Milk, cheese, yogurt', icon: '🥛', color: '#45B7D1' },
        { name: 'Meat', description: 'Meat and poultry', icon: '🥩', color: '#96CEB4' },
        { name: 'Bread', description: 'Bread and bakery items', icon: '🍞', color: '#FECA57' },
        { name: 'Beverages', description: 'Drinks and beverages', icon: '🥤', color: '#FF9FF3' },
        { name: 'Snacks', description: 'Snacks and treats', icon: '🍿', color: '#54A0FF' },
        { name: 'Frozen', description: 'Frozen foods', icon: '🧊', color: '#5F27CD' }
      ],
      zh: [
        { name: '水果', description: '新鲜水果', icon: '🍇', color: '#FF6B6B' },
        { name: '蔬菜', description: '新鲜蔬菜', icon: '🥕', color: '#4ECDC4' },
        { name: '乳制品', description: '牛奶、奶酪、酸奶', icon: '🥛', color: '#45B7D1' },
        { name: '肉类', description: '肉类和家禽', icon: '🥩', color: '#96CEB4' },
        { name: '面包', description: '面包和烘焙食品', icon: '🍞', color: '#FECA57' },
        { name: '饮料', description: '饮品和饮料', icon: '🥤', color: '#FF9FF3' },
        { name: '零食', description: '零食和小食', icon: '🍿', color: '#54A0FF' },
        { name: '冷冻食品', description: '冷冻食品', icon: '🧊', color: '#5F27CD' }
      ],
      ja: [
        { name: '果物', description: '新鮮な果物', icon: '🍇', color: '#FF6B6B' },
        { name: '野菜', description: '新鮮な野菜', icon: '🥕', color: '#4ECDC4' },
        { name: '乳製品', description: '牛乳、チーズ、ヨーグルト', icon: '🥛', color: '#45B7D1' },
        { name: '肉類', description: '肉類と鶏肉', icon: '🥩', color: '#96CEB4' },
        { name: 'パン', description: 'パンとベーカリー商品', icon: '🍞', color: '#FECA57' },
        { name: '飲み物', description: '飲み物と飲料', icon: '🥤', color: '#FF9FF3' },
        { name: 'スナック', description: 'スナックとお菓子', icon: '🍿', color: '#54A0FF' },
        { name: '冷凍食品', description: '冷凍食品', icon: '🧊', color: '#5F27CD' }
      ]
    };

    const categoriesToCreate = defaultCategories[language as keyof typeof defaultCategories] || defaultCategories.en;

    try {
      const batch = writeBatch(db);
      categoriesToCreate.forEach(category => {
        const docRef = doc(collection(db, COLLECTIONS.CATEGORIES));
        batch.set(docRef, {
          ...category,
          userId,
          createdAt: new Date().toISOString(),
          createdAtTimestamp: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error creating default categories:', error);
      throw error;
    }
  }
}

// Locations Service
export class LocationsService {
  static async addLocation(location: Omit<Location, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.LOCATIONS), {
        ...location,
        userId,
        createdAt: new Date().toISOString(),
        createdAtTimestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  }

  static async updateLocation(id: string, updates: Partial<Location>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.LOCATIONS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  static async deleteLocation(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.LOCATIONS, id));
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  static async getUserLocations(userId: string): Promise<Location[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LOCATIONS),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[];

      // Sort by creation date manually to avoid index issues  
      return locations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user locations:', error);
      throw error;
    }
  }

  static async getLocation(id: string): Promise<Location | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.LOCATIONS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Location;
      }
      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  // Create default locations for new users with multilingual support
  static async createDefaultLocations(userId: string, language: string = 'en'): Promise<void> {
    const defaultLocations = {
      en: [
        { name: 'Fridge', description: 'Main refrigerator' },
        { name: 'Freezer', description: 'Freezer compartment' },
        { name: 'Pantry', description: 'Kitchen pantry' },
        { name: 'Counter', description: 'Kitchen counter' },
        { name: 'Cabinet', description: 'Kitchen cabinet' }
      ],
      zh: [
        { name: '冰箱', description: '主冰箱' },
        { name: '冷冻室', description: '冷冻隔间' },
        { name: '食品储藏室', description: '厨房储藏室' },
        { name: '台面', description: '厨房台面' },
        { name: '橱柜', description: '厨房橱柜' }
      ],
      ja: [
        { name: '冷蔵庫', description: 'メイン冷蔵庫' },
        { name: '冷凍庫', description: '冷凍庫コンパートメント' },
        { name: 'パントリー', description: 'キッチンパントリー' },
        { name: 'カウンター', description: 'キッチンカウンター' },
        { name: 'キャビネット', description: 'キッチンキャビネット' }
      ]
    };

    const locationsToCreate = defaultLocations[language as keyof typeof defaultLocations] || defaultLocations.en;

    try {
      const batch = writeBatch(db);
      locationsToCreate.forEach(location => {
        const docRef = doc(collection(db, COLLECTIONS.LOCATIONS));
        batch.set(docRef, {
          ...location,
          userId,
          createdAt: new Date().toISOString(),
          createdAtTimestamp: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error creating default locations:', error);
      throw error;
    }
  }

  // Debug function to find location name mismatches
  static async debugLocationMismatches(userId: string): Promise<{ itemLocation: string, availableLocations: string[] }[]> {
    try {
      const [items, locations] = await Promise.all([
        FoodItemsService.getUserItems(userId),
        LocationsService.getUserLocations(userId)
      ]);

      const availableLocationIds = locations.map(loc => loc.id!);
      const mismatches: { itemLocation: string, availableLocations: string[] }[] = [];

      items.forEach(item => {
        const exactMatch = availableLocationIds.find(locId => locId === item.locationId);

        if (!exactMatch) {
          mismatches.push({
            itemLocation: item.locationId,
            availableLocations: availableLocationIds
          });
        }
      });

      return mismatches;
    } catch (error) {
      console.error('Error debugging location mismatches:', error);
      throw error;
    }
  }

  // Migration function to convert string-based location names to IDs
  static async migrateLocationNamesToIds(userId: string): Promise<number> {
    try {
      const [items, locations] = await Promise.all([
        FoodItemsService.getUserItems(userId),
        LocationsService.getUserLocations(userId)
      ]);

      let migratedCount = 0;
      const batch = writeBatch(db);

      for (const item of items) {
        // Check if item is still using string-based location (legacy data)
        const isLegacyLocation = !locations.find(loc => loc.id === item.locationId);
        
        if (isLegacyLocation) {
          // Find location by name (case-insensitive)
          const matchingLocation = locations.find(loc => 
            loc.name.toLowerCase().trim() === item.locationId.toLowerCase().trim()
          );

          if (matchingLocation && item.id) {
            const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, item.id);
            batch.update(docRef, { 
              locationId: matchingLocation.id!,
              updatedAt: serverTimestamp() 
            });
            migratedCount++;
          }
        }
      }

      if (migratedCount > 0) {
        await batch.commit();
      }

      return migratedCount;
    } catch (error) {
      console.error('Error migrating location names to IDs:', error);
      throw error;
    }
  }

  // Similar migration function for categories
  static async migrateCategoryNamesToIds(userId: string): Promise<number> {
    try {
      const [items, categories] = await Promise.all([
        FoodItemsService.getUserItems(userId),
        CategoriesService.getUserCategories(userId)
      ]);

      let migratedCount = 0;
      const batch = writeBatch(db);

      for (const item of items) {
        // Check if item is still using string-based category (legacy data)
        const isLegacyCategory = !categories.find(cat => cat.id === item.categoryId);
        
        if (isLegacyCategory) {
          // Find category by name (case-insensitive)
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().trim() === item.categoryId.toLowerCase().trim()
          );

          if (matchingCategory && item.id) {
            const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, item.id);
            batch.update(docRef, { 
              categoryId: matchingCategory.id!,
              updatedAt: serverTimestamp() 
            });
            migratedCount++;
          }
        }
      }

      if (migratedCount > 0) {
        await batch.commit();
      }

      return migratedCount;
    } catch (error) {
      console.error('Error migrating category names to IDs:', error);
      throw error;
    }
  }

  // Updated utility function to fix food items with incorrect location references
  static async fixLocationNames(userId: string): Promise<number> {
    // This now calls the migration function
    return await this.migrateLocationNamesToIds(userId);
  }
}

// Helper function to calculate item status and days until expiry
export const calculateItemStatus = (expiryDate: string): { status: 'fresh' | 'expiring-soon' | 'expired', daysUntilExpiry: number } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysUntilExpiry: diffDays };
  } else if (diffDays <= 3) {
    return { status: 'expiring-soon', daysUntilExpiry: diffDays };
  } else {
    return { status: 'fresh', daysUntilExpiry: diffDays };
  }
};

// Utility function to initialize default data for new users
export const initializeUserData = async (userId: string, language: string = 'en'): Promise<void> => {
  try {
    // Check if user already has data
    const [categories, locations] = await Promise.all([
      CategoriesService.getUserCategories(userId),
      LocationsService.getUserLocations(userId)
    ]);

    // Create default data if user has none
    if (categories.length === 0) {
      await CategoriesService.createDefaultCategories(userId, language);
    }
    
    if (locations.length === 0) {
      await LocationsService.createDefaultLocations(userId, language);
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};

// Utility function to clean up data inconsistencies
export const cleanupUserData = async (userId: string): Promise<{ duplicatesRemoved: number, orphansFixed: number, locationsMigrated: number, categoriesMigrated: number }> => {
  try {
    const items = await FoodItemsService.getUserItems(userId);
    const locations = await LocationsService.getUserLocations(userId);
    const categories = await CategoriesService.getUserCategories(userId);
    
    let duplicatesRemoved = 0;
    let orphansFixed = 0;
    let locationsMigrated = 0;
    let categoriesMigrated = 0;
    
    // Step 1: Migrate any legacy string-based references to IDs
    locationsMigrated = await LocationsService.migrateLocationNamesToIds(userId);
    categoriesMigrated = await LocationsService.migrateCategoryNamesToIds(userId);
    
    // Get fresh data after migration
    const updatedItems = await FoodItemsService.getUserItems(userId);
    
    // Step 2: Find and remove exact duplicates (same name, location, expiry date)
    const seen = new Set<string>();
    const itemsToDelete: string[] = [];
    
    for (const item of updatedItems) {
      const key = `${item.name}-${item.locationId}-${item.expiryDate}`;
      if (seen.has(key)) {
        // This is a duplicate
        if (item.id) {
          itemsToDelete.push(item.id);
          duplicatesRemoved++;
        }
      } else {
        seen.add(key);
      }
    }
    
    // Delete duplicates
    if (itemsToDelete.length > 0) {
      const batch = writeBatch(db);
      itemsToDelete.forEach(itemId => {
        batch.delete(doc(db, COLLECTIONS.FOOD_ITEMS, itemId));
      });
      await batch.commit();
    }
    
    // Step 3: Fix orphaned references (items pointing to non-existent locations/categories)
    const finalItems = await FoodItemsService.getUserItems(userId);
    const orphanBatch = writeBatch(db);
    let orphanCount = 0;
    
    for (const item of finalItems) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Check if location exists
      if (!locations.find(loc => loc.id === item.locationId)) {
        // Assign to first available location or create a default one
        if (locations.length > 0) {
          updates.locationId = locations[0].id!;
          needsUpdate = true;
          orphanCount++;
        }
      }
      
      // Check if category exists
      if (!categories.find(cat => cat.id === item.categoryId)) {
        // Assign to first available category or create a default one
        if (categories.length > 0) {
          updates.categoryId = categories[0].id!;
          needsUpdate = true;
          orphanCount++;
        }
      }
      
      if (needsUpdate && item.id) {
        const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, item.id);
        orphanBatch.update(docRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    if (orphanCount > 0) {
      await orphanBatch.commit();
    }
    
    orphansFixed = orphanCount;
    
    return { duplicatesRemoved, orphansFixed, locationsMigrated, categoriesMigrated };
  } catch (error) {
    console.error('Error cleaning up user data:', error);
    throw error;
  }
}; 