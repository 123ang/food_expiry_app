import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FoodItemWithDetails } from '../database/models';
import { Card } from './ui/Card';

interface FoodItemCardProps {
  item: FoodItemWithDetails;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({
  item,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();

  // Get status color
  const getStatusColor = () => {
    switch (item.status) {
      case 'expired':
        return colors.danger;
      case 'expiring_soon':
        return colors.warning;
      case 'fresh':
        return colors.success;
      default:
        return colors.success;
    }
  };

  // Get days text
  const getDaysText = () => {
    if (!item.days_until_expiry && item.days_until_expiry !== 0) return '';
    
    if (item.days_until_expiry < 0) {
      return `Expired ${Math.abs(item.days_until_expiry)} days ago`;
    } else if (item.days_until_expiry === 0) {
      return 'Expires today';
    } else if (item.days_until_expiry === 1) {
      return 'Expires tomorrow';
    } else {
      return `${item.days_until_expiry} days left`;
    }
  };

  // Get icon for category
  const getCategoryIcon = () => {
    if (!item.category_icon) return 'question-circle';
    return item.category_icon;
  };

  // Get icon for location
  const getLocationIcon = () => {
    if (!item.location_icon) return 'map-marker';
    return item.location_icon;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.container}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            {item.image_uri ? (
              <Image source={{ uri: item.image_uri }} style={styles.image} />
            ) : (
              <View 
                style={[styles.placeholderImage, { backgroundColor: colors.primary + '20' }]}
              >
                <FontAwesome name={getCategoryIcon() as any} size={24} color={colors.primary} />
              </View>
            )}
          </View>
          
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <FontAwesome name="clock-o" size={14} color={getStatusColor()} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {getDaysText()}
                </Text>
              </View>
              
              {item.location_name && (
                <View style={styles.metaItem}>
                  <FontAwesome name={getLocationIcon() as any} size={14} color={colors.tertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.location_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {(onEdit || onDelete) && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                  <FontAwesome name="edit" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                  <FontAwesome name="trash" size={18} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        <View 
          style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} 
        />
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: '100%',
  },
});