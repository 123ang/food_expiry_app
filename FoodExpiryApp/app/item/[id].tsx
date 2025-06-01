import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDatabase } from '../../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { FoodItemWithDetails } from '../../database/models';
import { BottomNav } from '../../components/BottomNav';
import CategoryIcon from '../../components/CategoryIcon';
import LocationIcon from '../../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function ItemDetailsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { getFoodItem, deleteFoodItem } = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [item, setItem] = useState<FoodItemWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const itemData = await getFoodItem(Number(id));
      setItem(itemData);
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert(t('alert.error'), t('alert.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit/[id]',
      params: { id: id as string }
    });
  };

  const handleDelete = () => {
    if (!item) return;
    
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
              router.back();
            } catch (error) {
              Alert.alert(t('alert.error'), t('alert.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return {
        text: `${Math.abs(daysUntilExpiry)} ${t('item.expiredDays')}`,
        color: theme?.dangerColor || '#F44336',
        icon: 'warning' as IconName,
        status: 'expired'
      };
    } else if (daysUntilExpiry === 0) {
      return {
        text: t('item.expirestoday'),
        color: theme?.dangerColor || '#F44336',
        icon: 'warning' as IconName,
        status: 'expired'
      };
    } else if (daysUntilExpiry <= 5) {
      return {
        text: `${daysUntilExpiry} ${t('item.daysLeft')}`,
        color: theme?.warningColor || '#FF9800',
        icon: 'clock-o' as IconName,
        status: 'expiring'
      };
    } else {
      return {
        text: `${daysUntilExpiry} ${t('item.daysLeft')}`,
        color: theme?.successColor || '#4CAF50',
        icon: 'check-circle' as IconName,
        status: 'fresh'
      };
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.backgroundColor || '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageSection: {
      backgroundColor: theme?.cardBackground || '#FFFFFF',
      padding: 20,
      paddingTop: 60,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme?.borderColor || '#E0E0E0',
      position: 'relative',
    },
    titleSection: {
      paddingTop: 20,
      paddingBottom: 10,
      alignItems: 'center',
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme?.textColor || '#000000',
      textAlign: 'center',
    },
    actionButtons: {
      position: 'absolute',
      top: 50,
      right: 16,
      flexDirection: 'row',
      gap: 8,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 16,
      padding: 8,
      borderRadius: 20,
      backgroundColor: `${theme?.backgroundColor}80`,
    },
    actionButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: `${theme?.primaryColor}20`,
    },
    deleteButton: {
      backgroundColor: `${theme?.dangerColor}20`,
    },
    itemImage: {
      width: 120,
      height: 120,
      borderRadius: 12,
      marginBottom: 16,
    },
    placeholderImage: {
      width: 120,
      height: 120,
      borderRadius: 12,
      backgroundColor: `${theme?.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    itemName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme?.textColor || '#000000',
      textAlign: 'center',
      marginBottom: 8,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme?.backgroundColor || '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    detailsSection: {
      padding: 16,
    },
    detailCard: {
      backgroundColor: theme?.cardBackground || '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme?.borderColor || '#E0E0E0',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme?.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 14,
      color: theme?.textSecondary || '#666666',
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '500',
      color: theme?.textColor || '#000000',
    },
    notesCard: {
      backgroundColor: theme?.cardBackground || '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme?.borderColor || '#E0E0E0',
    },
    notesLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme?.textColor || '#000000',
      marginBottom: 8,
    },
    notesText: {
      fontSize: 14,
      color: theme?.textSecondary || '#666666',
      lineHeight: 20,
    },
    noNotesText: {
      fontSize: 14,
      color: theme?.textSecondary || '#666666',
      fontStyle: 'italic',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Loading...',
            headerShown: false
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme?.primaryColor || '#000000'} />
          <Text style={{ color: theme?.textColor || '#000000', marginTop: 16 }}>Loading item...</Text>
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Item Not Found',
            headerShown: false
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48, color: theme?.textSecondary || '#666666' }}>⚠️</Text>
          <Text style={{ color: theme?.textColor || '#000000', marginTop: 16 }}>Item not found</Text>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(item.days_until_expiry || 0);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: item?.name || 'Item Details',
          headerShown: false // Keep header hidden since we have custom UI
        }} 
      />
      <ScrollView style={styles.content}>
        {/* Image and Name Section */}
        <View style={styles.imageSection}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={{ fontSize: 20, color: theme?.textColor || '#000000' }}>◀</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Text style={{ fontSize: 16, color: theme?.primaryColor || '#000000' }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
              <Text style={{ fontSize: 16, color: theme?.dangerColor || '#000000' }}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {/* Page Title */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>{item.name}</Text>
          </View>

          {item.image_uri && !imageError ? (
            <Image 
              source={{ uri: item.image_uri }} 
              style={styles.itemImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <CategoryIcon iconName={item.category_icon} size={40} />
            </View>
          )}
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.statusContainer}>
            <Text style={{ fontSize: 16, color: statusInfo.color }}>
              {statusInfo.icon === 'warning' ? '⚠️' :
               statusInfo.icon === 'clock-o' ? '⏰' : '✅'}
            </Text>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text style={{ fontSize: 16, color: theme?.primaryColor || '#000000' }}>📅</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('item.expiryDate')}</Text>
                <Text style={styles.detailValue}>{item.expiry_date}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text style={{ fontSize: 16, color: theme?.primaryColor || '#000000' }}>📦</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('item.quantity')}</Text>
                <Text style={styles.detailValue}>{item.quantity}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <CategoryIcon iconName={item.category_icon} size={16} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('item.category')}</Text>
                <Text style={styles.detailValue}>{item.category_name || 'Unknown'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <LocationIcon iconName={item.location_icon} size={16} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('item.location')}</Text>
                <Text style={styles.detailValue}>{item.location_name || 'Unknown'}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <View style={styles.detailIcon}>
                <Text style={{ fontSize: 16, color: theme?.primaryColor || '#000000' }}>🔔</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('item.reminderDays')}</Text>
                <Text style={styles.detailValue}>{item.reminder_days} days</Text>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          {item.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>{t('item.notes')}</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
} 