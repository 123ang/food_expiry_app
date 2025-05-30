import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { FoodItemCard } from '../../components/FoodItemCard';
import { EmptyState } from '../../components/EmptyState';
import { FilterBar } from '../../components/FilterBar';
import { Location, FoodItem } from '../../database/models';

export default function LocationDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    getLocationById, 
    getFoodItemsByLocation,
    isLoading,
  } = useDatabase();
  
  const [location, setLocation] = useState<Location | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  // Load location and its food items
  useEffect(() => {
    const loadLocationData = async () => {
      if (!id) return;
      
      try {
        const locationId = parseInt(id);
        const locationData = await getLocationById(locationId);
        
        if (locationData) {
          setLocation(locationData);
          const items = await getFoodItemsByLocation(locationId);
          setFoodItems(items);
          setFilteredItems(items);
        } else {
          setError('Location not found');
        }
      } catch (err) {
        setError('Failed to load location data');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadLocationData();
  }, [id, getLocationById, getFoodItemsByLocation]);

  // Apply filters
  useEffect(() => {
    if (!foodItems.length) return;

    let filtered = [...foodItems];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category_id === categoryFilter);
    }
    
    setFilteredItems(filtered);
  }, [foodItems, statusFilter, categoryFilter]);

  // Reset filters
  const resetFilters = () => {
    setStatusFilter(null);
    setCategoryFilter(null);
  };

  // Show loading or error state
  if (loadingData || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Location Details" 
          showBackButton 
          onBackPress={() => router.back()} 
        />
        <EmptyState
          title="Loading..."
          message="Please wait while we load the location details."
          icon="spinner"
        />
      </View>
    );
  }

  if (error || !location) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Location Details" 
          showBackButton 
          onBackPress={() => router.back()} 
        />
        <EmptyState
          title="Error"
          message={error || 'Location not found'}
          icon="exclamation-circle"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={location.name} 
        showBackButton 
        onBackPress={() => router.back()} 
      />
      
      {/* Location info */}
      <View style={[styles.locationHeader, { backgroundColor: colors.card }]}>
        <View style={styles.locationIconContainer}>
          <FontAwesome 
            name={location.icon || 'map-marker'} 
            size={24} 
            color={colors.primary} 
          />
        </View>
        <Text style={[styles.locationDescription, { color: colors.text }]}>
          {foodItems.length} {foodItems.length === 1 ? 'item' : 'items'} in this location
        </Text>
      </View>
      
      {/* Filter bar */}
      <FilterBar
        onStatusChange={setStatusFilter}
        onCategoryChange={setCategoryFilter}
        onReset={resetFilters}
        selectedStatus={statusFilter}
        selectedCategoryId={categoryFilter}
        showLocationFilter={false}
      />
      
      {/* Food items list */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title={foodItems.length === 0 ? "No Items" : "No Matching Items"}
          message={foodItems.length === 0 
            ? "There are no food items in this location yet." 
            : "Try changing your filters to see more items."}
          icon="map-marker"
          actionLabel={foodItems.length === 0 ? "Add Food Item" : "Reset Filters"}
          onAction={foodItems.length === 0 
            ? () => router.push('/food-item/add')
            : resetFilters}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
            <FoodItemCard
              item={item}
              onPress={() => router.push(`/food-item/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  locationDescription: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
});