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
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { DatePicker } from '../components/DatePicker';
import { getCurrentDate } from '../database/database';
import { BottomNav } from '../components/BottomNav';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function AddScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
    console.log('=== ADD SCREEN handleSave started ===');
    console.log('Item name:', itemName);
    console.log('Quantity:', quantity);
    console.log('Category ID:', selectedCategory);
    console.log('Location ID:', selectedLocation);
    
    if (!itemName.trim()) {
      Alert.alert(t('alert.error'), t('error.enterItemName'));
      return;
    }

    if (!selectedLocation) {
      Alert.alert(t('alert.error'), t('error.selectStorageLocation'));
      return;
    }

    try {
      console.log('Creating food item...');
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
      
      console.log('Food item created with ID:', id);
      
      // Refresh all data to ensure consistency across the app
      await refreshAll();
      console.log('Data refreshed, navigating back');
      
      router.back();
    } catch (error) {
      console.error('=== ADD SCREEN ERROR ===');
      console.error('Error creating food item:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      Alert.alert(t('alert.error'), `${t('error.failedToCreate')}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      borderRadius: 8,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 24,
    },
    notesInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 4,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      padding: 8,
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
          <Text style={styles.title}>{t('addItem.title')}</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('form.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.itemName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addItem.itemNamePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.quantity')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addItem.quantityPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.category')}</Text>
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
                    <CategoryIcon iconName={category.icon} size={20} />
                  </View>
                  <Text style={styles.optionName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.storageLocation')}</Text>
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
                    <LocationIcon iconName={location.icon} size={20} />
                  </View>
                  <Text style={styles.optionName}>{location.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.expiryDate')}</Text>
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
            <Text style={styles.label}>{t('addItem.reminderDays')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addItem.reminderDaysPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={reminderDays}
              onChangeText={setReminderDays}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.notes')}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder={t('addItem.notesPlaceholder')}
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