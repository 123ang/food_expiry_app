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
  category: string;
  location: string;
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
  temperature: 'room' | 'refrigerated' | 'frozen';
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
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];

      // Calculate status and days until expiry for each item
      return items.map(item => {
        const { status, daysUntilExpiry } = calculateItemStatus(item.expiryDate);
        return { ...item, status, daysUntilExpiry };
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
        where('userId', '==', userId),
        orderBy('createdAtTimestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
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

  // Create default categories for new users
  static async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Fruits', description: 'Fresh fruits', icon: '🍇', color: '#FF6B6B' },
      { name: 'Vegetables', description: 'Fresh vegetables', icon: '🥕', color: '#4ECDC4' },
      { name: 'Dairy', description: 'Milk, cheese, yogurt', icon: '🥛', color: '#45B7D1' },
      { name: 'Meat', description: 'Meat and poultry', icon: '🥩', color: '#96CEB4' },
      { name: 'Bread', description: 'Bread and bakery items', icon: '🍞', color: '#FECA57' },
      { name: 'Beverages', description: 'Drinks and beverages', icon: '🥤', color: '#FF9FF3' },
      { name: 'Snacks', description: 'Snacks and treats', icon: '🍿', color: '#54A0FF' },
      { name: 'Frozen', description: 'Frozen foods', icon: '🧊', color: '#5F27CD' }
    ];

    try {
      const batch = writeBatch(db);
      defaultCategories.forEach(category => {
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
        where('userId', '==', userId),
        orderBy('createdAtTimestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[];
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

  // Create default locations for new users
  static async createDefaultLocations(userId: string): Promise<void> {
    const defaultLocations = [
      { name: 'Fridge', description: 'Main refrigerator', temperature: 'refrigerated' as const },
      { name: 'Freezer', description: 'Freezer compartment', temperature: 'frozen' as const },
      { name: 'Pantry', description: 'Kitchen pantry', temperature: 'room' as const },
      { name: 'Counter', description: 'Kitchen counter', temperature: 'room' as const },
      { name: 'Cabinet', description: 'Kitchen cabinet', temperature: 'room' as const }
    ];

    try {
      const batch = writeBatch(db);
      defaultLocations.forEach(location => {
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
export const initializeUserData = async (userId: string): Promise<void> => {
  try {
    // Check if user already has data
    const [categories, locations] = await Promise.all([
      CategoriesService.getUserCategories(userId),
      LocationsService.getUserLocations(userId)
    ]);

    // Create default data if user has none
    if (categories.length === 0) {
      await CategoriesService.createDefaultCategories(userId);
    }
    
    if (locations.length === 0) {
      await LocationsService.createDefaultLocations(userId);
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
}; 