import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem } from '../database/models';

export interface NotificationSettings {
  notificationsEnabled: boolean;
  expiryAlerts: boolean;
  todayAlerts: boolean;
  expiredAlerts: boolean;
  reminderDays: number;
  notificationTime: string; // HH:MM format
}

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    notificationsEnabled: false,
    expiryAlerts: true,
    todayAlerts: true,
    expiredAlerts: true,
    reminderDays: 1,
    notificationTime: '09:00'
  };

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Load notification settings from storage
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        this.settings = { ...this.settings, ...JSON.parse(settings) };
      }

      // Check permission status
      const { status } = await Notifications.getPermissionsAsync();
      this.settings.notificationsEnabled = status === 'granted';
      
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
    return this.settings;
  }

  // Save notification settings
  async saveSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.log('Error saving notification settings:', error);
    }
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return this.settings;
  }

  // Schedule notifications for all food items
  async scheduleNotificationsForFoodItems(foodItems: FoodItem[]): Promise<void> {
    if (!this.settings.notificationsEnabled) {
      return;
    }

    // Cancel all existing notifications first
    await this.cancelAllScheduledNotifications();

    // Schedule new notifications for each food item
    for (const item of foodItems) {
      await this.scheduleNotificationsForItem(item);
    }
  }

  // Schedule notifications for a single food item
  async scheduleNotificationsForItem(item: FoodItem): Promise<void> {
    if (!this.settings.notificationsEnabled || !item.expiry_date) {
      return;
    }

    const now = new Date();
    const expiryDate = new Date(item.expiry_date);
    const timeDiffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    // Parse notification time
    const [hours, minutes] = this.settings.notificationTime.split(':').map(Number);

    // Schedule "Expiring Soon" notification
    if (this.settings.expiryAlerts && timeDiffDays === this.settings.reminderDays && timeDiffDays > 0) {
      const notificationDate = new Date(expiryDate);
      notificationDate.setDate(notificationDate.getDate() - this.settings.reminderDays);
      notificationDate.setHours(hours, minutes, 0, 0);

      if (notificationDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Food Expiring Soon',
            body: `${item.name} will expire in ${this.settings.reminderDays} day${this.settings.reminderDays > 1 ? 's' : ''}`,
            data: { 
              type: 'expiring_soon', 
              itemId: item.id,
              itemName: item.name,
              daysLeft: this.settings.reminderDays
            },
            sound: true,
          },
          trigger: notificationDate,
          identifier: `expiring_soon_${item.id}`
        });
      }
    }

    // Schedule "Expiring Today" notification
    if (this.settings.todayAlerts && timeDiffDays === 0) {
      const todayNotificationDate = new Date(expiryDate);
      todayNotificationDate.setHours(hours, minutes, 0, 0);

      if (todayNotificationDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Food Expiring Today!',
            body: `${item.name} expires today. Use it now!`,
            data: { 
              type: 'expiring_today', 
              itemId: item.id,
              itemName: item.name,
              daysLeft: 0
            },
            sound: true,
          },
          trigger: todayNotificationDate,
          identifier: `expiring_today_${item.id}`
        });
      }
    }

    // Schedule "Expired" notification
    if (this.settings.expiredAlerts && timeDiffDays === -1) {
      const expiredNotificationDate = new Date(expiryDate);
      expiredNotificationDate.setDate(expiredNotificationDate.getDate() + 1);
      expiredNotificationDate.setHours(hours, minutes, 0, 0);

      if (expiredNotificationDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '❌ Food Has Expired',
            body: `${item.name} expired yesterday. Check if it's still safe to consume.`,
            data: { 
              type: 'expired', 
              itemId: item.id,
              itemName: item.name,
              daysLeft: -1
            },
            sound: true,
          },
          trigger: expiredNotificationDate,
          identifier: `expired_${item.id}`
        });
      }
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

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Cancel notifications for a specific item
  async cancelNotificationsForItem(itemId: number): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(`expiring_soon_${itemId}`);
    await Notifications.cancelScheduledNotificationAsync(`expiring_today_${itemId}`);
    await Notifications.cancelScheduledNotificationAsync(`expired_${itemId}`);
  }

  // Get scheduled notifications count
  async getScheduledNotificationsCount(): Promise<number> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  }

  // Handle notification response (when user taps notification)
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'expiring_soon':
      case 'expiring_today':
      case 'expired':
        // Navigate to food item details or list
        console.log(`Navigate to item: ${data.itemName} (ID: ${data.itemId})`);
        break;
      case 'daily_check':
        // Navigate to main app or refresh data
        console.log('Navigate to main food list');
        break;
      case 'test':
        console.log('Test notification received');
        break;
    }
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

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    
    this.settings.notificationsEnabled = granted;
    await this.saveSettings({ notificationsEnabled: granted });
    
    return granted;
  }

  // Check if notifications are permitted
  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    const granted = status === 'granted';
    
    this.settings.notificationsEnabled = granted;
    
    return granted;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 