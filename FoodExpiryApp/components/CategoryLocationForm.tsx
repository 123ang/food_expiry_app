import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Category, Location } from '../database/models';

type IconOption = {
  name: string;
  label: string;
};

const CATEGORY_ICONS: IconOption[] = [
  { name: 'apple', label: 'Fruit' },
  { name: 'leaf', label: 'Vegetable' },
  { name: 'coffee', label: 'Beverage' },
  { name: 'cutlery', label: 'Meal' },
  { name: 'shopping-basket', label: 'Grocery' },
  { name: 'birthday-cake', label: 'Dessert' },
  { name: 'cheese', label: 'Dairy' },
  { name: 'drumstick-bite', label: 'Meat' },
  { name: 'fish', label: 'Seafood' },
  { name: 'bread-slice', label: 'Bakery' },
  { name: 'egg', label: 'Egg' },
  { name: 'pizza-slice', label: 'Fast Food' },
  { name: 'tag', label: 'Other' },
];

const LOCATION_ICONS: IconOption[] = [
  { name: 'snowflake-o', label: 'Freezer' },
  { name: 'thermometer-three-quarters', label: 'Fridge' },
  { name: 'archive', label: 'Pantry' },
  { name: 'cutlery', label: 'Kitchen' },
  { name: 'shopping-basket', label: 'Basket' },
  { name: 'home', label: 'Home' },
  { name: 'building', label: 'Storage' },
  { name: 'map-marker', label: 'Other' },
];

interface CategoryLocationFormProps {
  type: 'category' | 'location';
  initialValues?: Partial<Category | Location>;
  onSubmit: (values: Partial<Category | Location>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CategoryLocationForm: React.FC<CategoryLocationFormProps> = ({
  type,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const [values, setValues] = useState<Partial<Category | Location>>({
    name: '',
    icon: type === 'category' ? 'tag' : 'map-marker',
    ...initialValues,
  });

  // Get icons based on type
  const icons = type === 'category' ? CATEGORY_ICONS : LOCATION_ICONS;

  // Handle text input changes
  const handleChange = (field: keyof (Category | Location), value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!values.name) {
      Alert.alert('Error', `Please enter a name for the ${type}`);
      return;
    }
    
    onSubmit(values);
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={[styles.title, { color: colors.text }]}>
          {initialValues?.id ? `Edit ${type}` : `Add new ${type}`}
        </Text>
        
        <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={values.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder={`Enter ${type} name`}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Icon</Text>
        <View style={styles.iconsContainer}>
          {icons.map((icon) => (
            <TouchableOpacity
              key={icon.name}
              style={[
                styles.iconButton,
                {
                  backgroundColor:
                    values.icon === icon.name ? colors.primary : 'transparent',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleChange('icon', icon.name)}
            >
              <FontAwesome
                name={icon.name as any}
                size={20}
                color={values.icon === icon.name ? '#FFFFFF' : colors.text}
              />
            </TouchableOpacity>
          ))}
        </View>

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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
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
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    margin: 4,
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