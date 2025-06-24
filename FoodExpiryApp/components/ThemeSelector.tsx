import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { Category } from '../database/models';

const THEMES = [
  { 
    key: 'theme.food', 
    icon: '🍔',
    categories: [
      { name: 'category.vegetables', icon: '🥕' },
      { name: 'category.fruits', icon: '🍎' },
      { name: 'category.dairy', icon: '🧀' },
      { name: 'category.meat', icon: '🥩' },
      { name: 'category.snacks', icon: '🥨' },
      { name: 'category.desserts', icon: '🍰' },
      { name: 'category.seafood', icon: '🦞' },
      { name: 'category.bread', icon: '🍞' },
    ]
  },
  { 
    key: 'theme.health', 
    icon: '❤️',
    categories: [
      { name: 'category.medications', icon: '💊' },
      { name: 'category.vitamins', icon: '💪' },
      { name: 'category.firstAid', icon: '🩹' },
      { name: 'category.contactLenses', icon: '👁️' },
    ]
  },
  { 
    key: 'theme.beauty', 
    icon: '💄',
    categories: [
      { name: 'category.makeup', icon: '💅' },
      { name: 'category.skincare', icon: '🧴' },
      { name: 'category.hairCare', icon: '💇' },
      { name: 'category.perfume', icon: '💨' },
    ]
  },
  { 
    key: 'theme.household', 
    icon: '🏠',
    categories: [
      { name: 'category.cleaningSupplies', icon: '🧼' },
      { name: 'category.laundryProducts', icon: '🧺' },
      { name: 'category.batteries', icon: '🔋' },
    ]
  },
];

type ThemeSelectorProps = {
  visible: boolean;
  onClose: () => void;
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { categories, createCategory } = useDatabase();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryName)) {
      newSelection.delete(categoryName);
    } else {
      newSelection.add(categoryName);
    }
    setSelectedCategories(newSelection);
  };

  const handleApply = async () => {
    const existingCategoryNames = new Set(categories.map(c => c.name));
    const categoriesToAdd = THEMES.flatMap(theme => theme.categories)
                                  .filter(cat => selectedCategories.has(cat.name) && !existingCategoryNames.has(cat.name));

    if (categoriesToAdd.length === 0) {
      Alert.alert(t('common.info'), t('categories.allExist'));
      onClose();
      return;
    }
    
    try {
      for (const cat of categoriesToAdd) {
        await createCategory(cat as Category);
      }
      Alert.alert(t('common.success'), `${t('categories.added')} ${categoriesToAdd.length} ${t('categories.newCategories')}`);
    } catch (error) {
      Alert.alert(t('common.error'), t('categories.failedToAddAll'));
    }
    
    onClose();
  };

  const styles = StyleSheet.create({
    modalContent: {
      width: '90%',
      maxHeight: '85%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    themeContainer: {
      marginBottom: 12,
    },
    themeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
    },
    themeIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    themeTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 8,
    },
    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryText: {
      fontSize: 14,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    applyButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
    },
    cancelButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.borderColor,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="fadeIn"
      animationOut="fadeOut"
    >
      <View style={styles.modalContent}>
        <Text style={styles.title}>{t('themeSetup.title')}</Text>
        <Text style={styles.subtitle}>{t('themeSetup.subtitle')}</Text>
        <ScrollView>
          {THEMES.map((themeItem) => (
            <View key={themeItem.key} style={styles.themeContainer}>
              <View style={styles.themeHeader}>
                <Text style={styles.themeIcon}>{themeItem.icon}</Text>
                <Text style={styles.themeTitle}>{t(themeItem.key)}</Text>
              </View>
              <View style={styles.categoryGrid}>
                {themeItem.categories.map((cat) => {
                  const isSelected = selectedCategories.has(cat.name);
                  const isExisting = categories.some(c => c.name === cat.name);
                  const buttonStyle = {
                    borderColor: isExisting ? theme.successColor : (isSelected ? theme.primaryColor : theme.borderColor),
                    backgroundColor: isExisting ? `${theme.successColor}20` : (isSelected ? `${theme.primaryColor}20` : 'transparent'),
                  };
                  const textStyle = {
                    color: isExisting ? theme.successColor : (isSelected ? theme.primaryColor : theme.textColor),
                  };

                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[styles.categoryButton, buttonStyle]}
                      onPress={() => !isExisting && toggleCategory(cat.name)}
                      disabled={isExisting}
                    >
                      <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      <Text style={[styles.categoryText, textStyle]}>{t(cat.name)}</Text>
                      {isExisting && <FontAwesome name="check-circle" size={14} color={theme.successColor} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.buttonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.buttonText}>{t('themeSetup.apply')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}; 