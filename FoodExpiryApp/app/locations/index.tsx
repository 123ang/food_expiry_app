import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import IconSelector, { LOCATION_ICONS } from '../../components/IconSelector';
import { Location } from '../../database/models';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function LocationsScreen() {
  const { theme } = useTheme();
  const { locations, createLocation, updateLocation, deleteLocation } = useDatabase();
  const router = useRouter();
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconName>('building');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    addButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 8,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    input: {
      fontSize: 16,
      color: theme.textColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingVertical: 8,
      marginBottom: 16,
    },
    iconSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconText: {
      color: theme.textColor,
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    locationList: {
      flex: 1,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    locationIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
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
  });

  const handleSave = async () => {
    try {
      if (!newName.trim()) {
        Alert.alert('Error', 'Please enter a location name');
        return;
      }

      if (editingLocation) {
        await updateLocation({
          ...editingLocation,
          name: newName.trim(),
          icon: selectedIcon,
        });
      } else {
        await createLocation({
          name: newName.trim(),
          icon: selectedIcon,
        });
      }

      setNewName('');
      setSelectedIcon('building');
      setEditingLocation(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setNewName(location.name);
    setSelectedIcon(location.icon as IconName);
  };

  const handleDelete = async (location: Location) => {
    if (!location.id) return;

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Location Name"
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
          />
          
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconSelector(true)}
          >
            <View style={styles.iconPreview}>
              <FontAwesome name={selectedIcon} size={20} color={theme.primaryColor} />
            </View>
            <Text style={styles.iconText}>Select Icon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {editingLocation ? 'Update Location' : 'Add Location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationList}>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <FontAwesome
                  name={location.icon as IconName}
                  size={20}
                  color={theme.primaryColor}
                />
              </View>
              <Text style={styles.locationName}>{location.name}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(location)}
              >
                <FontAwesome name="pencil" size={20} color={theme.primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(location)}
              >
                <FontAwesome name="trash" size={20} color={theme.dangerColor} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <IconSelector
        visible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(icon) => {
          setSelectedIcon(icon);
          setShowIconSelector(false);
        }}
        icons={LOCATION_ICONS}
        title="Select Location Icon"
        selectedIcon={selectedIcon}
      />
    </View>
  );
} 