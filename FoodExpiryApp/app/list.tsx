import React, { useState } from 'react';
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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { useRouter } from 'expo-router';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data
const sampleItems = [
  {
    id: 1,
    name: 'Milk',
    daysLeft: 2,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    category: 'Dairy',
    categoryIcon: 'glass' as IconName,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
    status: 'expiring_soon',
  },
  {
    id: 2,
    name: 'Tomatoes',
    daysLeft: 4,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    category: 'Vegetables',
    categoryIcon: 'leaf' as IconName,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120',
    status: 'expiring_soon',
  },
  {
    id: 3,
    name: 'Bread',
    daysLeft: 7,
    location: 'Pantry',
    locationIcon: 'archive' as IconName,
    category: 'Bread',
    categoryIcon: 'shopping-basket' as IconName,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120',
    status: 'fresh',
  },
  {
    id: 4,
    name: 'Yogurt',
    daysLeft: -2,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    category: 'Dairy',
    categoryIcon: 'glass' as IconName,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
    status: 'expired',
  },
];

export default function ListScreen() {
  const { theme } = useTheme();
  const { deleteFoodItem } = useDatabase();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'expiry'>('expiry');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring' | 'fresh' | 'expired'>('all');

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
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: theme.borderRadius,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: theme.textColor,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    filterButtonActive: {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
    },
    filterButtonText: {
      color: theme.textColor,
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
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      alignItems: 'center',
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
      flexWrap: 'wrap',
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
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.borderColor,
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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitleText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginLeft: 8,
    },
    sectionCount: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 8,
    },
  });

  const filteredItems = sampleItems
    .filter(item => {
      if (filterStatus === 'expiring') return item.status === 'expiring_soon';
      if (filterStatus === 'fresh') return item.status === 'fresh';
      if (filterStatus === 'expired') return item.status === 'expired';
      return true;
    })
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.daysLeft - b.daysLeft;
    });

  const renderFoodItem = (item: any) => (
    <View key={item.id} style={styles.foodItem}>
      <Image source={{ uri: item.image }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <FontAwesome name={'clock-o' as IconName} size={14} color={theme.textSecondary} />
            <Text 
              style={[
                styles.metaText, 
                styles.expiryText,
                item.status === 'expiring_soon' && styles.expiringSoon,
                item.status === 'expired' && styles.expired,
                item.status === 'fresh' && styles.fresh,
              ]}
            >
              {item.daysLeft} days left
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name={item.locationIcon} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name={item.categoryIcon} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.foodActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/edit/${item.id}`)}
        >
          <FontAwesome name={'pencil' as IconName} size={14} color={theme.primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Delete Item',
              `Are you sure you want to delete "${item.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteFoodItem(item.id),
                },
              ]
            );
          }}
        >
          <FontAwesome name={'trash' as IconName} size={14} color={theme.dangerColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={16} color={theme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food items..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterContainer}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
            >
              <FontAwesome 
                name="list" 
                size={14} 
                color={filterStatus === 'all' ? '#FFFFFF' : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.filterButtonText,
                  filterStatus === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'fresh' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('fresh')}
            >
              <FontAwesome 
                name="check-circle" 
                size={14} 
                color={filterStatus === 'fresh' ? '#FFFFFF' : theme.successColor} 
              />
              <Text 
                style={[
                  styles.filterButtonText,
                  filterStatus === 'fresh' && styles.filterButtonTextActive,
                ]}
              >
                Fresh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'expiring' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('expiring')}
            >
              <FontAwesome 
                name="exclamation-circle" 
                size={14} 
                color={filterStatus === 'expiring' ? '#FFFFFF' : theme.warningColor} 
              />
              <Text 
                style={[
                  styles.filterButtonText,
                  filterStatus === 'expiring' && styles.filterButtonTextActive,
                ]}
              >
                Expiring
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'expired' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('expired')}
            >
              <FontAwesome 
                name="times-circle" 
                size={14} 
                color={filterStatus === 'expired' ? '#FFFFFF' : theme.dangerColor} 
              />
              <Text 
                style={[
                  styles.filterButtonText,
                  filterStatus === 'expired' && styles.filterButtonTextActive,
                ]}
              >
                Expired
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setSortBy(sortBy === 'name' ? 'expiry' : 'name')}
          >
            <FontAwesome 
              name="sort" 
              size={14} 
              color={theme.textSecondary} 
            />
            <Text style={styles.filterButtonText}>
              {sortBy === 'name' ? 'Sort by name' : 'Sort by expiry'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filterStatus !== 'all' && (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <FontAwesome 
                name={
                  filterStatus === 'fresh' ? 'check-circle' :
                  filterStatus === 'expiring' ? 'exclamation-circle' :
                  'times-circle'
                }
                size={20}
                color={
                  filterStatus === 'fresh' ? theme.successColor :
                  filterStatus === 'expiring' ? theme.warningColor :
                  theme.dangerColor
                }
              />
              <Text style={styles.sectionTitleText}>
                {filterStatus === 'fresh' ? 'Fresh Items' :
                 filterStatus === 'expiring' ? 'Expiring Soon' :
                 'Expired Items'}
              </Text>
              <Text style={styles.sectionCount}>
                {filteredItems.length}
              </Text>
            </View>
          </View>
        )}
        {filteredItems.map(renderFoodItem)}
      </ScrollView>

      <BottomNav />
    </View>
  );
} 