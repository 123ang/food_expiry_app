import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILIES, getTypography } from '../styles/typography';

interface FontSelectorProps {
  currentFont: keyof typeof FONT_FAMILIES;
  onFontChange: (fontFamily: keyof typeof FONT_FAMILIES) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onFontChange }) => {
  const { theme } = useTheme();

  const fontOptions = [
    { key: 'inter', name: 'Inter', description: 'Modern & Clean' },
    { key: 'poppins', name: 'Poppins', description: 'Rounded & Friendly' },
    { key: 'nunito', name: 'Nunito', description: 'Friendly & Readable' },
    { key: 'system', name: 'System', description: 'Default System Font' },
  ] as const;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    optionContainer: {
      marginBottom: 12,
    },
    option: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    selectedOption: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}15`,
    },
    fontName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    fontDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    previewText: {
      fontSize: 16,
      color: theme.textColor,
      marginBottom: 4,
    },
    previewSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Font</Text>
      {fontOptions.map((font) => {
        const typography = getTypography(font.key);
        const isSelected = currentFont === font.key;
        
        return (
          <TouchableOpacity
            key={font.key}
            style={[styles.option, isSelected && styles.selectedOption]}
            onPress={() => onFontChange(font.key)}
          >
            <Text style={styles.fontName}>{font.name}</Text>
            <Text style={styles.fontDescription}>{font.description}</Text>
            <Text style={[styles.previewText, typography.h4]}>
              Food Expiry Tracker
            </Text>
            <Text style={[styles.previewSubtext, typography.body2]}>
              Keep track of your food items and never waste food again!
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}; 