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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { Location } from '../database/models';

export default function LocationsScreen() {
  const { theme } = useTheme();
  const { locations, createLocation, updateLocation, deleteLocation } = useDatabase();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationIcon, setLocationIcon] = useState('');

  const handleSave = async () => {
    if (!locationName.trim() || !locationIcon.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (editingLocation) {
        await updateLocation({
          ...editingLocation,
          name: locationName,
          icon: locationIcon,
        });
      } else {
        await createLocation({
          name: locationName,
          icon: locationIcon,
        });
      }
      handleCloseModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setLocationIcon(location.icon);
    setModalVisible(true);
  };

  const handleDelete = (location: Location) => {
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
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingLocation(null);
    setLocationName('');
    setLocationIcon('');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      padding: 16,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationIcon: {
      width: 40,
      height: 40,
      backgroundColor: theme.primaryColor + '20',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    locationName: {
      flex: 1,
      fontSize: 16,
      color: theme.textColor,
    },
    actionButton: {
      padding: 8,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
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
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
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
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.locationIcon}>
              <FontAwesome name={item.icon} size={20} color={theme.primaryColor} />
            </View>
            <Text style={styles.locationName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <FontAwesome name="edit" size={20} color={theme.primaryColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <FontAwesome name="trash" size={20} color={theme.dangerColor} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLocation ? 'Edit Location' : 'New Location'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Location Name"
              placeholderTextColor={theme.textSecondary}
              value={locationName}
              onChangeText={setLocationName}
            />
            <TextInput
              style={styles.input}
              placeholder="Icon Name (FontAwesome)"
              placeholderTextColor={theme.textSecondary}
              value={locationIcon}
              onChangeText={setLocationIcon}
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
          </View>
        </View>
      </Modal>
    </View>
  );
} 