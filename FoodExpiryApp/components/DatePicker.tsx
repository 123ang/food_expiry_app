import React from 'react';
import { Platform, TextInput, StyleSheet } from 'react-native';
import { Theme } from '../theme';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  theme: Theme;
  minimumDate?: Date;
}

export function DatePicker({ value, onChange, theme, minimumDate }: DatePickerProps) {
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

  return (
    <TextInput
      style={{
        backgroundColor: theme.backgroundColor,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        color: theme.textColor,
        borderWidth: 1,
        borderColor: theme.borderColor,
      }}
      value={value.toISOString().split('T')[0]}
      onChangeText={(text) => {
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
          onChange(date);
        }
      }}
      placeholder="YYYY-MM-DD"
    />
  );
} 