import React, { useState, useEffect, useCallback } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { useRouter, useFocusEffect } from 'expo-router';
import { FoodItemWithDetails } from '../database/models';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function ListScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { foodItems, deleteFoodItem, refreshFoodItems, refreshAll, getByStatus, isDataAvailable, dataVersion } = useDatabase();
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
  const [lastDataVersion, setLastDataVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
    // Check if data is already available from cache
    if (isDataAvailable()) {
      setIsLoading(false);
      await loadItems();
      return;
    }
    
    setIsLoading(true);
    try {
      await refreshAll();
      await loadItems();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert(t('alert.error'), t('alert.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      await refreshFoodItems();
      // foodItems will be updated by refreshFoodItems, so we use it from context
      setFilteredItems(foodItems);
      setSearchQuery('');
      setFilterStatus('all');
    } catch (error) {
      console.error('Error loading items:', error);
      // Handle error appropriately
    }
  };

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAll();
      await loadItems();
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (item: FoodItemWithDetails) => {
    try {
      await deleteFoodItem(item.id);
      // Refresh the list after deletion
      await loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  // Listen for navigation events to refresh after edit
  useFocusEffect(
    React.useCallback(() => {
      // Check if data version has changed (indicating edits/deletes) or if we have no data
      const dataHasChanged = dataVersion !== lastDataVersion;
      const hasNoData = !foodItems || foodItems.length === 0;
      
      if (!isLoading && (dataHasChanged || hasNoData)) {
        setLastDataVersion(dataVersion);
        
        const refreshAfterChange = async () => {
          try {
            // Force refresh all data from database
            await refreshAll();
            
            // Reload items with fresh data
            await loadItems();
          } catch (error) {
            console.error('List: Error refreshing after change:', error);
          }
        };
        
        refreshAfterChange();
      } else {
        // Update lastDataVersion even if we don't refresh to avoid false positives
        if (dataVersion !== lastDataVersion) {
          setLastDataVersion(dataVersion);
        }
      }
    }, [dataVersion, isLoading, foodItems?.length, language])
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundColor,
    },
    customHeader: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textColor,
      textAlign: 'center',
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
          <Text style={[styles.emptyStateText, { marginTop: 16 }]}>{t('list.loading')}</Text>
        </View>
      );
    }

    if (!filteredItems || filteredItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, color: colors.textSecondary }}>📦</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? t('list.noSearch')
              : filterStatus === 'all'
              ? t('list.noItems')
              : t('list.noCategory')}
          </Text>
        </View>
      );
    }

    return filteredItems.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.foodItem}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.foodImage} />
        ) : (
          <View style={[styles.foodImage, { backgroundColor: `${colors.primaryColor}20` }]}>
            <CategoryIcon iconName={item.category_icon} size={24} />
          </View>
        )}
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.foodMeta}>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>📅</Text>
              <Text style={styles.metaText}>{item.expiry_date}</Text>
            </View>
            <View style={styles.metaItem}>
              <CategoryIcon iconName={item.category_icon} size={14} />
              <Text style={styles.metaText}>{item.category_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <LocationIcon iconName={item.location_icon} size={14} />
              <Text style={styles.metaText}>{item.location_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>📦</Text>
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
        <View style={styles.foodActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/edit/[id]',
              params: { id: item.id }
            })}
            disabled={isRefreshing}
          >
            <Text style={{ fontSize: 16, color: colors.primaryColor }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
            disabled={isRefreshing}
          >
            <Text style={{ fontSize: 16, color: theme.dangerColor || '#FF3B30' }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>{t('nav.list')}</Text>
      </View>
      
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 20, color: colors.textSecondary }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('list.search')}
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
              <Text style={{ fontSize: 16, color: filterStatus === 'all' ? '#FFFFFF' : colors.textColor }}>📝</Text>
              <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>{t('list.all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'expired' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('expired')}
              disabled={isLoading || isRefreshing}
            >
              <Text style={{ fontSize: 16, color: filterStatus === 'expired' ? '#FFFFFF' : theme.dangerColor || '#FF3B30' }}>⚠️</Text>
              <Text style={[styles.filterButtonText, filterStatus === 'expired' && styles.filterButtonTextActive]}>{t('list.expired')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'expiring_soon' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('expiring_soon')}
              disabled={isLoading || isRefreshing}
            >
              <Text style={{ fontSize: 16, color: filterStatus === 'expiring_soon' ? '#FFFFFF' : theme.warningColor || '#FF9500' }}>⏰</Text>
              <Text style={[styles.filterButtonText, filterStatus === 'expiring_soon' && styles.filterButtonTextActive]}>{t('list.expiring')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'fresh' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('fresh')}
              disabled={isLoading || isRefreshing}
            >
              <Text style={{ fontSize: 16, color: filterStatus === 'fresh' ? '#FFFFFF' : theme.successColor || '#34C759' }}>✅</Text>
              <Text style={[styles.filterButtonText, filterStatus === 'fresh' && styles.filterButtonTextActive]}>{t('list.fresh')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleManualRefresh}
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