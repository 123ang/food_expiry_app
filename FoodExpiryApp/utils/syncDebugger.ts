import { getDatabase } from '../database/database';
import { supabase } from '../lib/supabase';

/**
 * Debug function to check for food items in the local database
 */
export async function checkLocalFoodItems() {
  try {
    const db = await getDatabase();
    if (!db) {
      console.log('===DEBUG=== Database not available');
      return {
        success: false,
        error: 'Database not available',
        count: 0,
        items: []
      };
    }
    
    const foodItems = await db.getAllAsync('SELECT * FROM food_items');
    console.log(`===DEBUG=== Found ${foodItems.length} items in local database`);
    
    if (foodItems.length > 0) {
      console.log('===DEBUG=== Sample of local items:');
      foodItems.slice(0, 5).forEach((item: any, index: number) => {
        console.log(`Local Item ${index + 1}:`, {
          id: item.id,
          name: item.name,
          group_id: item.group_id,
          category_id: item.category_id,
          location_id: item.location_id,
          expiry_date: item.expiry_date
        });
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
    
    console.log(`===DEBUG=== Found ${foodItems?.length || 0} items in cloud database${groupId ? ` for group ${groupId}` : ''}`);
    
    if (foodItems && foodItems.length > 0) {
      console.log('===DEBUG=== Sample of cloud items:');
      foodItems.slice(0, 5).forEach((item: any, index: number) => {
        console.log(`Cloud Item ${index + 1}:`, {
          id: item.id,
          name: item.name,
          group_id: item.group_id,
          category_id: item.category_id,
          location_id: item.location_id,
          expiry_date: item.expiry_date
        });
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
  console.log('===DEBUG=== Running sync debug check...');
  
  const localResult = await checkLocalFoodItems();
  const cloudResult = await checkCloudFoodItems(groupId);
  
  console.log('===DEBUG=== Sync status summary:');
  console.log(`- Local items: ${localResult.count}`);
  console.log(`- Cloud items: ${cloudResult.count}`);
  
  return {
    local: localResult,
    cloud: cloudResult
  };
}