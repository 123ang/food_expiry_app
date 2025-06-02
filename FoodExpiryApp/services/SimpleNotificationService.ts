import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../context/LanguageContext';

export interface NotificationSettings {
  notificationsEnabled: boolean;
  expiryAlerts: boolean;
  todayAlerts: boolean;
  expiredAlerts: boolean;
  reminderDays: number;
  notificationTime: string;
}

export class SimpleNotificationService {
  private static instance: SimpleNotificationService;
  private settings: NotificationSettings = {
    notificationsEnabled: false,
    expiryAlerts: true,
    todayAlerts: true,
    expiredAlerts: true,
    reminderDays: 1,
    notificationTime: '09:00'
  };

  static getInstance(): SimpleNotificationService {
    if (!SimpleNotificationService.instance) {
      SimpleNotificationService.instance = new SimpleNotificationService();
    }
    return SimpleNotificationService.instance;
  }

  // Get current language from AsyncStorage
  private async getCurrentLanguage(): Promise<string> {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      return savedLanguage || 'en';
    } catch (error) {
      console.log('Error getting language:', error);
      return 'en';
    }
  }

  // Get translation for current language
  private async getTranslation(key: string): Promise<string> {
    const language = await this.getCurrentLanguage();
    const langTranslations = translations[language as keyof typeof translations] || translations.en;
    return langTranslations[key as keyof typeof langTranslations] || key;
  }

  // Format notification message with placeholders
  private formatMessage(template: string, values: Record<string, string>): string {
    let formatted = template;
    Object.entries(values).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return formatted;
  }

  // Load settings
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        this.settings = { ...this.settings, ...JSON.parse(settings) };
      }
      const { status } = await Notifications.getPermissionsAsync();
      this.settings.notificationsEnabled = status === 'granted';
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
    return this.settings;
  }

  // Save settings
  async saveSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.log('Error saving notification settings:', error);
    }
  }

  // Get settings
  getSettings(): NotificationSettings {
    return this.settings;
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    if (!this.settings.notificationsEnabled) return;
    
    const title = await this.getTranslation('notification.testTitle');
    const body = await this.getTranslation('notification.testBody');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'test' },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  // Send expiry warning notification with detailed information
  async sendExpiryWarning(foodName: string, daysLeft: number, quantity?: number, location?: string, category?: string): Promise<void> {
    if (!this.settings.notificationsEnabled) return;

    let title = '';
    let bodyTemplate = '';
    
    // Get localized strings
    const inText = await this.getTranslation('notification.in');
    const dayText = await this.getTranslation('notification.day');
    const daysText = await this.getTranslation('notification.days');

    // Build detailed information
    const quantityText = quantity ? `${quantity}x ` : '';
    const locationText = location ? ` ${inText} ${location}` : '';
    const categoryText = category ? ` (${category})` : '';
    const pluralText = daysLeft === 1 ? '' : 's';
    const dayWord = Math.abs(daysLeft) === 1 ? dayText : daysText;

    if (daysLeft === 0) {
      title = await this.getTranslation('notification.expiringTodayTitle');
      bodyTemplate = await this.getTranslation('notification.expiringTodayBody');
    } else if (daysLeft > 0) {
      title = await this.getTranslation('notification.expiringSoonTitle');
      bodyTemplate = await this.getTranslation('notification.expiringSoonBody');
    } else {
      title = await this.getTranslation('notification.expiredTitle');
      bodyTemplate = await this.getTranslation('notification.expiredBody');
    }

    // Format the message
    const body = this.formatMessage(bodyTemplate, {
      quantity: quantityText,
      name: foodName,
      category: categoryText,
      location: locationText,
      days: Math.abs(daysLeft).toString(),
      plural: pluralText
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { 
          type: 'expiry_warning', 
          foodName, 
          daysLeft, 
          quantity, 
          location, 
          category 
        },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  // Check and notify for expiry (for integration with food items)
  async notifyExpiry(item: any): Promise<void> {
    if (!this.settings.notificationsEnabled || !item.expiry_date) return;

    const now = new Date();
    const expiryDate = new Date(item.expiry_date);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    // Check if we should notify based on user settings
    const shouldNotify = 
      (daysLeft === 0 && this.settings.todayAlerts) || // Expiring today
      (daysLeft === this.settings.reminderDays && this.settings.expiryAlerts) || // Expiring soon
      (daysLeft < 0 && this.settings.expiredAlerts); // Already expired

    if (shouldNotify) {
      // Extract additional information from the item
      const quantity = item.quantity || undefined;
      const location = item.location_name || undefined;
      const category = item.category_name || undefined;
      
      await this.sendExpiryWarning(item.name, daysLeft, quantity, location, category);
    }
  }

  // Check all food items for expiry and send notifications
  async checkAllFoodItemsForExpiry(foodItems: any[]): Promise<void> {
    if (!this.settings.notificationsEnabled) return;

    for (const item of foodItems) {
      await this.notifyExpiry(item);
    }
  }

  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    this.settings.notificationsEnabled = granted;
    await this.saveSettings({ notificationsEnabled: granted });
    return granted;
  }

  // Check permissions
  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    const granted = status === 'granted';
    this.settings.notificationsEnabled = granted;
    return granted;
  }

  // Update specific setting
  async updateSetting(key: keyof NotificationSettings, value: any): Promise<void> {
    const updates = { [key]: value };
    await this.saveSettings(updates);
  }
}

export const simpleNotificationService = SimpleNotificationService.getInstance(); 