import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type IconName = keyof typeof FontAwesome.glyphMap;

// Predefined icons for food categories (all valid FontAwesome icons)
export const CATEGORY_ICONS: IconName[] = [
  'apple',
  'coffee',
  'cutlery',
  'glass',
  'leaf',
  'lemon-o',
  'shopping-basket',
  'spoon',
  'beer',
  'birthday-cake',
  'shopping-cart',
  'heart',
  'star',
  'circle',
  'square',
  'diamond',
  'cube',
  'gift',
  'flask',      // Instead of "cookie" - use chemistry flask
  'envira',     // Instead of "carrot" - use leaf icon  
  'tint',       // Use droplet for drinks
  'fire',       // Use fire for spicy foods
  'snowflake-o', // Use snowflake for frozen items
  'sun-o'       // Use sun for fresh items
];

// Predefined icons for storage locations
export const LOCATION_ICONS: IconName[] = [
  'home',
  'building',
  'cube',
  'archive',
  'inbox',
  'database',
  'folder',
  'briefcase',
  'suitcase',
  'shopping-basket',
  'truck',
  'shield'
];

interface IconSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (icon: IconName) => void;
  icons?: IconName[];
  title: string;
  selectedIcon?: IconName;
}

export default function IconSelector({
  visible,
  onClose,
  onSelect,
  icons = CATEGORY_ICONS,
  title,
  selectedIcon,
}: IconSelectorProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    iconsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    iconButton: {
      width: '25%',
      aspectRatio: 1,
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconWrapper: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    selectedIcon: {
      backgroundColor: `${theme.primaryColor}20`,
      borderColor: theme.primaryColor,
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView>
            <View style={styles.iconsGrid}>
              {icons.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={styles.iconButton}
                  onPress={() => onSelect(icon)}
                >
                  <View style={[
                    styles.iconWrapper,
                    selectedIcon === icon && styles.selectedIcon
                  ]}>
                    <FontAwesome
                      name={icon}
                      size={24}
                      color={selectedIcon === icon ? theme.primaryColor : theme.textColor}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 