import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface CategoryIconProps {
  iconName?: string;
  size?: number;
}

// Category emoji mapping for FontAwesome icon names
const CATEGORY_EMOJIS: { [key: string]: string } = {
  // FontAwesome icon names from database
  leaf: '🥬',           // Vegetables
  heart: '🍇',          // Fruits (changed from 🍎 to 🍇)
  tint: '🥛',           // Dairy
  cutlery: '🥩',        // Meat
  star: '🍿',           // Snacks
  'birthday-cake': '🍰', // Desserts
  ship: '🐟',           // Seafood
  plus: '🍞',           // Bread
  
  // Additional common category names
  apple: '🍎',          // Keep apple as 🍎
  dairy: '🥛',
  fruits: '🍇',
  vegetables: '🥕',
  meat: '🥩',
  bread: '🍞',
  beverages: '🥤',
  snacks: '🍿',
  frozen: '🧊',
  canned: '🥫',
  seafood: '🐟',
  spices: '🌶️',
  dessert: '🍰',
  grains: '🌾',
  // Additional mappings for existing data
  vegetable: '🥕', // Map singular form
  fruit: '🍇',     // Map singular form
  beverage: '🥤',  // Map singular form
  default: '🍎',
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 24 }) => {
  // First try exact match, then lowercase match, then default
  let emoji = CATEGORY_EMOJIS.default;
  
  if (iconName) {
    // Try exact match first
    if (CATEGORY_EMOJIS[iconName]) {
      emoji = CATEGORY_EMOJIS[iconName];
    } 
    // Try lowercase match
    else if (CATEGORY_EMOJIS[iconName.toLowerCase()]) {
      emoji = CATEGORY_EMOJIS[iconName.toLowerCase()];
    }
    // Try partial matches for common patterns
    else if (iconName.toLowerCase().includes('fruit')) {
      emoji = '🍊';
    }
    else if (iconName.toLowerCase().includes('vegetable')) {
      emoji = '🥬';
    }
    else if (iconName.toLowerCase().includes('dairy')) {
      emoji = '🥛';
    }
    else if (iconName.toLowerCase().includes('meat')) {
      emoji = '🥩';
    }
    else if (iconName.toLowerCase().includes('bread') || iconName.toLowerCase().includes('grain')) {
      emoji = '🍞';
    }
    else if (iconName.toLowerCase().includes('drink') || iconName.toLowerCase().includes('beverage')) {
      emoji = '🥤';
    }
  }
  
  return (
    <Text style={[styles.emoji, { fontSize: size }]}>
      {emoji}
    </Text>
  );
};

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});

export default CategoryIcon; 