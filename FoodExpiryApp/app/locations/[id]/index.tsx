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
import { useDatabase } from '../../../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { BottomNav } from '../../../components/BottomNav';
import { FoodItemWithDetails } from '../../../database/models';

type IconName = keyof typeof FontAwesome.glyphMap;

const LOCATION_COLORS = {
  'Fridge': '#2196F3',
  'Pantry': '#9C27B0',
  'Freezer': '#00BCD4',
  'Cabinet': '#FF9800',
};

export default function LocationDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { locations, foodItems, refreshAll } = useDatabase();
  
  const locationId = typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : null;
  const location = locations.find(loc => loc.id === locationId);
  const locationItems = foodItems.filter(item => item.location_id === locationId);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshAll();
    }, [])
  );

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
      backgroundColor: location ? `${LOCATION_COLORS[location.name as keyof typeof LOCATION_COLORS]}20` : theme.primaryColor,
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
    placeholderImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: `${theme.primaryColor}20`,
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
      marginLeft: 8,
      fontSize: 14,
      color: theme.textSecondary,
    },
    expiryText: {
      marginLeft: 8,
      fontSize: 14,
    },
    expiringSoon: {
      color: theme.warningColor,
    },
    expired: {
      color: theme.dangerColor,
    },
    fresh: {
      color: theme.successColor,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  const renderFoodItem = (item: FoodItemWithDetails) => (
    <View key={item.id} style={styles.foodItem}>
      {item.image_uri ? (
        <Image source={{ uri: item.image_uri }} style={styles.foodImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <FontAwesome name={item.category_icon as IconName} size={32} color={theme.primaryColor} />
        </View>
      )}
      <View style={styles.foodInfo}>
        <View style={styles.foodNameRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.quantity}>x{item.quantity}</Text>
        </View>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <FontAwesome name={item.category_icon as IconName} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.category_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name="clock-o" size={14} color={theme.textSecondary} />
            <Text 
              style={[
                styles.expiryText,
                item.days_until_expiry <= 0 && styles.expired,
                item.days_until_expiry > 0 && item.days_until_expiry <= 5 && styles.expiringSoon,
                item.days_until_expiry > 5 && styles.fresh,
              ]}
            >
              {item.days_until_expiry} days left
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!location) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.title}>Location not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <FontAwesome name={location.icon as IconName} size={24} color={theme.textColor} />
          <Text style={styles.title}>{location.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <FontAwesome name={location.icon as IconName} size={24} color={LOCATION_COLORS[location.name as keyof typeof LOCATION_COLORS]} />
          </View>
          <Text style={styles.statsTitle}>Items in {location.name}</Text>
          <Text style={styles.statsCount}>{locationItems.length}</Text>
        </View>

        {locationItems.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="inbox" size={48} color={theme.textSecondary} />
            <Text style={styles.emptyStateText}>
              No items in {location.name} yet.{'\n'}
              Add some items to see them here!
            </Text>
          </View>
        ) : (
          locationItems.map(renderFoodItem)
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
} 