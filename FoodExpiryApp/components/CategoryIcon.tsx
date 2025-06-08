import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { getCategoryEmojiByKey } from '../constants/emojis';

interface CategoryIconProps {
  iconName?: string;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 24 }) => {
  // Handle null/undefined iconName
  if (!iconName) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        🍎
      </Text>
    );
  }

  // Use the centralized helper function to get the emoji
  const emoji = getCategoryEmojiByKey(iconName);
  
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