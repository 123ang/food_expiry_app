import { ShoppingItem, WishItem } from './models';
import { getDatabase, queuedDatabaseOperation } from './database';

// Shopping List Operations
export const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'created_at'>): Promise<number> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const result = await db.runAsync(
      'INSERT INTO shopping_items (name, image_uri, done) VALUES (?, ?, ?)',
      [item.name, item.image_uri || null, item.done ? 1 : 0]
    );

    return result.lastInsertRowId;
  }, 'addShoppingItem');
};

export const updateShoppingItem = async (item: ShoppingItem): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync(
      'UPDATE shopping_items SET name = ?, image_uri = ?, done = ? WHERE id = ?',
      [item.name, item.image_uri || null, item.done ? 1 : 0, item.id]
    );
  }, 'updateShoppingItem');
};

export const deleteShoppingItem = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [id]);
  }, 'deleteShoppingItem');
};

export const getShoppingItems = async (includeCompleted: boolean = false): Promise<ShoppingItem[]> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const query = includeCompleted 
      ? 'SELECT * FROM shopping_items ORDER BY created_at DESC'
      : 'SELECT * FROM shopping_items WHERE done = 0 ORDER BY created_at DESC';

    const items = await db.getAllAsync(query);
    return items.map((item: any) => ({
      ...item,
      done: Boolean(item.done),
      image_uri: item.image_uri || undefined
    }));
  }, 'getShoppingItems');
};

export const toggleShoppingItemDone = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('UPDATE shopping_items SET done = NOT done WHERE id = ?', [id]);
  }, 'toggleShoppingItemDone');
};

// Wish List Operations
export const addWishItem = async (item: Omit<WishItem, 'id' | 'created_at'>): Promise<number> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const result = await db.runAsync(
      'INSERT INTO wish_items (name, notes, price, rating, image_uri, done) VALUES (?, ?, ?, ?, ?, ?)',
      [
        item.name,
        item.notes || null,
        item.price || null,
        item.rating || null,
        item.image_uri || null,
        item.done ? 1 : 0
      ]
    );

    return result.lastInsertRowId;
  }, 'addWishItem');
};

export const updateWishItem = async (item: WishItem): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync(
      'UPDATE wish_items SET name = ?, notes = ?, price = ?, rating = ?, image_uri = ?, done = ? WHERE id = ?',
      [
        item.name,
        item.notes || null,
        item.price || null,
        item.rating || null,
        item.image_uri || null,
        item.done ? 1 : 0,
        item.id
      ]
    );
  }, 'updateWishItem');
};

export const deleteWishItem = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('DELETE FROM wish_items WHERE id = ?', [id]);
  }, 'deleteWishItem');
};

export const getWishItems = async (includeCompleted: boolean = false): Promise<WishItem[]> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const query = includeCompleted 
      ? 'SELECT * FROM wish_items ORDER BY created_at DESC'
      : 'SELECT * FROM wish_items WHERE done = 0 ORDER BY created_at DESC';

    const items = await db.getAllAsync(query);
    return items.map((item: any) => ({
      ...item,
      done: Boolean(item.done),
      notes: item.notes || undefined,
      price: item.price || undefined,
      rating: item.rating || undefined,
      image_uri: item.image_uri || undefined
    }));
  }, 'getWishItems');
};

export const toggleWishItemDone = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('UPDATE wish_items SET done = NOT done WHERE id = ?', [id]);
  }, 'toggleWishItemDone');
};

// Batch operations
export const clearCompletedShoppingItems = async (): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('DELETE FROM shopping_items WHERE done = 1');
  }, 'clearCompletedShoppingItems');
};

export const clearCompletedWishItems = async (): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('DELETE FROM wish_items WHERE done = 1');
  }, 'clearCompletedWishItems');
}; 