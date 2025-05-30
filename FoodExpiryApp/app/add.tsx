import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { DatePicker } from '../components/DatePicker';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data
const sampleCategories = [
  { id: 1, name: 'Vegetables', icon: 'leaf' as IconName },
  { id: 2, name: 'Fruits', icon: 'apple' as IconName },
  { id: 3, name: 'Dairy', icon: 'glass' as IconName },
  { id: 4, name: 'Meat', icon: 'cutlery' as IconName },
  { id: 5, name: 'Snacks', icon: 'coffee' as IconName },
  { id: 6, name: 'Desserts', icon: 'birthday-cake' as IconName },
  { id: 7, name: 'Seafood', icon: 'anchor' as IconName },
  { id: 8, name: 'Bread', icon: 'shopping-basket' as IconName },
];

const sampleLocations = [
  { id: 1, name: 'Fridge', icon: 'building' as IconName },
  { id: 2, name: 'Freezer', icon: 'snowflake-o' as IconName },
  { id: 3, name: 'Pantry', icon: 'archive' as IconName },
  { id: 4, name: 'Cabinet', icon: 'inbox' as IconName },
];

export default function AddScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingTop: Platform.OS === 'ios' ? 48 : 24,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
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
      backgroundColor: theme.primaryColor + '10',
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryColor + '20',
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
      borderRadius: 8,
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

  const handleSave = () => {
    // TODO: Implement save functionality
    router.back();
  };

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
            <Text style={styles.label}>Category</Text>
            <View style={styles.optionsGrid}>
              {sampleCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionCard,
                    selectedCategory === category.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View style={styles.optionIcon}>
                    <FontAwesome name={category.icon} size={20} color={theme.primaryColor} />
                  </View>
                  <Text style={styles.optionName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Storage Location</Text>
            <View style={styles.optionsGrid}>
              {sampleLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.optionCard,
                    selectedLocation === location.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedLocation(location.id)}
                >
                  <View style={styles.optionIcon}>
                    <FontAwesome name={location.icon} size={20} color={theme.primaryColor} />
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
            <Text style={styles.label}>Reminder Days Before Expiry</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of days"
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

        <BottomNav />
      </View>
    </>
  );
} 