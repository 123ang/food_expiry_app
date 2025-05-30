import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomNav } from '../../../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data - in real app, this would come from your database
const categories = {
  1: {
    name: 'Vegetables',
    icon: 'leaf' as IconName,
    color: '#4CAF50',
    items: [
      {
        id: 1,
        name: 'Tomatoes',
        quantity: 5,
        daysLeft: 4,
        location: 'Fridge',
        locationIcon: 'building' as IconName,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120',
        status: 'expiring_soon',
      },
      {
        id: 2,
        name: 'Lettuce',
        quantity: 1,
        daysLeft: -1,
        location: 'Fridge',
        locationIcon: 'building' as IconName,
        image: 'https://images.unsplash.com/photo-1621844504531-0e5c3cf2b3d7?w=120',
        status: 'expired',
      },
    ],
  },
  2: {
    name: 'Dairy',
    icon: 'glass' as IconName,
    color: '#2196F3',
    items: [
      {
        id: 3,
        name: 'Milk',
        quantity: 2,
        daysLeft: 2,
        location: 'Fridge',
        locationIcon: 'building' as IconName,
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
        status: 'expiring_soon',
      },
      {
        id: 4,
        name: 'Yogurt',
        quantity: 1,
        daysLeft: -2,
        location: 'Fridge',
        locationIcon: 'building' as IconName,
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
        status: 'expired',
      },
    ],
  },
  3: {
    name: 'Fruits',
    icon: 'apple' as IconName,
    color: '#FF9800',
    items: [
      {
        id: 5,
        name: 'Apples',
        quantity: 6,
        daysLeft: 10,
        location: 'Fridge',
        locationIcon: 'building' as IconName,
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120',
        status: 'fresh',
      },
    ],
  },
  4: {
    name: 'Meat',
    icon: 'cutlery' as IconName,
    color: '#F44336',
    items: [
      {
        id: 6,
        name: 'Chicken',
        quantity: 2,
        daysLeft: 3,
        location: 'Freezer',
        locationIcon: 'snowflake-o' as IconName,
        image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=120',
        status: 'fresh',
      },
    ],
  },
};

export default function CategoryDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const categoryId = typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : null;
  const category = categoryId ? categories[categoryId as keyof typeof categories] : null;
  const items = category?.items || [];

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
  });

  const renderFoodItem = (item: any) => (
    <View key={item.id} style={styles.foodItem}>
      <Image source={{ uri: item.image }} style={styles.foodImage} />
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
              item.daysLeft > 7 && styles.fresh,
              (item.daysLeft <= 7 && item.daysLeft > 0) && styles.expiring,
              item.daysLeft <= 0 && styles.expired,
            ]}>
              {item.daysLeft > 0 
                ? `${item.daysLeft} days left`
                : `${Math.abs(item.daysLeft)} days expired`
              }
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name={item.locationIcon} size={16} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        </View>
      </View>
    </View>
  );

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
            <Text style={styles.title}>Category not found</Text>
          </View>
        </View>
      </View>
    );
  }

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
          <FontAwesome name={category.icon} size={24} color={theme.primaryColor} />
          <Text style={styles.title}>{category.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <FontAwesome name={category.icon} size={24} color={theme.primaryColor} />
          </View>
          <Text style={styles.statsTitle}>Items in {category.name}</Text>
          <Text style={styles.statsCount}>{items.length}</Text>
        </View>

        {items.length > 0 ? (
          items.map(renderFoodItem)
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome 
              name={category.icon}
              size={48} 
              color={theme.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateText}>
              No items in {category.name}
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
} 