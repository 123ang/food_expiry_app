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

type IconName = keyof typeof FontAwesome.glyphMap;

const statusInfo = {
  fresh: {
    name: 'Fresh Items',
    icon: '✅',
    color: '#4CAF50',
  },
  expiring: {
    name: 'Expiring',
    icon: '⏰',
    color: '#FF9800',
  },
  expired: {
    name: 'Expired',
    icon: '⚠️',
    color: '#F44336',
  },
};

// Separate component for food item to avoid hooks violation
const FoodItemCard: React.FC<{ 
  item: FoodItemWithDetails; 
  onPress: () => void; 
  theme: any;
  styles: any;
}> = ({ item, onPress, theme, styles }) => {
  const [imageError, setImageError] = useState(false);

  // Determine status icon and color based on days until expiry
  const getStatusInfo = () => {
    if (item.days_until_expiry <= 0) {
      return { icon: '⚠️', color: '#F44336', text: 'Expired' };
    } else if (item.days_until_expiry <= 5) {
      return { icon: '⏰', color: '#FF9800', text: 'Expiring' };
    } else {
      return { icon: '✅', color: '#4CAF50', text: 'Fresh' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity style={styles.foodItem} onPress={onPress}>
      {item.image_uri && !imageError ? (
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
            <Text style={[styles.quantity, { color: statusInfo.color }]}>x{item.quantity}</Text>
          </View>
        </View>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <CategoryIcon iconName={item.category_icon} size={16} />
            <Text style={styles.metaText}>{item.category_name || 'No category'}</Text>
          </View>
          <View style={styles.metaItem}>
            <LocationIcon iconName={item.location_icon} size={16} />
            <Text style={styles.metaText}>{item.location_name || 'No location'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 16, color: theme.textSecondary }}>📅</Text>
            <Text style={[styles.metaText, { color: statusInfo.color }]}>
              {item.days_until_expiry > 0
                ? `${item.days_until_expiry} days left`
                : item.days_until_expiry === 0
                ? 'Expires today'
                : `Expired ${Math.abs(item.days_until_expiry)} days ago`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ItemStatusScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { status } = useLocalSearchParams();
  const { getByStatus, refreshAll, foodItems } = useDatabase();
  
  const [currentItems, setCurrentItems] = useState<FoodItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure status is a string and map to our expected values
  const currentStatus = Array.isArray(status) ? status[0] : status || 'fresh';
  
  // Map status to display information
  const statusConfig = {
    fresh: { title: 'Fresh Items', color: '#4CAF50', icon: '✅' },
    expiring: { title: 'Expiring Soon', color: '#FF9800', icon: '⏰' },
    expired: { title: 'Expired Items', color: '#F44336', icon: '⚠️' }
  };
  
  const statusData = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.fresh;

  console.log('ItemStatusScreen - currentStatus:', currentStatus);
  console.log('ItemStatusScreen - statusData:', statusData);

  // Safety check for theme
  if (!theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Load items when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Try to use cached data first if available
          const hasData = foodItems && foodItems.length > 0;
          if (!hasData) {
            console.log('Items status: No cached data, refreshing...');
            await refreshAll();
          } else {
            console.log('Items status: Using cached data');
          }
          
          // Map the status parameter to the database enum
          let dbStatus: 'expired' | 'expiring_soon' | 'fresh' = 'fresh';
          if (currentStatus === 'expired') {
            dbStatus = 'expired';
          } else if (currentStatus === 'expiring') {
            dbStatus = 'expiring_soon';
          } else {
            dbStatus = 'fresh';
          }
          
          console.log('Loading items with dbStatus:', dbStatus);
          const items = await getByStatus(dbStatus);
          console.log('Loaded items count:', items.length);
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
    }, [currentStatus, foodItems?.length]) // Only refresh when status changes or no cached data
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
      color: theme.textColor,
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
      color: theme.textSecondary,
      marginLeft: 8,
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
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>◀</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: statusData.color }]}>{statusData.icon}</Text>
          <Text style={styles.title}>{statusData.title}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={[styles.statsIcon, dynamicStyles.statsIconBackground]}>
            <Text style={{ fontSize: 24, color: statusData.color }}>{statusData.icon}</Text>
          </View>
          <Text style={styles.statsTitle}>Items</Text>
          <Text style={styles.statsCount}>{currentItems.length}</Text>
        </View>
        
        {error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, color: theme.dangerColor || '#FF3B30' }}>⚠️</Text>
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
                    setError(error instanceof Error ? error.message : 'Failed to load items');
                  } finally {
                    setIsLoading(false);
                  }
                };
                loadItems();
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <ActivityIndicator size="large" color={theme.primaryColor} />
        ) : currentItems.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, color: theme.textSecondary }}>📦</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
              No {statusData?.title?.toLowerCase() || 'items'} found
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