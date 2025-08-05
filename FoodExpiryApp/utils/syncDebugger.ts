import { supabase } from '../lib/supabase';
import * as SQLite from 'expo-sqlite';
import { openDatabase } from '../database/database';

export interface SyncDebugResult {
  local: {
    categories: any[];
    locations: any[];
    shopping_items: any[];
    wish_lists: any[];
    food_items: any[];
    groups: any[];
    group_members: any[];
  };
  cloud: {
    categories: any[];
    locations: any[];
    shopping_items: any[];
    wish_lists: any[];
    food_items: any[];
    groups: any[];
    group_members: any[];
  };
}

export const debugSync = async (userId: string, groupId: string): Promise<SyncDebugResult> => {
  console.log('SyncDebugger: Starting debug for userId:', userId, 'groupId:', groupId);
  
  const db = await openDatabase();
  const result: SyncDebugResult = {
    local: {
      categories: [],
      locations: [],
      shopping_items: [],
      wish_lists: [],
      food_items: [],
      groups: [],
      group_members: []
    },
    cloud: {
      categories: [],
      locations: [],
      shopping_items: [],
      wish_lists: [],
      food_items: [],
      groups: [],
      group_members: []
    }
  };

  // Get local data
  try {
    result.local.categories = await queryDatabase(db, 'SELECT * FROM categories');
    result.local.locations = await queryDatabase(db, 'SELECT * FROM locations');
    result.local.shopping_items = await queryDatabase(db, 'SELECT * FROM shopping_items');
    result.local.wish_lists = await queryDatabase(db, 'SELECT * FROM wish_lists');
    result.local.food_items = await queryDatabase(db, 'SELECT * FROM food_items');
    result.local.groups = await queryDatabase(db, 'SELECT * FROM groups');
    result.local.group_members = await queryDatabase(db, 'SELECT * FROM group_members');
    
    console.log('SyncDebugger: Local data fetched');
  } catch (error) {
    console.error('SyncDebugger: Error fetching local data:', error);
  }

  // Get cloud data
  if (userId && groupId) {
    try {
      // Get categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('group_id', groupId);
      
      if (categoriesError) throw categoriesError;
      result.cloud.categories = categories || [];

      // Get locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('group_id', groupId);
      
      if (locationsError) throw locationsError;
      result.cloud.locations = locations || [];

      // Get shopping items
      const { data: shoppingItems, error: shoppingItemsError } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('group_id', groupId);
      
      if (shoppingItemsError) throw shoppingItemsError;
      result.cloud.shopping_items = shoppingItems || [];

      // Get wish list items
      const { data: wishLists, error: wishListsError } = await supabase
        .from('wish_lists')
        .select('*')
        .eq('group_id', groupId);
      
      if (wishListsError) throw wishListsError;
      result.cloud.wish_lists = wishLists || [];

      // Get food items
      const { data: foodItems, error: foodItemsError } = await supabase
        .from('food_items')
        .select('*')
        .eq('group_id', groupId);
      
      if (foodItemsError) throw foodItemsError;
      result.cloud.food_items = foodItems || [];

      // Get groups
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId);
      
      if (groupsError) throw groupsError;
      result.cloud.groups = groups || [];

      // Get group members
      const { data: groupMembers, error: groupMembersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);
      
      if (groupMembersError) throw groupMembersError;
      result.cloud.group_members = groupMembers || [];
      
      console.log('SyncDebugger: Cloud data fetched');
    } catch (error) {
      console.error('SyncDebugger: Error fetching cloud data:', error);
    }
  } else {
    console.warn('SyncDebugger: Missing userId or groupId, cannot fetch cloud data');
  }

  // Log summary
  console.log('SyncDebugger: Summary');
  console.log('Local categories:', result.local.categories.length);
  console.log('Cloud categories:', result.cloud.categories.length);
  console.log('Local locations:', result.local.locations.length);
  console.log('Cloud locations:', result.cloud.locations.length);
  console.log('Local food items:', result.local.food_items.length);
  console.log('Cloud food items:', result.cloud.food_items.length);
  console.log('Local shopping items:', result.local.shopping_items.length);
  console.log('Cloud shopping items:', result.cloud.shopping_items.length);
  console.log('Local wish lists:', result.local.wish_lists.length);
  console.log('Cloud wish lists:', result.cloud.wish_lists.length);

  return result;
};

const queryDatabase = (db: SQLite.SQLiteDatabase, query: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const items: any[] = [];
          for (let i = 0; i < rows.length; i++) {
            items.push(rows.item(i));
          }
          resolve(items);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};