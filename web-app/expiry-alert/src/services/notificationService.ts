import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '../firebase';

// Your Firebase messaging key - you'll need to get this from Firebase Console
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // Replace with your actual VAPID key

export interface NotificationSettings {
  enabled: boolean;
  expiringSoonAlerts: boolean;
  expiringTodayAlerts: boolean;
  expiredAlerts: boolean;
  reminderDays: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  expiringSoonAlerts: true,
  expiringTodayAlerts: true,
  expiredAlerts: false,
  reminderDays: 3
};

class NotificationService {
  private messaging: any;
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  constructor() {
    if (typeof window !== 'undefined' && 'firebase' in window) {
      this.messaging = getMessaging(app);
      this.loadSettings();
    }
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('This browser does not support service workers');
        return false;
      }

      await this.requestPermission();
      await this.setupForegroundHandler();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted !== this.settings.enabled) {
        await this.updateSettings({ enabled: granted });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getRegistrationToken(): Promise<string | null> {
    try {
      if (!this.messaging) return null;
      
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (token) {
        console.log('Registration token:', token);
        // Store this token in your backend to send notifications
        localStorage.setItem('fcm_token', token);
        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting registration token:', error);
      return null;
    }
  }

  private setupForegroundHandler(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show notification when app is in foreground
      if (payload.notification) {
        this.showLocalNotification(
          payload.notification.title || 'Expiry Alert',
          payload.notification.body || '',
          payload.data
        );
      }
    });
  }

  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      if (!this.settings.enabled || Notification.permission !== 'granted') {
        return;
      }

      const notification = new Notification(title, {
        body,
        icon: '/food_expiry_logo.png',
        badge: '/food_expiry_logo.png',
        data,
        requireInteraction: true
      } as NotificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to specific item if data contains itemId
        if (data?.itemId) {
          window.location.href = `/item/${data.itemId}`;
        } else {
          window.location.href = '/dashboard';
        }
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async scheduleExpiryNotification(
    itemName: string,
    daysUntilExpiry: number,
    itemId?: string
  ): Promise<void> {
    if (!this.settings.enabled) return;

    let shouldNotify = false;
    let title = '';
    let body = '';

    if (daysUntilExpiry === 0 && this.settings.expiringTodayAlerts) {
      shouldNotify = true;
      title = '🚨 Expires Today!';
      body = `${itemName} expires today! Use it now to avoid waste.`;
    } else if (daysUntilExpiry > 0 && daysUntilExpiry <= this.settings.reminderDays && this.settings.expiringSoonAlerts) {
      shouldNotify = true;
      title = '⏰ Expiring Soon';
      body = `${itemName} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
    } else if (daysUntilExpiry < 0 && this.settings.expiredAlerts) {
      shouldNotify = true;
      title = '❌ Item Expired';
      body = `${itemName} expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago`;
    }

    if (shouldNotify) {
      await this.showLocalNotification(title, body, { itemId, itemName });
    }
  }

  async checkItemsForNotifications(items: any[]): Promise<void> {
    const now = new Date();
    const notifiedToday = JSON.parse(localStorage.getItem('notified_today') || '[]');
    const today = now.toDateString();

    // Reset notifications if it's a new day
    const lastNotificationDate = localStorage.getItem('last_notification_date');
    if (lastNotificationDate !== today) {
      localStorage.setItem('notified_today', '[]');
      localStorage.setItem('last_notification_date', today);
    }

    for (const item of items) {
      const expiryDate = new Date(item.expiryDate);
      const timeDiff = expiryDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Only notify once per day per item
      const notificationKey = `${item.id}_${daysUntilExpiry}`;
      if (!notifiedToday.includes(notificationKey)) {
        await this.scheduleExpiryNotification(item.name, daysUntilExpiry, item.id);
        notifiedToday.push(notificationKey);
        localStorage.setItem('notified_today', JSON.stringify(notifiedToday));
      }
    }
  }

  async testNotification(): Promise<void> {
    await this.showLocalNotification(
      '🧪 Test Notification',
      'This is a test notification from Expiry Alert!',
      { type: 'test' }
    );
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = localStorage.getItem('notification_settings');
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async updateSettings(updates: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    localStorage.setItem('notification_settings', JSON.stringify(this.settings));
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    return Notification.permission;
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
}

export const notificationService = new NotificationService();
export default NotificationService; 