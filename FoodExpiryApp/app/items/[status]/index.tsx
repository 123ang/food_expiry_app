import React, { useState } from 'react';
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

const statusInfo = {
  fresh: {
    name: 'Fresh Items',
    icon: 'check-circle' as IconName,
    color: '#4CAF50',
  },
  expiring: {
    name: 'Expiring Soon',
    icon: 'clock-o' as IconName,
    color: '#FF9800',
  },
  expired: {
    name: 'Expired',
    icon: 'warning' as IconName,
    color: '#F44336',
  },
};

// Sample data - replace with your actual data
const items = {
  fresh: [
    {
      id: 1,
      name: 'Apples',
      quantity: 6,
      daysLeft: 10,
      location: 'Fridge',
      locationIcon: 'building' as IconName,
      category: 'Fruits',
      categoryIcon: 'apple' as IconName,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120',
    },
  ],
  expiring: [
    {
      id: 2,
      name: 'Tomatoes',
      quantity: 5,
      daysLeft: 4,
      location: 'Fridge',
      locationIcon: 'building' as IconName,
      category: 'Vegetables',
      categoryIcon: 'leaf' as IconName,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120',
    },
  ],
  expired: [
    {
      id: 3,
      name: 'Yogurt',
      quantity: 1,
      daysLeft: -2,
      location: 'Fridge',
      locationIcon: 'building' as IconName,
      category: 'Dairy',
      categoryIcon: 'glass' as IconName,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
    },
  ],
};

export default function ItemStatusScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { status } = useLocalSearchParams();
  
  const currentStatus = typeof status === 'string' ? status : Array.isArray(status) ? status[0] : 'fresh';
  const statusData = statusInfo[currentStatus as keyof typeof statusInfo];
  const currentItems = items[currentStatus as keyof typeof items] || [];

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
      backgroundColor: `${statusData.color}20`,
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
  });

  const renderFoodItem = (item: any) => {
    const [imageError, setImageError] = useState(false);

    return (
      <View key={item.id} style={styles.foodItem}>
        {!imageError ? (
          <Image
            source={{ uri: item.image }}
            style={styles.foodImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <FontAwesome name="cutlery" size={32} color={theme.primaryColor} />
          </View>
        )}
        <View style={styles.foodInfo}>
          <View style={styles.foodNameRow}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.quantity}>x{item.quantity}</Text>
          </View>
          <View style={styles.foodMeta}>
            <View style={styles.metaItem}>
              <FontAwesome name={item.categoryIcon} size={16} color={theme.textSecondary} />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name={item.locationIcon} size={16} color={theme.textSecondary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="calendar" size={16} color={theme.textSecondary} />
              <Text style={styles.metaText}>
                {item.daysLeft > 0
                  ? `${item.daysLeft} days left`
                  : item.daysLeft === 0
                  ? 'Expires today'
                  : `Expired ${Math.abs(item.daysLeft)} days ago`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <FontAwesome name={statusData.icon} size={24} color={statusData.color} />
          <Text style={styles.title}>{statusData.name}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <FontAwesome name={statusData.icon} size={24} color={statusData.color} />
          </View>
          <Text style={styles.statsTitle}>Total Items</Text>
          <Text style={styles.statsCount}>{currentItems.length}</Text>
        </View>
        
        {currentItems.map(renderFoodItem)}
      </ScrollView>
      
      <BottomNav />
    </View>
  );
} 