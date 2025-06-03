import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDatabase } from '../context/DatabaseContext';
import { simpleNotificationService } from '../services/SimpleNotificationService';

export const useNotificationChecker = () => {
  const { foodItems } = useDatabase();

  const checkExpiringItems = async () => {
    try {
      // Check all food items for expiry notifications
      await simpleNotificationService.checkAllFoodItemsForExpiry(foodItems);
    } catch (error) {
      // Silent error handling
    }
  };

  useEffect(() => {
    checkExpiringItems();
  }, [foodItems]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkExpiringItems();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return { checkExpiringItems };
}; 