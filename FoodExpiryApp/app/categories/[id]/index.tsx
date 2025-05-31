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
  const { foodItems, categories, getCategory } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [categoryItems, setCategoryItems] = useState<FoodItemWithDetails[]>([]);
  const [category, setCategory] = useState<{ name: string; icon: string; color: string } | null>(null);

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

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        setLoading(true);
        const categoryId = typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : null;
        
        if (categoryId) {
          // Find the category
          const foundCategory = await getCategory(categoryId);
          if (foundCategory) {
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
      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [id, foodItems]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    categoryIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: category?.color || theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    categoryName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    itemCount: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 4,
    },
    itemList: {
      flex: 1,
    },
    itemCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    itemDetails: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.categoryIcon}>
            <FontAwesome
              name={(category?.icon || 'question-circle') as IconName}
              size={30}
              color="#FFFFFF"
            />
          </View>
          <View>
            <Text style={styles.categoryName}>{category?.name || 'Unknown Category'}</Text>
            <Text style={styles.itemCount}>
              {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        <View style={styles.itemList}>
          {categoryItems.length > 0 ? (
            categoryItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => router.push(`/items/${item.id}`)}
              >
                <FontAwesome
                  name={(item.category_icon || 'circle') as IconName}
                  size={24}
                  color={category?.color || theme.primaryColor}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    Expires in {item.days_until_expiry} days
                  </Text>
                </View>
                <FontAwesome
                  name="chevron-right"
                  size={16}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome
                name="inbox"
                size={48}
                color={theme.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No items in this category yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 