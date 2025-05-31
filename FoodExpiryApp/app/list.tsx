import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { useRouter, useFocusEffect } from 'expo-router';
import { FoodItemWithDetails } from '../database/models';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function ListScreen() {
  const { theme } = useTheme();
  const { foodItems, deleteFoodItem, refreshFoodItems, refreshAll, getByStatus } = useDatabase();
  const router = useRouter();
  
  // Ensure we have a theme before rendering
  if (!theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'expiry'>('expiry');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expired' | 'expiring_soon' | 'fresh'>('all');
  const [filteredItems, setFilteredItems] = useState<FoodItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Default colors for fallback
  const defaultColors = {
    primaryColor: '#007AFF',
    textColor: '#000000',
    textSecondary: '#666666',
    backgroundColor: '#FFFFFF',
    cardBackground: '#FFFFFF',
    borderColor: '#E5E5E5',
  };

  // Use theme colors with fallbacks
  const colors = {
    primaryColor: theme?.primaryColor || defaultColors.primaryColor,
    textColor: theme?.textColor || defaultColors.textColor,
    textSecondary: theme?.textSecondary || defaultColors.textSecondary,
    backgroundColor: theme?.backgroundColor || defaultColors.backgroundColor,
    cardBackground: theme?.cardBackground || defaultColors.cardBackground,
    borderColor: theme?.borderColor || defaultColors.borderColor,
  };

  // Initial data load only
  useEffect(() => {
    loadInitialData();
  }, []);

  // Only refresh when filter status changes (not on every focus)
  useEffect(() => {
    if (!isLoading) {
      loadItems();
    }
  }, [filterStatus]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await refreshAll();
      await loadItems();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function for pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manual refresh triggered');
      await refreshAll();
      await loadItems();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadItems = async () => {
    try {
      let items: FoodItemWithDetails[] = [];
      
      // Get items based on filter status
      if (filterStatus === 'all') {
        items = [...foodItems]; // Create a copy to avoid reference issues
      } else {
        items = await getByStatus(filterStatus);
      }

      if (!items || items.length === 0) {
        setFilteredItems([]);
        return;
      }

      // Apply search and sort in a single pass
      const searchLower = searchQuery.toLowerCase();
      items = items
        .filter(item => {
          return !searchQuery || 
            item.name.toLowerCase().includes(searchLower) ||
            (item.category_name && item.category_name.toLowerCase().includes(searchLower)) ||
            (item.location_name && item.location_name.toLowerCase().includes(searchLower));
        })
        .sort((a, b) => sortBy === 'name' ? 
          a.name.localeCompare(b.name) : 
          a.days_until_expiry - b.days_until_expiry
        );

      setFilteredItems(items);
      console.log('Items loaded:', items.length);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
      setFilteredItems([]);
    }
  };

  // Update filtered items when search query or sort changes
  useEffect(() => {
    if (!isLoading && !isRefreshing) {
      loadItems();
    }
  }, [searchQuery, sortBy]);

  const handleDelete = async (item: FoodItemWithDetails) => {
    try {
      setIsRefreshing(true);
      await deleteFoodItem(item.id!);
      // Refresh data after delete
      await refreshAll();
      await loadItems();
      console.log('Item deleted and list refreshed');
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for navigation events to refresh after edit
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if this is a return from another screen (not initial load)
      if (!isLoading) {
        const refreshAfterEdit = async () => {
          setIsRefreshing(true);
          try {
            console.log('Screen focused - refreshing data after edit');
            await refreshAll(); // Force database refresh
            await loadItems(); // Reload items with fresh data
          } catch (error) {
            console.error('Error refreshing after edit:', error);
          } finally {
            setIsRefreshing(false);
          }
        };
        
        refreshAfterEdit();
      }
    }, [isLoading])
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundColor,
    },
    header: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: colors.borderColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.textColor,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    filterButtonActive: {
      backgroundColor: colors.primaryColor,
      borderColor: colors.primaryColor,
    },
    filterButtonText: {
      color: colors.textColor,
      marginLeft: 4,
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    foodItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
      alignItems: 'center',
    },
    foodImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textColor,
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
      color: colors.textSecondary,
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
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.borderColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expiryText: {
      fontSize: 14,
    },
    expiringSoon: {
      color: theme.warningColor,
    },
    expired: {
      color: theme.dangerColor,
    },
    fresh: {
      color: theme.successColor,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryColor} />
          <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Loading items...</Text>
        </View>
      );
    }

    if (!filteredItems || filteredItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <FontAwesome name="inbox" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? 'No items match your search'
              : filterStatus === 'all'
              ? 'No items found. Add some items to get started!'
              : 'No items found in this category.'}
          </Text>
        </View>
      );
    }

    return filteredItems.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.foodItem}
        onPress={() => router.push(`/items/${item.id}`)}
      >
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.foodImage} />
        ) : (
          <View style={[styles.foodImage, { backgroundColor: `${colors.primaryColor}20` }]}>
            <FontAwesome
              name={(item.category_icon as IconName) || 'question-circle'}
              size={24}
              color={colors.primaryColor}
            />
          </View>
        )}
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.foodMeta}>
            <View style={styles.metaItem}>
              <FontAwesome name="calendar" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.expiry_date}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome
                name={(item.category_icon as IconName) || 'folder'}
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>{item.category_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome
                name={(item.location_icon as IconName) || 'map-marker'}
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>{item.location_name}</Text>
            </View>
          </View>
        </View>
        <View style={styles.foodActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/edit/[id]',
              params: { id: item.id }
            })}
            disabled={isRefreshing}
          >
            <FontAwesome name="pencil" size={16} color={colors.primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
            disabled={isRefreshing}
          >
            <FontAwesome name="trash" size={16} color={theme.dangerColor || '#FF3B30'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
              disabled={isLoading || isRefreshing}
            >
              <FontAwesome name="list" size={16} color={filterStatus === 'all' ? '#FFFFFF' : colors.textColor} />
              <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'expired' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('expired')}
              disabled={isLoading || isRefreshing}
            >
              <FontAwesome name="warning" size={16} color={filterStatus === 'expired' ? '#FFFFFF' : theme.dangerColor || '#FF3B30'} />
              <Text style={[styles.filterButtonText, filterStatus === 'expired' && styles.filterButtonTextActive]}>Expired</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'expiring_soon' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('expiring_soon')}
              disabled={isLoading || isRefreshing}
            >
              <FontAwesome name="clock-o" size={16} color={filterStatus === 'expiring_soon' ? '#FFFFFF' : theme.warningColor || '#FF9500'} />
              <Text style={[styles.filterButtonText, filterStatus === 'expiring_soon' && styles.filterButtonTextActive]}>Expiring</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'fresh' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('fresh')}
              disabled={isLoading || isRefreshing}
            >
              <FontAwesome name="check" size={16} color={filterStatus === 'fresh' ? '#FFFFFF' : theme.successColor || '#34C759'} />
              <Text style={[styles.filterButtonText, filterStatus === 'fresh' && styles.filterButtonTextActive]}>Fresh</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primaryColor]}
            tintColor={colors.primaryColor}
          />
        }
      >
        {renderContent()}
      </ScrollView>
      <BottomNav />
    </View>
  );
} 