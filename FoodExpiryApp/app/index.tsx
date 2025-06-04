import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { FoodItem } from '../database/models';
import { DatePicker } from '../components/DatePicker';
import { BottomNav } from '../components/BottomNav';
import { getSafeIconName } from '../utils/iconUtils';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';
import { useTypography } from '../hooks/useTypography';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const router = useRouter();
  const {
    foodItems,
    categories,
    locations,
    dashboardCounts,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    refreshAll,
    isDataAvailable,
  } = useDatabase();
  const typography = useTypography();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastLanguage = React.useRef(language);

  // Load data when screen comes into focus or language changes
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        // Check if data is already available from cache
        if (isDataAvailable()) {
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        try {
          await refreshAll();
        } catch (error) {
          // Silent error handling for production
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, [isDataAvailable, refreshAll, language])
  );

  // Handle language changes
  useFocusEffect(
    React.useCallback(() => {
      if (language !== lastLanguage.current) {
        lastLanguage.current = language;
        
        const refreshData = async () => {
          try {
            await refreshAll();
          } catch (error) {
            // Silent error handling for production
          }
        };
        
        refreshData();
      }
    }, [language])
  );

  // Calculate location item counts
  const getLocationItemCounts = () => {
    const counts: { [key: number]: number } = {};
    foodItems.forEach(item => {
      if (item.location_id) {
        counts[item.location_id] = (counts[item.location_id] || 0) + 1;
      }
    });
    return counts;
  };

  // Calculate category item counts
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
      await refreshAll();
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.saveFailed'));
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
      ...typography.h3,
      color: '#FFFFFF',
      marginBottom: 4,
    },
    welcomeSubtitle: {
      ...typography.body1,
      color: '#FFFFFF',
      opacity: 0.9,
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
      ...typography.body3,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      ...typography.h2,
      color: theme.textColor,
    },
    sectionTitle: {
      ...typography.h4,
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
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      overflow: 'hidden',
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
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      overflow: 'hidden',
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
  });

  const renderFoodItem = (item: any) => (
    <View key={item.id} style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 14 }}>⏰</Text>
            <Text style={styles.metaText}>{item.daysLeft} days left</Text>
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
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../assets/food_expiry_logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Expiry Alert</Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={styles.loadingText}>{t('home.loading')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>{t('home.welcome')}</Text>
              <Text style={styles.welcomeSubtitle}>
                {dashboardCounts.expiring_soon} {dashboardCounts.expiring_soon === 1 ? t('home.item') : t('home.items')} {t('home.expiring')}
              </Text>
            </View>
            <View style={styles.bannerIcon}>
              <FontAwesome name={'cutlery' as IconName} size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.quickStats}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/fresh')}
            >
              <Text style={{ fontSize: 24, color: '#4CAF50', marginBottom: 8 }}>✅</Text>
              <Text style={styles.statLabel}>{t('home.fresh')}</Text>
              <Text style={styles.statValue}>{dashboardCounts.fresh}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/expiring')}
            >
              <Text style={{ fontSize: 24, color: '#FF9800', marginBottom: 8 }}>⏰</Text>
              <Text style={styles.statLabel}>{t('list.expiring')}</Text>
              <Text style={styles.statValue}>{dashboardCounts.expiring_soon}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/items/expired')}
            >
              <Text style={{ fontSize: 24, color: '#F44336', marginBottom: 8 }}>⚠️</Text>
              <Text style={styles.statLabel}>{t('home.expired')}</Text>
              <Text style={styles.statValue}>{dashboardCounts.expired}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{t('home.storageLocations')}</Text>
          <View style={styles.locationGrid}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationCard}
                onPress={() => router.push(`/locations/${location.id}`)}
              >
                <View style={styles.locationIcon}>
                  <LocationIcon iconName={location.icon} size={32} />
                </View>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationCount}>
                  {location.id ? getLocationItemCounts()[location.id] || 0 : 0} {t('home.items')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.categoryList}>
            <View style={styles.categoryHeader}>
              <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => router.push(`/categories/${category.id}`)}
                >
                  <View style={styles.categoryIcon}>
                    <CategoryIcon iconName={category.icon} size={32} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.locationCount}>
                    {category.id ? getCategoryItemCounts()[category.id] || 0 : 0} {t('home.items')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

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
                          {category.name}
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
                          {location.name}
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
                  minimumDate={new Date()}
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