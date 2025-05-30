import React, { useState } from 'react';
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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { FoodItem } from '../database/models';
import { DatePicker } from '../components/DatePicker';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data for locations
const sampleLocations = [
  { id: 1, name: 'Fridge', icon: 'building' as IconName, itemCount: 8 },
  { id: 2, name: 'Freezer', icon: 'snowflake-o' as IconName, itemCount: 4 },
  { id: 3, name: 'Pantry', icon: 'archive' as IconName, itemCount: 3 },
  { id: 4, name: 'Cabinet', icon: 'inbox' as IconName, itemCount: 2 },
];

// Sample data for categories
const sampleCategories = [
  { id: 1, name: 'Vegetables', icon: 'leaf' as IconName, itemCount: 5 },
  { id: 2, name: 'Fruits', icon: 'apple' as IconName, itemCount: 3 },
  { id: 3, name: 'Dairy', icon: 'glass' as IconName, itemCount: 4 },
  { id: 4, name: 'Meat', icon: 'cutlery' as IconName, itemCount: 2 },
  { id: 5, name: 'Snacks', icon: 'coffee' as IconName, itemCount: 6 },
  { id: 6, name: 'Desserts', icon: 'birthday-cake' as IconName, itemCount: 1 },
  { id: 7, name: 'Seafood', icon: 'anchor' as IconName, itemCount: 2 },
  { id: 8, name: 'Bread', icon: 'shopping-basket' as IconName, itemCount: 3 },
];

// Sample data for food items
const sampleExpiredItems = [
  {
    id: 1,
    name: 'Milk',
    daysLeft: -2,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
  },
  {
    id: 2,
    name: 'Tomatoes',
    daysLeft: -4,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120',
  },
];

const sampleFreshItems = [
  {
    id: 3,
    name: 'Bread',
    daysLeft: 7,
    location: 'Pantry',
    locationIcon: 'archive' as IconName,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120',
  },
];

export default function DashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    foodItems,
    categories,
    locations,
    dashboardCounts,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
  } = useDatabase();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter a name for the item');
      return;
    }

    try {
      const item: FoodItem = {
        name: itemName,
        category_id: categoryId,
        location_id: locationId,
        expiry_date: expiryDate.toISOString().split('T')[0],
        reminder_days: parseInt(reminderDays) || 0,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString().split('T')[0],
      };

      if (editingItem) {
        await updateFoodItem({ ...item, id: editingItem.id });
      } else {
        await createFoodItem(item);
      }
      handleCloseModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save food item');
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
    setModalVisible(true);
  };

  const handleDelete = (item: FoodItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFoodItem(item.id!);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
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
    welcomeBanner: {
      backgroundColor: theme.primaryColor,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeText: {
      flex: 1,
    },
    welcomeTitle: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    welcomeSubtitle: {
      color: '#FFFFFF',
      opacity: 0.9,
      fontSize: 16,
    },
    bannerIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quickStats: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
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
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },
    statValue: {
      color: theme.textColor,
      fontSize: 24,
      fontWeight: 'bold',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 12,
    },
    locationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    locationCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
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
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationName: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    locationCount: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    addLocationCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
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
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 24,
      maxHeight: '80%',
    },
    modalScrollContent: {
      flexGrow: 1,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 24,
    },
    input: {
      backgroundColor: theme.backgroundColor,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      gap: 12,
    },
    categoryCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
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
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryName: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '500',
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
  });

  const renderFoodItem = (item: any) => (
    <View key={item.id} style={styles.foodItem}>
      <Image source={{ uri: item.image }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <FontAwesome name={'clock-o' as IconName} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.daysLeft} days left</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name={item.locationIcon} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.foodActions}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name={'pencil' as IconName} size={14} color={theme.primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name={'trash' as IconName} size={14} color={theme.dangerColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              2 items expiring soon
            </Text>
          </View>
          <View style={styles.bannerIcon}>
            <FontAwesome name={'cutlery' as IconName} size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <FontAwesome
              name={'check-circle' as IconName}
              size={24}
              color={theme.successColor}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>Fresh</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome
              name={'exclamation-circle' as IconName}
              size={24}
              color={theme.warningColor}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>Expiring Soon</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome
              name={'times-circle' as IconName}
              size={24}
              color={theme.dangerColor}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>Expired</Text>
            <Text style={styles.statValue}>3</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Storage Locations</Text>
        <View style={styles.locationGrid}>
          {sampleLocations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <FontAwesome name={location.icon} size={20} color={theme.primaryColor} />
              </View>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationCount}>
                {location.itemCount} items
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.categoryList}>
          <View style={styles.categoryHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {sampleCategories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <FontAwesome name={category.icon} size={20} color={theme.primaryColor} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.locationCount}>
                  {category.itemCount} items
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav />

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
                {editingItem ? 'Edit Food Item' : 'New Food Item'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Item Name"
                placeholderTextColor={theme.textSecondary}
                value={itemName}
                onChangeText={setItemName}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Category</Text>
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
                      <Text
                        style={[
                          styles.pickerOptionText,
                          categoryId === category.id && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Storage Location</Text>
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
                      <Text
                        style={[
                          styles.pickerOptionText,
                          locationId === location.id && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {location.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Expiry Date</Text>
                <DatePicker
                  value={expiryDate}
                  onChange={setExpiryDate}
                  theme={theme}
                  minimumDate={new Date()}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Reminder Days Before Expiry"
                placeholderTextColor={theme.textSecondary}
                value={reminderDays}
                onChangeText={setReminderDays}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Notes"
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
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
} 