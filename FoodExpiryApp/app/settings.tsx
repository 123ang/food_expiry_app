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
import { useLanguage } from '../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

type SettingItem = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  type: 'switch' | 'link' | 'language';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const settings: SettingItem[] = [
    {
      id: 'language',
      icon: 'language',
      title: t('language'),
      description: t('languageDescription'),
      type: 'language',
    },
    {
      id: 'theme',
      icon: 'moon-o',
      title: t('darkMode'),
      description: t('darkModeDescription'),
      type: 'switch',
      value: isDark,
      onValueChange: toggleTheme,
    },
    {
      id: 'notifications',
      icon: 'bell',
      title: t('notifications'),
      description: t('notificationsDescription'),
      type: 'link',
    },
    {
      id: 'locations',
      icon: 'map-marker',
      title: t('storageLocations'),
      description: t('storageLocationsDescription'),
      type: 'link',
    },
    {
      id: 'categories',
      icon: 'tags',
      title: t('categories'),
      description: t('categoriesDescription'),
      type: 'link',
    },
    {
      id: 'backup',
      icon: 'cloud',
      title: t('backupSync'),
      description: t('backupSyncDescription'),
      type: 'link',
    },
    {
      id: 'about',
      icon: 'info-circle',
      title: t('about'),
      description: t('aboutDescription'),
      type: 'link',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingTop: Platform.OS === 'ios' ? 48 : 24,
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
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.borderColor,
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
    languageOptions: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    languageText: {
      fontSize: 16,
      color: theme.textColor,
    },
    languageSelected: {
      color: theme.primaryColor,
    },
    chevron: {
      marginLeft: 8,
    },
  });

  const renderSettingItem = (item: SettingItem, index: number, total: number) => {
    const isLast = index === total - 1;

    if (item.type === 'language') {
      return (
        <View key={item.id}>
          <View style={[styles.settingItem]}>
            <View style={styles.settingIcon}>
              <FontAwesome name={item.icon} size={16} color={theme.primaryColor} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingDescription}>{item.description}</Text>
            </View>
          </View>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => setLanguage('en')}
            >
              <Text style={[
                styles.languageText,
                language === 'en' && styles.languageSelected
              ]}>
                {t('english')}
              </Text>
              {language === 'en' && (
                <FontAwesome name="check" size={16} color={theme.primaryColor} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => setLanguage('zh')}
            >
              <Text style={[
                styles.languageText,
                language === 'zh' && styles.languageSelected
              ]}>
                {t('chinese')}
              </Text>
              {language === 'zh' && (
                <FontAwesome name="check" size={16} color={theme.primaryColor} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          isLast && styles.settingItemLast,
        ]}
        onPress={() => {
          if (item.type === 'link') {
            router.push(`/${item.id}`);
          }
        }}
      >
        <View style={styles.settingIcon}>
          <FontAwesome name={item.icon} size={16} color={theme.primaryColor} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#767577', true: `${theme.primaryColor}50` }}
            thumbColor={item.value ? theme.primaryColor : '#f4f3f4'}
          />
        ) : item.type === 'link' && (
          <FontAwesome
            name="chevron-right"
            size={16}
            color={theme.textSecondary}
            style={styles.chevron}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings')}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            {settings.map((item, index) => renderSettingItem(item, index, settings.length))}
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </>
  );
} 