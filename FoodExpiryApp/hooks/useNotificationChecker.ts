import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { useDatabase } from '../context/DatabaseContext';
import { simpleNotificationService } from '../services/SimpleNotificationService';

export const useNotificationChecker = () => {
  const { foodItems } = useDatabase();
  const lastCheckRef = useRef<number>(0);

  // Only check notifications if not in Expo Go (which doesn't support push notifications)
  const notificationsAvailable = Constants.appOwnership !== 'expo';

  const checkExpiringItems = async () => {
    if (!notificationsAvailable) {
      return;
    }
    try {
      // Check all food items for expiry notifications
      await simpleNotificationService.checkAllFoodItemsForExpiry(foodItems);
    } catch (error) {
      // Silent error handling
    }
  };

  // Only check on initial load, not on every foodItems change
  useEffect(() => {
    if (!notificationsAvailable) {
      return;
    }
    const now = Date.now();
    // Only check if it's been more than 5 minutes since last check
    if (now - lastCheckRef.current > 300000) {
      checkExpiringItems();
      lastCheckRef.current = now;
    }
  }, [foodItems.length, notificationsAvailable]); // Only trigger when the number of items changes, not the items themselves

  useEffect(() => {
    if (!notificationsAvailable) {
      return;
    }
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
  }, [notificationsAvailable]);

  return { checkExpiringItems };
}; 
