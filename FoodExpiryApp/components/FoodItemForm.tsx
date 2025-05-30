import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Category, Location, FoodItem } from '../database/models';

interface FoodItemFormProps {
  initialValues?: Partial<FoodItem>;
  categories: Category[];
  locations: Location[];
  onSubmit: (values: Partial<FoodItem>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FoodItemForm: React.FC<FoodItemFormProps> = ({
  initialValues,
  categories,
  locations,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const [values, setValues] = useState<Partial<FoodItem>>({
    name: '',
    category_id: null,
    location_id: null,
    expiry_date: new Date().toISOString().split('T')[0],
    notes: '',
    image_uri: null,
    ...initialValues,
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    values.expiry_date ? new Date(values.expiry_date) : new Date()
  );

  // Update selected date when initialValues change
  useEffect(() => {
    if (initialValues?.expiry_date) {
      setSelectedDate(new Date(initialValues.expiry_date));
    }
  }, [initialValues]);

  // Handle text input changes
  const handleChange = (field: keyof FoodItem, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  // Handle date change
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      handleChange('expiry_date', date.toISOString().split('T')[0]);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle image picking
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleChange('image_uri', result.assets[0].uri);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!values.name) {
      Alert.alert('Error', 'Please enter a name for the food item');
      return;
    }
    
    if (!values.category_id) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    
    if (!values.location_id) {
      Alert.alert('Error', 'Please select a storage location');
      return;
    }
    
    onSubmit(values);
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={values.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="Enter food name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
        <View style={styles.optionsContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    values.category_id === category.id ? colors.primary : 'transparent',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleChange('category_id', category.id)}
            >
              <FontAwesome
                name={(category.icon as any) || 'tag'}
                size={16}
                color={values.category_id === category.id ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: values.category_id === category.id ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Storage Location *</Text>
        <View style={styles.optionsContainer}>
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    values.location_id === location.id ? colors.primary : 'transparent',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleChange('location_id', location.id)}
            >
              <FontAwesome
                name={(location.icon as any) || 'map-marker'}
                size={16}
                color={values.location_id === location.id ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: values.location_id === location.id ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {location.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Expiry Date *</Text>
        <TouchableOpacity
          style={[styles.dateButton, { borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <FontAwesome name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {values.expiry_date ? formatDate(values.expiry_date) : 'Select date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={values.notes || ''}
          onChangeText={(text) => handleChange('notes', text)}
          placeholder="Add any additional notes"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.text }]}>Image (Optional)</Text>
        <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
          {values.image_uri ? (
            <Image source={{ uri: values.image_uri }} style={styles.previewImage} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: colors.primary + '20', borderColor: colors.border },
              ]}
            >
              <FontAwesome name="camera" size={24} color={colors.primary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                Tap to add image
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={initialValues?.id ? 'Update' : 'Add'}
            onPress={handleSubmit}
            variant="primary"
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});