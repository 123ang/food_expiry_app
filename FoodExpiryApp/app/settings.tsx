import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { resetDatabase } = useDatabase();

  // Handle database reset
  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'Are you sure you want to reset the database? This will delete all your data and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database has been reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database');
            }
          } 
        },
      ]
    );
  };

  // Render a settings item
  const renderSettingsItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity 
      style={[styles.settingsItem, { borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <FontAwesome name={icon as any} size={20} color={colors.primary} />
      </View>
      
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingsItemSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      
      {rightComponent || (
        <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Settings" 
        showBackButton 
        onBackPress={() => router.back()} 
      />
      
      <ScrollView style={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          {renderSettingsItem(
            'adjust',
            'Theme',
            `Current: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}`,
            toggleTheme,
            <View style={styles.themeToggle}>
              <FontAwesome 
                name={theme === 'dark' ? 'moon-o' : 'sun-o'} 
                size={20} 
                color={colors.primary} 
              />
            </View>
          )}
        </Card>
        
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          
          {renderSettingsItem(
            'tags',
            'Categories',
            'Manage food categories',
            () => router.push('/categories')
          )}
          
          {renderSettingsItem(
            'map-marker',
            'Storage Locations',
            'Manage storage locations',
            () => router.push('/locations')
          )}
          
          {renderSettingsItem(
            'database',
            'Reset Database',
            'Delete all data and reset to defaults',
            handleResetDatabase
          )}
        </Card>
        
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          {renderSettingsItem(
            'info-circle',
            'About App',
            'Version 1.0.0',
            () => {}
          )}
          
          {renderSettingsItem(
            'question-circle',
            'Help & Support',
            'Get help using the app',
            () => {}
          )}
          
          {renderSettingsItem(
            'code',
            'Source Code',
            'View on GitHub',
            () => Linking.openURL('https://github.com/example/food-expiry-app')
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardMargin: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingsItemSubtitle: {
    fontSize: 14,
  },
  themeToggle: {
    padding: 8,
  },
});