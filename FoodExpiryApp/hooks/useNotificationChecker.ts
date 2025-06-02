import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { simpleNotificationService } from '../services/SimpleNotificationService';
import { useDatabase } from '../context/DatabaseContext';

export const useNotificationChecker = () => {
  const { foodItems, isLoading } = useDatabase();
  const appState = useRef(AppState.currentState);
  const lastCheckTime = useRef(Date.now());

  // Check food items for expiry and send notifications
  const checkFoodExpiry = async () => {
    try {
      if (!isLoading && foodItems.length > 0) {
        await simpleNotificationService.checkAllFoodItemsForExpiry(foodItems);
        lastCheckTime.current = Date.now();
        console.log(`Checked ${foodItems.length} food items for expiry notifications`);
      }
    } catch (error) {
      console.log('Error checking food expiry:', error);
    }
  };

  // Handle app state changes
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // If app comes to foreground and it's been more than 1 hour since last check
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      Date.now() - lastCheckTime.current > 60 * 60 * 1000 // 1 hour
    ) {
      console.log('App came to foreground, checking food expiry');
      await checkFoodExpiry();
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    // Initial check when hook is mounted and data is loaded
    if (!isLoading && foodItems.length > 0) {
      checkFoodExpiry();
    }
  }, [isLoading, foodItems]);

  useEffect(() => {
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic check (every 4 hours when app is active)
    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkFoodExpiry();
      }
    }, 4 * 60 * 60 * 1000); // 4 hours

    return () => {
      subscription?.remove();
      clearInterval(intervalId);
    };
  }, []);

  return {
    checkFoodExpiry,
    lastCheckTime: lastCheckTime.current,
  };
}; 