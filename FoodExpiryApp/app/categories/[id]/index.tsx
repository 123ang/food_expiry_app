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
import CategoryIcon from '../../../components/CategoryIcon';
import LocationIcon from '../../../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

// Separate component for food item to avoid hooks violation
const FoodItemCard: React.FC<{ 
  item: FoodItemWithDetails; 
  onPress: () => void; 
  theme: any;
  styles: any;
}> = ({ item, onPress, theme, styles }) => {
  const [imageError, setImageError] = useState(false);

  // Determine status icon and color based on days until expiry
  const getStatusInfo = () => {
    if (item.days_until_expiry <= 0) {
      return { icon: '⚠️', color: '#F44336', text: 'Expired' };
    } else if (item.days_until_expiry <= 5) {
      return { icon: '⏰', color: '#FF9800', text: 'Expiring' };
    } else {
      return { icon: '✅', color: '#4CAF50', text: 'Fresh' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity style={styles.foodItem} onPress={onPress}>
      {item.image_uri && !imageError ? (
        <Image
          source={{ uri: item.image_uri }}
          style={styles.foodImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <CategoryIcon iconName={item.category_icon} size={32} />
        </View>
      )}
      <View style={styles.foodInfo}>
        <View style={styles.foodNameRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.statusContainer}>
            <Text style={{ fontSize: 16 }}>{statusInfo.icon}</Text>
            <Text style={styles.quantity}>x{item.quantity}</Text>
          </View>
        </View>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <LocationIcon iconName={item.location_icon} size={16} />
            <Text style={styles.metaText}>{item.location_name || 'No location'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text style={[styles.metaText, { color: statusInfo.color }]}>
              {item.days_until_expiry > 0
                ? `${item.days_until_expiry} days left`
                : item.days_until_expiry === 0
                ? 'Expires today'
                : `Expired ${Math.abs(item.days_until_expiry)} days ago`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function CategoryDetailScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
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
  }, [id, foodItems, language]);

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
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 50,
      backgroundColor: theme.cardBackground,
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
      justifyContent: 'center',
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
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      minHeight: 120,
    },
    statsIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statsTitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
      lineHeight: 18,
    },
    statsCount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
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
      marginLeft: 8,
      color: theme.textSecondary,
      fontSize: 14,
    },
    placeholderImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
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
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>◀</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <CategoryIcon iconName={category?.icon} size={24} />
          <Text style={styles.title}>{category?.name || 'Unknown Category'}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={[styles.statsIcon, { backgroundColor: `${category?.color || theme.primaryColor}20` }]}>
            <CategoryIcon iconName={category?.icon} size={24} />
          </View>
          <Text style={styles.statsTitle}>{t('detail.itemsIn')} {category?.name || 'Category'}</Text>
          <Text style={styles.statsCount}>{categoryItems.length}</Text>
        </View>

        {categoryItems.length > 0 ? (
          categoryItems.map((item) => (
            <FoodItemCard 
              key={item.id} 
              item={item} 
              onPress={() => router.push(`/item/${item.id}`)}
              theme={theme}
              styles={styles}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyStateText}>
              {t('detail.noItemsYet')}
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
} 