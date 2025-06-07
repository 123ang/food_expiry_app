import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { FoodItemWithDetails } from '../database/models';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';

export default function ClearItemsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { foodItems, deleteMultipleItems } = useDatabase();
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const toggleItemSelection = (itemId: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleClearSelected = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select items to clear from your inventory.');
      return;
    }

    Alert.alert(
      'Clear Selected Items',
      `This will permanently remove ${selectedItems.size} item${selectedItems.size === 1 ? '' : 's'} from your inventory. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Items',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const deletedCount = await deleteMultipleItems(Array.from(selectedItems));
              Alert.alert(
                'Success',
                `Successfully removed ${deletedCount} item${deletedCount === 1 ? '' : 's'} from your inventory.`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  }
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to clear selected items. Please try again.'
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const selectAll = () => {
    const allIds = new Set(foodItems.map(item => item.id));
    setSelectedItems(allIds);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    actionButtonText: {
      color: theme.primaryColor,
      fontSize: 12,
      fontWeight: '500',
    },
    selectionInfo: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectionText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '500',
    },
    clearButton: {
      backgroundColor: theme.dangerColor,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      opacity: selectedItems.size === 0 ? 0.5 : 1,
    },
    clearButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    itemsList: {
      flex: 1,
    },
    foodItem: {
      backgroundColor: theme.cardBackground,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    selectedItem: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}10`,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.borderColor,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkedBox: {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
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
      alignItems: 'center',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginLeft: 4,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const renderFoodItem = (item: FoodItemWithDetails) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.foodItem, isSelected && styles.selectedItem]}
        onPress={() => toggleItemSelection(item.id)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
          {isSelected && (
            <FontAwesome name="check" size={12} color="#FFFFFF" />
          )}
        </View>
        
        {item.image_uri ? (
          <Image 
            source={{ uri: item.image_uri }} 
            style={styles.foodImage} 
          />
        ) : (
          <View style={[styles.foodImage, { backgroundColor: `${theme.primaryColor}20`, justifyContent: 'center', alignItems: 'center' }]}>
            <CategoryIcon iconName={item.category_icon} size={24} />
          </View>
        )}
        
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.foodMeta}>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 12 }}>📦</Text>
              <Text style={styles.metaText}>{item.quantity}</Text>
            </View>
            <View style={styles.metaItem}>
              <CategoryIcon iconName={item.category_icon} size={12} />
              <Text style={styles.metaText}>{item.category_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <LocationIcon iconName={item.location_icon} size={12} />
              <Text style={styles.metaText}>{item.location_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 12 }}>📅</Text>
              <Text style={[
                styles.metaText,
                item.days_until_expiry < 0 && { color: theme.dangerColor },
                item.days_until_expiry >= 0 && item.days_until_expiry <= 5 && { color: theme.warningColor },
                item.days_until_expiry > 5 && { color: theme.successColor }
              ]}>
                {item.days_until_expiry > 0 
                  ? `${item.days_until_expiry} days left`
                  : item.days_until_expiry === 0 
                  ? 'Expires today'
                  : `Expired ${Math.abs(item.days_until_expiry)} days ago`
                }
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.selectionInfo}>
        <View style={styles.topRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color={theme.textColor} />
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={selectAll}
            >
              <Text style={styles.actionButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={clearSelection}
            >
              <Text style={styles.actionButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.selectionText}>
            {selectedItems.size} of {foodItems.length} items selected
          </Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearSelected}
            disabled={selectedItems.size === 0 || isLoading}
          >
            <Text style={styles.clearButtonText}>
              {isLoading ? 'Clearing...' : 'Clear Selected'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {foodItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Items Found</Text>
          <Text style={styles.emptyDescription}>
            You don't have any items in your inventory to clear.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.itemsList}>
          {foodItems.map(renderFoodItem)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
} 