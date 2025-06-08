import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { FoodItemWithDetails } from '../database/models';

export interface NotificationSettings {
  enabled: boolean;
  expiringSoonAlerts: boolean;
  expiringTodayAlerts: boolean;
  expiredAlerts: boolean;
  notificationTime: string; // HH:MM format
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  expiringSoonAlerts: true,
  expiringTodayAlerts: true,
  expiredAlerts: false,
  notificationTime: '09:00',
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

class SimpleNotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private isInitialized = false;
  private lastNotificationCheck: number = 0;
  private notificationCooldown: number = 60000; // 1 minute cooldown
  private notifiedItems: Set<string> = new Set(); // Track items we've already notified about today

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.loadSettings();
    await this.requestPermissions();
    this.setupLanguageListener();
    this.isInitialized = true;
  }

  private setupLanguageListener(): void {
    // Listen for language changes
    DeviceEventEmitter.addListener('languageChanged', async (event) => {
      // Language change detected - no specific action needed here as getLanguage() is called fresh each time
    });
  }

  private async getLanguage(): Promise<string> {
    try {
      const language = await AsyncStorage.getItem('app_language');
      return language || 'en';
    } catch (error) {
      return 'en';
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      
      if (granted !== this.settings.enabled) {
        await this.saveSettings({ enabled: granted });
      }
      
      return granted;
    } catch (error) {
      return false;
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      // Use defaults on error
    }
  }

  async saveSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      // Silent error handling
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  private calculateDaysUntilExpiry(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getTranslatedText(key: string, params: any = {}): Promise<string> {
    const language = await this.getLanguage();
    
    const translations: Record<string, Record<string, string>> = {
      en: {
        'notification.expiringTodayTitle': '🚨 Food Expiring Today!',
        'notification.expiringSoonTitle': '⚠️ Food Expiring Soon',
        'notification.expiredTitle': '❌ Food Has Expired',
        'notification.expiringTodayBody': '{quantity}{name} ({category}) expires today{location}. Use it now!',
        'notification.expiringSoonBody': '{quantity}{name} ({category}) will expire in {days} {plural}{location}',
        'notification.expiredBody': '{quantity}{name} ({category}) expired {days} {plural} ago{location}',
        'notification.testTitle': '🍎 Food Expiry Alert',
        'notification.testBody': 'This is a test notification from Expiry Alert!',
        'notification.in': ' in ',
        'notification.days': 'days',
        'notification.day': 'day',
      },
      zh: {
        'notification.expiringTodayTitle': '🚨 今天过期的食品！',
        'notification.expiringSoonTitle': '⚠️ 即将过期的食品',
        'notification.expiredTitle': '❌ 食品已过期',
        'notification.expiringTodayBody': '{quantity}{name} ({category}) 今天过期{location}。现在使用它！',
        'notification.expiringSoonBody': '{quantity}{name} ({category}) 将在 {days} {plural}{location} 后过期',
        'notification.expiredBody': '{quantity}{name} ({category}) 已过期 {days} {plural} 前{location}',
        'notification.testTitle': '🍎 食品过期警报',
        'notification.testBody': '这是一个测试通知，来自过期警报！',
        'notification.in': ' 在 ',
        'notification.days': '天',
        'notification.day': '天',
      },
      ja: {
        'notification.expiringTodayTitle': '🚨 今日期限切れの食品！',
        'notification.expiringSoonTitle': '⚠️ 期限切れ間近の食品',
        'notification.expiredTitle': '❌ 食品が期限切れ',
        'notification.expiringTodayBody': '{quantity}{name} ({category}) 今日期限切れ{location}。今すぐ使用してください！',
        'notification.expiringSoonBody': '{quantity}{name} ({category}) は {days} {plural}{location} 後に期限切れになります',
        'notification.expiredBody': '{quantity}{name} ({category}) は {days} {plural} 前に期限切れになりました{location}',
        'notification.testTitle': '🍎 食品期限警報',
        'notification.testBody': 'これは過期警報からのテスト通知です！',
        'notification.in': ' に ',
        'notification.days': '日',
        'notification.day': '日',
      }
    };

    let text = translations[language]?.[key] || translations.en[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param] || '');
    });
    
    return text;
  }

  async scheduleNotificationForItem(item: FoodItemWithDetails): Promise<void> {
    // Always load latest settings first
    await this.loadSettings();
    
    if (!this.settings.enabled) return;

    await this.initialize();

    const daysUntilExpiry = this.calculateDaysUntilExpiry(item.expiry_date);
    const quantityText = item.quantity > 1 ? `${item.quantity} ` : '';
    const locationText = item.location_name ? await this.getTranslatedText('notification.in') + item.location_name : '';

    let shouldNotify = false;
    let titleKey = '';
    let bodyKey = '';
    let bodyParams: any = {};

    if (daysUntilExpiry === 0 && this.settings.expiringTodayAlerts) {
      shouldNotify = true;
      titleKey = 'notification.expiringTodayTitle';
      bodyKey = 'notification.expiringTodayBody';
      bodyParams = {
        quantity: quantityText,
        name: item.name,
        category: item.category_name || '',
        location: locationText
      };
    } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 3 && this.settings.expiringSoonAlerts) {
      shouldNotify = true;
      titleKey = 'notification.expiringSoonTitle';
      bodyKey = 'notification.expiringSoonBody';
      const dayWord = daysUntilExpiry === 1 
        ? await this.getTranslatedText('notification.day')
        : await this.getTranslatedText('notification.days');
      bodyParams = {
        quantity: quantityText,
        name: item.name,
        category: item.category_name || '',
        days: daysUntilExpiry,
        plural: dayWord,
        location: locationText
      };
    } else if (daysUntilExpiry < 0 && this.settings.expiredAlerts) {
      shouldNotify = true;
      titleKey = 'notification.expiredTitle';
      bodyKey = 'notification.expiredBody';
      const expiredDays = Math.abs(daysUntilExpiry);
      const dayWord = expiredDays === 1 
        ? await this.getTranslatedText('notification.day')
        : await this.getTranslatedText('notification.days');
      bodyParams = {
        quantity: quantityText,
        name: item.name,
        category: item.category_name || '',
        days: expiredDays,
        plural: dayWord,
        location: locationText
      };
    }

    if (!shouldNotify) return;

    try {
      const title = await this.getTranslatedText(titleKey);
      const body = await this.getTranslatedText(bodyKey, bodyParams);

      // Use immediate notification but rely on throttling to prevent spam
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            itemId: item.id,
            itemName: item.name,
            categoryName: item.category_name,
            locationName: item.location_name,
            daysUntilExpiry,
            type: 'expiry_alert'
          },
        },
        trigger: null,
      });
    } catch (error) {
      // Silent error handling
    }
  }

  async checkAllFoodItemsForExpiry(foodItems: FoodItemWithDetails[]): Promise<void> {
    // Always load latest settings first
    await this.loadSettings();
    
    if (!this.settings.enabled) {
      // If notifications are disabled, cancel any existing notifications and return
      await this.cancelAllNotifications();
      return;
    }

    // Throttle notifications - only check once per minute
    const now = Date.now();
    if (now - this.lastNotificationCheck < this.notificationCooldown) {
      return;
    }
    this.lastNotificationCheck = now;

    try {
      await this.initialize();
      
      // Reset daily notification tracking at midnight
      const today = new Date().toDateString();
      const lastResetDate = await AsyncStorage.getItem('last_notification_reset');
      if (lastResetDate !== today) {
        this.notifiedItems.clear();
        await AsyncStorage.setItem('last_notification_reset', today);
      }

      // Only notify for items we haven't notified about today
      for (const item of foodItems) {
        const itemKey = `${item.id}-${today}`;
        if (!this.notifiedItems.has(itemKey)) {
          const shouldNotify = await this.shouldNotifyForItem(item);
          if (shouldNotify) {
            await this.scheduleNotificationForItem(item);
            this.notifiedItems.add(itemKey);
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  }

  private async shouldNotifyForItem(item: FoodItemWithDetails): Promise<boolean> {
    const daysUntilExpiry = this.calculateDaysUntilExpiry(item.expiry_date);
    
    if (daysUntilExpiry === 0 && this.settings.expiringTodayAlerts) {
      return true;
    } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 3 && this.settings.expiringSoonAlerts) {
      return true;
    } else if (daysUntilExpiry < 0 && this.settings.expiredAlerts) {
      return true;
    }
    
    return false;
  }

  async sendTestNotification(): Promise<void> {
    try {
      await this.initialize();
      
      const title = await this.getTranslatedText('notification.testTitle');
      const body = await this.getTranslatedText('notification.testBody');

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'test' },
        },
        trigger: null,
      });
    } catch (error) {
      // Silent error handling
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      this.notifiedItems.clear();
      this.lastNotificationCheck = Date.now();
    } catch (error) {
      // Silent error handling
    }
  }

  async emergencyStopNotifications(): Promise<void> {
    try {
      // Disable notifications completely
      this.settings.enabled = false;
      await this.saveSettings({ enabled: false });
      
      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      
      // Clear tracking
      this.notifiedItems.clear();
      this.lastNotificationCheck = Date.now();
    } catch (error) {
      // Silent error handling
    }
  }

  async getPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  // Add method to return settings with expected property names for the UI
  async getUISettings(): Promise<any> {
    await this.loadSettings();
    return {
      notificationsEnabled: this.settings.enabled,
      expiryAlerts: this.settings.expiringSoonAlerts,
      todayAlerts: this.settings.expiringTodayAlerts,
      expiredAlerts: this.settings.expiredAlerts,
      reminderDays: 3, // Default reminder days
    };
  }

  // Add method to update individual settings
  async updateSetting(key: string, value: any): Promise<void> {
    try {
      // Map UI property names to service property names
      const propertyMap: Record<string, string> = {
        'notificationsEnabled': 'enabled',
        'expiryAlerts': 'expiringSoonAlerts',
        'todayAlerts': 'expiringTodayAlerts',
        'expiredAlerts': 'expiredAlerts',
      };

      const serviceKey = propertyMap[key] || key;
      const newSettings = { [serviceKey]: value };
      await this.saveSettings(newSettings);

      // If notifications are being disabled, cancel all notifications
      if (key === 'notificationsEnabled' && !value) {
        await this.emergencyStopNotifications();
      }
    } catch (error) {
      // Silent error handling
    }
  }
}

export const simpleNotificationService = new SimpleNotificationService(); 