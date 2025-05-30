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
import { Category, FoodItem } from '../../database/models';

export default function CategoryDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    getCategoryById, 
    getFoodItemsByCategoryId,
    isLoading,
  } = useDatabase();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);

  // Load category and its food items
  useEffect(() => {
    const loadCategoryData = async () => {
      if (!id) return;
      
      try {
        const categoryId = parseInt(id);
        const categoryData = await getCategoryById(categoryId);
        
        if (categoryData) {
          setCategory(categoryData);
          const items = await getFoodItemsByCategoryId(categoryId);
          setFoodItems(items);
          setFilteredItems(items);
        } else {
          setError('Category not found');
        }
      } catch (err) {
        setError('Failed to load category data');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadCategoryData();
  }, [id, getCategoryById, getFoodItemsByCategoryId]);

  // Apply filters
  useEffect(() => {
    if (!foodItems.length) return;

    let filtered = [...foodItems];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(item => item.location_id === locationFilter);
    }
    
    setFilteredItems(filtered);
  }, [foodItems, statusFilter, locationFilter]);

  // Reset filters
  const resetFilters = () => {
    setStatusFilter(null);
    setLocationFilter(null);
  };

  // Show loading or error state
  if (loadingData || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Category Details" 
          showBackButton 
          onBackPress={() => router.back()} 
        />
        <EmptyState
          title="Loading..."
          message="Please wait while we load the category details."
          icon="spinner"
        />
      </View>
    );
  }

  if (error || !category) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Category Details" 
          showBackButton 
          onBackPress={() => router.back()} 
        />
        <EmptyState
          title="Error"
          message={error || 'Category not found'}
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
        title={category.name} 
        showBackButton 
        onBackPress={() => router.back()} 
      />
      
      {/* Category info */}
      <View style={[styles.categoryHeader, { backgroundColor: colors.card }]}>
        <View style={styles.categoryIconContainer}>
          <FontAwesome 
            name={category.icon || 'tag'} 
            size={24} 
            color={colors.primary} 
          />
        </View>
        <Text style={[styles.categoryDescription, { color: colors.text }]}>
          {foodItems.length} {foodItems.length === 1 ? 'item' : 'items'} in this category
        </Text>
      </View>
      
      {/* Filter bar */}
      <FilterBar
        onStatusChange={setStatusFilter}
        onLocationChange={setLocationFilter}
        onReset={resetFilters}
        selectedStatus={statusFilter}
        selectedLocationId={locationFilter}
        showCategoryFilter={false}
      />
      
      {/* Food items list */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title={foodItems.length === 0 ? "No Items" : "No Matching Items"}
          message={foodItems.length === 0 
            ? "There are no food items in this category yet." 
            : "Try changing your filters to see more items."}
          icon="tag"
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryDescription: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
});