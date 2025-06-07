import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FoodItem } from '../database/models';

export interface NotificationSettings {
  notificationsEnabled: boolean;
  expiryAlerts: boolean;
  todayAlerts: boolean;
  expiredAlerts: boolean;
  reminderDays: number;
  notificationTime: string; // HH:MM format
}

const DEFAULT_SETTINGS: NotificationSettings = {
  notificationsEnabled: true,
  expiryAlerts: true,
  todayAlerts: true,
  expiredAlerts: false,
  reminderDays: 1,
  notificationTime: '09:00'
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadSettings();
    await this.requestPermissions();
    this.setupNotificationListener();
  }

  async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      // Silent error handling - use defaults
    }
  }

  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      // Silent error handling
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async getPermissionStatus(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  private setupNotificationListener(): void {
    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationTap(response.notification.request.content.data);
    });
  }

  async scheduleExpiryNotification(
    itemId: string,
    itemName: string,
    categoryName: string,
    locationName: string,
    daysUntilExpiry: number,
    quantity: number = 1
  ): Promise<void> {
    if (!this.settings.notificationsEnabled) return;

    let shouldNotify = false;
    let title = '';
    let body = '';

    if (daysUntilExpiry === 0 && this.settings.todayAlerts) {
      shouldNotify = true;
      title = '🚨 Food Expiring Today!';
      const quantityText = quantity > 1 ? `${quantity} ` : '';
      const locationText = locationName ? ` in ${locationName}` : '';
      body = `${quantityText}${itemName} (${categoryName}) expires today${locationText}. Use it now!`;
    } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 3 && this.settings.expiryAlerts) {
      shouldNotify = true;
      title = '⚠️ Food Expiring Soon';
      const quantityText = quantity > 1 ? `${quantity} ` : '';
      const locationText = locationName ? ` in ${locationName}` : '';
      const daysText = daysUntilExpiry === 1 ? 'day' : 'days';
      body = `${quantityText}${itemName} (${categoryName}) will expire in ${daysUntilExpiry} ${daysText}${locationText}`;
    } else if (daysUntilExpiry < 0 && this.settings.expiredAlerts) {
      shouldNotify = true;
      title = '❌ Food Has Expired';
      const quantityText = quantity > 1 ? `${quantity} ` : '';
      const locationText = locationName ? ` in ${locationName}` : '';
      const expiredDays = Math.abs(daysUntilExpiry);
      const daysText = expiredDays === 1 ? 'day' : 'days';
      body = `${quantityText}${itemName} (${categoryName}) expired ${expiredDays} ${daysText} ago${locationText}`;
    }

    if (!shouldNotify) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            itemId,
            itemName,
            categoryName,
            locationName,
            daysUntilExpiry,
            type: 'expiry_alert'
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      // Silent error handling
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      // Silent error handling
    }
  }

  async cancelNotificationForItem(itemId: string): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const itemNotifications = notifications.filter(
        notif => notif.content.data?.itemId === itemId
      );
      
      for (const notification of itemNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      // Silent error handling
    }
  }

  async scheduleTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍎 Food Expiry Alert',
          body: 'This is a test notification from Expiry Alert!',
          data: { type: 'test' },
        },
        trigger: null,
      });
    } catch (error) {
      // Silent error handling
    }
  }

  private handleNotificationTap(data: any): void {
    if (data?.type === 'expiry_alert' && data?.itemId) {
      // Navigate to specific item
      router.push(`/item/${data.itemId}`);
    } else if (data?.type === 'expiry_alert') {
      // Navigate to food list
      router.push('/list');
    } else if (data?.type === 'test') {
      // Handle test notification
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      // Silent error handling
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Schedule notifications for all food items
  async scheduleNotificationsForFoodItems(foodItems: FoodItem[]): Promise<void> {
    if (!this.settings.notificationsEnabled) {
      return;
    }

    // Cancel all existing notifications first
    await this.cancelAllNotifications();

    // Schedule new notifications for each food item
    for (const item of foodItems) {
      await this.scheduleExpiryNotification(item.id.toString(), item.name, item.category, item.location, Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    }
  }

  // Schedule daily check for food items (background task)
  async scheduleDailyFoodCheck(): Promise<void> {
    if (!this.settings.notificationsEnabled) {
      return;
    }

    // Cancel existing daily check
    await Notifications.cancelScheduledNotificationAsync('daily_food_check');

    // Parse notification time
    const [hours, minutes] = this.settings.notificationTime.split(':').map(Number);
    
    // Schedule daily notification to check food status
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Daily Food Check',
        body: 'Time to check your food expiry dates!',
        data: { type: 'daily_check' },
        sound: false,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
      identifier: 'daily_food_check'
    });
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍎 Food Expiry Alert',
        body: 'This is a test notification from Expiry Alert!',
        data: { type: 'test' },
        sound: true,
      },
      trigger: { seconds: 2 },
    });
  }

  // Send immediate notification summary
  async sendFoodSummaryNotification(foodItems: FoodItem[]): Promise<void> {
    if (!this.settings.notificationsEnabled) {
      return;
    }

    const now = new Date();
    const expiringSoon = foodItems.filter(item => {
      if (!item.expiry_date) return false;
      const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysLeft <= this.settings.reminderDays && daysLeft > 0;
    });

    const expiringToday = foodItems.filter(item => {
      if (!item.expiry_date) return false;
      const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysLeft === 0;
    });

    const expired = foodItems.filter(item => {
      if (!item.expiry_date) return false;
      const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysLeft < 0;
    });

    let title = '📋 Food Status Summary';
    let body = '';

    if (expiringToday.length > 0) {
      body += `${expiringToday.length} item${expiringToday.length > 1 ? 's' : ''} expiring today! `;
    }
    if (expiringSoon.length > 0) {
      body += `${expiringSoon.length} item${expiringSoon.length > 1 ? 's' : ''} expiring soon. `;
    }
    if (expired.length > 0) {
      body += `${expired.length} item${expired.length > 1 ? 's' : ''} already expired.`;
    }

    if (!body) {
      body = 'All your food items are fresh! 🎉';
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'summary' },
        sound: true,
      },
      trigger: { seconds: 1 },
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 