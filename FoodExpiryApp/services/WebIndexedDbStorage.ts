import { Platform } from 'react-native';

export type WebFallbackData = {
  categories: any[];
  locations: any[];
  foodItems: any[];
  shoppingItems: any[];
  wishItems: any[];
};

const DB_NAME = 'expiry_alert_web_local_store';
const STORE_NAME = 'local_data';
const FALLBACK_DATA_KEY = 'fallback_data';

const emptyData = (): WebFallbackData => ({
  categories: [],
  locations: [],
  foodItems: [],
  shoppingItems: [],
  wishItems: [],
});

class WebIndexedDbStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isAvailable(): boolean {
    return Platform.OS === 'web' && typeof indexedDB !== 'undefined';
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (!this.isAvailable()) {
      return Promise.reject(new Error('IndexedDB is not available on this platform.'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open IndexedDB.'));
    });

    return this.dbPromise;
  }

  private async getValue<T>(key: string): Promise<T | null> {
    const database = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error || new Error(`Could not read ${key}.`));
    });
  }

  private async setValue<T>(key: string, value: T): Promise<void> {
    const database = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error(`Could not write ${key}.`));
    });
  }

  private async removeValue(key: string): Promise<void> {
    const database = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error(`Could not remove ${key}.`));
    });
  }

  async readFallbackData(): Promise<WebFallbackData> {
    if (!this.isAvailable()) {
      return emptyData();
    }

    const data = await this.getValue<Partial<WebFallbackData>>(FALLBACK_DATA_KEY);

    return {
      ...emptyData(),
      ...(data || {}),
    };
  }

  async writeFallbackData(data: Partial<WebFallbackData>): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    await this.setValue(FALLBACK_DATA_KEY, {
      ...emptyData(),
      ...data,
    });
  }

  async clearFallbackData(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    await this.removeValue(FALLBACK_DATA_KEY);
  }

  async exportFallbackData(): Promise<WebFallbackData> {
    return this.readFallbackData();
  }

  async importFallbackData(data: Partial<WebFallbackData>): Promise<void> {
    const existing = await this.readFallbackData();
    await this.writeFallbackData({
      categories: data.categories || existing.categories,
      locations: data.locations || existing.locations,
      foodItems: data.foodItems || existing.foodItems,
      shoppingItems: data.shoppingItems || existing.shoppingItems,
      wishItems: data.wishItems || existing.wishItems,
    });
  }
}

export const webIndexedDbStorage = new WebIndexedDbStorage();
