import { ShoppingItem, WishItem } from './models';
import { getDatabase, queuedDatabaseOperation } from './database';
import { apiClient } from '../services/ApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentDateTimeISO } from '../utils/dateUtils';

// Helper to check if we're online and authenticated
const canSyncToServer = async (): Promise<boolean> => {
  try {
    const token = await apiClient.getAccessToken();
    return !!token;
  } catch {
    return false;
  }
};

// Shopping List Operations
// Helper function to get Personal group ID (same as in FoodItemRepository)
const getPersonalGroupId = async (): Promise<string | null> => {
  try {
    const personalGroupId = await AsyncStorage.getItem('personal_group_id');
    if (personalGroupId) return personalGroupId;
    
    const storedGroups = await AsyncStorage.getItem('user_groups');
    if (storedGroups) {
      try {
        const groups = JSON.parse(storedGroups);
        const personalGroup = Array.isArray(groups) 
          ? groups.find((g: any) => {
              const name = g.name?.toLowerCase() || g.groups?.name?.toLowerCase();
              return name === 'personal';
            })
          : null;
        
        if (personalGroup?.id) {
          await AsyncStorage.setItem('personal_group_id', personalGroup.id);
          return personalGroup.id;
        }
        if (personalGroup?.groups?.id) {
          await AsyncStorage.setItem('personal_group_id', personalGroup.groups.id);
          return personalGroup.groups.id;
        }
      } catch (parseError) {
        // Invalid JSON, continue
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const addShoppingItem = async (
  item: Omit<ShoppingItem, 'id' | 'created_at'>,
  groupId?: string | null
): Promise<number> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // If groupId is null, default to Personal group ID
    let finalGroupId = groupId;
    if (!finalGroupId) {
      const personalGroupId = await getPersonalGroupId();
      if (personalGroupId) {
        finalGroupId = personalGroupId;
      }
    }

    const now = getCurrentDateTimeISO();
    const quantity = item.quantity ?? 1;

    const result = await db.runAsync(
      `INSERT INTO shopping_items (name, quantity, unit, image_uri, done, group_id, created_at, updated_at, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.name,
        quantity,
        item.unit || null,
        item.image_uri || null,
        item.done ? 1 : 0,
        finalGroupId || null,
        now,
        now,
        'pending'
      ]
    );

    const localId = result.lastInsertRowId;

    // Try to sync to PostgreSQL immediately if we have a group ID and internet
    if (finalGroupId && await canSyncToServer()) {
      try {
        const response = await apiClient.post<{ item: any }>('/shopping-items', {
          group_id: finalGroupId,
          name: item.name,
          quantity: quantity,
          unit: item.unit,
          notes: item.image_uri, // Store image_uri in notes for now
        });

        if (response.data?.item?.id) {
          // Update local record with cloud_id and sync status
          await db.runAsync(
            'UPDATE shopping_items SET cloud_id = ?, sync_status = ? WHERE id = ?',
            [response.data.item.id, 'synced', localId]
          );
        }
      } catch (error) {
        // Keep sync_status as 'pending' for retry later
      }
    }

    return localId;
  }, 'addShoppingItem');
};

export const updateShoppingItem = async (item: ShoppingItem): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const now = getCurrentDateTimeISO();

    await db.runAsync(
      `UPDATE shopping_items 
       SET name = ?, quantity = ?, unit = ?, image_uri = ?, done = ?, updated_at = ?, sync_status = ? 
       WHERE id = ?`,
      [
        item.name,
        item.quantity ?? 1,
        item.unit || null,
        item.image_uri || null,
        item.done ? 1 : 0,
        now,
        'pending',
        item.id
      ]
    );

    // Try to sync to PostgreSQL if we have a valid cloud_id and internet
    if (item.cloud_id && isValidUUID(item.cloud_id) && await canSyncToServer()) {
      try {
        const response = await apiClient.patch(`/shopping-items/${item.cloud_id}`, {
          name: item.name,
          quantity: item.quantity ?? 1,
          unit: item.unit,
          is_purchased: item.done,
          notes: item.image_uri,
        });

        if (response.error) {
          // Keep sync_status as 'pending' for retry later
        } else {
          await db.runAsync(
            'UPDATE shopping_items SET sync_status = ? WHERE id = ?',
            ['synced', item.id]
          );
        }
      } catch (error) {
        // Keep sync_status as 'pending' for retry later
      }
    }
  }, 'updateShoppingItem');
};

export const deleteShoppingItem = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // Get the cloud_id before deleting
    const item = await db.getFirstAsync('SELECT cloud_id FROM shopping_items WHERE id = ?', [id]) as any;

    await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [id]);

    // Try to delete from PostgreSQL if we have a valid cloud_id and internet
    if (item?.cloud_id && isValidUUID(item.cloud_id) && await canSyncToServer()) {
      try {
        const response = await apiClient.delete(`/shopping-items/${item.cloud_id}`);
        if (response.error) {
          // Failed to delete from PostgreSQL - item already deleted locally, can't retry
        }
      } catch (error) {
        // Failed to delete shopping item from PostgreSQL - item already deleted locally, can't retry
      }
    }
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
      quantity: item.quantity ?? 1,
      done: Boolean(item.done),
      image_uri: item.image_uri || undefined
    }));
  }, 'getShoppingItems');
};

export const getShoppingItemsByGroup = async (groupId: string, includeCompleted: boolean = false): Promise<ShoppingItem[]> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const query = includeCompleted 
      ? 'SELECT * FROM shopping_items WHERE group_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM shopping_items WHERE group_id = ? AND done = 0 ORDER BY created_at DESC';

    const items = await db.getAllAsync(query, [groupId]);
    return items.map((item: any) => ({
      ...item,
      quantity: item.quantity ?? 1,
      done: Boolean(item.done),
      image_uri: item.image_uri || undefined
    }));
  }, 'getShoppingItemsByGroup');
};

export const toggleShoppingItemDone = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('UPDATE shopping_items SET done = NOT done, updated_at = ?, sync_status = ? WHERE id = ?', 
      [getCurrentDateTimeISO(), 'pending', id]);

    // Get item to sync
    const item = await db.getFirstAsync('SELECT * FROM shopping_items WHERE id = ?', [id]) as any;
    
    if (item?.cloud_id && await canSyncToServer()) {
      try {
        await apiClient.post(`/shopping-items/${item.cloud_id}/toggle`);
        await db.runAsync('UPDATE shopping_items SET sync_status = ? WHERE id = ?', ['synced', id]);
      } catch (error) {
        // Failed to sync shopping item toggle
      }
    }
  }, 'toggleShoppingItemDone');
};

// Wish List Operations
export const addWishItem = async (
  item: Omit<WishItem, 'id' | 'created_at'>,
  groupId?: string | null
): Promise<number> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // If groupId is null, default to Personal group ID
    let finalGroupId = groupId;
    if (!finalGroupId) {
      const personalGroupId = await getPersonalGroupId();
      if (personalGroupId) {
        finalGroupId = personalGroupId;
      }
    }

    const now = getCurrentDateTimeISO();

    const result = await db.runAsync(
      `INSERT INTO wish_items (name, notes, price, rating, image_uri, done, group_id, created_at, updated_at, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.name,
        item.notes || null,
        item.price || null,
        item.rating || null,
        item.image_uri || null,
        item.done ? 1 : 0,
        finalGroupId || null,
        now,
        now,
        'pending'
      ]
    );

    const localId = result.lastInsertRowId;

    // Try to sync to PostgreSQL immediately if we have a group ID and internet
    if (finalGroupId && await canSyncToServer()) {
      try {
        const response = await apiClient.post<{ item: any }>('/wish-items', {
          group_id: finalGroupId,
          name: item.name,
          notes: item.notes,
          price: item.price ? parseFloat(item.price) : undefined,
          rating: item.rating,
          image_url: item.image_uri,
        });

        if (response.data?.item?.id) {
          await db.runAsync(
            'UPDATE wish_items SET cloud_id = ?, sync_status = ? WHERE id = ?',
            [response.data.item.id, 'synced', localId]
          );
        }
      } catch (error) {
        // Failed to sync wish item to PostgreSQL - will retry later
      }
    }

    return localId;
  }, 'addWishItem');
};

export const updateWishItem = async (item: WishItem): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const now = getCurrentDateTimeISO();

    await db.runAsync(
      `UPDATE wish_items 
       SET name = ?, notes = ?, price = ?, rating = ?, image_uri = ?, done = ?, updated_at = ?, sync_status = ? 
       WHERE id = ?`,
      [
        item.name,
        item.notes || null,
        item.price || null,
        item.rating || null,
        item.image_uri || null,
        item.done ? 1 : 0,
        now,
        'pending',
        item.id
      ]
    );

    // Try to sync to PostgreSQL if we have a valid cloud_id and internet
    if (item.cloud_id && isValidUUID(item.cloud_id) && await canSyncToServer()) {
      try {
        const response = await apiClient.patch(`/wish-items/${item.cloud_id}`, {
          name: item.name,
          notes: item.notes,
          price: item.price ? parseFloat(item.price) : undefined,
          rating: item.rating,
          image_url: item.image_uri,
        });

        if (response.error) {
          // Keep sync_status as 'pending' for retry later
        } else {
          await db.runAsync(
            'UPDATE wish_items SET sync_status = ? WHERE id = ?',
            ['synced', item.id]
          );
        }
      } catch (error) {
        // Keep sync_status as 'pending' for retry later
      }
    }
  }, 'updateWishItem');
};

export const deleteWishItem = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // Get the cloud_id before deleting
    const item = await db.getFirstAsync('SELECT cloud_id FROM wish_items WHERE id = ?', [id]) as any;

    await db.runAsync('DELETE FROM wish_items WHERE id = ?', [id]);

    // Try to delete from PostgreSQL if we have a valid cloud_id and internet
    if (item?.cloud_id && isValidUUID(item.cloud_id) && await canSyncToServer()) {
      try {
        const response = await apiClient.delete(`/wish-items/${item.cloud_id}`);
        if (response.error) {
          // Failed to delete from PostgreSQL - item already deleted locally, can't retry
        }
      } catch (error) {
        // Failed to delete wish item from PostgreSQL - item already deleted locally, can't retry
      }
    }
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

export const getWishItemsByGroup = async (groupId: string, includeCompleted: boolean = false): Promise<WishItem[]> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const query = includeCompleted 
      ? 'SELECT * FROM wish_items WHERE group_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM wish_items WHERE group_id = ? AND done = 0 ORDER BY created_at DESC';

    const items = await db.getAllAsync(query, [groupId]);
    return items.map((item: any) => ({
      ...item,
      done: Boolean(item.done),
      notes: item.notes || undefined,
      price: item.price || undefined,
      rating: item.rating || undefined,
      image_uri: item.image_uri || undefined
    }));
  }, 'getWishItemsByGroup');
};

export const toggleWishItemDone = async (id: number): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('UPDATE wish_items SET done = NOT done, updated_at = ?, sync_status = ? WHERE id = ?',
      [getCurrentDateTimeISO(), 'pending', id]);

    // Get item to sync
    const item = await db.getFirstAsync('SELECT * FROM wish_items WHERE id = ?', [id]) as any;
    
    if (item?.cloud_id && isValidUUID(item.cloud_id) && await canSyncToServer()) {
      try {
        const response = await apiClient.post(`/wish-items/${item.cloud_id}/toggle`);
        if (response.error) {
          // Keep sync_status as 'pending' for retry later
        } else {
          await db.runAsync('UPDATE wish_items SET sync_status = ? WHERE id = ?', ['synced', id]);
        }
      } catch (error) {
        // Keep sync_status as 'pending' for retry later
      }
    }
  }, 'toggleWishItemDone');
};

// Batch operations
export const clearCompletedShoppingItems = async (groupId?: string): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // Get all completed items to delete from server
    const query = groupId 
      ? 'SELECT cloud_id FROM shopping_items WHERE done = 1 AND group_id = ?'
      : 'SELECT cloud_id FROM shopping_items WHERE done = 1';
    const items = await db.getAllAsync(query, groupId ? [groupId] : []) as any[];

    // Delete locally
    if (groupId) {
      await db.runAsync('DELETE FROM shopping_items WHERE done = 1 AND group_id = ?', [groupId]);
    } else {
      await db.runAsync('DELETE FROM shopping_items WHERE done = 1');
    }

    // Try to delete from PostgreSQL
    if (await canSyncToServer() && groupId) {
      try {
        await apiClient.post('/shopping-items/clear-purchased', { group_id: groupId });
      } catch (error) {
        // Failed to clear purchased items from PostgreSQL
      }
    }
  }, 'clearCompletedShoppingItems');
};

export const clearCompletedWishItems = async (groupId?: string): Promise<void> => {
  return queuedDatabaseOperation(async () => {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    if (groupId) {
      await db.runAsync('DELETE FROM wish_items WHERE done = 1 AND group_id = ?', [groupId]);
    } else {
      await db.runAsync('DELETE FROM wish_items WHERE done = 1');
    }
  }, 'clearCompletedWishItems');
};

// Helper to check if a string is a valid UUID (PostgreSQL format)
const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Sync pending items to PostgreSQL (called from SyncButton or on app start)
export const syncPendingShoppingItems = async (groupId: string): Promise<{ synced: number; failed: number }> => {
  let synced = 0;
  let failed = 0;

  try {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // First, get ALL shopping items to debug
    const allShoppingItems = await db.getAllAsync("SELECT * FROM shopping_items") as any[];
    console.log(`[SYNC DEBUG] All shopping items in local DB:`, JSON.stringify(allShoppingItems.map(item => ({
      id: item.id,
      name: item.name,
      group_id: item.group_id,
      sync_status: item.sync_status,
      cloud_id: item.cloud_id
    })), null, 2));
    console.log(`[SYNC DEBUG] Syncing with group_id:`, groupId);

    // Fix items with string group_id values (like "personal") to use UUID
    const groupNameToUuid = new Map<string, string>();
    try {
      const groupsResponse = await apiClient.get<{ groups: any[] }>('/groups');
      if (groupsResponse.data?.groups) {
        for (const group of groupsResponse.data.groups) {
          groupNameToUuid.set(group.name.toLowerCase(), group.id);
        }
      }
    } catch (err) {
      // Couldn't fetch groups, continue anyway
    }

    // Fix string group_id values
    for (const item of allShoppingItems) {
      if (item.group_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.group_id)) {
        const groupName = item.group_id.toLowerCase();
        const correctUuid = groupNameToUuid.get(groupName);
        if (correctUuid) {
          await db.runAsync('UPDATE shopping_items SET group_id = ? WHERE id = ?', [correctUuid, item.id]);
          item.group_id = correctUuid; // Update in memory too
        }
      }
    }

    // Query for pending items - include items with NULL group_id if groupId matches Personal
    let pendingItems: any[];
    const personalGroupId = await getPersonalGroupId();
    if (personalGroupId && groupId === personalGroupId) {
      // Include items with NULL group_id when syncing Personal group
      pendingItems = await db.getAllAsync(
        "SELECT * FROM shopping_items WHERE sync_status = 'pending' AND (group_id = ? OR group_id IS NULL)",
        [groupId]
      ) as any[];
      // Update NULL group_id items to use the correct group_id
      for (const item of pendingItems) {
        if (!item.group_id) {
          await db.runAsync('UPDATE shopping_items SET group_id = ? WHERE id = ?', [groupId, item.id]);
          item.group_id = groupId; // Update in memory too
        }
      }
    } else {
      pendingItems = await db.getAllAsync(
        "SELECT * FROM shopping_items WHERE sync_status = 'pending' AND group_id = ?",
        [groupId]
      ) as any[];
    }

    console.log(`[SYNC DEBUG] Found ${pendingItems.length} pending shopping items for group ${groupId}:`, JSON.stringify(pendingItems.map(item => ({
      id: item.id,
      name: item.name,
      group_id: item.group_id,
      sync_status: item.sync_status
    })), null, 2));

    for (const item of pendingItems) {
      try {
        // If cloud_id exists and is valid UUID, try to update existing item
        // If update fails (item not found), fall back to creating new item
        if (item.cloud_id && isValidUUID(item.cloud_id)) {
          // Try to update existing item
          const response = await apiClient.patch(`/shopping-items/${item.cloud_id}`, {
            name: item.name,
            quantity: item.quantity ?? 1,
            unit: item.unit,
            is_purchased: Boolean(item.done),
          });

          if (response.error) {
            // If item not found on server, clear cloud_id and create new item
            if (response.error.includes('not found') || response.error.includes('Not found')) {
              await db.runAsync('UPDATE shopping_items SET cloud_id = NULL WHERE id = ?', [item.id]);
              item.cloud_id = null; // Update in memory too
              // Fall through to create new item
            } else {
              throw new Error(response.error);
            }
          } else {
            // Update successful
            await db.runAsync('UPDATE shopping_items SET sync_status = ? WHERE id = ?', ['synced', item.id]);
            synced++;
            console.log(`[SYNC DEBUG] Successfully synced shopping item "${item.name}" (id: ${item.id})`);
            continue; // Skip to next item
          }
        }
        
        // Create new item (no cloud_id, invalid cloud_id, or update failed)
        if (!item.cloud_id || !isValidUUID(item.cloud_id)) {
          // Clear invalid cloud_id before creating
          if (item.cloud_id && !isValidUUID(item.cloud_id)) {
            await db.runAsync('UPDATE shopping_items SET cloud_id = NULL WHERE id = ?', [item.id]);
          }

          const response = await apiClient.post<{ item: any }>('/shopping-items', {
            group_id: groupId,
            name: item.name,
            quantity: item.quantity ?? 1,
            unit: item.unit,
            notes: item.image_uri,
          });

          if (response.error) {
            throw new Error(response.error);
          }

          if (response.data?.item?.id) {
            await db.runAsync(
              'UPDATE shopping_items SET cloud_id = ?, sync_status = ? WHERE id = ?',
              [response.data.item.id, 'synced', item.id]
            );
            synced++;
            console.log(`[SYNC DEBUG] Successfully synced shopping item "${item.name}" (id: ${item.id})`);
          } else {
            throw new Error('No item ID in response');
          }
        }
        console.log(`[SYNC DEBUG] Successfully synced shopping item "${item.name}" (id: ${item.id})`);
      } catch (error: any) {
        failed++;
        console.log(`[SYNC DEBUG] Failed to sync shopping item "${item.name}" (id: ${item.id}):`, error?.message || error);
      }
    }
    console.log(`[SYNC DEBUG] Shopping items sync complete: ${synced} synced, ${failed} failed`);
  } catch (error: any) {
    console.log(`[SYNC DEBUG] Error syncing pending shopping items:`, error?.message || error);
  }

  return { synced, failed };
};

export const syncPendingWishItems = async (groupId: string): Promise<{ synced: number; failed: number }> => {
  let synced = 0;
  let failed = 0;

  try {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    // First, get ALL wish items to debug
    const allWishItems = await db.getAllAsync("SELECT * FROM wish_items") as any[];
    console.log(`[SYNC DEBUG] All wish items in local DB:`, JSON.stringify(allWishItems.map(item => ({
      id: item.id,
      name: item.name,
      group_id: item.group_id,
      sync_status: item.sync_status,
      cloud_id: item.cloud_id
    })), null, 2));
    console.log(`[SYNC DEBUG] Syncing with group_id:`, groupId);

    // Fix items with string group_id values (like "personal") to use UUID
    const groupNameToUuid = new Map<string, string>();
    try {
      const groupsResponse = await apiClient.get<{ groups: any[] }>('/groups');
      if (groupsResponse.data?.groups) {
        for (const group of groupsResponse.data.groups) {
          groupNameToUuid.set(group.name.toLowerCase(), group.id);
        }
      }
    } catch (err) {
      // Couldn't fetch groups, continue anyway
    }

    // Fix string group_id values
    for (const item of allWishItems) {
      if (item.group_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.group_id)) {
        const groupName = item.group_id.toLowerCase();
        const correctUuid = groupNameToUuid.get(groupName);
        if (correctUuid) {
          await db.runAsync('UPDATE wish_items SET group_id = ? WHERE id = ?', [correctUuid, item.id]);
          item.group_id = correctUuid; // Update in memory too
        }
      }
    }

    // Query for pending items - include items with NULL group_id if groupId matches Personal
    let pendingItems: any[];
    const personalGroupId = await getPersonalGroupId();
    if (personalGroupId && groupId === personalGroupId) {
      // Include items with NULL group_id when syncing Personal group
      pendingItems = await db.getAllAsync(
        "SELECT * FROM wish_items WHERE sync_status = 'pending' AND (group_id = ? OR group_id IS NULL)",
        [groupId]
      ) as any[];
      // Update NULL group_id items to use the correct group_id
      for (const item of pendingItems) {
        if (!item.group_id) {
          await db.runAsync('UPDATE wish_items SET group_id = ? WHERE id = ?', [groupId, item.id]);
          item.group_id = groupId; // Update in memory too
        }
      }
    } else {
      pendingItems = await db.getAllAsync(
        "SELECT * FROM wish_items WHERE sync_status = 'pending' AND group_id = ?",
        [groupId]
      ) as any[];
    }

    console.log(`[SYNC DEBUG] Found ${pendingItems.length} pending wish items for group ${groupId}:`, JSON.stringify(pendingItems.map(item => ({
      id: item.id,
      name: item.name,
      group_id: item.group_id,
      sync_status: item.sync_status
    })), null, 2));

    for (const item of pendingItems) {
      try {
        // If cloud_id exists and is valid UUID, try to update existing item
        // If update fails (item not found), fall back to creating new item
        if (item.cloud_id && isValidUUID(item.cloud_id)) {
          // Try to update existing item
          const response = await apiClient.patch(`/wish-items/${item.cloud_id}`, {
            name: item.name,
            notes: item.notes,
            price: item.price ? parseFloat(item.price) : undefined,
            rating: item.rating,
            image_url: item.image_uri,
          });

          if (response.error) {
            // If item not found on server, clear cloud_id and create new item
            if (response.error.includes('not found') || response.error.includes('Not found')) {
              await db.runAsync('UPDATE wish_items SET cloud_id = NULL WHERE id = ?', [item.id]);
              item.cloud_id = null; // Update in memory too
              // Fall through to create new item
            } else {
              throw new Error(response.error);
            }
          } else {
            // Update successful
            await db.runAsync('UPDATE wish_items SET sync_status = ? WHERE id = ?', ['synced', item.id]);
            synced++;
            console.log(`[SYNC DEBUG] Successfully synced wish item "${item.name}" (id: ${item.id})`);
            continue; // Skip to next item
          }
        }
        
        // Create new item (no cloud_id, invalid cloud_id, or update failed)
        if (!item.cloud_id || !isValidUUID(item.cloud_id)) {
          // Create new item (no cloud_id or invalid cloud_id)
          // Clear invalid cloud_id before creating
          if (item.cloud_id && !isValidUUID(item.cloud_id)) {
            await db.runAsync('UPDATE wish_items SET cloud_id = NULL WHERE id = ?', [item.id]);
          }

          const response = await apiClient.post<{ item: any }>('/wish-items', {
            group_id: groupId,
            name: item.name,
            notes: item.notes,
            price: item.price ? parseFloat(item.price) : undefined,
            rating: item.rating,
            image_url: item.image_uri,
          });

          if (response.error) {
            throw new Error(response.error);
          }

          if (response.data?.item?.id) {
            await db.runAsync(
              'UPDATE wish_items SET cloud_id = ?, sync_status = ? WHERE id = ?',
              [response.data.item.id, 'synced', item.id]
            );
            synced++;
            console.log(`[SYNC DEBUG] Successfully synced wish item "${item.name}" (id: ${item.id})`);
          } else {
            throw new Error('No item ID in response');
          }
        }
        console.log(`[SYNC DEBUG] Successfully synced wish item "${item.name}" (id: ${item.id})`);
      } catch (error: any) {
        failed++;
        console.log(`[SYNC DEBUG] Failed to sync wish item "${item.name}" (id: ${item.id}):`, error?.message || error);
      }
    }
    console.log(`[SYNC DEBUG] Wish items sync complete: ${synced} synced, ${failed} failed`);
  } catch (error: any) {
    console.log(`[SYNC DEBUG] Error syncing pending wish items:`, error?.message || error);
  }

  return { synced, failed };
};

// Pull items from PostgreSQL and merge with local
export const pullShoppingItemsFromServer = async (groupId: string): Promise<number> => {
  try {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const response = await apiClient.get<{ items: any[] }>(`/shopping-items?group_id=${groupId}&include_purchased=true`);
    
    if (!response.data?.items) return 0;

    let imported = 0;
    for (const serverItem of response.data.items) {
      // Check if we already have this item locally
      const existing = await db.getFirstAsync(
        'SELECT id FROM shopping_items WHERE cloud_id = ?',
        [serverItem.id]
      );

      if (!existing) {
        // Insert new item from server
        await db.runAsync(
          `INSERT INTO shopping_items (name, quantity, unit, image_uri, done, group_id, cloud_id, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            serverItem.name,
            serverItem.quantity ?? 1,
            serverItem.unit || null,
            serverItem.image_url || null,
            serverItem.is_purchased ? 1 : 0,
            groupId,
            serverItem.id,
            serverItem.created_at,
            serverItem.updated_at,
            'synced'
          ]
        );
        imported++;
      }
    }

    return imported;
  } catch (error) {
    return 0;
  }
};

export const pullWishItemsFromServer = async (groupId: string): Promise<number> => {
  try {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const response = await apiClient.get<{ items: any[] }>(`/wish-items?group_id=${groupId}`);
    
    if (!response.data?.items) return 0;

    let imported = 0;
    for (const serverItem of response.data.items) {
      // Check if we already have this item locally
      const existing = await db.getFirstAsync(
        'SELECT id FROM wish_items WHERE cloud_id = ?',
        [serverItem.id]
      );

      if (!existing) {
        // Insert new item from server
        await db.runAsync(
          `INSERT INTO wish_items (name, notes, price, rating, image_uri, done, group_id, cloud_id, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            serverItem.name,
            serverItem.notes || null,
            serverItem.price?.toString() || null,
            serverItem.rating || null,
            serverItem.image_url || null,
            0,
            groupId,
            serverItem.id,
            serverItem.created_at,
            serverItem.updated_at,
            'synced'
          ]
        );
        imported++;
      }
    }

    return imported;
  } catch (error) {
    return 0;
  }
};
