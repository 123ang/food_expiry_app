import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FoodItem, FoodItemWithDetails } from '../database/models';

// Import Language type
export type Language = 'en' | 'zh' | 'ja';

// Translation mappings for notifications
const notificationTranslations: Record<Language, Record<string, string>> = {
  en: {
    'notification.testTitle': '🍎 Food Expiry Alert',
    'notification.testBody': 'This is a test notification from Expiry Alert!',
    'notification.expiringTodayTitle': '🚨 Food Expiring Today!',
    'notification.expiringSoonTitle': '⚠️ Food Expiring Soon',
    'notification.expiredTitle': '❌ Food Has Expired',
    'notification.expiringTodayBody': '{quantity}{name} ({category}) expires today{location}. Use it now!',
    'notification.expiringSoonBody': '{quantity}{name} ({category}) will expire in {days} {dayText}{location}',
    'notification.expiredBody': '{quantity}{name} ({category}) expired {days} {dayText} ago{location}',
    'notification.dailyCheckTitle': '🔔 Daily Food Check',
    'notification.dailyCheckBody': 'Time to check your food expiry dates!',
    'notification.summaryTitle': '📋 Food Status Summary',
    'notification.summaryBodyExpiringToday': '{count} item{plural} expiring today! ',
    'notification.summaryBodyExpiringSoon': '{count} item{plural} expiring soon. ',
    'notification.summaryBodyExpired': '{count} item{plural} already expired.',
    'notification.summaryBodyAllFresh': 'All your food items are fresh! 🎉',
    'notification.day': 'day',
    'notification.days': 'days',
    'notification.in': ' in ',
  },
  zh: {
    'notification.testTitle': '🍎 食品过期警报',
    'notification.testBody': '这是一个测试通知，来自过期警报！',
    'notification.expiringTodayTitle': '🚨 今天过期的食品！',
    'notification.expiringSoonTitle': '⚠️ 即将过期的食品',
    'notification.expiredTitle': '❌ 食品已过期',
    'notification.expiringTodayBody': '{quantity}{name} ({category}) 今天过期{location}。现在使用它！',
    'notification.expiringSoonBody': '{quantity}{name} ({category}) 将在 {days} {dayText}{location} 后过期',
    'notification.expiredBody': '{quantity}{name} ({category}) 已过期 {days} {dayText} 前{location}',
    'notification.dailyCheckTitle': '🔔 每日食品检查',
    'notification.dailyCheckBody': '是时候检查您的食品过期日期了！',
    'notification.summaryTitle': '📋 食品状态摘要',
    'notification.summaryBodyExpiringToday': '{count} 个食品今天过期！',
    'notification.summaryBodyExpiringSoon': '{count} 个食品即将过期。',
    'notification.summaryBodyExpired': '{count} 个食品已经过期。',
    'notification.summaryBodyAllFresh': '您的所有食品都很新鲜！🎉',
    'notification.day': '天',
    'notification.days': '天',
    'notification.in': ' 在 ',
  },
  ja: {
    'notification.testTitle': '🍎 食品期限警報',
    'notification.testBody': 'これは過期警報からのテスト通知です！',
    'notification.expiringTodayTitle': '🚨 今日期限切れの食品！',
    'notification.expiringSoonTitle': '⚠️ 期限切れ間近の食品',
    'notification.expiredTitle': '❌ 食品が期限切れ',
    'notification.expiringTodayBody': '{quantity}{name} ({category}) 今日期限切れ{location}。今すぐ使用してください！',
    'notification.expiringSoonBody': '{quantity}{name} ({category}) は {days} {dayText}{location} 後に期限切れになります',
    'notification.expiredBody': '{quantity}{name} ({category}) は {days} {dayText} 前に期限切れになりました{location}',
    'notification.dailyCheckTitle': '🔔 毎日の食品チェック',
    'notification.dailyCheckBody': '食品の期限をチェックする時間です！',
    'notification.summaryTitle': '📋 食品状況サマリー',
    'notification.summaryBodyExpiringToday': '{count} 品目が今日期限切れ！',
    'notification.summaryBodyExpiringSoon': '{count} 品目が期限切れ間近。',
    'notification.summaryBodyExpired': '{count} 品目がすでに期限切れ。',
    'notification.summaryBodyAllFresh': 'すべての食品は新鮮です！🎉',
    'notification.day': '日',
    'notification.days': '日',
    'notification.in': ' に ',
  }
};

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
  private currentLanguage: Language = 'en';

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadSettings();
    await this.loadLanguage();
    await this.requestPermissions();
    this.setupNotificationListener();
    this.setupLanguageListener();
  }

  private async loadLanguage(): Promise<void> {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'ja')) {
        this.currentLanguage = savedLanguage as Language;
      }
    } catch (error) {
      this.currentLanguage = 'en'; // Fallback to English
    }
  }

  private t(key: string, replacements: Record<string, string> = {}): string {
    let translation = notificationTranslations[this.currentLanguage][key] || key;
    
    // Replace placeholders
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    });
    
    return translation;
  }

  async updateLanguage(): Promise<void> {
    await this.loadLanguage();
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

  private setupLanguageListener(): void {
    // Listen for language changes
    DeviceEventEmitter.addListener('languageChanged', async (event) => {
      await this.updateLanguage();
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
      title = this.t('notification.expiringTodayTitle');
      const quantityText = quantity > 1 ? `${quantity} ` : '';
      const locationText = locationName ? ` ${this.t('notification.in')} ${locationName}` : '';
      body = this.t('notification.expiringTodayBody', { quantity: quantityText, name: itemName, category: categoryName, location: locationText });
    } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 3 && this.settings.expiryAlerts) {
      shouldNotify = true;
      title = this.t('notification.expiringSoonTitle');
      const quantityText = quantity > 1 ? `${quantity} ` : '';
      const locationText = locationName ? ` ${this.t('notification.in')} ${locationName}` : '';
      const daysText = daysUntilExpiry === 1 ? this.t('notification.day') : this.t('notification.days');
             body = this.t('notification.expiringSoonBody', { quantity: quantityText, name: itemName, category: categoryName, days: daysUntilExpiry.toString(), dayText: daysText, location: locationText });
    } else if (daysUntilExpiry < 0 && this.settings.expiredAlerts) {
      shouldNotify = true;
      title = this.t('notification.expiredTitle');
      const quantityText = quantity > 1 ? `${quantity} ` : '';
      const locationText = locationName ? ` ${this.t('notification.in')} ${locationName}` : '';
      const expiredDays = Math.abs(daysUntilExpiry);
      const daysText = expiredDays === 1 ? this.t('notification.day') : this.t('notification.days');
             body = this.t('notification.expiredBody', { quantity: quantityText, name: itemName, category: categoryName, days: expiredDays.toString(), dayText: daysText, location: locationText });
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
          title: this.t('notification.testTitle'),
          body: this.t('notification.testBody'),
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
  async scheduleNotificationsForFoodItems(foodItems: FoodItemWithDetails[]): Promise<void> {
    if (!this.settings.notificationsEnabled) {
      return;
    }

    // Cancel all existing notifications first
    await this.cancelAllNotifications();

    // Schedule new notifications for each food item
    for (const item of foodItems) {
      if (item.id) {
        await this.scheduleExpiryNotification(
          item.id.toString(), 
          item.name, 
          item.category_name, 
          item.location_name, 
          Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        );
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
        title: this.t('notification.dailyCheckTitle'),
        body: this.t('notification.dailyCheckBody'),
        data: { type: 'daily_check' },
        sound: false,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
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
        title: this.t('notification.testTitle'),
        body: this.t('notification.testBody'),
        data: { type: 'test' },
        sound: true,
      },
      trigger: { 
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2 
      },
    });
  }

  // Send immediate notification summary
  async sendFoodSummaryNotification(foodItems: FoodItemWithDetails[]): Promise<void> {
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

    let title = this.t('notification.summaryTitle');
    let body = '';

          if (expiringToday.length > 0) {
        body += this.t('notification.summaryBodyExpiringToday', { count: expiringToday.length.toString(), plural: expiringToday.length > 1 ? 's' : '' });
      }
      if (expiringSoon.length > 0) {
        body += this.t('notification.summaryBodyExpiringSoon', { count: expiringSoon.length.toString(), plural: expiringSoon.length > 1 ? 's' : '' });
      }
      if (expired.length > 0) {
        body += this.t('notification.summaryBodyExpired', { count: expired.length.toString(), plural: expired.length > 1 ? 's' : '' });
      }

    if (!body) {
      body = this.t('notification.summaryBodyAllFresh');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'summary' },
        sound: true,
      },
      trigger: { 
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1 
      },
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 
