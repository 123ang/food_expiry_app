import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { useApi } from '../context/ApiContext';

import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { FoodItem, Category, Location, FoodItemWithDetails } from '../database/models';
import { DatePicker } from '../components/DatePicker';
import { BottomNav } from '../components/BottomNav';
import { getSafeIconName } from '../utils/iconUtils';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';
import { useTypography } from '../hooks/useTypography';
import { useResponsive } from '../hooks/useResponsive';
import { CATEGORY_EMOJIS, LOCATION_EMOJIS, EMOJI_CATEGORIES, EmojiItem, EmojiCategory } from '../constants/emojis';
import { getCurrentDate, toGMT8DateString } from '../utils/dateUtils';
import { EditModal } from '../components/ManagementModals';
import { ThemeSelector } from '../components/ThemeSelector';
import { GroupSelector } from '../components/GroupSelector';

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
  const filteredCategories: EmojiCategory[] = categories;
  
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            Select {isCategory ? 'Category' : 'Location'} Icon ({emojis.length} options)
          </Text>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            {filteredCategories.map((category) => (
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
      </View>
    </Modal>
  );
};

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { t, language, getCategoryName, getLocationName } = useLanguage();
  const typography = useTypography(undefined, language);
  const responsive = useResponsive();
  const router = useRouter();
  
  // Group and authentication functionality
  const { 
    user, 
    isAuthenticated, 
    isLocalMode,
    isCloudMode,
    currentGroup, 
    userGroups, 
    createGroup,
    setCurrentGroup,
    syncToServer
  } = useApi();
  
  const {
    foodItems,
    categories,
    locations: allLocations,
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
    invalidateCache,
    error,
    getFoodItemsByGroup,
  } = useDatabase();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [managementModalType, setManagementModalType] = useState<'categories' | 'locations'>('categories');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Category | Location | null>(null);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const lastLanguage = React.useRef(language);

  // Group-related state
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItemWithDetails[]>([]);
  const [isSwitchingGroup, setIsSwitchingGroup] = useState(false);
  
  // Filter locations and categories by current group, and deduplicate by name
  const locations = React.useMemo(() => {
    if (!currentGroup?.id) return allLocations;
    const filtered = allLocations.filter(loc => loc.group_id === currentGroup.id);
    // Deduplicate by name - keep the one with cloud_id if available
    const seen = new Map<string, Location>();
    for (const loc of filtered) {
      const key = loc.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, loc);
      } else {
        const existing = seen.get(key)!;
        // Prefer the one with cloud_id (synced from server)
        if (loc.cloud_id && !existing.cloud_id) {
          seen.set(key, loc);
        }
      }
    }
    return Array.from(seen.values());
  }, [allLocations, currentGroup?.id]);
  
  const filteredCategories = React.useMemo(() => {
    if (!currentGroup?.id) return categories;
    const filtered = categories.filter(cat => cat.group_id === currentGroup.id);
    // Deduplicate by name - keep the one with cloud_id if available
    const seen = new Map<string, Category>();
    for (const cat of filtered) {
      const key = cat.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, cat);
      } else {
        const existing = seen.get(key)!;
        // Prefer the one with cloud_id (synced from server)
        if (cat.cloud_id && !existing.cloud_id) {
          seen.set(key, cat);
        }
      }
    }
    return Array.from(seen.values());
  }, [categories, currentGroup?.id]);
  
  // Determine subscription plan
  const subscriptionPlan = user?.subscription_type || 'free';

  // Extract groups from userGroups and adapt to GroupSelector's expected format
  const adaptGroup = (group: any): any => ({
    id: group.id,
    name: group.name,
    description: group.description || null,
    created_by: group.created_by,
    invite_code: group.invite_code || null,
    max_members: group.max_members || undefined,
    created_at: group.created_at,
    updated_at: group.updated_at
  });
  const groups = userGroups.map(membership => adaptGroup(membership.groups));

  // Load food items for the selected group
  useEffect(() => {
    const loadGroupFoodItems = async () => {
      if (activeGroupId) {
        try {
          const items = await getFoodItemsByGroup(activeGroupId);
          setFilteredFoodItems(items);
        } catch (error) {
          setFilteredFoodItems([]);
        }
      } else {
        // If no group selected, show all items (for non-authenticated users)
        setFilteredFoodItems(foodItems);
      }
    };

    loadGroupFoodItems();
  }, [activeGroupId, foodItems, getFoodItemsByGroup]);

  // Note: Categories and locations are loaded from local database
  // They are NOT auto-synced when group changes - only when user clicks sync button
  // This ensures local database is the source of truth for UI display

  // Set active group when groups change - use currentGroup from ApiContext (which prioritizes groups with items)
  useEffect(() => {
    // Use currentGroup from ApiContext instead of manually selecting
    // This ensures we use the group that has items (if any), or Personal as default
    if (currentGroup && currentGroup.id !== activeGroupId) {
      setActiveGroupId(currentGroup.id);
    } else if (groups.length > 0 && !activeGroupId && !currentGroup) {
      // Fallback: if no currentGroup set yet, find Personal group or use first group
      const personalGroup = groups.find(g => g.name.toLowerCase() === 'personal');
      const selectedGroupId = personalGroup ? personalGroup.id : groups[0].id;
      
      setActiveGroupId(selectedGroupId);
    } else if (groups.length === 0 && isAuthenticated) {
      // If authenticated but no groups, the GroupSelector will show "Creating Personal Group..."
    }
  }, [groups, activeGroupId, isAuthenticated, currentGroup]);

  const setActiveGroup = async (group: any) => {
    // Show loading state when switching groups
    setIsSwitchingGroup(true);
    try {
      // Invalidate cache first to ensure fresh data
      invalidateCache();
      
      // Update both local state and ApiContext's currentGroup
      setActiveGroupId(group.id);
      if (setCurrentGroup) {
        await setCurrentGroup(group);
      }
      // Refresh data for the new group
      await refreshAll();
    } finally {
      // Small delay to prevent flickering
      setTimeout(() => {
        setIsSwitchingGroup(false);
      }, 300);
    }
  };

  useEffect(() => {
    const hasCategories = filteredCategories.length > 0;
    const hasLocations = locations.length > 0;
    
    if (hasCategories && hasLocations) {
      // Data is ready
    } else {
      // Hard-stop after 3 s so the UI never blocks indefinitely.
      const timer = setTimeout(() => {}, 3000);
      return () => clearTimeout(timer);
    }
  }, [filteredCategories.length, locations.length]);

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
    filteredFoodItems.forEach(item => {
      if (item.location_id) {
        counts[item.location_id] = (counts[item.location_id] || 0) + 1;
      }
    });
    return counts;
  };

  const getCategoryItemCounts = () => {
    const counts: { [key: number]: number } = {};
    filteredFoodItems.forEach(item => {
      if (item.category_id) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
    });
    return counts;
  };

  // Calculate dashboard counts based on filteredFoodItems (current group only)
  // Exclude consumed items if they exist in the data
  // Use useMemo to avoid recalculating on every render
  const groupDashboardCounts = React.useMemo(() => {
    // Filter out consumed items if is_consumed field exists
    const activeItems = filteredFoodItems.filter(item => {
      // Check if item has is_consumed field (from PostgreSQL sync)
      if ('is_consumed' in item && (item as any).is_consumed === true) {
        return false;
      }
      return true;
    });
    
    const total = activeItems.length;
    const expiring_soon = activeItems.filter(item => item.status === 'expiring_soon').length;
    const expired = activeItems.filter(item => item.status === 'expired').length;
    const fresh = activeItems.filter(item => item.status === 'fresh').length;
    
    return { total, expiring_soon, expired, fresh };
  }, [filteredFoodItems, activeGroupId]);

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

    // Ensure we have a group selected - use currentGroup from ApiContext (most reliable)
    // If currentGroup is not set, try activeGroupId, but prioritize currentGroup
    // Also fallback to first available group if user is authenticated
    let selectedGroupId = currentGroup?.id || activeGroupId;
    
    if (!selectedGroupId && isAuthenticated && groups.length > 0) {
      // Auto-select first group if none selected but user is authenticated and has groups
      selectedGroupId = groups[0].id;
      setActiveGroupId(selectedGroupId);
    }
    
    if (!selectedGroupId && isCloudMode) {
      Alert.alert(
        t('alert.error'), 
        'No group available. Please ensure you are signed in and have at least one group. If you just signed up, please wait a moment for your Personal group to be created.'
      );
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    try {
      const item: FoodItem = {
        name: itemName.trim(),
        category_id: categoryId,
        location_id: locationId,
        expiry_date: toGMT8DateString(expiryDate),
        reminder_days: parseInt(reminderDays, 10),
        notes: notes.trim() || null,
        quantity: parseInt(quantity) || 1,
        unit: 'unit', // Default unit
        image_uri: null,
        created_at: getCurrentDate(),
        group_id: isLocalMode ? null : selectedGroupId, // Local Mode keeps food data private and ungrouped
        cloud_id: null, // New items start with no cloud_id
      };

      if (editingItem && editingItem.id) {
        await updateFoodItem({ ...item, id: editingItem.id });
      } else {
        const newId = await createFoodItem(item);
      }

      // If authenticated and online, sync the new/updated item to PostgreSQL
      if (isCloudMode && isAuthenticated && syncToServer) {
        try {
          await syncToServer();
        } catch (syncError) {
          // Don't block the UI if sync fails - item is saved locally
        }
      }

      setModalVisible(false);
      handleCloseModal();
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.saveFailed'));
    } finally {
      setIsSaving(false);
    }
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
    setIsRefreshing(true);
    try {
      // If authenticated, check for internet and sync with cloud
      if (isCloudMode && isAuthenticated) {
        // Check internet connectivity
        const netInfoState = await NetInfo.fetch();
        
        if (!netInfoState.isConnected || !netInfoState.isInternetReachable) {
          Alert.alert(
            'No Internet Connection',
            'Please connect to the internet to sync your data with the cloud.',
            [{ text: 'OK' }]
          );
          
          // Still refresh local data even without internet
          await refreshAll();
          return;
        }
        
        // Check if user has groups - if not, explain the issue
        if (userGroups.length === 0) {
          if (!isAuthenticated) {
            Alert.alert(
              'Sign In Required for Cloud Sync',
              'You are currently in offline mode. To sync with the cloud, please:\n\n1. Go to Settings\n2. Sign in to your account\n3. This will create your Personal group and enable cloud sync',
              [{ text: 'OK' }]
            );
            return;
          }
          
          try {
            await createGroup('Personal', 'Your personal food management group');
          } catch (groupError) {
            const errorMessage = groupError instanceof Error ? groupError.message : String(groupError);
            Alert.alert(
              'Group Creation Failed',
              `Could not create your Personal group: ${errorMessage}\n\nPlease try signing out and signing back in.`,
              [{ text: 'OK' }]
            );
            return;
          }
        }

        // Use PostgreSQL sync from ApiContext
        try {
          await syncToServer();
          Alert.alert(
            'Sync Completed',
            'Data synchronization completed successfully.',
            [{ text: 'OK' }]
          );
        } catch (syncError) {
          Alert.alert(
            'Sync Failed',
            syncError instanceof Error ? syncError.message : 'An unknown error occurred during sync.',
            [{ text: 'OK' }]
          );
        }
      } else {
        await refreshAll();
      }
      
      // Then refresh local data
      await refreshAll();
      
      // Reload group-specific food items
      if (activeGroupId) {
        const items = await getFoodItemsByGroup(activeGroupId);
        setFilteredFoodItems(items);
      }
    } catch (error) {
      Alert.alert(
        'Sync Error',
        'An error occurred while syncing. Please try again later.',
        [{ text: 'OK' }]
      );
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
    dashboardLane: {
      width: '100%',
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
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      borderWidth: 1,
      borderColor: theme.borderColor,
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
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: responsive.layout.spacing.container,
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
      width: '100%',
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
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      width: '100%',
    },
    managementModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
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
      {/* Loading overlay when switching groups */}
      {isSwitchingGroup && (
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
          <View style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
            <Text style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.textColor,
              fontWeight: '600',
            }}>
              {t('home.loading') || 'Loading...'}
            </Text>
          </View>
        </View>
      )}
      
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
            alignItems: 'stretch',
            paddingBottom: responsive.getResponsiveValue({
              small: 75,
              default: 85,
              tablet: 95,
              largeTablet: 105,
            }),
          }}
        >
          <View style={[styles.welcomeBanner, styles.dashboardLane]}>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>{t('home.welcome')}</Text>
              {isAuthenticated && (
                <View style={{ marginTop: 8 }}>
                  <GroupSelector
                    selectedGroupId={activeGroupId}
                    onGroupChange={setActiveGroup}
                    groups={groups}
                  />
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.bannerIcon, { 
                marginLeft: responsive.getResponsiveValue({
                  tablet: 16,
                  largeTablet: 20,
                  default: 12,
                })
              }]} 
              onPress={isAuthenticated ? handleRefresh : undefined}
            >
              <FontAwesome name={(isAuthenticated ? 'refresh' : 'cutlery') as IconName} size={responsive.getResponsiveValue({
                tablet: 32,
                largeTablet: 40,
                default: 24,
              })} color="#FFFFFF" />
            </TouchableOpacity>

          </View>

          <View style={[styles.quickStats, styles.dashboardLane]}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/fresh')}
            >
              <Text style={{ fontSize: 24, color: theme.successColor, marginBottom: 8 }}>✅</Text>
              <Text style={styles.statLabel}>{t('status.fresh')}</Text>
              <Text style={styles.statValue}>{groupDashboardCounts.fresh}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/expiring')}
            >
              <Text style={{ fontSize: 24, color: theme.warningColor, marginBottom: 8 }}>⏰</Text>
              <Text style={styles.statLabel}>{t('list.expiring')}</Text>
              <Text style={styles.statValue}>{groupDashboardCounts.expiring_soon}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/expired')}
            >
              <Text style={{ fontSize: 24, color: theme.dangerColor, marginBottom: 8 }}>⚠️</Text>
              <Text style={styles.statLabel}>{t('home.expired')}</Text>
              <Text style={styles.statValue}>{groupDashboardCounts.expired}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>{t('home.storageLocations')}</Text>
            <TouchableOpacity onPress={() => openManagementModal('locations')}>
              <FontAwesome name="pencil" size={20} color={theme.primaryColor} />
            </TouchableOpacity>
          </View>
          <View style={[styles.locationGrid, styles.dashboardLane]}>
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
              {filteredCategories.map((category) => (
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
        visible={managementModalVisible && !themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManagementModalVisible(false)}
      >
        <View style={styles.managementModalOverlay}>
          <View style={styles.managementModalContent}>
            <Text style={styles.managementModalTitle}>
              {managementModalType === 'categories' ? t('settings.manageCategories') : t('settings.manageLocations')}
            </Text>
            {managementModalType === 'categories' && (
              <TouchableOpacity 
                style={[styles.themeButton, { marginTop: 0, marginBottom: 16 }]}
                onPress={() => {
                  setManagementModalVisible(false);
                  setTimeout(() => setThemeModalVisible(true), Platform.OS === 'ios' ? 100 : 0);
                }}
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
        onClose={() => {
          setThemeModalVisible(false);
          setManagementModalVisible(true);
        }}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
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
                  {filteredCategories.map((category) => (
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
        </View>
      </Modal>

    </View>
  );
} 
