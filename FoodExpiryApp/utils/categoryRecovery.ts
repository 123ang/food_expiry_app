import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabaseSafely } from '../database/database';

export interface CategoryBackup {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
  isUserCreated?: boolean;
}

export interface LocationBackup {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
  isUserCreated?: boolean;
}

// Emergency function to restore categories if they become "No Category" with apple icons
export const emergencyRestoreCategories = async (): Promise<boolean> => {
  try {
    console.log('🚨 Emergency category restoration initiated...');
    
    const database = await getDatabaseSafely();
    if (!database) {
      console.error('Database not available for emergency restoration');
      return false;
    }
    
    // Check for backed up categories
    const backupSources = [
      'preserved_categories',
      'categories_backup', 
      'database_backup'
    ];
    
    let restoredCategories: CategoryBackup[] = [];
    
    for (const backupKey of backupSources) {
      try {
        const backup = await AsyncStorage.getItem(backupKey);
        if (backup) {
          const data = JSON.parse(backup);
          
          if (backupKey === 'database_backup' && data.categories) {
            restoredCategories = data.categories;
          } else if (Array.isArray(data)) {
            restoredCategories = data;
          }
          
          if (restoredCategories.length > 0) {
            console.log(`Found ${restoredCategories.length} categories in ${backupKey}`);
            break;
          }
        }
      } catch (error) {
        console.warn(`Failed to read backup from ${backupKey}:`, error);
      }
    }
    
    if (restoredCategories.length === 0) {
      console.warn('No category backups found for emergency restoration');
      return false;
    }
    
    // Clear existing corrupted categories
    await database.runAsync('DELETE FROM categories');
    
    // Restore categories from backup
    let restored = 0;
    for (const category of restoredCategories) {
      try {
        await database.runAsync(
          'INSERT INTO categories (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
          [
            category.id,
            category.name,
            category.icon,
            category.created_at || new Date().toISOString()
          ]
        );
        restored++;
      } catch (error) {
        console.warn(`Failed to restore category ${category.name}:`, error);
      }
    }
    
    console.log(`✅ Emergency restoration complete: ${restored}/${restoredCategories.length} categories restored`);
    return restored > 0;
    
  } catch (error) {
    console.error('Emergency category restoration failed:', error);
    return false;
  }
};

// Emergency function to restore locations
export const emergencyRestoreLocations = async (): Promise<boolean> => {
  try {
    console.log('🚨 Emergency location restoration initiated...');
    
    const database = await getDatabaseSafely();
    if (!database) {
      console.error('Database not available for emergency restoration');
      return false;
    }
    
    // Check for backed up locations
    const backupSources = [
      'preserved_locations',
      'locations_backup',
      'database_backup'
    ];
    
    let restoredLocations: LocationBackup[] = [];
    
    for (const backupKey of backupSources) {
      try {
        const backup = await AsyncStorage.getItem(backupKey);
        if (backup) {
          const data = JSON.parse(backup);
          
          if (backupKey === 'database_backup' && data.locations) {
            restoredLocations = data.locations;
          } else if (Array.isArray(data)) {
            restoredLocations = data;
          }
          
          if (restoredLocations.length > 0) {
            console.log(`Found ${restoredLocations.length} locations in ${backupKey}`);
            break;
          }
        }
      } catch (error) {
        console.warn(`Failed to read backup from ${backupKey}:`, error);
      }
    }
    
    if (restoredLocations.length === 0) {
      console.warn('No location backups found for emergency restoration');
      return false;
    }
    
    // Clear existing corrupted locations
    await database.runAsync('DELETE FROM locations');
    
    // Restore locations from backup
    let restored = 0;
    for (const location of restoredLocations) {
      try {
        await database.runAsync(
          'INSERT INTO locations (id, name, icon, created_at) VALUES (?, ?, ?, ?)',
          [
            location.id,
            location.name,
            location.icon,
            location.created_at || new Date().toISOString()
          ]
        );
        restored++;
      } catch (error) {
        console.warn(`Failed to restore location ${location.name}:`, error);
      }
    }
    
    console.log(`✅ Emergency restoration complete: ${restored}/${restoredLocations.length} locations restored`);
    return restored > 0;
    
  } catch (error) {
    console.error('Emergency location restoration failed:', error);
    return false;
  }
};

// Check if categories appear to be corrupted (all show as "No Category" with apple icons)
export const checkCategoriesCorrupted = async (): Promise<boolean> => {
  try {
    const database = await getDatabaseSafely();
    if (!database) return false;
    
    const categories = await database.getAllAsync('SELECT * FROM categories') as any[];
    
    if (categories.length === 0) return true;
    
    // Check if all categories have default/corrupted values
    const corruptedCount = categories.filter(cat => 
      cat.name === 'No Category' || 
      cat.icon === '🍎' || 
      !cat.name || 
      !cat.icon
    ).length;
    
    // If more than 50% are corrupted, consider it a corruption
    return corruptedCount > categories.length * 0.5;
    
  } catch (error) {
    console.error('Error checking category corruption:', error);
    return false;
  }
};

// Auto-fix corrupted categories on app start
export const autoFixCorruptedData = async (): Promise<void> => {
  try {
    const isCorrupted = await checkCategoriesCorrupted();
    
    if (isCorrupted) {
      console.warn('🔧 Corrupted categories detected, attempting auto-fix...');
      
      const categoriesRestored = await emergencyRestoreCategories();
      const locationsRestored = await emergencyRestoreLocations();
      
      if (categoriesRestored || locationsRestored) {
        console.log('✅ Auto-fix completed successfully');
      } else {
        console.warn('⚠️ Auto-fix could not restore from backups');
      }
    }
  } catch (error) {
    console.error('Auto-fix failed:', error);
  }
};

// Manual trigger for emergency restoration (can be called from settings)
export const manualEmergencyRestore = async (): Promise<{success: boolean, message: string}> => {
  try {
    const categoriesRestored = await emergencyRestoreCategories();
    const locationsRestored = await emergencyRestoreLocations();
    
    if (categoriesRestored && locationsRestored) {
      return {
        success: true,
        message: 'Successfully restored all categories and locations from backup'
      };
    } else if (categoriesRestored || locationsRestored) {
      return {
        success: true,
        message: 'Partially restored data from backup'
      };
    } else {
      return {
        success: false,
        message: 'No backup data found to restore from'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}; 