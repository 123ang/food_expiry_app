import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface CategoryIconProps {
  iconName?: string;
  size?: number;
}

// Category emoji mapping with more variety
const CATEGORY_EMOJIS: { [key: string]: string } = {
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
  // Alternative mappings
  fruit: '🍊',
  vegetable: '🥬',
  grains: '🌾',
  seafood: '🐟',
  spices: '🌶️',
  dessert: '🍰',
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