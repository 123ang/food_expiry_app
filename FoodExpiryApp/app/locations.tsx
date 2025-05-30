import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDatabase } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { CategoryLocationCard } from '../components/CategoryLocationCard';
import { CategoryLocationForm } from '../components/CategoryLocationForm';
import { EmptyState } from '../components/EmptyState';
import { Location } from '../database/models';

export default function LocationsScreen() {
  const { colors } = useTheme();
  const { 
    locations, 
    loading, 
    createLocation, 
    updateLocation, 
    deleteLocation,
    getLocationItemCount,
  } = useDatabase();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle location creation
  const handleCreateLocation = async (values: Partial<Location>) => {
    setIsSubmitting(true);
    try {
      await createLocation(values as Location);
      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create location');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle location update
  const handleUpdateLocation = async (values: Partial<Location>) => {
    if (!selectedLocation?.id) return;
    
    setIsSubmitting(true);
    try {
      await updateLocation({ ...values, id: selectedLocation.id } as Location);
      setShowEditModal(false);
      setSelectedLocation(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle location deletion
  const handleDeleteLocation = (location: Location) => {
    const itemCount = getLocationItemCount(location.id!);
    
    if (itemCount > 0) {
      Alert.alert(
        'Cannot Delete',
        `This location contains ${itemCount} items. Please remove or reassign these items first.`
      );
      return;
    }
    
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(location.id!);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete location');
            }
          } 
        },
      ]
    );
  };

  // Open edit modal
  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  // Render add/edit location modal
  const renderLocationModal = (isEdit: boolean) => {
    const visible = isEdit ? showEditModal : showAddModal;
    const onClose = isEdit ? () => setShowEditModal(false) : () => setShowAddModal(false);
    const onSubmit = isEdit ? handleUpdateLocation : handleCreateLocation;
    const initialValues = isEdit ? selectedLocation : undefined;
    
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <CategoryLocationForm
            type="location"
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isSubmitting}
          />
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Storage Locations" 
        showBackButton 
        onBackPress={() => router.back()} 
        rightIcon="plus"
        onRightIconPress={() => setShowAddModal(true)}
      />
      
      {locations.length === 0 && !loading ? (
        <EmptyState
          title="No Storage Locations"
          message="Add locations to organize where your food is stored."
          icon="map-marker"
          actionLabel="Add Location"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
            <CategoryLocationCard
              item={item}
              itemCount={getLocationItemCount(item.id!)}
              onPress={() => router.push(`/location/${item.id}`)}
              onEdit={() => openEditModal(item)}
              onDelete={() => handleDeleteLocation(item)}
              type="location"
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {renderLocationModal(false)} {/* Add modal */}
      {renderLocationModal(true)} {/* Edit modal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});