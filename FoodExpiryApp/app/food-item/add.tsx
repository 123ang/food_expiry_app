import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { FoodItemForm } from '../../components/FoodItemForm';
import { FoodItem } from '../../database/models';

export default function AddFoodItemScreen() {
  const { colors } = useTheme();
  const { categories, locations, createFoodItem } = useDatabase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (values: Partial<FoodItem>) => {
    if (!values.name || !values.category_id || !values.location_id || !values.expiry_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createFoodItem(values as FoodItem);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add food item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Add Food Item" 
        showBackButton 
        onBackPress={() => router.back()} 
      />
      
      <FoodItemForm
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