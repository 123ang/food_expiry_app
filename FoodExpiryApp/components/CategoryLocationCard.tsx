import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';
import { Category, Location } from '../database/models';

interface CategoryLocationCardProps {
  item: Category | Location;
  itemCount: number;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  type: 'category' | 'location';
}

export const CategoryLocationCard: React.FC<CategoryLocationCardProps> = ({
  item,
  itemCount,
  onPress,
  onEdit,
  onDelete,
  type,
}) => {
  const { colors } = useTheme();

  // Get icon for the item
  const getIcon = () => {
    if (!item.icon) {
      return type === 'category' ? 'tag' : 'map-marker';
    }
    return item.icon;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.container}>
        <View style={styles.content}>
          <View 
            style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}
          >
            <FontAwesome name={getIcon() as any} size={24} color={colors.primary} />
          </View>
          
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          
          {(onEdit || onDelete) && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                  <FontAwesome name="edit" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity 
                  onPress={onDelete} 
                  style={styles.actionButton}
                  disabled={itemCount > 0}
                >
                  <FontAwesome 
                    name="trash" 
                    size={18} 
                    color={itemCount > 0 ? colors.textSecondary : colors.danger} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  count: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
  },
});