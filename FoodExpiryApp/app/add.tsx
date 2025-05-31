import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDatabase } from '../context/DatabaseContext';
import { DatePicker } from '../components/DatePicker';
import { getCurrentDate } from '../database/database';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function AddScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { createFoodItem, refreshFoodItems, refreshAll, locations, categories } = useDatabase();
  const { prefilledDate } = useLocalSearchParams();
  
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (prefilledDate && typeof prefilledDate === 'string') {
      // Parse the date string manually to avoid timezone issues
      const [year, month, day] = prefilledDate.split('-').map(Number);
      setExpiryDate(new Date(year, month - 1, day)); // month is 0-indexed
    }
  }, [prefilledDate]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a storage location');
      return;
    }

    try {
      const id = await createFoodItem({
        name: itemName.trim(),
        quantity: parseInt(quantity) || 1,
        category_id: selectedCategory,
        location_id: selectedLocation,
        expiry_date: expiryDate.toISOString().split('T')[0],
        reminder_days: parseInt(reminderDays) || 0,
        notes: notes.trim(),
        created_at: getCurrentDate(),
        image_uri: null,
      });
      
      // Refresh all data to ensure consistency across the app
      await refreshAll();
      
      router.back();
    } catch (error) {
      console.error('Error creating food item:', error);
      Alert.alert('Error', 'Failed to create item');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
      flex: 1,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.cardBackground,
      padding: 12,
      borderRadius: theme.borderRadius,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    optionCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: theme.borderRadius,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionCardSelected: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}10`,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionName: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '500',
    },
    datePickerContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: theme.borderRadius,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 24,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    notesInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius / 2,
      alignItems: 'center',
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      padding: 8,
    },
    photoUpload: {
      width: '100%',
      height: 200,
      backgroundColor: theme.cardBackground,
      borderRadius: theme.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderStyle: 'dashed',
    },
    photoUploadIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    photoUploadText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Food Item</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter food item name"
              placeholderTextColor={theme.textSecondary}
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity"
              placeholderTextColor={theme.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.optionsGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionCard,
                    selectedCategory === category.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id!)}
                >
                  <View style={styles.optionIcon}>
                    <FontAwesome name={category.icon as IconName} size={20} color={theme.primaryColor} />
                  </View>
                  <Text style={styles.optionName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Storage Location</Text>
            <View style={styles.optionsGrid}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.optionCard,
                    selectedLocation === location.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedLocation(location.id!)}
                >
                  <View style={styles.optionIcon}>
                    <FontAwesome name={location.icon as IconName} size={20} color={theme.primaryColor} />
                  </View>
                  <Text style={styles.optionName}>{location.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Expiry Date</Text>
            <View style={styles.datePickerContainer}>
              <DatePicker
                value={expiryDate}
                onChange={setExpiryDate}
                theme={theme}
                minimumDate={new Date()}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reminder Days</Text>
            <TextInput
              style={styles.input}
              placeholder="Days before expiry to remind"
              placeholderTextColor={theme.textSecondary}
              value={reminderDays}
              onChangeText={setReminderDays}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add any notes about the item"
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </ScrollView>
      </View>
      <BottomNav />
    </>
  );
}