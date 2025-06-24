import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { FoodItem, Category, Location } from '../database/models';
import { DatePicker } from '../components/DatePicker';
import { BottomNav } from '../components/BottomNav';
import { getSafeIconName } from '../utils/iconUtils';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';
import { useTypography } from '../hooks/useTypography';
import { useResponsive } from '../hooks/useResponsive';
import { CATEGORY_EMOJIS, LOCATION_EMOJIS, EMOJI_CATEGORIES, EmojiItem, EmojiCategory } from '../constants/emojis';
import { EditModal } from '../components/ManagementModals';
import { ThemeSelector } from '../components/ThemeSelector';
import Modal from 'react-native-modal';

type IconName = keyof typeof FontAwesome.glyphMap;

type EmojiSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  isCategory: boolean;
  selectedEmoji?: string;
};

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  isCategory,
  selectedEmoji,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['emojiCategory.food']));
  
  const emojis = isCategory ? CATEGORY_EMOJIS : LOCATION_EMOJIS;
  const categories = isCategory ? EMOJI_CATEGORIES : [{ title: 'Locations', icon: '📍', items: LOCATION_EMOJIS }];
  
  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
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
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    scrollContainer: {
      maxHeight: 400,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      marginVertical: 4,
    },
    categoryIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      flex: 1,
    },
    expandIcon: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 8,
    },
    emojiItem: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiItemSelected: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}20`,
    },
    emojiIcon: {
      fontSize: 28,
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
    <Modal isVisible={visible} onBackdropPress={onClose} onBackButtonPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>
          Select {isCategory ? 'Category' : 'Location'} Icon ({emojis.length} options)
        </Text>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
          {categories.map((category) => (
            <View key={category.title}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.title)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryTitle}>{t(category.title)}</Text>
                <Text style={styles.expandIcon}>
                  {expandedCategories.has(category.title) ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {expandedCategories.has(category.title) && (
                <View style={styles.emojiGrid}>
                  {category.items.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.emojiItem,
                        selectedEmoji === item.emoji && styles.emojiItemSelected
                      ]}
                      onPress={() => {
                        onSelect(item.emoji);
                      }}
                    >
                      <Text style={styles.emojiIcon}>{item.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { t, language, getCategoryName, getLocationName } = useLanguage();
  const typography = useTypography(undefined, language);
  const responsive = useResponsive();
  const {
    foodItems,
    categories,
    locations,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    createCategory,
    updateCategory,
    deleteCategory,
    createLocation,
    updateLocation,
    deleteLocation,
    isLoading,
    refreshAll,
    refreshCategories,
    refreshLocations,
    dashboardCounts,
    error,
  } = useDatabase();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [managementModalType, setManagementModalType] = useState<'categories' | 'locations'>('categories');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Category | Location | null>(null);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const lastLanguage = React.useRef(language);

  useEffect(() => {
    const hasCategories = categories.length > 0;
    const hasLocations = locations.length > 0;
    
    if (hasCategories && hasLocations) {
      // Data is ready
    } else {
      // Hard-stop after 3 s so the UI never blocks indefinitely.
      const timer = setTimeout(() => {}, 3000);
      return () => clearTimeout(timer);
    }
  }, [categories.length, locations.length]);

  useFocusEffect(
    React.useCallback(() => {
      if (language !== lastLanguage.current) {
        lastLanguage.current = language;
        
        const refreshData = async () => {
          try {
            await Promise.all([
              refreshCategories(),
              refreshLocations()
            ]);
          } catch (error) {
            // Silent error handling for production
          }
        };
        
        setTimeout(() => {
          refreshData();
        }, 200);
      }
    }, [language, refreshCategories, refreshLocations])
  );

  const getLocationItemCounts = () => {
    const counts: { [key: number]: number } = {};
    foodItems.forEach(item => {
      if (item.location_id) {
        counts[item.location_id] = (counts[item.location_id] || 0) + 1;
      }
    });
    return counts;
  };

  const getCategoryItemCounts = () => {
    const counts: { [key: number]: number } = {};
    foodItems.forEach(item => {
      if (item.category_id) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
    });
    return counts;
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    if (!itemName.trim()) {
      Alert.alert(t('alert.error'), t('form.nameRequired'));
      return;
    }

    if (!categoryId) {
      Alert.alert(t('alert.error'), t('form.categoryRequired'));
      return;
    }

    if (!locationId) {
      Alert.alert(t('alert.error'), t('form.locationRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const item: FoodItem = {
        name: itemName.trim(),
        category_id: categoryId,
        location_id: locationId,
        expiry_date: expiryDate.toISOString().split('T')[0],
        reminder_days: parseInt(reminderDays, 10),
        notes: notes.trim(),
        quantity: parseInt(quantity) || 1,
        image_uri: null,
        created_at: new Date().toISOString().split('T')[0]
      };

      if (editingItem && editingItem.id) {
        await updateFoodItem({ ...item, id: editingItem.id });
      } else {
        const newId = await createFoodItem(item);
      }

      setModalVisible(false);
      handleCloseModal();
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setCategoryId(item.category_id);
    setLocationId(item.location_id);
    setExpiryDate(new Date(item.expiry_date));
    setReminderDays(item.reminder_days.toString());
    setNotes(item.notes || '');
    setQuantity(item.quantity.toString());
    setModalVisible(true);
  };

  const handleDelete = (item: FoodItem) => {
    Alert.alert(
      t('alert.deleteTitle'),
      `${t('alert.deleteMessage')} "${item.name}"?`,
      [
        { text: t('form.cancel'), style: 'cancel' },
        {
          text: t('action.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFoodItem(item.id!);
            } catch (error) {
              Alert.alert(t('alert.error'), t('alert.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setItemName('');
    setCategoryId(null);
    setLocationId(null);
    setExpiryDate(new Date());
    setReminderDays('3');
    setNotes('');
    setQuantity('1');
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAll();
    } catch (error) {
      // Silent error handling for production
    } finally {
      setIsRefreshing(false);
    }
  };

  const openManagementModal = (type: 'categories' | 'locations') => {
    setManagementModalType(type);
    setManagementModalVisible(true);
  };

  const handleEditCategoryOrLocation = (item: Category | Location) => {
    setItemToEdit(item);
    setManagementModalVisible(false);
    setEditModalVisible(true);
  };

  const handleDeleteCategory = async (id: number) => {
    Alert.alert(
      t('deleteCategory'),
      t('deleteCategoryConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteCategory(id)
        }
      ]
    );
  };

  const handleDeleteLocation = async (id: number) => {
    Alert.alert(
      t('deleteLocation'),
      t('deleteLocationConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteLocation(id)
        }
      ]
    );
  };

  const handleSaveCategoryOrLocation = async (name: string, icon: string) => {
    if (itemToEdit) {
      if (managementModalType === 'categories') {
        await updateCategory({ ...itemToEdit as Category, name, icon });
      } else {
        await updateLocation({ ...itemToEdit as Location, name, icon });
      }
    } else {
      if (managementModalType === 'categories') {
        await createCategory({ name, icon } as Category);
      } else {
        await createLocation({ name, icon } as Location);
      }
    }
    setItemToEdit(null);
    setEditModalVisible(false);
    setManagementModalVisible(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: responsive.layout.spacing.container,
    },
    welcomeBanner: {
      backgroundColor: theme.primaryColor,
      borderRadius: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 24,
        default: 16,
      }),
      padding: responsive.getResponsiveValue({
        tablet: 24,
        largeTablet: 32,
        default: 20,
      }),
      marginBottom: responsive.getResponsiveValue({
        tablet: 24,
        largeTablet: 32,
        default: 20,
      }),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeText: {
      flex: 1,
    },
    welcomeTitle: {
      ...typography.h3,
      color: '#FFFFFF',
      marginBottom: 4,
      fontSize: responsive.layout.fontSize.large,
    },
    welcomeSubtitle: {
      ...typography.body1,
      color: '#FFFFFF',
      opacity: 0.9,
      fontSize: responsive.layout.fontSize.medium,
    },
    bannerIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      width: responsive.getResponsiveValue({
        tablet: 60,
        largeTablet: 70,
        default: 50,
      }),
      height: responsive.getResponsiveValue({
        tablet: 60,
        largeTablet: 70,
        default: 50,
      }),
      borderRadius: responsive.getResponsiveValue({
        tablet: 30,
        largeTablet: 35,
        default: 25,
      }),
      justifyContent: 'center',
      alignItems: 'center',
    },
    quickStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: responsive.getResponsiveValue({
        tablet: 32,
        largeTablet: 40,
        default: 24,
      }),
      justifyContent: 'space-around',
    },
    statCard: {
      width: '30%',
      backgroundColor: theme.cardBackground,
      borderRadius: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 24,
        default: 16,
      }),
      padding: responsive.layout.spacing.card,
      paddingVertical: responsive.getResponsiveValue({
        tablet: 24,
        largeTablet: 32,
        default: responsive.layout.spacing.card,
      }),
      alignItems: 'center',
      minHeight: responsive.getResponsiveValue({
        tablet: 140,
        largeTablet: 160,
        default: 120,
      }),
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    statIcon: {
      marginBottom: 8,
    },
    statLabel: {
      ...typography.body3,
      color: theme.textSecondary,
      marginBottom: 4,
      fontSize: responsive.layout.fontSize.small,
      textAlign: 'center',
      lineHeight: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 22,
        default: 18,
      }),
      minHeight: responsive.getResponsiveValue({
        tablet: 40,
        largeTablet: 44,
        default: 36,
      }),
    },
    statValue: {
      ...typography.h2,
      color: theme.primaryColor,
      fontSize: responsive.layout.fontSize.xlarge,
      fontWeight: 'bold',
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.textColor,
      marginBottom: responsive.getResponsiveValue({
        tablet: 16,
        largeTablet: 20,
        default: 12,
      }),
      fontSize: responsive.layout.fontSize.large,
      fontWeight: '600',
    },
    locationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.layout.spacing.grid,
      marginBottom: responsive.getResponsiveValue({
        tablet: 32,
        largeTablet: 40,
        default: 24,
      }),
      justifyContent: 'space-between',
    },
    locationCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 24,
        default: 16,
      }),
      padding: responsive.layout.spacing.card,
      alignItems: 'center',
      minHeight: responsive.getResponsiveValue({
        tablet: 140,
        largeTablet: 160,
        default: 120,
      }),
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    locationIcon: {
      width: responsive.getResponsiveValue({
        tablet: 70,
        largeTablet: 80,
        default: 60,
      }),
      height: responsive.getResponsiveValue({
        tablet: 70,
        largeTablet: 80,
        default: 60,
      }),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 8,
      }),
    },
    locationName: {
      color: theme.textColor,
      fontSize: responsive.layout.fontSize.medium,
      fontWeight: '500',
      marginBottom: 4,
      textAlign: 'center',
    },
    locationCount: {
      color: theme.textSecondary,
      fontSize: responsive.layout.fontSize.small,
      textAlign: 'center',
    },
    addLocationCard: {
      width: responsive.getGridItemWidth(responsive.layout.gridColumns.locations, responsive.layout.spacing.grid),
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: responsive.layout.spacing.card,
      alignItems: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.borderColor,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
    },
    itemDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemInfoText: {
      marginLeft: 4,
      color: theme.textSecondary,
      fontSize: 14,
    },
    expiryDate: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    actionButton: {
      padding: 8,
    },
    modalContent: {
      backgroundColor: theme.cardBackground,
      borderRadius: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 24,
        default: 12,
      }),
      padding: responsive.layout.spacing.container,
      maxHeight: responsive.breakpoints.isSmall ? '90%' : '80%',
      width: responsive.getResponsiveValue({
        largeTablet: '70%',
        tablet: '80%',
        default: '100%',
      }),
      alignSelf: 'center',
      maxWidth: responsive.getResponsiveValue({
        largeTablet: 800,
        tablet: 600,
        default: undefined,
      }),
    },
    modalScrollContent: {
      flexGrow: 1,
    },
    modalTitle: {
      fontSize: responsive.layout.fontSize.large,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: responsive.getResponsiveValue({
        tablet: 32,
        largeTablet: 40,
        default: 24,
      }),
    },
    input: {
      backgroundColor: theme.backgroundColor,
      padding: responsive.getResponsiveValue({
        tablet: 16,
        largeTablet: 20,
        default: 12,
      }),
      borderRadius: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 8,
      }),
      marginBottom: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 24,
        default: 16,
      }),
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      fontSize: responsive.layout.fontSize.medium,
    },
    pickerContainer: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      padding: 12,
    },
    pickerLabel: {
      color: theme.textSecondary,
      marginBottom: 8,
    },
    pickerOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pickerOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    pickerOptionSelected: {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
    },
    pickerOptionText: {
      color: theme.textColor,
    },
    pickerOptionTextSelected: {
      color: '#FFFFFF',
    },
    pickerOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 16,
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.borderColor,
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
    },
    buttonText: {
      color: theme.textColor,
      fontWeight: '500',
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    expired: {
      color: theme.dangerColor,
    },
    expiringSoon: {
      color: theme.warningColor,
    },
    fresh: {
      color: theme.successColor,
    },
    categoryList: {
      marginBottom: 24,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.layout.spacing.grid,
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: responsive.getResponsiveValue({
        tablet: 20,
        largeTablet: 24,
        default: 16,
      }),
      padding: responsive.layout.spacing.card,
      alignItems: 'center',
      minHeight: responsive.getResponsiveValue({
        tablet: 140,
        largeTablet: 160,
        default: 120,
      }),
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    categoryIcon: {
      width: responsive.getResponsiveValue({
        tablet: 70,
        largeTablet: 80,
        default: 60,
      }),
      height: responsive.getResponsiveValue({
        tablet: 70,
        largeTablet: 80,
        default: 60,
      }),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 8,
      }),
    },
    categoryName: {
      color: theme.textColor,
      fontSize: responsive.layout.fontSize.medium,
      fontWeight: '500',
      textAlign: 'center',
    },
    addCategoryCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.borderColor,
    },
    foodSection: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      marginBottom: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    sectionCount: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    sectionCountText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    foodItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    foodImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
      marginBottom: 4,
    },
    foodMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginLeft: 4,
    },
    foodActions: {
      flexDirection: 'row',
      gap: 8,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    loadingText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 16,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLogo: {
      width: 40,
      height: 40,
      marginRight: 16,
    },
    headerTitle: {
      ...typography.h2,
      color: theme.textColor,
    },
    headerText: {
      ...typography.h2,
      color: theme.textColor,
      textAlign: 'center' as const,
    },
    numberText: {
      fontWeight: 'bold',
      color: theme.primaryColor,
    },
    greyText: {
      color: theme.textSecondary,
    },
    sectionHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: responsive.getResponsiveValue({
        small: '95%',
        default: '90%',
        tablet: '80%',
        largeTablet: '70%',
      }),
    },
    managementModalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
    },
    managementModalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    managementList: {
      maxHeight: 300,
    },
    managementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      marginVertical: 4,
    },
    managementItemIcon: {
      marginRight: 12,
    },
    managementItemText: {
      flex: 1,
      fontSize: 16,
      color: theme.textColor,
    },
    managementItemActions: {
      flexDirection: 'row',
      gap: 8,
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: theme.primaryColor,
      marginTop: 16,
      borderRadius: 8,
    },
    addNewButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: theme.tertiaryColor,
      marginTop: 16,
      borderRadius: 8,
    },
    themeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    closeManagementModalButton: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.dangerColor,
      alignItems: 'center',
    },
    closeManagementModalButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderFoodItem = (item: any) => (
    <View key={item.id} style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 14 }}>⏰</Text>
            <Text style={styles.metaText}>
              {item.daysLeft > 0
                ? `${item.daysLeft} ${t('foodStatus.daysLeft')}`
                : item.daysLeft === 0
                ? t('foodStatus.expirestoday')
                : `${t('foodStatus.expired')} ${Math.abs(item.daysLeft)} ${t('foodStatus.expiredDays')}`
              }
            </Text>
          </View>
          <View style={styles.metaItem}>
            <LocationIcon iconName={item.locationIcon} size={14} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.foodActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={{ fontSize: 14, color: theme.primaryColor }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={{ fontSize: 14, color: theme.dangerColor }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../assets/food_expiry_logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>{t('app.name')}</Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={styles.loadingText}>{t('home.loading')}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{
            alignItems: 'center',
            paddingBottom: responsive.getResponsiveValue({
              small: 75,
              default: 85,
              tablet: 95,
              largeTablet: 105,
            }),
          }}
        >
          <View style={[styles.welcomeBanner, {
            width: responsive.getResponsiveValue({
              small: '95%',
              default: '90%',
              tablet: '80%',
              largeTablet: '70%',
            }),
          }]}>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>{t('home.welcome')}</Text>
            </View>
            <View style={styles.bannerIcon}>
              <FontAwesome name={'cutlery' as IconName} size={responsive.getResponsiveValue({
                tablet: 32,
                largeTablet: 40,
                default: 24,
              })} color="#FFFFFF" />
            </View>
          </View>

          <View style={[styles.quickStats, {
            width: responsive.getResponsiveValue({
              small: '95%',
              default: '90%',
              tablet: '80%',
              largeTablet: '70%',
            }),
          }]}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/fresh')}
            >
              <Text style={{ fontSize: 24, color: theme.successColor, marginBottom: 8 }}>✅</Text>
              <Text style={styles.statLabel}>{t('home.indate')}</Text>
              <Text style={styles.statValue}>{dashboardCounts.fresh}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/expiring')}
            >
              <Text style={{ fontSize: 24, color: theme.warningColor, marginBottom: 8 }}>⏰</Text>
              <Text style={styles.statLabel}>{t('list.expiring')}</Text>
              <Text style={styles.statValue}>{dashboardCounts.expiring_soon}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/expired')}
            >
              <Text style={{ fontSize: 24, color: theme.dangerColor, marginBottom: 8 }}>⚠️</Text>
              <Text style={styles.statLabel}>{t('home.expired')}</Text>
              <Text style={styles.statValue}>{dashboardCounts.expired}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>{t('home.storageLocations')}</Text>
            <TouchableOpacity onPress={() => openManagementModal('locations')}>
              <FontAwesome name="pencil" size={20} color={theme.primaryColor} />
            </TouchableOpacity>
          </View>
          <View style={[styles.locationGrid, {
            width: responsive.getResponsiveValue({
              small: '95%',
              default: '90%',
              tablet: '80%',
              largeTablet: '70%',
            }),
          }]}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationCard}
                onPress={() => router.push(`/locations/${location.id}`)}
              >
                <View style={styles.locationIcon}>
                  <LocationIcon iconName={location.icon} size={responsive.getResponsiveValue({
                    tablet: 40,
                    largeTablet: 48,
                    default: 32,
                  })} />
                </View>
                <Text style={styles.locationName}>{getLocationName(location)}</Text>
                <Text style={styles.locationCount}>
                  <Text style={styles.numberText}>{location.id ? getLocationItemCounts()[location.id] || 0 : 0}</Text>
                  <Text style={styles.greyText}> {t('home.items')}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
            <TouchableOpacity onPress={() => openManagementModal('categories')}>
              <FontAwesome name="pencil" size={20} color={theme.primaryColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.categoryList}>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => router.push(`/categories/${category.id}`)}
                >
                  <View style={styles.categoryIcon}>
                    <CategoryIcon iconName={category.icon} size={responsive.getResponsiveValue({
                      tablet: 40,
                      largeTablet: 48,
                      default: 32,
                    })} />
                  </View>
                  <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
                  <Text style={styles.locationCount}>
                    <Text style={styles.numberText}>{category.id ? getCategoryItemCounts()[category.id] || 0 : 0}</Text>
                    <Text style={styles.greyText}> {t('home.items')}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <BottomNav />
      
      <Modal
        isVisible={managementModalVisible}
        onBackdropPress={() => setManagementModalVisible(false)}
        onBackButtonPress={() => setManagementModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={styles.managementModalContent}>
          <Text style={styles.managementModalTitle}>
            {managementModalType === 'categories' ? t('settings.manageCategories') : t('settings.manageLocations')}
          </Text>
          {managementModalType === 'categories' && (
            <TouchableOpacity 
              style={[styles.themeButton, { marginTop: 0, marginBottom: 16 }]}
              onPress={() => setThemeModalVisible(true)}
            >
              <FontAwesome name="magic" size={16} color="#FFFFFF" />
              <Text style={styles.themeButtonText}>
                {t('themeSetup.quickSetup')}
              </Text>
            </TouchableOpacity>
          )}
          <ScrollView style={styles.managementList}>
            {(managementModalType === 'categories' ? categories : locations).map((item) => (
              <View key={item.id} style={styles.managementItem}>
                <View style={styles.managementItemIcon}>
                  {managementModalType === 'categories' ? (
                    <CategoryIcon iconName={item.icon} size={24} />
                  ) : (
                    <LocationIcon iconName={item.icon} size={24} />
                  )}
                </View>
                <Text style={styles.managementItemText}>{managementModalType === 'categories' ? getCategoryName(item as Category) : getLocationName(item as Location)}</Text>
                <View style={styles.managementItemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditCategoryOrLocation(item)}
                  >
                    <FontAwesome name="pencil" size={14} color={theme.textColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => managementModalType === 'categories' ? handleDeleteCategory(item.id!) : handleDeleteLocation(item.id!)}
                  >
                    <FontAwesome name="trash" size={14} color={theme.dangerColor} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.addNewButton}
            onPress={() => {
              setItemToEdit(null);
              setManagementModalVisible(false);
              setEditModalVisible(true);
            }}
          >
            <FontAwesome name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addNewButtonText}>
              {managementModalType === 'categories' ? t('addCategory') : t('addLocation')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.closeManagementModalButton}
            onPress={() => setManagementModalVisible(false)}
          >
            <Text style={styles.closeManagementModalButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <EditModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setItemToEdit(null);
          setManagementModalVisible(true);
        }}
        onSave={handleSaveCategoryOrLocation}
        title={itemToEdit 
          ? (managementModalType === 'categories' ? t('editCategory') : t('editLocation'))
          : (managementModalType === 'categories' ? t('addCategory') : t('addLocation'))
        }
        initialName={itemToEdit ? (managementModalType === 'categories' ? getCategoryName(itemToEdit as Category) : getLocationName(itemToEdit as Location)) : ''}
        initialIcon={itemToEdit?.icon}
        isCategory={managementModalType === 'categories'}
      />

      <ThemeSelector 
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />

      <Modal
        isVisible={modalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? t('form.edit') : t('form.new')}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={t('form.itemName')}
              placeholderTextColor={theme.textSecondary}
              value={itemName}
              onChangeText={setItemName}
            />

            <View style={styles.quantityContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder={t('form.quantity')}
                placeholderTextColor={theme.textSecondary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>{t('form.category')}</Text>
              <View style={styles.pickerOptions}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.pickerOption,
                      categoryId === category.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setCategoryId(category.id!)}
                  >
                    <View style={styles.pickerOptionContent}>
                      <CategoryIcon iconName={category.icon} size={16} />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          categoryId === category.id && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {getCategoryName(category)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>{t('form.location')}</Text>
              <View style={styles.pickerOptions}>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.pickerOption,
                      locationId === location.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setLocationId(location.id!)}
                  >
                    <View style={styles.pickerOptionContent}>
                      <LocationIcon iconName={location.icon} size={16} />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          locationId === location.id && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {getLocationName(location)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>{t('form.expiryDate')}</Text>
              <DatePicker
                value={expiryDate}
                onChange={setExpiryDate}
                theme={theme}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('form.reminderDays')}
              placeholderTextColor={theme.textSecondary}
              value={reminderDays}
              onChangeText={setReminderDays}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder={t('form.notes')}
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.buttonText}>{t('form.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>{t('form.save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
} 
