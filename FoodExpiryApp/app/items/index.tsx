import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function ItemsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const statusCategories = [
    {
      id: 'fresh',
      name: t('status.freshItems'),
      icon: 'check-circle' as IconName,
      color: '#4CAF50',
    },
    {
      id: 'expiring',
      name: t('status.expiring'),
      icon: 'clock-o' as IconName,
      color: '#FF9800',
    },
    {
      id: 'expired',
      name: t('status.expired'),
      icon: 'warning' as IconName,
      color: '#F44336',
    },
  ];

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
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('status.items')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {statusCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.card}
            onPress={() => router.push(`/items/${category.id}`)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              <FontAwesome name={category.icon} size={24} color={category.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{category.name}</Text>
              <Text style={styles.cardSubtitle}>{t('status.viewAll')}</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <BottomNav />
    </View>
  );
} 