import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import CategoryIcon from '../../components/CategoryIcon';
import { Category } from '../../database/models';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';
import { CATEGORY_EMOJIS, EmojiItem } from '../../constants/emojis';

// Predefined category themes
interface CategoryTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: { name: string; icon: string }[];
}


// Function to get localized category themes
const getCategoryThemes = (t: (key: string) => string): CategoryTheme[] => [
  {
    id: 'food',
    name: t('theme.food'),
    description: t('theme.foodDesc'),
    icon: '🍎',
    categories: [
      { name: t('category.vegetables'), icon: '🥬' },
      { name: t('category.fruits'), icon: '🍎' },
      { name: t('category.dairy'), icon: '🥛' },
      { name: t('category.meat'), icon: '🥩' },
      { name: t('category.snacks'), icon: '🍿' },
      { name: t('category.desserts'), icon: '🍰' },
      { name: t('category.seafood'), icon: '🐟' },
      { name: t('category.bread'), icon: '🍞' },
    ]
  },
  {
    id: 'health',
    name: t('theme.health'),
    description: t('theme.healthDesc'),
    icon: '💊',
    categories: [
      { name: t('category.medications'), icon: '💊' },
      { name: t('category.vitamins'), icon: '🍀' },
      { name: t('category.firstAid'), icon: '🩹' },
      { name: t('category.contactLenses'), icon: '👓' },
      { name: t('category.bloodTestKits'), icon: '🩸' },
      { name: t('category.medicalDevices'), icon: '⚕️' },
    ]
  },
  {
    id: 'beauty',
    name: t('theme.beauty'),
    description: t('theme.beautyDesc'),
    icon: '💄',
    categories: [
      { name: t('category.makeup'), icon: '💄' },
      { name: t('category.skincare'), icon: '🧴' },
      { name: t('category.hairCare'), icon: '🧼' },
      { name: t('category.perfume'), icon: '🌸' },
      { name: t('category.sunscreen'), icon: '🌞' },
      { name: t('category.beautyTools'), icon: '🧽' },
    ]
  },
  {
    id: 'household',
    name: t('theme.household'),
    description: t('theme.householdDesc'),
    icon: '🧹',
    categories: [
      { name: t('category.cleaningSupplies'), icon: '🧹' },
      { name: t('category.laundryProducts'), icon: '🧺' },
      { name: t('category.batteries'), icon: '🔋' },
      { name: t('category.safetyEquipment'), icon: '🧯' },
    ]
  },
  {
    id: 'automotive',
    name: t('theme.automotive'),
    description: t('theme.automotiveDesc'),
    icon: '🛢️',
    categories: [
      { name: t('category.paintCoatings'), icon: '🎨' },
      { name: t('category.motorOil'), icon: '🛢️' },
      { name: t('category.fuelAdditives'), icon: '⛽' },
    ]
  }
];

// Emoji Selector Component
interface EmojiSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({ visible, onClose, onSelect, selectedEmoji }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

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
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center', // Center the emoji grid
      paddingVertical: 8,
      gap: 8,
    },
    emojiButton: {
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedEmoji: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}20`,
    },
    emojiText: {
      fontSize: 32,
      textAlign: 'center',
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('selectIcon')}</Text>
          <ScrollView showsVerticalScrollIndicator={true}>
            <View style={styles.emojiGrid}>
              {CATEGORY_EMOJIS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === item.emoji && styles.selectedEmoji,
                  ]}
                  onPress={() => onSelect(item.emoji)}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Theme Setup Modal Component
interface ThemeSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (selectedCategories: { name: string; icon: string }[]) => void;
  existingCategories: Category[];
}

const ThemeSetupModal: React.FC<ThemeSetupModalProps> = ({ visible, onClose, onApply, existingCategories }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const categoryThemes = getCategoryThemes(t);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set(['food'])); // Food expanded by default
  
  // Initialize selected categories based on existing categories
  const getInitialSelectedCategories = () => {
    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
    const selected = new Set<string>();
    
    categoryThemes.forEach(themeData => {
      themeData.categories.forEach(category => {
        if (existingNames.includes(category.name.toLowerCase())) {
          selected.add(`${themeData.id}-${category.name}`);
        }
      });
    });
    
    return selected;
  };
  
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(getInitialSelectedCategories());
  
  // Reset selected categories when modal opens to reflect current state
  useEffect(() => {
    if (visible) {
      setSelectedCategories(getInitialSelectedCategories());
    }
  }, [visible, existingCategories]);

  const toggleTheme = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  const toggleCategory = (themeId: string, categoryName: string) => {
    const categoryKey = `${themeId}-${categoryName}`;
    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
    const isExisting = existingNames.includes(categoryName.toLowerCase());
    
    // Don't allow unchecking existing categories
    if (isExisting) return;
    
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryKey)) {
      newSelected.delete(categoryKey);
    } else {
      newSelected.add(categoryKey);
    }
    setSelectedCategories(newSelected);
  };

  const toggleAllInTheme = (themeId: string) => {
    const themeData = categoryThemes.find(theme => theme.id === themeId);
    if (!themeData) return;

    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
    const themeCategoryKeys = themeData.categories.map(cat => `${themeId}-${cat.name}`);
    
    // Only consider non-existing categories for toggle
    const newCategoryKeys = themeCategoryKeys.filter(key => {
      const categoryName = key.split('-').slice(1).join('-'); // Get category name after theme id
      return !existingNames.includes(categoryName.toLowerCase());
    });
    
    const allNewSelected = newCategoryKeys.every(key => selectedCategories.has(key));
    
    const newSelected = new Set(selectedCategories);
    if (allNewSelected) {
      // Deselect all new categories in this theme (keep existing ones)
      newCategoryKeys.forEach(key => newSelected.delete(key));
    } else {
      // Select all new categories in this theme
      newCategoryKeys.forEach(key => newSelected.add(key));
    }
    setSelectedCategories(newSelected);
  };

  const getSelectedCategoriesForApply = () => {
    const result: { name: string; icon: string }[] = [];
    
    categoryThemes.forEach(themeData => {
      themeData.categories.forEach(category => {
        const categoryKey = `${themeData.id}-${category.name}`;
        if (selectedCategories.has(categoryKey)) {
          result.push(category);
        }
      });
    });
    
    return result;
  };

  const handleApply = () => {
    const selectedCats = getSelectedCategoriesForApply();
    onApply(selectedCats);
    onClose();
  };

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
      marginBottom: 20,
      textAlign: 'center',
    },
    themeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeItemSelected: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}10`,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.borderColor,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxSelected: {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    themeIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    themeInfo: {
      flex: 1,
    },
    themeName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    themeDescription: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    categoryCount: {
      fontSize: 12,
      color: theme.primaryColor,
      fontWeight: '600',
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.textSecondary,
    },
    applyButton: {
      backgroundColor: theme.primaryColor,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    themeCheckbox: {
      marginRight: 8,
    },
    checkboxPartial: {
      backgroundColor: theme.textSecondary,
      borderColor: theme.textSecondary,
    },
    expandIcon: {
      fontSize: 16,
      color: theme.textSecondary,
      padding: 8,
    },
    categoryList: {
      marginLeft: 20,
      marginTop: 8,
      paddingLeft: 16,
      borderLeftWidth: 2,
      borderLeftColor: theme.borderColor,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 4,
      borderRadius: 8,
      backgroundColor: theme.cardBackground,
    },
    categoryItemSelected: {
      backgroundColor: `${theme.primaryColor}15`,
    },
    categoryCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.borderColor,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    categoryName: {
      fontSize: 14,
      color: theme.textColor,
      flex: 1,
    },
    categoryItemExisting: {
      opacity: 0.7,
      backgroundColor: `${theme.primaryColor}05`,
    },
    checkboxExisting: {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
    },
    categoryNameExisting: {
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
    existingLabel: {
      fontSize: 12,
      color: theme.primaryColor,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('themeSetup.title')}</Text>
          <Text style={styles.subtitle}>
            {t('themeSetup.subtitle')}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={true}>
            {categoryThemes.map((categoryTheme) => {
              const themeCategoryKeys = categoryTheme.categories.map(cat => `${categoryTheme.id}-${cat.name}`);
              const allSelected = themeCategoryKeys.every(key => selectedCategories.has(key));
              const someSelected = themeCategoryKeys.some(key => selectedCategories.has(key));
              
              return (
                <View key={categoryTheme.id}>
                  <TouchableOpacity
                    style={[
                      styles.themeItem,
                      someSelected && styles.themeItemSelected
                    ]}
                    onPress={() => toggleTheme(categoryTheme.id)}
                  >
                    <TouchableOpacity 
                      style={styles.themeCheckbox}
                      onPress={() => toggleAllInTheme(categoryTheme.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        allSelected && styles.checkboxSelected,
                        someSelected && !allSelected && styles.checkboxPartial
                      ]}>
                        {allSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                        {someSelected && !allSelected && (
                          <Text style={styles.checkmark}>-</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                
                    <Text style={styles.themeIcon}>{categoryTheme.icon}</Text>
                    
                    <View style={styles.themeInfo}>
                      <Text style={styles.themeName}>{categoryTheme.name}</Text>
                      <Text style={styles.themeDescription}>{categoryTheme.description}</Text>
                      <Text style={styles.categoryCount}>
                        {categoryTheme.categories.length} {t('themeSetup.categories')}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => toggleTheme(categoryTheme.id)}>
                      <Text style={styles.expandIcon}>
                        {expandedThemes.has(categoryTheme.id) ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Individual Categories */}
                  {expandedThemes.has(categoryTheme.id) && (
                    <View style={styles.categoryList}>
                      {categoryTheme.categories.map((category) => {
                        const categoryKey = `${categoryTheme.id}-${category.name}`;
                        const isSelected = selectedCategories.has(categoryKey);
                        const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
                        const isExisting = existingNames.includes(category.name.toLowerCase());
                        
                        return (
                          <TouchableOpacity
                            key={categoryKey}
                            style={[
                              styles.categoryItem,
                              isSelected && styles.categoryItemSelected,
                              isExisting && styles.categoryItemExisting
                            ]}
                            onPress={() => toggleCategory(categoryTheme.id, category.name)}
                            disabled={isExisting}
                          >
                            <View style={[
                              styles.categoryCheckbox,
                              isSelected && styles.checkboxSelected,
                              isExisting && styles.checkboxExisting
                            ]}>
                              {isSelected && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </View>
                            
                            <Text style={styles.categoryIcon}>{category.icon}</Text>
                            <Text style={[
                              styles.categoryName,
                              isExisting && styles.categoryNameExisting
                            ]}>{category.name}</Text>
                            {isExisting && (
                              <Text style={styles.existingLabel}>{t('themeSetup.added')}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>{t('themeSetup.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.applyButton]} onPress={handleApply}>
              <Text style={styles.buttonText}>{t('themeSetup.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { categories, createCategory, updateCategory, deleteCategory, refreshCategories } = useDatabase();
  const router = useRouter();
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showThemeSetup, setShowThemeSetup] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('🍎');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshCategories();
  }, []);

  const handleApplyThemes = async (selectedCategories: { name: string; icon: string }[]) => {
    try {
      setIsLoading(true);

      // Check for existing categories to avoid duplicates
      const existingCategoryNames = categories.map(cat => cat.name.toLowerCase());
      
      // Collect new categories to add
      const newCategories = selectedCategories.filter(categoryData => 
        !existingCategoryNames.includes(categoryData.name.toLowerCase())
      );
      
      // Add categories sequentially to avoid database conflicts
      let addedCount = 0;
      for (const categoryData of newCategories) {
        try {
          await createCategory({
            name: categoryData.name,
            icon: categoryData.icon,
          });
          addedCount++;
          // Small delay to prevent database conflicts
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`Failed to create category ${categoryData.name}:`, error);
        }
      }

      // Refresh once at the end instead of after each creation
      if (addedCount > 0) {
        await refreshCategories();
      }
      
      const skippedCount = selectedCategories.length - addedCount;
      let message = '';
      
      if (addedCount > 0 && skippedCount > 0) {
        message = `${t('categories.added')} ${addedCount} ${t('categories.newCategories')}. ${t('categories.skipped')} ${skippedCount} ${t('categories.existingCategories')}.`;
      } else if (addedCount > 0) {
        message = `${t('categories.added')} ${addedCount} ${t('categories.newCategoriesFromThemes')}!`;
      } else {
        message = t('categories.allExist');
      }
      
      Alert.alert(t('common.success'), message, [{ text: t('common.ok') }]);
    } catch (error) {
              Alert.alert(t('alert.error'), t('alert.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    themeSetupButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    themeSetupButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    inputContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    input: {
      fontSize: 16,
      color: theme.textColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingVertical: 8,
      marginBottom: 16,
    },
    iconSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconText: {
      color: theme.textColor,
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    categoryList: {
      flex: 1,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryName: {
      flex: 1,
      fontSize: 16,
      color: theme.textColor,
    },
    actionButton: {
      padding: 8,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 50,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    addButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 8,
      width: 40,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handleSave = async () => {
    try {
      setIsLoading(true);
      if (!newName.trim()) {
        Alert.alert(t('alert.error'), t('alert.nameRequired'));
        return;
      }

      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: newName.trim(),
          icon: selectedIcon,
        });
      } else {
        await createCategory({
          name: newName.trim(),
          icon: selectedIcon,
        });
      }

      setNewName('');
      setSelectedIcon('🍎');
      setEditingCategory(null);
      await refreshCategories();
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setSelectedIcon(category.icon);
  };

  const handleDelete = async (category: Category) => {
    if (!category.id) return;

    Alert.alert(
      t('categories.deleteCategory'),
      `${t('categories.deleteConfirm')} "${category.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteCategory(category.id!);
              await refreshCategories();
            } catch (error) {
              Alert.alert(t('alert.error'), t('categories.errorDelete'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('categories.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Setup Button */}
        <TouchableOpacity 
          style={styles.themeSetupButton} 
          onPress={() => setShowThemeSetup(true)}
          disabled={isLoading}
        >
          <FontAwesome name="magic" size={16} color="#FFFFFF" />
          <Text style={styles.themeSetupButtonText}>{t('themeSetup.quickSetup')}</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('categoryName')}
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
          />
          
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconSelector(true)}
          >
            <View style={styles.iconPreview}>
              <CategoryIcon iconName={selectedIcon} size={20} />
            </View>
            <Text style={styles.iconText}>{t('selectIcon')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingCategory ? t('categories.updateCategory') : t('categories.addCategory')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.categoryList}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <CategoryIcon iconName={category.icon} size={20} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(category)}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 20, color: theme.primaryColor }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(category)}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 20, color: theme.dangerColor }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <EmojiSelector
        visible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(icon) => {
          setSelectedIcon(icon);
          setShowIconSelector(false);
        }}
        selectedEmoji={selectedIcon}
      />

              <ThemeSetupModal
          visible={showThemeSetup}
          onClose={() => setShowThemeSetup(false)}
          onApply={handleApplyThemes}
          existingCategories={categories}
        />

      <BottomNav />
    </View>
  );
} 