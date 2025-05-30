import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDatabase } from '../../../context/DatabaseContext';
import { useTheme } from '../../../context/ThemeContext';
import { Header } from '../../../components/Header';
import { FoodItemForm } from '../../../components/FoodItemForm';
import { EmptyState } from '../../../components/EmptyState';
import { FoodItem } from '../../../database/models';

export default function EditFoodItemScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    categories, 
    locations, 
    getFoodItemById, 
    updateFoodItem,
    isLoading,
  } = useDatabase();
  
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  }, [id, getFoodItemById]);

  // Handle form submission
  const handleSubmit = async (values: Partial<FoodItem>) => {
    if (!foodItem?.id) return;
    
    if (!values.name || !values.category_id || !values.location_id || !values.expiry_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateFoodItem({ ...values, id: foodItem.id } as FoodItem);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to update food item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading or error state
  if (loadingItem || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Edit Food Item" 
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
          title="Edit Food Item" 
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Edit Food Item" 
        showBackButton 
        onBackPress={() => router.back()} 
      />
      
      <FoodItemForm
        initialValues={foodItem}
        categories={categories}
        locations={locations}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});