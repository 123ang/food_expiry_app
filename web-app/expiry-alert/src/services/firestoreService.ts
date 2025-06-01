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
  DocumentData
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
}

export interface Category {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  userId: string;
  createdAt: string;
}

export interface Location {
  id?: string;
  name: string;
  description: string;
  temperature: 'room' | 'refrigerated' | 'frozen';
  userId: string;
  createdAt: string;
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
        createdAt: serverTimestamp()
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
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];
    } catch (error) {
      console.error('Error getting user items:', error);
      throw error;
    }
  }

  static async getItem(id: string): Promise<FoodItem | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.FOOD_ITEMS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FoodItem;
      }
      return null;
    } catch (error) {
      console.error('Error getting food item:', error);
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
      callback(items);
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
}

// Helper function to calculate item status and days until expiry
export const calculateItemStatus = (expiryDate: string): { status: 'fresh' | 'expiring-soon' | 'expired', daysUntilExpiry: number } => {
  const today = new Date();
  const expiry = new Date(expiryDate);
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