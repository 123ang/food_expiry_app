import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface CategoryIconProps {
  iconName?: string;
  size?: number;
}

// Category emoji mapping for FontAwesome icon names and direct emojis
const CATEGORY_EMOJIS: { [key: string]: string } = {
  // New direct emoji mappings (from database)
  '🥬': '🥬',           // Vegetables
  '🍎': '🍎',           // Fruits
  '🥛': '🥛',           // Dairy
  '🥩': '🥩',           // Meat
  '🍿': '🍿',           // Snacks
  '🍰': '🍰',           // Desserts
  '🐟': '🐟',           // Seafood
  '🍞': '🍞',           // Bread
  
  // Legacy FontAwesome icon names (for backward compatibility)
  leaf: '🥬',           // Vegetables
  heart: '🍎',          // Fruits
  tint: '🥛',           // Dairy
  cutlery: '🥩',        // Meat
  star: '🍿',           // Snacks
  'birthday-cake': '🍰', // Desserts
  ship: '🐟',           // Seafood
  plus: '🍞',           // Bread
  
  // Additional common category names
  apple: '🍎',
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
  vegetable: '🥕',
  fruit: '🍇',
  beverage: '🥤',
  default: '🍎',
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 24 }) => {
  // First check if it's already an emoji (length 1-4 Unicode characters)
  if (iconName && /^[\u{1F300}-\u{1F9FF}]$/u.test(iconName)) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {iconName}
      </Text>
    );
  }
  
  // Otherwise use mapping
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