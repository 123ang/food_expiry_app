import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data - replace with your actual data
const categories = [
  {
    id: 1,
    name: 'Vegetables',
    icon: 'leaf' as IconName,
    color: '#4CAF50',
    itemCount: 8,
  },
  {
    id: 2,
    name: 'Dairy',
    icon: 'glass' as IconName,
    color: '#2196F3',
    itemCount: 5,
  },
  {
    id: 3,
    name: 'Fruits',
    icon: 'apple' as IconName,
    color: '#FF9800',
    itemCount: 6,
  },
  {
    id: 4,
    name: 'Meat',
    icon: 'cutlery' as IconName,
    color: '#F44336',
    itemCount: 3,
  },
];

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.card}
            onPress={() => router.push(`/categories/${category.id}`)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              <FontAwesome name={category.icon} size={24} color={category.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{category.name}</Text>
              <Text style={styles.cardSubtitle}>{category.itemCount} items</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <BottomNav />
    </View>
  );
} 