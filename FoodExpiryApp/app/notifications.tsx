import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { simpleNotificationService } from '../services/SimpleNotificationService';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Notification states
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [todayAlerts, setTodayAlerts] = useState(true);
  const [expiredAlerts, setExpiredAlerts] = useState(true);
  const [reminderDays, setReminderDays] = useState(1);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  // Load notification settings
  const loadNotificationSettings = async () => {
    try {
      const settings = await simpleNotificationService.loadSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setExpiryAlerts(settings.expiryAlerts);
      setTodayAlerts(settings.todayAlerts);
      setExpiredAlerts(settings.expiredAlerts);
      setReminderDays(settings.reminderDays);
      
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
  };

  // Request notification permissions
  const requestPermissions = async () => {
    const granted = await simpleNotificationService.requestPermissions();
    setNotificationsEnabled(granted);
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      Alert.alert(
        t('notification.enabledSuccess'),
        t('notification.enabledSuccessDesc')
      );
    } else {
      Alert.alert(
        t('notification.disabledError'),
        t('notification.disabledErrorDesc')
      );
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Error', t('notification.notEnabledError'));
      return;
    }

    await simpleNotificationService.sendTestNotification();
    Alert.alert(t('notification.testSent'), t('notification.testSentDesc'));
  };

  // Toggle main notifications
  const toggleNotifications = async () => {
    if (!notificationsEnabled && permissionStatus !== 'granted') {
      await requestPermissions();
    } else {
      setNotificationsEnabled(!notificationsEnabled);
      await simpleNotificationService.updateSetting('notificationsEnabled', !notificationsEnabled);
    }
  };

  // Update settings
  const updateSetting = async (key: string, value: any) => {
    await simpleNotificationService.updateSetting(key as any, value);
  };

  // Update reminder days
  const updateReminderDays = async (days: number) => {
    setReminderDays(days);
    await updateSetting('reminderDays', days);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      padding: 16,
      paddingBottom: 8,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    permissionCard: {
      backgroundColor: permissionStatus === 'granted' ? `${theme.successColor}20` : `${theme.warningColor}20`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: permissionStatus === 'granted' ? theme.successColor : theme.warningColor,
    },
    permissionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 8,
    },
    permissionText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    button: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    reminderDaysContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    reminderDayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    reminderDayButtonActive: {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
    },
    reminderDayText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    reminderDayTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('header.notifications')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Permission Status */}
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>
            {permissionStatus === 'granted' ? `✅ ${t('notification.enabledTitle')}` : `🔔 ${t('notification.enableTitle')}`}
          </Text>
          <Text style={styles.permissionText}>
            {permissionStatus === 'granted' 
              ? t('notification.enabledDesc')
              : t('notification.disabledDesc')
            }
          </Text>
          {permissionStatus !== 'granted' && (
            <TouchableOpacity style={styles.button} onPress={requestPermissions}>
              <Text style={styles.buttonText}>{t('notification.enableButton')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notification.alertSettings')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <FontAwesome name="bell" size={16} color={theme.primaryColor} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('notification.enableNotifications')}</Text>
              <Text style={styles.settingDescription}>{t('notification.enableNotificationsDesc')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: theme.borderColor, true: theme.primaryColor }}
              thumbColor={theme.cardBackground}
            />
          </View>

          <View style={[styles.settingItem, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
            <View style={styles.settingIcon}>
              <FontAwesome name="clock-o" size={16} color={theme.warningColor} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('notification.expiringSoonAlerts')}</Text>
              <Text style={styles.settingDescription}>{t('notification.expiringSoonAlertsDesc')}</Text>
            </View>
            <Switch
              value={expiryAlerts}
              onValueChange={(value) => {
                setExpiryAlerts(value);
                updateSetting('expiryAlerts', value);
              }}
              disabled={!notificationsEnabled}
              trackColor={{ false: theme.borderColor, true: theme.warningColor }}
              thumbColor={theme.cardBackground}
            />
          </View>

          <View style={[styles.settingItem, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
            <View style={styles.settingIcon}>
              <FontAwesome name="exclamation-triangle" size={16} color={theme.dangerColor} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('notification.expiringTodayAlerts')}</Text>
              <Text style={styles.settingDescription}>{t('notification.expiringTodayAlertsDesc')}</Text>
            </View>
            <Switch
              value={todayAlerts}
              onValueChange={(value) => {
                setTodayAlerts(value);
                updateSetting('todayAlerts', value);
              }}
              disabled={!notificationsEnabled}
              trackColor={{ false: theme.borderColor, true: theme.dangerColor }}
              thumbColor={theme.cardBackground}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemLast, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
            <View style={styles.settingIcon}>
              <FontAwesome name="times-circle" size={16} color={theme.dangerColor} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('notification.expiredAlerts')}</Text>
              <Text style={styles.settingDescription}>{t('notification.expiredAlertsDesc')}</Text>
            </View>
            <Switch
              value={expiredAlerts}
              onValueChange={(value) => {
                setExpiredAlerts(value);
                updateSetting('expiredAlerts', value);
              }}
              disabled={!notificationsEnabled}
              trackColor={{ false: theme.borderColor, true: theme.dangerColor }}
              thumbColor={theme.cardBackground}
            />
          </View>
        </View>

        {/* Reminder Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notification.reminderTiming')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('notification.alertMeBefore')}</Text>
              <Text style={styles.settingDescription}>{t('notification.alertMeBeforeDesc')}</Text>
            </View>
          </View>
          <View style={styles.reminderDaysContainer}>
            {[1, 2, 3, 7].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.reminderDayButton,
                  reminderDays === days && styles.reminderDayButtonActive
                ]}
                onPress={() => updateReminderDays(days)}
                disabled={!notificationsEnabled}
              >
                <Text style={[
                  styles.reminderDayText,
                  reminderDays === days && styles.reminderDayTextActive
                ]}>
                  {days} {days > 1 ? t('notification.days') : t('notification.day')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Notification */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <FontAwesome name="paper-plane" size={16} color={theme.primaryColor} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('notification.testNotification')}</Text>
              <Text style={styles.settingDescription}>{t('notification.testNotificationDesc')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.button, { opacity: notificationsEnabled ? 1 : 0.5 }]}
              onPress={sendTestNotification}
              disabled={!notificationsEnabled}
            >
              <Text style={styles.buttonText}>{t('notification.testButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
} 