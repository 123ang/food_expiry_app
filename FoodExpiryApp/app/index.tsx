import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDatabase } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';
import { DashboardStats } from '../components/DashboardStats';
import { FoodItemCard } from '../components/FoodItemCard';
import { EmptyState } from '../components/EmptyState';
import { FilterBar } from '../components/FilterBar';
import { FoodItemWithDetails } from '../database/models';

type FilterStatus = 'all' | 'expired' | 'expiring_soon' | 'fresh';

export default function HomeScreen() {
  const { colors, toggleTheme } = useTheme();
  const { 
    foodItems, 
    categories, 
    locations, 
    isLoading, 
    stats,
    getFoodItems,
    deleteFoodItem,
  } = useDatabase();

  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [filteredItems, setFilteredItems] = useState<FoodItemWithDetails[]>([]);

  // Apply filters when dependencies change
  useEffect(() => {
    let filtered = [...foodItems];
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }
    
    // Filter by category
    if (selectedCategoryId !== null) {
      filtered = filtered.filter(item => item.category_id === selectedCategoryId);
    }
    
    // Filter by location
    if (selectedLocationId !== null) {
      filtered = filtered.filter(item => item.location_id === selectedLocationId);
    }
    
    setFilteredItems(filtered);
  }, [foodItems, selectedStatus, selectedCategoryId, selectedLocationId]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedStatus('all');
    setSelectedCategoryId(null);
    setSelectedLocationId(null);
  };

  // Handle food item deletion
  const handleDeleteItem = (item: FoodItemWithDetails) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFoodItem(item.id!);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          } 
        },
      ]
    );
  };

  // Navigate to food item details
  const navigateToItemDetails = (item: FoodItemWithDetails) => {
    router.push(`/food-item/${item.id}`);
  };

  // Navigate to edit food item
  const navigateToEditItem = (item: FoodItemWithDetails) => {
    router.push(`/food-item/edit/${item.id}`);
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (foodItems.length === 0) {
      return (
        <EmptyState
          title="No Food Items"
          message="Start tracking your food by adding items to your inventory."
          icon="shopping-basket"
          actionLabel="Add Food Item"
          onAction={() => router.push('/food-item/add')}
        />
      );
    }
    
    if (filteredItems.length === 0) {
      return (
        <EmptyState
          title="No Matching Items"
          message="Try changing your filters to see more items."
          icon="filter"
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Food Expiry Tracker</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={toggleTheme}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="adjust" size={22} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.push('/settings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="cog" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <DashboardStats
        totalCount={stats.total}
        expiredCount={stats.expired}
        expiringSoonCount={stats.expiringSoon}
        freshCount={stats.fresh}
        onPressTotal={() => setSelectedStatus('all')}
        onPressExpired={() => setSelectedStatus('expired')}
        onPressExpiringSoon={() => setSelectedStatus('expiring_soon')}
        onPressFresh={() => setSelectedStatus('fresh')}
      />
      
      <FilterBar
        selectedStatus={selectedStatus}
        selectedCategoryId={selectedCategoryId}
        selectedLocationId={selectedLocationId}
        categories={categories}
        locations={locations}
        onStatusChange={setSelectedStatus}
        onCategoryChange={setSelectedCategoryId}
        onLocationChange={setSelectedLocationId}
        onResetFilters={resetFilters}
      />
      
      {renderEmptyState() || (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
            <FoodItemCard
              item={item}
              onPress={() => navigateToItemDetails(item)}
              onEdit={() => navigateToEditItem(item)}
              onDelete={() => handleDeleteItem(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/food-item/add')}
      >
        <FontAwesome name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});