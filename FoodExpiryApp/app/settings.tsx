import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    settingInfo: {
      flex: 1,
      marginLeft: 12,
    },
    settingTitle: {
      fontSize: 16,
      color: theme.textColor,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chevron: {
      marginLeft: 8,
    },
  });

  const settings = [
    {
      id: 'theme',
      icon: 'moon-o' as IconName,
      title: 'Dark Mode',
      description: 'Switch between light and dark theme',
      type: 'switch' as const,
      value: isDark,
      onValueChange: toggleTheme,
    },
    {
      id: 'notifications',
      icon: 'bell' as IconName,
      title: 'Notifications',
      description: 'Manage notification preferences',
      type: 'link' as const,
    },
    {
      id: 'locations',
      icon: 'map-marker' as IconName,
      title: 'Storage Locations',
      description: 'Manage your storage locations',
      type: 'link' as const,
    },
    {
      id: 'categories',
      icon: 'tags' as IconName,
      title: 'Categories',
      description: 'Manage food categories',
      type: 'link' as const,
    },
    {
      id: 'backup',
      icon: 'cloud' as IconName,
      title: 'Backup & Sync',
      description: 'Manage your data backup',
      type: 'link' as const,
    },
    {
      id: 'about',
      icon: 'info-circle' as IconName,
      title: 'About',
      description: 'App information and help',
      type: 'link' as const,
    },
  ];

  const renderSettingItem = (setting: any) => (
    <TouchableOpacity
      key={setting.id}
      style={styles.settingItem}
      onPress={() => {
        if (setting.type === 'link') {
          // TODO: Navigate to setting detail screen
        }
      }}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={setting.icon} size={16} color={theme.primaryColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      {setting.type === 'switch' ? (
        <Switch
          value={setting.value}
          onValueChange={setting.onValueChange}
          trackColor={{ false: theme.borderColor, true: theme.primaryColor }}
          thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : setting.value ? '#FFFFFF' : theme.cardBackground}
        />
      ) : (
        <FontAwesome
          name={'chevron-right' as IconName}
          size={16}
          color={theme.textSecondary}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {settings.slice(0, 2).map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization</Text>
          {settings.slice(2, 4).map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          {settings.slice(4).map(renderSettingItem)}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
} 