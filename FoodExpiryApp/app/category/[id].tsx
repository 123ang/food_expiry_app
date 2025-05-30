import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { daysDifference, getCurrentDate } from '../../database/database';

type IconName = keyof typeof FontAwesome.glyphMap;

// Predefined categories with icons
const CATEGORIES = [
  { id: 1, name: 'Vegetables', icon: 'leaf' as IconName },
  { id: 2, name: 'Fruits', icon: 'apple' as IconName },
  { id: 3, name: 'Dairy', icon: 'glass' as IconName },
  { id: 4, name: 'Meat', icon: 'cutlery' as IconName },
  { id: 5, name: 'Snacks', icon: 'coffee' as IconName },
  { id: 6, name: 'Desserts', icon: 'birthday-cake' as IconName },
  { id: 7, name: 'Seafood', icon: 'anchor' as IconName },
  { id: 8, name: 'Bread', icon: 'shopping-basket' as IconName },
];

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const { foodItems, refreshAll } = useDatabase();
  const [categoryItems, setCategoryItems] = useState<any[]>([]);
  const category = CATEGORIES.find(c => c.id === Number(id));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    backButton: {
      padding: 8,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    content: {
      flex: 1,
    },
    statsCard: {
      margin: 16,
      padding: 16,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      alignItems: 'center',
    },
    statsTitle: {
      fontSize: 16,
      color: '#666',
    },
    statsCount: {
      fontSize: 32,
      fontWeight: 'bold',
      marginTop: 8,
    },
    itemsList: {
      padding: 16,
    },
    foodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#fff',
      borderRadius: 8,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    foodImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    defaultImage: {
      backgroundColor: `${theme.primaryColor}10`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    foodInfo: {
      flex: 1,
      marginLeft: 12,
    },
    foodName: {
      fontSize: 16,
      fontWeight: '500',
    },
    foodMeta: {
      flexDirection: 'row',
      marginTop: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    metaText: {
      marginLeft: 4,
      fontSize: 12,
      color: '#666',
    },
    actionButton: {
      padding: 8,
    },
    emptyText: {
      textAlign: 'center',
      color: '#666',
      marginTop: 32,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      await refreshAll();
      const items = foodItems.filter(item => item.category_id === Number(id));
      setCategoryItems(items);
    };
    loadData();
  }, [id]);

  if (!category) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleEdit = (itemId: number) => {
    router.push(`/edit/${itemId}`);
  };

  const handleBack = () => {
    router.back();
  };

  const renderFoodItem = (item: any) => {
    const daysLeft = daysDifference(getCurrentDate(), item.expiry_date);
    
    return (
      <View key={item.id} style={styles.foodItem}>
        {item.image_uri ? (
          <Image 
            source={{ uri: item.image_uri }}
            style={styles.foodImage} 
          />
        ) : (
          <View style={[styles.foodImage, styles.defaultImage]}>
            <FontAwesome name="cutlery" size={20} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.foodMeta}>
            <View style={styles.metaItem}>
              <FontAwesome name="clock-o" size={14} color={theme.textSecondary} />
              <Text style={styles.metaText}>{daysLeft} days left</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name={item.location_icon || 'map-marker'} size={14} color={theme.textSecondary} />
              <Text style={styles.metaText}>{item.location_name}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEdit(item.id)}
        >
          <FontAwesome name="pencil" size={14} color={theme.primaryColor} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <FontAwesome name={category.icon} size={24} color={theme.primaryColor} />
          <Text style={styles.title}>{category.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Items in {category.name}</Text>
          <Text style={styles.statsCount}>{categoryItems.length}</Text>
        </View>

        <View style={styles.itemsList}>
          {categoryItems.length > 0 ? (
            categoryItems.map(renderFoodItem)
          ) : (
            <Text style={styles.emptyText}>No items in this category</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 