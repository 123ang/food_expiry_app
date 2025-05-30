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
import { Stack } from 'expo-router';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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
    sectionHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionTextStyle: {
      fontSize: 16,
      color: theme.textColor,
    },
    optionTextSelected: {
      color: theme.primaryColor,
    },
    optionIcon: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings')}</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Language Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('language')}</Text>
            </View>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setLanguage('en')}
            >
              <Text style={[
                styles.optionTextStyle,
                language === 'en' && styles.optionTextSelected
              ]}>
                {t('english')}
              </Text>
              {language === 'en' && (
                <View style={styles.optionIcon}>
                  <FontAwesome name="check" size={16} color={theme.primaryColor} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setLanguage('zh')}
            >
              <Text style={[
                styles.optionTextStyle,
                language === 'zh' && styles.optionTextSelected
              ]}>
                {t('chinese')}
              </Text>
              {language === 'zh' && (
                <View style={styles.optionIcon}>
                  <FontAwesome name="check" size={16} color={theme.primaryColor} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Theme Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('theme')}</Text>
            </View>
            <View style={styles.option}>
              <Text style={styles.optionTextStyle}>{t('darkMode')}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: `${theme.primaryColor}50` }}
                thumbColor={isDark ? theme.primaryColor : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </>
  );
} 