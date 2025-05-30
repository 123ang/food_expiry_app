import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Category, Location } from '../database/models';

type FilterStatus = 'all' | 'expired' | 'expiring_soon' | 'fresh';

interface FilterBarProps {
  selectedStatus: FilterStatus;
  selectedCategoryId: number | null;
  selectedLocationId: number | null;
  categories: Category[];
  locations: Location[];
  onStatusChange: (status: FilterStatus) => void;
  onCategoryChange: (categoryId: number | null) => void;
  onLocationChange: (locationId: number | null) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedStatus,
  selectedCategoryId,
  selectedLocationId,
  categories,
  locations,
  onStatusChange,
  onCategoryChange,
  onLocationChange,
  onResetFilters,
}) => {
  const { colors } = useTheme();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedStatus !== 'all') count++;
    if (selectedCategoryId !== null) count++;
    if (selectedLocationId !== null) count++;
    return count;
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    if (selectedCategoryId === null) return 'All Categories';
    const category = categories.find(c => c.id === selectedCategoryId);
    return category ? category.name : 'All Categories';
  };

  // Get selected location name
  const getSelectedLocationName = () => {
    if (selectedLocationId === null) return 'All Locations';
    const location = locations.find(l => l.id === selectedLocationId);
    return location ? location.name : 'All Locations';
  };

  // Get status color
  const getStatusColor = (status: FilterStatus) => {
    if (status === selectedStatus) {
      switch (status) {
        case 'expired':
          return colors.danger;
        case 'expiring_soon':
          return colors.warning;
        case 'fresh':
          return colors.success;
        default:
          return colors.primary;
      }
    }
    return 'transparent';
  };

  // Get status text color
  const getStatusTextColor = (status: FilterStatus) => {
    if (status === selectedStatus) {
      return '#FFFFFF';
    }
    return colors.text;
  };

  // Render category modal
  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <FontAwesome name="times" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.modalItem,
                selectedCategoryId === null && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => {
                onCategoryChange(null);
                setShowCategoryModal(false);
              }}
            >
              <FontAwesome
                name="list"
                size={16}
                color={selectedCategoryId === null ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.modalItemText,
                  { color: selectedCategoryId === null ? colors.primary : colors.text },
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.modalItem,
                  selectedCategoryId === category.id && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => {
                  onCategoryChange(category.id ?? null);
                  setShowCategoryModal(false);
                }}
              >
                <FontAwesome
                  name={(category.icon as any) || 'tag'}
                  size={16}
                  color={selectedCategoryId === category.id ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.modalItemText,
                    { color: selectedCategoryId === category.id ? colors.primary : colors.text },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render location modal
  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <FontAwesome name="times" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.modalItem,
                selectedLocationId === null && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => {
                onLocationChange(null);
                setShowLocationModal(false);
              }}
            >
              <FontAwesome
                name="list"
                size={16}
                color={selectedLocationId === null ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.modalItemText,
                  { color: selectedLocationId === null ? colors.primary : colors.text },
                ]}
              >
                All Locations
              </Text>
            </TouchableOpacity>
            
            {locations.map(location => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.modalItem,
                  selectedLocationId === location.id && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => {
                  onLocationChange(location.id ?? null);
                  setShowLocationModal(false);
                }}
              >
                <FontAwesome
                  name={(location.icon as any) || 'map-marker'}
                  size={16}
                  color={selectedLocationId === location.id ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.modalItemText,
                    { color: selectedLocationId === location.id ? colors.primary : colors.text },
                  ]}
                >
                  {location.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: getStatusColor('all'), borderColor: colors.border },
          ]}
          onPress={() => onStatusChange('all')}
        >
          <Text style={[styles.statusText, { color: getStatusTextColor('all') }]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: getStatusColor('expired'), borderColor: colors.border },
          ]}
          onPress={() => onStatusChange('expired')}
        >
          <FontAwesome
            name="exclamation-circle"
            size={14}
            color={getStatusTextColor('expired')}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: getStatusTextColor('expired') }]}>
            Expired
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: getStatusColor('expiring_soon'), borderColor: colors.border },
          ]}
          onPress={() => onStatusChange('expiring_soon')}
        >
          <FontAwesome
            name="clock-o"
            size={14}
            color={getStatusTextColor('expiring_soon')}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: getStatusTextColor('expiring_soon') }]}>
            Expiring Soon
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: getStatusColor('fresh'), borderColor: colors.border },
          ]}
          onPress={() => onStatusChange('fresh')}
        >
          <FontAwesome
            name="check-circle"
            size={14}
            color={getStatusTextColor('fresh')}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: getStatusTextColor('fresh') }]}>
            Fresh
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { borderColor: colors.border },
            selectedCategoryId !== null && { borderColor: colors.primary },
          ]}
          onPress={() => setShowCategoryModal(true)}
        >
          <FontAwesome
            name="tag"
            size={14}
            color={selectedCategoryId !== null ? colors.primary : colors.text}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              { color: colors.text },
              selectedCategoryId !== null && { color: colors.primary },
            ]}
            numberOfLines={1}
          >
            {getSelectedCategoryName()}
          </Text>
          <FontAwesome
            name="chevron-down"
            size={12}
            color={selectedCategoryId !== null ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            { borderColor: colors.border },
            selectedLocationId !== null && { borderColor: colors.primary },
          ]}
          onPress={() => setShowLocationModal(true)}
        >
          <FontAwesome
            name="map-marker"
            size={14}
            color={selectedLocationId !== null ? colors.primary : colors.text}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              { color: colors.text },
              selectedLocationId !== null && { color: colors.primary },
            ]}
            numberOfLines={1}
          >
            {getSelectedLocationName()}
          </Text>
          <FontAwesome
            name="chevron-down"
            size={12}
            color={selectedLocationId !== null ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        
        {getActiveFilterCount() > 0 && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={onResetFilters}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="times-circle" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
      
      {renderCategoryModal()}
      {renderLocationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    marginRight: 6,
  },
  resetButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
});