import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomNav } from '../../../components/BottomNav';
import { useDatabase } from '../../../context/DatabaseContext';
import { FoodItemWithDetails } from '../../../database/models';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function CategoryDetailScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { foodItems, categories } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [categoryItems, setCategoryItems] = useState<FoodItemWithDetails[]>([]);
  const [category, setCategory] = useState<{ name: string; icon: string; color: string } | null>(null);

  useEffect(() => {
    const categoryId = typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : null;
    
    if (categoryId) {
      // Find the category
      const foundCategory = categories.find(c => c.id === categoryId);
      if (foundCategory) {
        // Set category with color based on ID
        const colors = {
          1: '#4CAF50', // Vegetables
          2: '#FF9800', // Fruits
          3: '#2196F3', // Dairy
          4: '#F44336', // Meat
          5: '#795548', // Snacks
          6: '#E91E63', // Desserts
          7: '#00BCD4', // Seafood
          8: '#FFC107', // Bread
        };
        setCategory({
          name: foundCategory.name,
          icon: foundCategory.icon as IconName,
          color: colors[categoryId as keyof typeof colors] || '#9E9E9E',
        });
      }

      // Filter items by category
      const items = foodItems.filter(item => item.category_id === categoryId);
      setCategoryItems(items);
    }
    setLoading(false);
  }, [id, categories, foodItems]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    statsIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statsTitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    statsCount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    foodItem: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    foodImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: `${theme.primaryColor}10`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    foodInfo: {
      flex: 1,
    },
    foodNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    foodName: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    quantity: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textSecondary,
      marginLeft: 8,
    },
    foodMeta: {
      flexDirection: 'column',
      gap: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginLeft: 8,
    },
    daysLeft: {
      fontSize: 14,
      fontWeight: '500',
    },
    fresh: {
      color: theme.successColor,
    },
    expiring: {
      color: theme.warningColor,
    },
    expired: {
      color: theme.dangerColor,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color={theme.textColor} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('categoryNotFound')}</Text>
          </View>
        </View>
      </View>
    );
  }

  const renderFoodItem = (item: FoodItemWithDetails) => (
    <View key={item.id} style={styles.foodItem}>
      <View style={styles.foodImage}>
        <FontAwesome name={category.icon} size={32} color={category.color} />
      </View>
      <View style={styles.foodInfo}>
        <View style={styles.foodNameRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.quantity}>×{item.quantity}</Text>
        </View>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <FontAwesome name="clock-o" size={16} color={theme.textSecondary} />
            <Text style={[
              styles.metaText,
              styles.daysLeft,
              item.days_until_expiry > 7 && styles.fresh,
              (item.days_until_expiry <= 7 && item.days_until_expiry > 0) && styles.expiring,
              item.days_until_expiry <= 0 && styles.expired,
            ]}>
              {item.days_until_expiry > 0 
                ? `${item.days_until_expiry} ${t('daysLeft')}`
                : `${Math.abs(item.days_until_expiry)} ${t('daysExpired')}`
              }
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome 
              name={item.location_icon as IconName || 'building'} 
              size={16} 
              color={theme.textSecondary} 
            />
            <Text style={styles.metaText}>{item.location_name}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <FontAwesome name={category.icon} size={24} color={category.color} />
          <Text style={styles.title}>{category.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={[styles.statsIcon, { backgroundColor: `${category.color}20` }]}>
            <FontAwesome name={category.icon} size={24} color={category.color} />
          </View>
          <Text style={styles.statsTitle}>{t('itemsIn')} {category.name}</Text>
          <Text style={styles.statsCount}>{categoryItems.length}</Text>
        </View>

        {categoryItems.length > 0 ? (
          categoryItems.map(renderFoodItem)
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome 
              name={category.icon} 
              size={48} 
              color={theme.textSecondary}
              style={styles.emptyStateIcon} 
            />
            <Text style={styles.emptyStateText}>
              {t('noItemsInCategory')}
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
} 