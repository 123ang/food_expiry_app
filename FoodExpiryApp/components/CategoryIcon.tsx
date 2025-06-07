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
  '🩸': '🩸',           // Blood/Health
  
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
  
  // New emoji mappings
  lipstick: '💄',
  lotion: '🧴',
  soap: '🧼',
  perfume: '🌸',
  pills: '💊',
  medicine: '💊',
  bandage: '🩹',
  eye_drops: '👁️',
  sponge: '🧽',
  laundry_basket: '🧺',
  battery: '🔋',
  fire_extinguisher: '🧯',
  paint: '🎨',
  oil_drum: '🛢️',
  fuel: '⛽',
  sun_protection: '🌞',
  blood_test: '🩸',
  health: '🩸',
  herbs: '🍀',
  test_tube: '🧪',
  label: '🏷️',
  ticket: '🎟️',
  phone: '📱',
  plant: '🌱',
  leaves: '🌿',
  
  default: '🍎',
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 24 }) => {
  if (!iconName) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {CATEGORY_EMOJIS.default}
      </Text>
    );
  }

  // Check if iconName is already an emoji (Unicode emoji characters)
  const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName);
  
  if (isEmoji) {
    // If it's already an emoji, display it directly
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {iconName}
      </Text>
    );
  }

  // Try exact match first (this handles FontAwesome icon names)
  if (CATEGORY_EMOJIS[iconName]) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {CATEGORY_EMOJIS[iconName]}
      </Text>
    );
  }
  
  // Try lowercase match
  if (CATEGORY_EMOJIS[iconName.toLowerCase()]) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {CATEGORY_EMOJIS[iconName.toLowerCase()]}
      </Text>
    );
  }
  
  // Try partial matches for common patterns
  let emoji = CATEGORY_EMOJIS.default;
  const lowerIconName = iconName.toLowerCase();
  
  if (lowerIconName.includes('fruit')) {
    emoji = '🍊';
  }
  else if (lowerIconName.includes('vegetable')) {
    emoji = '🥬';
  }
  else if (lowerIconName.includes('dairy')) {
    emoji = '🥛';
  }
  else if (lowerIconName.includes('meat')) {
    emoji = '🥩';
  }
  else if (lowerIconName.includes('bread') || lowerIconName.includes('grain')) {
    emoji = '🍞';
  }
  else if (lowerIconName.includes('drink') || lowerIconName.includes('beverage')) {
    emoji = '🥤';
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