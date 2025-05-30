import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/EmptyState';
import { FoodItemWithDetails } from '../../database/models';
import { formatDate } from '../../utils/dateUtils';
import { getStatusColor, getStatusName } from '../../utils/statusUtils';

export default function FoodItemDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    getFoodItemById, 
    getCategoryById, 
    getLocationById, 
    deleteFoodItem,
    isLoading,
  } = useDatabase();
  
  const [foodItem, setFoodItem] = useState<FoodItemWithDetails | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load food item data
  useEffect(() => {
    const loadFoodItem = async () => {
      if (!id) return;
      
      try {
        const item = await getFoodItemById(parseInt(id));
        if (item) {
          setFoodItem(item);
          
          // Get category and location names
          if (item.category_id) {
            const category = await getCategoryById(item.category_id);
            if (category) setCategoryName(category.name);
          }
          
          if (item.location_id) {
            const location = await getLocationById(item.location_id);
            if (location) setLocationName(location.name);
          }
        } else {
          setError('Food item not found');
        }
      } catch (err) {
        setError('Failed to load food item');
      } finally {
        setLoadingItem(false);
      }
    };
    
    loadFoodItem();
  }, [id, getFoodItemById, getCategoryById, getLocationById]);

  // Handle delete
  const handleDelete = () => {
    if (!foodItem?.id) return;
    
    Alert.alert(
      'Delete Food Item',
      `Are you sure you want to delete "${foodItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFoodItem(foodItem.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete food item');
            }
          } 
        },
      ]
    );
  };

  // Show loading or error state
  if (loadingItem || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Food Item Details" 
          showBackButton 
          onBackPress={() => router.back()} 
        />
        <EmptyState
          title="Loading..."
          message="Please wait while we load the food item details."
          icon="spinner"
        />
      </View>
    );
  }

  if (error || !foodItem) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Food Item Details" 
          showBackButton 
          onBackPress={() => router.back()} 
        />
        <EmptyState
          title="Error"
          message={error || 'Food item not found'}
          icon="exclamation-circle"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // Calculate status
  const status = foodItem.status || 'fresh';
  const statusColor = getStatusColor(status, colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Food Item Details" 
        showBackButton 
        onBackPress={() => router.back()} 
        rightIcon="pencil"
        onRightIconPress={() => router.push(`/food-item/edit/${foodItem.id}`)}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Food image */}
        {foodItem.image_uri ? (
          <Image source={{ uri: foodItem.image_uri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.card }]}>
            <FontAwesome name="image" size={50} color={colors.text} />
            <Text style={[styles.placeholderText, { color: colors.text }]}>No Image</Text>
          </View>
        )}
        
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{getStatusName(status)}</Text>
        </View>
        
        {/* Food details */}
        <Card style={styles.detailsCard}>
          <Text style={[styles.foodName, { color: colors.text }]}>{foodItem.name}</Text>
          
          <View style={styles.detailRow}>
            <FontAwesome name="tag" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Category:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{categoryName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome name="map-marker" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Location:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{locationName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome name="calendar" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={[styles.detailLabel, { color: colors.text }]}>Expiry Date:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(foodItem.expiry_date)}
            </Text>
          </View>
          
          {foodItem.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.notesLabel, { color: colors.text }]}>Notes:</Text>
              <Text style={[styles.notesText, { color: colors.text }]}>{foodItem.notes}</Text>
            </View>
          )}
        </Card>
        
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <Button 
            title="Edit" 
            icon="pencil"
            onPress={() => router.push(`/food-item/edit/${foodItem.id}`)}
            style={styles.editButton}
          />
          <Button 
            title="Delete" 
            icon="trash"
            onPress={handleDelete}
            style={styles.deleteButton}
            color="danger"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailsCard: {
    padding: 16,
    marginBottom: 16,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
  },
});