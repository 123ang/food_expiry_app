import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import IconSelector, { LOCATION_ICONS } from '../../components/IconSelector';
import LocationIcon from '../../components/LocationIcon';
import { Location } from '../../database/models';
import { useLanguage } from '../../context/LanguageContext';

// Location emojis for selection - All 9 location emojis
const LOCATION_EMOJIS = [
  { key: 'freezer', emoji: '🧊', label: 'Freezer' },
  { key: 'fridge', emoji: '❄️', label: 'Fridge' },
  { key: 'cabinet', emoji: '📦', label: 'Cabinet' },
  { key: 'lunch_box', emoji: '🍱', label: 'Lunch Box' },
  { key: 'takeout_container', emoji: '🥡', label: 'Takeout Container' },
  { key: 'pantry', emoji: '🏠', label: 'Pantry' },
  { key: 'dining_area', emoji: '🍽️', label: 'Dining Area' },
  { key: 'storage_box', emoji: '📦', label: 'Storage Box' },
  { key: 'shopping_cart', emoji: '🛒', label: 'Shopping Cart' },
];

// Emoji Selector Component
const EmojiSelector: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}> = ({ visible, onClose, onSelect, selectedEmoji }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      paddingVertical: 8,
      gap: 8,
    },
    emojiButton: {
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedEmoji: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}20`,
    },
    emojiText: {
      fontSize: 32,
      textAlign: 'center',
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('selectIcon')}</Text>
          <ScrollView showsVerticalScrollIndicator={true}>
            <View style={styles.emojiGrid}>
              {LOCATION_EMOJIS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === item.emoji && styles.selectedEmoji,
                  ]}
                  onPress={() => onSelect(item.emoji)}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function LocationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { locations, createLocation, updateLocation, deleteLocation, refreshLocations } = useDatabase();
  const router = useRouter();
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('❄️');

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
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
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
    if (!newName.trim()) {
      Alert.alert(t('alert.error'), t('alert.nameRequired'));
      return;
    }

    try {
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
      setSelectedIcon('❄️');
      setEditingLocation(null);
      await refreshLocations();
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.saveFailed'));
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setNewName(location.name);
    setSelectedIcon(location.icon);
  };

  const handleDelete = async (location: Location) => {
    if (!location.id) return;

    Alert.alert(
      t('locations.deleteLocation'),
      `${t('locations.deleteConfirm')} "${location.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(location.id!);
            } catch (error) {
              Alert.alert(t('alert.error'), t('locations.errorDelete'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('locations.title')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setEditingLocation(null)}>
            <FontAwesome name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('locationName')}
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
          />
          
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconSelector(true)}
          >
            <View style={styles.iconPreview}>
              <LocationIcon iconName={selectedIcon} size={20} />
            </View>
            <Text style={styles.iconText}>{t('selectIcon')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {editingLocation ? t('locations.updateLocation') : t('locations.addLocation')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationList}>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <LocationIcon iconName={location.icon} size={20} />
              </View>
              <Text style={styles.locationName}>{location.name}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(location)}
              >
                <Text style={{ fontSize: 20, color: theme.primaryColor }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(location)}
              >
                <Text style={{ fontSize: 20, color: theme.dangerColor }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <EmojiSelector
        visible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(emoji) => {
          setSelectedIcon(emoji);
          setShowIconSelector(false);
        }}
        selectedEmoji={selectedIcon}
      />
      
      <BottomNav />
    </View>
  );
} 