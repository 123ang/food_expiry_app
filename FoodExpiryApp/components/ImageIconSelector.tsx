import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CategoryIcon } from './CategoryIcon';
import { LocationIcon } from './LocationIcon';
import { getCategoryIconNames, getLocationIconNames } from '../utils/iconRegistry';

interface ImageIconSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  type: 'category' | 'location';
  title: string;
  selectedIcon?: string;
}

export default function ImageIconSelector({
  visible,
  onClose,
  onSelect,
  type,
  title,
  selectedIcon,
}: ImageIconSelectorProps) {
  const { theme } = useTheme();

  const iconNames = type === 'category' ? getCategoryIconNames() : getLocationIconNames();

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
    iconLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      textTransform: 'capitalize',
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

  const renderIcon = (iconName: string) => {
    if (type === 'category') {
      return (
        <CategoryIcon
          iconName={iconName}
          size={32}
          backgroundColor="transparent"
        />
      );
    } else {
      return (
        <LocationIcon
          iconName={iconName}
          size={32}
          backgroundColor="transparent"
        />
      );
    }
  };

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
              {iconNames.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={styles.iconButton}
                  onPress={() => onSelect(iconName)}
                >
                  <View style={[
                    styles.iconWrapper,
                    selectedIcon === iconName && styles.selectedIcon
                  ]}>
                    {renderIcon(iconName)}
                  </View>
                  <Text style={styles.iconLabel}>{iconName}</Text>
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