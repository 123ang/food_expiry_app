import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useDatabase } from '../../../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { BottomNav } from '../../../components/BottomNav';
import { FoodItemWithDetails } from '../../../database/models';
import CategoryIcon from '../../../components/CategoryIcon';
import LocationIcon from '../../../components/LocationIcon';
import { useLanguage } from '../../../context/LanguageContext';
import { Alert } from 'react-native';
import { getCategoryEmojiByKey, getLocationEmojiByKey } from '../../../constants/emojis';

type IconName = keyof typeof FontAwesome.glyphMap;

// Separate component for food item to avoid hooks violation
const FoodItemCard: React.FC<{ 
  item: FoodItemWithDetails; 
  onPress: () => void; 
  theme: any;
  styles: any;
  t: (key: string) => string;
}> = ({ item, onPress, theme, styles, t }) => {
  const [imageError, setImageError] = useState(false);

  // Determine status based on days until expiry
  const getStatusInfo = () => {
    if (item.days_until_expiry <= 0) {
      return { icon: '⚠️', color: '#F44336', text: t('foodStatus.expired') };
    } else if (item.days_until_expiry <= 5) {
      return { icon: '⏰', color: '#FF9800', text: t('foodStatus.expiring') };
    } else {
      return { icon: '✅', color: '#4CAF50', text: t('foodStatus.indate') };
    }
  };

  // Check if image_uri is an emoji
  const isEmojiImage = item.image_uri && item.image_uri.startsWith('emoji:');
  const emojiValue = isEmojiImage && item.image_uri ? item.image_uri.replace('emoji:', '') : null;

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity style={styles.foodItem} onPress={onPress}>
      {/* Enhanced image/emoji handling */}
      {isEmojiImage && emojiValue ? (
        <View style={styles.emojiImageContainer}>
          <Text style={styles.emojiImage}>{emojiValue}</Text>
        </View>
      ) : item.image_uri && !imageError ? (
        <Image
          source={{ uri: item.image_uri }}
          style={styles.foodImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <CategoryIcon iconName={item.category_icon} size={32} />
        </View>
      )}
      <View style={styles.foodInfo}>
        <View style={styles.foodNameRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.statusContainer}>
            <Text style={{ fontSize: 16, color: statusInfo.color }}>{statusInfo.icon}</Text>
            <Text style={styles.quantity}>
              <Text style={styles.quantityPrefix}>x</Text>
              <Text style={styles.quantityNumber}>{item.quantity}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <CategoryIcon iconName={item.category_icon} size={16} />
            <Text style={styles.metaText}>{item.category_name || t('foodStatus.noCategory')}</Text>
          </View>
          <View style={styles.metaItem}>
            <LocationIcon iconName={item.location_icon} size={16} />
            <Text style={styles.metaText}>{item.location_name || t('foodStatus.noLocation')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 16, color: theme.textSecondary }}>📅</Text>
            <Text style={[styles.metaText, { color: statusInfo.color }]}>
              {item.days_until_expiry > 0
                ? `${item.days_until_expiry} ${t('foodStatus.daysLeft')}`
                : item.days_until_expiry === 0
                ? t('foodStatus.expirestoday')
                : `${t('foodStatus.expired')} ${Math.abs(item.days_until_expiry)} ${t('foodStatus.expiredDays')}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ItemStatusScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { status } = useLocalSearchParams();
  const { getByStatus, refreshAll, foodItems, deleteAllExpired } = useDatabase();
  
  const [currentItems, setCurrentItems] = useState<FoodItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure status is a string and map to our expected values
  const currentStatus = Array.isArray(status) ? status[0] : status || 'indate';
  
  // Map status to display information
  const statusConfig = {
    indate: { title: t('status.indateItems'), color: '#4CAF50', icon: '✅' },
    expiring: { title: t('status.expiringSoon'), color: '#FF9800', icon: '⏰' },
    expired: { title: t('status.expiredItems'), color: '#F44336', icon: '⚠️' }
  };
  
  const statusData = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.indate;

  // Handle clear expired items
  const handleClearExpired = async () => {
    Alert.alert(
      t('settings.clearExpiredConfirmTitle'),
      t('settings.clearExpiredConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.clearExpiredButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await deleteAllExpired();
              const plural = deletedCount === 1 ? '' : 's';
              Alert.alert(
                t('common.success'), 
                t('settings.clearExpiredSuccess').replace('{count}', deletedCount.toString()).replace('{plural}', plural)
              );
              // Refresh the current items list
              const items = await getByStatus('expired');
              setCurrentItems(items || []);
            } catch (error) {
              Alert.alert(
                t('common.error'), 
                t('settings.clearExpiredError')
              );
            }
          }
        }
      ]
    );
  };

  // Safety check for theme
  if (!theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>{t('status.loading')}</Text>
      </View>
    );
  }

  // Load items when screen comes into focus or language changes
  useFocusEffect(
    React.useCallback(() => {
      const loadItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Try to use cached data first if available
          const hasData = foodItems && foodItems.length > 0;
          if (!hasData) {
            await refreshAll();
          }
          
          // Map the status parameter to the database enum
          let dbStatus: 'expired' | 'expiring_soon' | 'fresh' = 'fresh';
          if (currentStatus === 'expired') {
            dbStatus = 'expired';
          } else if (currentStatus === 'expiring') {
            dbStatus = 'expiring_soon';
          } else {
            // Handle both 'indate' and 'fresh' for consistency
            dbStatus = 'fresh';
          }
          
          const items = await getByStatus(dbStatus);
          setCurrentItems(items || []);
        } catch (error) {
          console.error('Error loading items:', error);
          setError(error instanceof Error ? error.message : 'Failed to load items');
          setCurrentItems([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadItems();
    }, [currentStatus, foodItems?.length, language]) // Add language to dependencies
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      paddingTop: 50,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      minHeight: 120,
    },
    statsIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statsTitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
      lineHeight: 18,
    },
    statsCount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primaryColor,
      textAlign: 'center',
    },
    foodItem: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    foodImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    foodInfo: {
      flex: 1,
    },
    foodNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    foodName: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    quantity: {
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    quantityPrefix: {
      color: theme.textSecondary,
    },
    quantityNumber: {
      color: theme.primaryColor,
    },
    foodMeta: {
      flexDirection: 'column',
      gap: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      marginLeft: 8,
      color: theme.textSecondary,
      fontSize: 14,
    },
    placeholderImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    listButton: {
      padding: 8,
      marginLeft: 8,
    },
    clearButton: {
      backgroundColor: theme.dangerColor || '#FF3B30',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 16,
      alignItems: 'center',
    },
    clearButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    emojiImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: `${theme.primaryColor}10`,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    emojiImage: {
      fontSize: 48,
      textAlign: 'center',
    },
  });

  // Dynamic styles
  const dynamicStyles = {
    statsIconBackground: {
      backgroundColor: `${statusData?.color || '#4CAF50'}20`,
    },
  };

  const renderFoodItem = (item: FoodItemWithDetails) => {
    return (
      <FoodItemCard 
        key={item.id} 
        item={item} 
        onPress={() => router.push(`/item/${item.id}`)}
        theme={theme}
        styles={styles}
        t={t}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: statusData.color }]}>{statusData.icon}</Text>
          <Text style={styles.title}>{statusData.title}</Text>
        </View>
        <TouchableOpacity 
          style={styles.listButton}
          onPress={() => router.push({
            pathname: '/list',
            params: { filterStatus: currentStatus === 'expiring' ? 'expiring_soon' : currentStatus === 'expired' ? 'expired' : 'fresh' }
          })}
        >
          <FontAwesome name="list" size={20} color={theme.textColor} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={[styles.statsIcon, dynamicStyles.statsIconBackground]}>
            <Text style={{ fontSize: 24, color: statusData.color }}>{statusData.icon}</Text>
          </View>
          <Text style={styles.statsTitle}>{t('status.items')}</Text>
          <Text style={styles.statsCount}>{currentItems.length}</Text>
        </View>
        
        {currentStatus === 'expired' && currentItems.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearExpired}>
            <Text style={styles.clearButtonText}>{t('settings.clearExpiredItems')}</Text>
          </TouchableOpacity>
        )}
        
        {error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, color: theme.dangerColor || '#FF3B30' }}>{statusData.icon}</Text>
            <Text style={{ color: theme.textColor, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: theme.primaryColor, 
                paddingHorizontal: 20, 
                paddingVertical: 10, 
                borderRadius: 8, 
                marginTop: 16 
              }}
              onPress={() => {
                setError(null);
                // Trigger reload
                const loadItems = async () => {
                  setIsLoading(true);
                  try {
                    await refreshAll();
                    let dbStatus: 'expired' | 'expiring_soon' | 'fresh' = 'fresh';
                    if (currentStatus === 'expired') {
                      dbStatus = 'expired';
                    } else if (currentStatus === 'expiring') {
                      dbStatus = 'expiring_soon';
                    } else {
                      dbStatus = 'fresh';
                    }
                    const items = await getByStatus(dbStatus);
                    setCurrentItems(items || []);
                  } catch (error) {
                    setError(error instanceof Error ? error.message : t('error.failedToLoadData'));
                  } finally {
                    setIsLoading(false);
                  }
                };
                loadItems();
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t('status.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
            <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 16 }}>
              {t('status.loading')}
            </Text>
          </View>
        ) : currentItems.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
              {t('status.noItems').replace('{status}', statusData?.title?.toLowerCase() || 'items')}
            </Text>
          </View>
        ) : (
          currentItems.map(renderFoodItem)
        )}
      </ScrollView>
      
      <BottomNav />
    </View>
  );
} 