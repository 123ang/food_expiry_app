import { getDatabase } from '../database/database';
import { supabase } from '../lib/supabase';

/**
 * Debug function to check for food items in the local database
 */
export async function checkLocalFoodItems() {
  try {
    const db = await getDatabase();
    if (!db) {
      return {
        success: false,
        error: 'Database not available',
        count: 0,
        items: []
      };
    }
    
    const foodItems = await db.getAllAsync('SELECT * FROM food_items');
    if (foodItems.length > 0) {
      foodItems.slice(0, 5).forEach((item: any, index: number) => {
      });
    }
    
    return {
      success: true,
      count: foodItems.length,
      items: foodItems
    };
  } catch (error) {
    console.error('===DEBUG=== Error checking local food items:', error);
    return {
      success: false,
      error,
      count: 0,
      items: []
    };
  }
}

/**
 * Debug function to check for food items in the Supabase database
 */
export async function checkCloudFoodItems(groupId?: string) {
  try {
    let query = supabase.from('food_items').select('*');
    
    if (groupId) {
      query = query.eq('group_id', groupId);
    }
    
    const { data: foodItems, error } = await query;
    
    if (error) {
      console.error('===DEBUG=== Error fetching cloud food items:', error);
      return {
        success: false,
        error,
        count: 0,
        items: []
      };
    }
    if (foodItems && foodItems.length > 0) {
      foodItems.slice(0, 5).forEach((item: any, index: number) => {
      });
    }
    
    return {
      success: true,
      count: foodItems?.length || 0,
      items: foodItems || []
    };
  } catch (error) {
    console.error('===DEBUG=== Error checking cloud food items:', error);
    return {
      success: false,
      error,
      count: 0,
      items: []
    };
  }
}

/**
 * Debug function to run a direct debug check of sync status
 */
export async function runSyncDebugCheck(groupId?: string) {
  const localResult = await checkLocalFoodItems();
  const cloudResult = await checkCloudFoodItems(groupId);
  return {
    local: localResult,
    cloud: cloudResult
  };
}