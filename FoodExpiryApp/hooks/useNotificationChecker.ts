import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDatabase } from '../context/DatabaseContext';
import { simpleNotificationService } from '../services/SimpleNotificationService';

export const useNotificationChecker = () => {
  const { foodItems } = useDatabase();
  const lastCheckRef = useRef<number>(0);

  const checkExpiringItems = async () => {
    try {
      // Check all food items for expiry notifications
      await simpleNotificationService.checkAllFoodItemsForExpiry(foodItems);
    } catch (error) {
      // Silent error handling
    }
  };

  // Only check on initial load, not on every foodItems change
  useEffect(() => {
    const now = Date.now();
    // Only check if it's been more than 5 minutes since last check
    if (now - lastCheckRef.current > 300000) {
      checkExpiringItems();
      lastCheckRef.current = now;
    }
  }, [foodItems.length]); // Only trigger when the number of items changes, not the items themselves

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        // Only check if it's been more than 5 minutes since last check
        if (now - lastCheckRef.current > 300000) {
          checkExpiringItems();
          lastCheckRef.current = now;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return { checkExpiringItems };
}; 