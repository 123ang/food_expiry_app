import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useDatabase } from '../../../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { BottomNav } from '../../../components/BottomNav';
import { FoodItemWithDetails } from '../../../database/models';
import LocationIcon from '../../../components/LocationIcon';
import CategoryIcon from '../../../components/CategoryIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

const LOCATION_COLORS = {
  'Fridge': '#2196F3',
  'Pantry': '#9C27B0',
  'Freezer': '#00BCD4',
  'Cabinet': '#FF9800',
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
      return { icon: '✅', color: '#4CAF50', text: 'In-date' };
    }
  };

  const renderDaysText = () => {
    if (item.days_until_expiry > 0) {
      return (
        <Text style={[styles.metaText, { color: statusInfo.color }]}>
          <Text style={styles.daysNumber}>{item.days_until_expiry}</Text>
          <Text style={styles.daysText}> days left</Text>
        </Text>
      );
    } else if (item.days_until_expiry === 0) {
      return (
        <Text style={[styles.metaText, { color: statusInfo.color }]}>
          Expires today
        </Text>
      );
    } else {
      return (
        <Text style={[styles.metaText, { color: statusInfo.color }]}>
          <Text style={styles.daysText}>Expired </Text>
          <Text style={styles.daysNumber}>{Math.abs(item.days_until_expiry)}</Text>
          <Text style={styles.daysText}> days ago</Text>
        </Text>
      );
    }
  };

  const statusInfo = getStatusInfo();

  // Check if image_uri is an emoji
  const isEmojiImage = item.image_uri && item.image_uri.startsWith('emoji:');
  const emojiValue = isEmojiImage && item.image_uri ? item.image_uri.replace('emoji:', '') : null;

  return (
    <TouchableOpacity style={styles.foodItem} onPress={onPress}>
      {isEmojiImage && emojiValue ? (
        <View style={styles.placeholderImage}>
          <Text style={{ fontSize: 40 }}>{emojiValue}</Text>
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
            <Text style={{ fontSize: 16 }}>{statusInfo.icon}</Text>
            <Text style={styles.quantity}>
              <Text style={styles.quantityPrefix}>x</Text>
              <Text style={styles.quantityNumber}>{item.quantity}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <CategoryIcon iconName={item.category_icon} size={16} />
            <Text style={styles.metaText}>{item.category_name || 'No category'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 16 }}>📅</Text>
            {renderDaysText()}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function LocationDetailScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { locations, foodItems, refreshAll, dataVersion } = useDatabase();
  const [lastDataVersion, setLastDataVersion] = useState(0);
  
  const locationId = typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : null;
  const location = locations.find(loc => loc.id === locationId);
  const locationItems = foodItems.filter(item => item.location_id === locationId);

  // Load data when screen comes into focus or language changes
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        // Only refresh if we have no data or if this is the first load
        const hasNoData = !foodItems || foodItems.length === 0;
        const isFirstLoad = lastDataVersion === 0;
        
        if (hasNoData || isFirstLoad) {
          setLastDataVersion(dataVersion);
          
          const refreshData = async () => {
            try {
              await refreshAll();
            } catch (error) {
              console.error('Location detail: Error refreshing data:', error);
            }
          };
          
          refreshData();
        } else {
          // Update lastDataVersion to current version to prevent future unnecessary refreshes
          if (dataVersion !== lastDataVersion) {
            setLastDataVersion(dataVersion);
          }
        }
      };
      loadData();
    }, [foodItems?.length, lastDataVersion]) // Removed dataVersion and language from dependencies
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
      justifyContent: 'center',
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
    placeholderImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
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
      fontSize: 14,
      color: theme.textSecondary,
    },
    daysNumber: {
      color: theme.primaryColor,
      fontWeight: '600',
    },
    daysText: {
      color: theme.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });

  if (!location) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('detail.locationNotFound')}</Text>
          </View>
        </View>
      </View>
    );
  }

  const locationColor = LOCATION_COLORS[location.name as keyof typeof LOCATION_COLORS] || theme.primaryColor;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>◀</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <LocationIcon iconName={location.icon} size={24} />
          <Text style={styles.title}>{location.name}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <View style={[styles.statsIcon, { backgroundColor: `${locationColor}20` }]}>
            <LocationIcon iconName={location.icon} size={24} />
          </View>
          <Text style={styles.statsTitle}>{t('detail.itemsIn')} {location.name}</Text>
          <Text style={styles.statsCount}>{locationItems.length}</Text>
        </View>

        {locationItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyStateText}>
              {t('detail.noItemsInLocation').replace('{location}', location.name)}
            </Text>
          </View>
        ) : (
          locationItems.map((item) => (
            <FoodItemCard 
              key={item.id} 
              item={item} 
              onPress={() => router.push(`/item/${item.id}`)}
              theme={theme}
              styles={styles}
            />
          ))
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
} 