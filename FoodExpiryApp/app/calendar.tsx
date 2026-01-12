import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { FoodItemWithDetails } from '../database/models';
import { BottomNav } from '../components/BottomNav';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';
import { useResponsive } from '../hooks/useResponsive';
import { ImageDisplayContext, getOptimizedImageUri } from '../utils/imageUtils';

type IconName = keyof typeof FontAwesome.glyphMap;

// Add OptimizedFoodImage component
interface OptimizedFoodImageProps {
  imageUri: string | null;
  style: any; // Use the appropriate type from your styles
}

const OptimizedFoodImage = ({ imageUri, style }: OptimizedFoodImageProps) => {
  const [optimizedUri, setOptimizedUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  
  // Load optimized image when component mounts
  useEffect(() => {
    const loadOptimizedImage = async () => {
      if (imageUri) {
        try {
          // Fix localhost URLs to use correct IP address
          let fixedUri = imageUri;
          if (imageUri.includes('localhost') || imageUri.includes('127.0.0.1')) {
            const { API_URL } = require('../services/ApiClient');
            const baseUrl = API_URL.replace('/api', '');
            fixedUri = imageUri.replace(/http:\/\/localhost:\d+/, baseUrl);
            fixedUri = fixedUri.replace(/http:\/\/127\.0\.0\.1:\d+/, baseUrl);
          }
          
          // Use LIST_ITEM context to get appropriate sizing
          const uri = await getOptimizedImageUri(fixedUri, ImageDisplayContext.LIST_ITEM);
          setOptimizedUri(uri);
          setImageError(false);
        } catch (error) {
          setImageError(true);
        }
      }
    };
    
    loadOptimizedImage();
  }, [imageUri]);
  
  if (!imageUri || imageError) {
    return (
      <View style={[style, { backgroundColor: `${theme.primaryColor}20`, justifyContent: 'center', alignItems: 'center' }]}>
        <CategoryIcon iconName="cutlery" size={24} />
      </View>
    );
  }
  
  if (imageUri.startsWith('emoji:')) {
    return (
      <View style={[style, { backgroundColor: `${theme.primaryColor}10`, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 24 }}>{imageUri.replace('emoji:', '')}</Text>
      </View>
    );
  }
  
  // Use fixed URI if we have one, otherwise use original
  const finalUri = optimizedUri || imageUri;
  // Fix localhost in final URI as well (in case it wasn't fixed earlier)
  let displayUri = finalUri;
  if (displayUri && (displayUri.includes('localhost') || displayUri.includes('127.0.0.1'))) {
    const { API_URL } = require('../services/ApiClient');
    const baseUrl = API_URL.replace('/api', '');
    displayUri = displayUri.replace(/http:\/\/localhost:\d+/, baseUrl);
    displayUri = displayUri.replace(/http:\/\/127\.0\.0\.1:\d+/, baseUrl);
  }
  
  return (
    <Image 
      source={{ uri: displayUri }} 
      style={style}
      onError={() => {
        setImageError(true);
      }}
    />
  );
};

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t, language, getCategoryName, getLocationName } = useLanguage();
  const { foodItems, refreshAll, dataVersion, categories, locations, getFoodItemsByGroup } = useDatabase();
  const router = useRouter();
  const responsive = useResponsive();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filteredItems, setFilteredItems] = useState<FoodItemWithDetails[]>([]);
  const [allFoodItems, setAllFoodItems] = useState<FoodItemWithDetails[]>([]);
  const [lastDataVersion, setLastDataVersion] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const windowHeight = Dimensions.get('window').height;
  const isWeb = Platform.OS === 'web';
  
  // Helper functions to get translated names
  const getItemCategoryName = (item: FoodItemWithDetails) => {
    // First try to find category by ID
    if (item.category_id) {
      const category = categories.find(cat => cat.id === item.category_id);
      if (category) {
        return getCategoryName(category);
      }
    }
    // Fallback: try to translate the category_name if it looks like a translation key
    if (item.category_name) {
      if (item.category_name.startsWith('category.')) {
        const translated = t(item.category_name);
        return translated !== item.category_name ? translated : item.category_name;
      }
      return item.category_name;
    }
    return t('foodStatus.noCategory') || 'Unknown';
  };
  
  const getItemLocationName = (item: FoodItemWithDetails) => {
    // First try to find location by ID
    if (item.location_id) {
      const location = locations.find(loc => loc.id === item.location_id);
      if (location) {
        return getLocationName(location);
      }
    }
    // Fallback: try to translate the location_name if it looks like a translation key
    if (item.location_name) {
      if (item.location_name.startsWith('defaultLocation.') || item.location_name.startsWith('category.')) {
        const translated = t(item.location_name);
        return translated !== item.location_name ? translated : item.location_name;
      }
      return item.location_name;
    }
    return t('foodStatus.noLocation') || 'Unknown';
  };

  const months = [
    t('month.january'), t('month.february'), t('month.march'), t('month.april'),
    t('month.may'), t('month.june'), t('month.july'), t('month.august'),
    t('month.september'), t('month.october'), t('month.november'), t('month.december')
  ];

  const weekDays = [
    t('weekday.sun'), t('weekday.mon'), t('weekday.tue'), t('weekday.wed'),
    t('weekday.thu'), t('weekday.fri'), t('weekday.sat')
  ];

  // Helper function to deduplicate items
  // Prefers items with cloud_id, and removes duplicates based on name + expiry_date + group_id OR cloud_id
  const deduplicateItems = (items: FoodItemWithDetails[]): FoodItemWithDetails[] => {
    const seenByName = new Map<string, FoodItemWithDetails>();
    const seenByCloudId = new Map<string, FoodItemWithDetails>();
    const duplicates: Array<{ item: FoodItemWithDetails; reason: string }> = [];
    
    for (const item of items) {
      // First check: if item has cloud_id, check for duplicates by cloud_id
      if (item.cloud_id) {
        const existingByCloudId = seenByCloudId.get(item.cloud_id);
        if (existingByCloudId) {
          // Found duplicate by cloud_id - prefer the one with more complete data
          duplicates.push({ item, reason: `duplicate cloud_id: ${item.cloud_id}` });
          if ((item.category_id || item.location_id) && !(existingByCloudId.category_id || existingByCloudId.location_id)) {
            // Current item has more data, replace
            seenByCloudId.set(item.cloud_id, item);
            // Also update in name map if it exists there
            const nameKey = `${existingByCloudId.name.toLowerCase().trim()}_${existingByCloudId.expiry_date}_${existingByCloudId.group_id || 'null'}`;
            if (seenByName.has(nameKey)) {
              seenByName.set(nameKey, item);
            }
          }
          continue; // Skip adding to name map since we already have this cloud_id
        } else {
          // First time seeing this cloud_id
          seenByCloudId.set(item.cloud_id, item);
        }
      }
      
      // Second check: check for duplicates by name + expiry_date + group_id
      const nameKey = `${item.name.toLowerCase().trim()}_${item.expiry_date}_${item.group_id || 'null'}`;
      const existingByName = seenByName.get(nameKey);
      
      if (!existingByName) {
        // First time seeing this item
        seenByName.set(nameKey, item);
      } else {
        // Duplicate found by name/date/group - prefer the one with cloud_id
        duplicates.push({ item, reason: `duplicate name/date/group: ${nameKey}` });
        if (item.cloud_id && !existingByName.cloud_id) {
          // Current item has cloud_id, existing doesn't - replace
          seenByName.set(nameKey, item);
        } else if (!item.cloud_id && existingByName.cloud_id) {
          // Existing has cloud_id, current doesn't - keep existing
          // Do nothing
        } else if (item.cloud_id && existingByName.cloud_id) {
          // Both have cloud_id - should have been caught by cloud_id check above
          // Keep the one with more complete data
          if ((item.category_id || item.location_id) && !(existingByName.category_id || existingByName.location_id)) {
            seenByName.set(nameKey, item);
          }
        } else {
          // Neither has cloud_id - prefer the one with more complete data
          if ((item.category_id || item.location_id) && !(existingByName.category_id || existingByName.location_id)) {
            seenByName.set(nameKey, item);
          }
        }
      }
    }
    
    // Deduplicate items
    
    // Return unique items from name map (which should include all unique items)
    return Array.from(seenByName.values());
  };

  // Load data when component mounts or when data version changes
  useEffect(() => {
    const hasNoData = !foodItems || foodItems.length === 0;
    const isFirstLoad = lastDataVersion === 0;
    
    if (hasNoData || isFirstLoad) {
      setLastDataVersion(dataVersion);
      
      const refreshData = async () => {
        try {
          await refreshAll();
          // Load all food items for calendar (across all groups)
          const allItems = await getFoodItemsByGroup();
          // Deduplicate items before setting state
          const deduplicatedItems = deduplicateItems(allItems);
          setAllFoodItems(deduplicatedItems);
        } catch (error) {
          // Error refreshing calendar data
        }
      };
      
      refreshData();
    } else {
      // Update lastDataVersion to current version to prevent future unnecessary refreshes
      if (dataVersion !== lastDataVersion) {
        setLastDataVersion(dataVersion);
        // Reload all food items when data version changes
        const loadAllItems = async () => {
          try {
            const allItems = await getFoodItemsByGroup();
            // Deduplicate items before setting state
            const deduplicatedItems = deduplicateItems(allItems);
            setAllFoodItems(deduplicatedItems);
          } catch (error) {
            // Error loading all items
          }
        };
        loadAllItems();
      }
    }
  }, [foodItems?.length, lastDataVersion, dataVersion]); // Added dataVersion back to dependencies

  // Update filtered items when selected date or food items change
  useEffect(() => {
    if (allFoodItems) {
      const items = getItemsForDate(selectedDate);
      setFilteredItems(items);
    }
  }, [selectedDate, allFoodItems]); // Use allFoodItems instead of foodItems

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      ...(isWeb && {
        maxWidth: responsive.getResponsiveValue({
          largeTablet: 1200,
          tablet: 900,
          default: 800,
        }),
        alignSelf: 'center' as any,
        minHeight: '100vh' as any,
        paddingBottom: 0,
        display: 'flex' as any,
        flexDirection: 'column' as any,
      }),
    } as any,
    mainContent: {
      flex: 1,
      flexDirection: responsive.breakpoints.isLandscape && (responsive.breakpoints.isTablet || responsive.breakpoints.isLargeTablet) 
        ? 'row' // Horizontal layout for landscape tablets
        : 'column', // Vertical layout for portrait or phones
    },
    calendarSection: {
      ...(isWeb ? {
        // Web: fixed height for proper layout
        flex: 0,
        flexShrink: 0,
        height: 450, // Fixed height for web
        minHeight: 450,
        maxHeight: 450,
      } : responsive.breakpoints.isLandscape && (responsive.breakpoints.isTablet || responsive.breakpoints.isLargeTablet) ? {
        // Landscape tablets: horizontal layout (left side)
        flex: 1,
        width: '50%',
        maxWidth: '50%',
        height: '100%',
      } : {
        // Portrait or phones: vertical layout (top section)
        height: responsive.getResponsiveValue({
          largeTablet: Math.min(windowHeight * 0.4, 380), // Portrait iPad: 40% height
          tablet: Math.min(windowHeight * 0.42, 400), // Portrait tablet: 42% height
          default: Math.min(windowHeight * 0.45, 350), // Keep same for phones
        }),
        minHeight: responsive.getResponsiveValue({
          largeTablet: 320, // Portrait iPad
          tablet: 340, // Portrait tablet
          default: 320, // Keep same for phones
        }),
        maxHeight: responsive.getResponsiveValue({
          largeTablet: 420, // Portrait iPad
          tablet: 450, // Portrait tablet
          default: 400, // Keep same for phones
        }),
      }),
    } as any,
    calendarContainer: {
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingBottom: responsive.getResponsiveValue({
        tablet: 16, // Reduced padding for tablets
        largeTablet: 20, // Reduced padding for iPad
        default: 16,
      }),
      borderTopLeftRadius: responsive.getResponsiveValue({
        tablet: 16,
        largeTablet: 20,
        default: 12,
      }),
      borderTopRightRadius: responsive.getResponsiveValue({
        tablet: 16,
        largeTablet: 20,
        default: 12,
      }),
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      ...(isWeb ? {
        // Web: full height with proper flex
        flex: 1,
        display: 'flex' as any,
        flexDirection: 'column' as any,
      } : {
        // Mobile/Tablet: Allow full expansion
        flex: 1,
      }),
    },
    header: {
      padding: responsive.getResponsiveValue({
        tablet: 16, // Reduced padding for tablets
        largeTablet: 18, // Reduced padding for iPad
        default: 16,
      }),
    },
    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.getResponsiveValue({
        tablet: 14, // Reduced margin for tablets
        largeTablet: 16, // Reduced margin for iPad
        default: 16,
      }),
    },
    monthText: {
      fontSize: responsive.getResponsiveValue({
        tablet: 20, // Reduced for tablets
        largeTablet: 22, // Reduced for iPad
        default: 18,
      }),
      fontWeight: '600',
      color: theme.textColor,
    },
    monthButton: {
      padding: 8,
    },
    weekDaysRow: {
      flexDirection: 'row',
      paddingHorizontal: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 8,
      }),
      marginBottom: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 8,
      }),
    },
    weekDay: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    weekDayText: {
      color: theme.textSecondary,
      fontSize: responsive.getResponsiveValue({
        tablet: 15,
        largeTablet: 17,
        default: 13,
      }),
      fontWeight: '500',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 8,
      }),
      ...(isWeb ? {
        // Web: fixed height for proper grid layout
        flex: 1,
        minHeight: 280,
        maxHeight: 320,
        alignContent: 'flex-start' as any,
      } : {
        // Mobile/Tablet: Optimized for iPad orientations
        flex: 1,
        minHeight: responsive.getResponsiveValue({
          largeTablet: responsive.breakpoints.isLandscape ? 260 : 240, // More space in landscape
          tablet: responsive.breakpoints.isLandscape ? 280 : 260, // More space in landscape
          default: 240,
        }),
        maxHeight: responsive.getResponsiveValue({
          largeTablet: responsive.breakpoints.isLandscape ? 340 : 300, // More space in landscape
          tablet: responsive.breakpoints.isLandscape ? 360 : 320, // More space in landscape
          default: 280,
        }),
      }),
    },
    dayCell: {
      width: `${100 / 7}%`,
      ...(isWeb ? {
        // Web: fixed height instead of aspect ratio
        height: 40,
        minHeight: 40,
        maxHeight: 40,
      } : {
        // Mobile/Tablet: use aspect ratio optimized for orientations
        aspectRatio: responsive.getResponsiveValue({
          largeTablet: responsive.breakpoints.isLandscape ? 0.9 : 0.85, // Taller cells in landscape
          tablet: responsive.breakpoints.isLandscape ? 0.95 : 0.9, // Taller cells in landscape
          small: 0.8,
          default: 0.9,
        }),
      }),
      padding: responsive.getResponsiveValue({
        largeTablet: responsive.breakpoints.isLandscape ? 5 : 4, // More padding in landscape
        tablet: responsive.breakpoints.isLandscape ? 5 : 4, // More padding in landscape
        small: 1,
        default: 2,
      }),
    },
    dayContent: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: responsive.getResponsiveValue({
        tablet: 12,
        largeTablet: 16,
        default: 6,
      }),
      backgroundColor: theme.backgroundColor,
      ...(isWeb ? {
        // Web: fixed dimensions for consistent layout
        height: 32,
        minHeight: 32,
        maxHeight: 32,
        width: '100%',
      } : {
        // Mobile/Tablet: responsive heights optimized for orientations
        minHeight: responsive.getResponsiveValue({
          largeTablet: responsive.breakpoints.isLandscape ? 45 : 40, // Taller in landscape
          tablet: responsive.breakpoints.isLandscape ? 50 : 45, // Taller in landscape
          small: 28,
          default: 32,
        }),
        maxHeight: responsive.getResponsiveValue({
          largeTablet: responsive.breakpoints.isLandscape ? 55 : 50, // Taller in landscape
          tablet: responsive.breakpoints.isLandscape ? 60 : 55, // Taller in landscape
          small: 36,
          default: 40,
        }),
      }),
      // Change overflow to 'visible' when selected to ensure text is visible
      // overflow: 'hidden', // Commented out - might be hiding text
      ...(isWeb && {
        cursor: 'pointer' as any,
      }),
    } as any,
    dayContentSelected: {
      backgroundColor: theme.primaryColor,
    },
    dayContentHasItems: {
      borderWidth: 1,
      borderColor: theme.primaryColor,
      backgroundColor: theme.cardBackground, // Use card background for better contrast
    },
    dayText: {
      fontSize: responsive.getResponsiveValue({
        tablet: 14, // Reduced for tablets
        largeTablet: 15, // Reduced for iPad
        small: 10,
        default: 12,
      }),
      color: theme.textColor, // Default color, will be overridden when selected
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: responsive.getResponsiveValue({
        tablet: 18, // Reduced for tablets
        largeTablet: 19, // Reduced for iPad
        small: 12,
        default: 14,
      }),
    },
    dayTextHasItems: {
      color: theme.textColor, // Ensure text color is visible
      fontWeight: '600', // Make it bolder for better visibility
    },
    dayTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    dayTextOtherMonth: {
      color: theme.textSecondary,
      opacity: 0.4,
    },
    dayContentOtherMonth: {
      opacity: 0.4,
    },
    itemsDot: {
      width: responsive.getResponsiveValue({
        tablet: 4,
        largeTablet: 5,
        small: 2,
        default: 3,
      }),
      height: responsive.getResponsiveValue({
        tablet: 4,
        largeTablet: 5,
        small: 2,
        default: 3,
      }),
      borderRadius: responsive.getResponsiveValue({
        tablet: 2,
        largeTablet: 2.5,
        small: 1,
        default: 1.5,
      }),
      backgroundColor: theme.primaryColor,
      marginTop: responsive.getResponsiveValue({
        tablet: 2,
        largeTablet: 3,
        small: 1,
        default: 1,
      }),
    },
    itemsDotSelected: {
      backgroundColor: '#FFFFFF',
      // Make dot slightly larger when selected for better visibility
      width: responsive.getResponsiveValue({
        tablet: 5,
        largeTablet: 6,
        small: 3,
        default: 4,
      }),
      height: responsive.getResponsiveValue({
        tablet: 5,
        largeTablet: 6,
        small: 3,
        default: 4,
      }),
    },
    listSection: {
      ...(isWeb ? {
        // Web: allow natural expansion with minimum height
        minHeight: 400,
        backgroundColor: theme.backgroundColor,
      } : responsive.breakpoints.isLandscape && (responsive.breakpoints.isTablet || responsive.breakpoints.isLargeTablet) ? {
        // Landscape tablets: horizontal layout (right side)
        flex: 1,
        width: '50%',
        maxWidth: '50%',
        height: '100%',
        backgroundColor: theme.backgroundColor,
        borderLeftWidth: 1,
        borderLeftColor: theme.borderColor,
      } : {
        // Portrait or phones: vertical layout (bottom section)
        flex: responsive.getResponsiveValue({
          largeTablet: 2.2, // More space in portrait
          tablet: 1.7, // More space in portrait
          default: 1,
        }),
        backgroundColor: theme.backgroundColor,
        minHeight: responsive.getResponsiveValue({
          largeTablet: 320, // Portrait iPad
          tablet: 280, // Portrait tablet
          default: 200,
        }),
      }),
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderColor: theme.borderColor,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    listHeaderLeft: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: 1,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
    },
    listCount: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    listContent: {
      ...(isWeb ? {
        // Web: no flex constraints for better scrolling
        minHeight: 300,
      } : {
        // Mobile/Tablet: proper flex behavior
        flex: 1,
      }),
    },
    scrollContent: {
      flexGrow: 1,
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: theme.backgroundColor,
    },
    emptyListText: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    foodItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      ...(isWeb && {
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
      }),
    } as any,
    lastFoodItem: {
      borderBottomWidth: 0,
      paddingBottom: 16, // Normal padding - extra padding applied conditionally
      borderBottomLeftRadius: responsive.getResponsiveValue({
        tablet: 16,
        largeTablet: 20,
        default: 12,
      }),
      borderBottomRightRadius: responsive.getResponsiveValue({
        tablet: 16,
        largeTablet: 20,
        default: 12,
      }),
    },
    foodImage: {
      width: 50,
      height: 50,
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
      flexWrap: 'wrap',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: theme.textColor,
      fontSize: 14,
      marginLeft: 4,
    },
    foodActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    customHeader: {
      backgroundColor: theme.cardBackground,
      padding: responsive.getResponsiveValue({
        largeTablet: 24,
        tablet: 20,
        default: 16,
      }),
      paddingTop: responsive.getResponsiveValue({
        largeTablet: 60,
        tablet: 55,
        default: 50,
      }),
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      ...(isWeb && {
        paddingTop: 20, // Reduced top padding for web
        flexShrink: 0,
      }),
    },
    headerTitle: {
      fontSize: responsive.getResponsiveValue({
        largeTablet: 28,
        tablet: 24,
        default: 20,
      }),
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
    },
    addButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.primaryColor,
      marginLeft: 8,
      minWidth: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonAvoidanceItem: {
      // Smart padding: Position content 5px above the floating add button
      paddingBottom: responsive.getResponsiveValue({
        small: 56 + 28 + 5,     // 89px: Button height + margin top + buffer (iPhone SE, small Android)
        default: 56 + 28 + 5,   // 89px: Button height + margin top + buffer (Standard phones)
        tablet: 56 + 28 + 5,    // 89px: Button height + margin top + buffer (Small tablets)
        largeTablet: 56 + 28 + 5, // 89px: Button height + margin top + buffer (Large tablets)
      }),
    },
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Calculate how many days we need to complete the last row
    const totalDaysUsed = days.length;
    const remainingDaysInLastRow = 7 - (totalDaysUsed % 7);
    
    // Only add next month days if we need to complete a row (not a full row)
    if (remainingDaysInLastRow < 7) {
      for (let i = 1; i <= remainingDaysInLastRow; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false
        });
      }
    }
    
    return days;
  };

  const getItemsForDate = (date: Date) => {
    if (!allFoodItems) return [];
    
    // Format date as YYYY-MM-DD using local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return allFoodItems.filter(item => item.expiry_date === dateStr);
  };

  const hasItemsOnDate = (date: Date) => {
    return getItemsForDate(date).length > 0;
  };

  const renderDay = (dayInfo: { date: Date; isCurrentMonth: boolean }) => {
    const isSelected = dayInfo.date.toDateString() === selectedDate.toDateString();
    const hasItems = hasItemsOnDate(dayInfo.date);
    
    // Create computed text style for selected dates
    const computedTextStyle = isSelected 
      ? StyleSheet.flatten([
          styles.dayText,
          !dayInfo.isCurrentMonth && styles.dayTextOtherMonth,
          {
            color: '#FFFFFF',
            fontWeight: '600',
            opacity: 1,
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }
        ])
      : StyleSheet.flatten([
          styles.dayText,
          !dayInfo.isCurrentMonth && styles.dayTextOtherMonth,
          hasItems && styles.dayTextHasItems,
        ]);
    
    
    return (
      <TouchableOpacity
        key={dayInfo.date.toISOString()}
        style={styles.dayCell}
        onPress={() => setSelectedDate(dayInfo.date)}
      >
        <View 
          style={StyleSheet.flatten([
            styles.dayContent,
            // Apply hasItems style only when NOT selected
            hasItems && !isSelected && styles.dayContentHasItems,
            // Apply selected style last to override hasItems
            isSelected && styles.dayContentSelected,
            !dayInfo.isCurrentMonth && styles.dayContentOtherMonth,
            // When selected, ensure overflow is visible so text isn't clipped
            isSelected && { overflow: 'visible' as any }
          ])}
          // Debug: Check if View is hiding text
          {...(isSelected && hasItems && {
            onLayout: (event) => {
              const { width, height, x, y } = event.nativeEvent.layout;
              const computedStyle = StyleSheet.flatten([
                styles.dayContent,
                isSelected && styles.dayContentSelected,
              ]);
            }
          })}
        >
          <Text 
            style={computedTextStyle}
            // Debug: Check if Text is rendering
            {...(isSelected && hasItems && {
              onLayout: (event) => {
                const { width, height, x, y } = event.nativeEvent.layout;
              }
            })}
          >
            {dayInfo.date.getDate()}
          </Text>
          {hasItems && (
            <View style={[
              styles.itemsDot,
              // When selected, make dot white and larger for better visibility
              isSelected && styles.itemsDotSelected
            ]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Height-based detection: Apply padding when content would overlap with bottom navigation
  const needsButtonAvoidance = (isLastItem: boolean) => {
    if (!isLastItem) return false;
    if (scrollViewHeight === 0 || contentHeight === 0) return false; // Wait for measurements
    if (filteredItems.length < 3) return false; // Don't apply to very short lists
    
    // Get the height of the bottom navigation (approximately 80-100px)
    const bottomNavHeight = responsive.getResponsiveValue({
      small: 80,        // Compact phones
      default: 90,      // Standard phones
      tablet: 100,      // Tablets
      largeTablet: 110, // Large tablets
    });
    
    // Add some buffer space (20px) to ensure comfortable spacing
    const bufferSpace = 20;
    const thresholdHeight = scrollViewHeight - bottomNavHeight - bufferSpace;
    
    // Only apply padding if content actually exceeds the threshold
    // This prevents applying padding to short lists that don't need it
    const needsPadding = contentHeight > thresholdHeight;
    
    return needsPadding;
  };

  const renderFoodItem = (item: FoodItemWithDetails, index: number) => {
    const isLastItem = index === filteredItems.length - 1;
    const needsAvoidance = needsButtonAvoidance(isLastItem);
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.foodItem,
          isLastItem && styles.lastFoodItem,
          needsAvoidance && styles.buttonAvoidanceItem
        ]}
        onPress={() => router.push(`/item/${item.id}`)}
      >
      <OptimizedFoodImage imageUri={item.image_uri} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={[styles.foodName, { color: theme.textColor }]}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 14 }}>⏰</Text>
            <Text style={[
              styles.metaText,
              item.days_until_expiry < 0 && { color: theme.dangerColor },
              item.days_until_expiry >= 0 && item.days_until_expiry <= 5 && { color: theme.warningColor },
              item.days_until_expiry > 5 && { color: theme.successColor }
            ]}>
              {item.days_until_expiry > 0
                ? `${item.days_until_expiry} ${t('foodStatus.daysLeft')}`
                : item.days_until_expiry === 0
                ? t('foodStatus.expirestoday')
                : `${t('foodStatus.expired')} ${Math.abs(item.days_until_expiry)} ${t('foodStatus.expiredDays')}`
              }
            </Text>
          </View>
          <View style={styles.metaItem}>
            <LocationIcon iconName={item.location_icon} size={14} />
            <Text style={[styles.metaText, { color: theme.textColor }]}>
              {(() => {
                const locationName = getItemLocationName(item);
                return locationName;
              })()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <CategoryIcon iconName={item.category_icon} size={14} />
            <Text style={[styles.metaText, { color: theme.textColor }]}>
              {(() => {
                const categoryName = getItemCategoryName(item);
                return categoryName;
              })()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 14 }}>📦</Text>
            <Text style={styles.metaText}>{item.quantity}</Text>
            <Text style={{ 
              fontSize: 14, 
              marginLeft: 8,
              color: item.status === 'expired' ? '#F44336' :
                     item.status === 'expiring_soon' ? '#FF9800' : '#4CAF50'
            }}>
              {item.status === 'expired' ? '⚠️' :
               item.status === 'expiring_soon' ? '⏰' : '✅'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>{t('nav.calendar')}</Text>
      </View>
      
      {/* Main Content Container - Horizontal in landscape, vertical in portrait */}
      <View style={styles.mainContent}>
        <View style={styles.calendarSection}>
          <View style={styles.calendarContainer}>
            <View style={styles.header}>
              <View style={styles.monthSelector}>
                <TouchableOpacity
                  style={styles.monthButton}
                  onPress={() => {
                    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
                    setCurrentMonth(newDate);
                  }}
                >
                  <Text style={{ fontSize: 20, color: theme.textColor }}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.monthText}>
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <TouchableOpacity
                  style={styles.monthButton}
                  onPress={() => {
                    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
                    setCurrentMonth(newDate);
                  }}
                >
                  <Text style={{ fontSize: 20, color: theme.textColor }}>▶</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.weekDaysRow}>
                {weekDays.map(day => (
                  <View key={day} style={styles.weekDay}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map(renderDay)}
            </View>
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <View style={styles.listHeaderLeft}>
              <Text style={styles.listTitle}>
                {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              <Text style={styles.listCount}>
                {filteredItems.length} {t('calendar.items')}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push({
                pathname: '/add',
                params: { 
                  prefilledDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                }
              })}
            >
              <Text style={{ fontSize: 20, color: "#FFFFFF", fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.listContent}
            contentContainerStyle={[
              styles.scrollContent,
              filteredItems.length === 0 && styles.emptyList
            ]}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setScrollViewHeight(height);
            }}
            onContentSizeChange={(width, height) => {
              setContentHeight(height);
            }}
          >
            {filteredItems.length === 0 ? (
              <View>
                <Text style={{ fontSize: 48, color: theme.textSecondary }}>📅</Text>
                <Text style={styles.emptyListText}>
                  {t('calendar.noItems')}
                </Text>
              </View>
            ) : (
              filteredItems.map((item, index) => renderFoodItem(item, index))
            )}
          </ScrollView>
        </View>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
} 
