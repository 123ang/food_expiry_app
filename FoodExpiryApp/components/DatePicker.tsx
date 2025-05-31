import React, { useState } from 'react';
import { Platform, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../theme';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  theme: Theme;
  minimumDate?: Date;
}

export function DatePicker({ value, onChange, theme, minimumDate }: DatePickerProps) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        style={{
          backgroundColor: theme.backgroundColor,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          color: theme.textColor,
          borderWidth: 1,
          borderColor: theme.borderColor,
          width: '100%',
          height: 40,
        }}
        value={value.toISOString().split('T')[0]}
        onChange={(e) => onChange(new Date(e.target.value))}
        min={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
      />
    );
  }

  const showDatePicker = () => {
    setShow(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={showDatePicker}
        style={{
          backgroundColor: theme.backgroundColor,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: theme.borderColor,
        }}
      >
        <Text style={{ color: theme.textColor }}>
          {value.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={minimumDate}
        />
      )}
    </>
  );
} 