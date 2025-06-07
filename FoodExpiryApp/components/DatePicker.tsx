import React, { useState } from 'react';
import { Platform, TextInput, StyleSheet, TouchableOpacity, Text, Alert, View } from 'react-native';
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

  // Enhanced theme detection logic
  const isDarkTheme = 
    theme.backgroundColor === '#2C2417' || // Dark theme background
    theme.textColor === '#F5EFE7' || // Dark theme text color
    (theme.backgroundColor?.toLowerCase().includes('#2c')) || // Any dark background
    (theme.textColor?.toLowerCase().includes('#f5')); // Any light text color

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        style={{
          backgroundColor: theme.backgroundColor,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          color: isDarkTheme ? '#FFFFFF' : '#000000', // White text in dark theme, black in light
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
    // Handle different platforms and event types
    if (Platform.OS === 'android') {
      // On Android, close picker after selection
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
      setShow(false);
    } else {
      // On iOS, handle different event types
      if (event.type === 'dismissed') {
        // User cancelled or tapped outside
        setShow(false);
      } else if (selectedDate) {
        // User is scrolling/selecting - update value but keep picker open
        onChange(selectedDate);
        // Don't close the picker, let user continue scrolling
      }
    }
  };

  // Platform-specific theme configuration
  const getThemeProps = () => {
    if (Platform.OS === 'ios') {
      return {
        // iOS supports these theme props
        textColor: isDarkTheme ? '#FFFFFF' : '#000000', // White text in dark theme, black in light
        themeVariant: (isDarkTheme ? 'dark' : 'light') as 'dark' | 'light',
        accentColor: theme.primaryColor || '#4CAF50',
        // Use spinner display for better text color control on iOS
        display: 'spinner' as const,
      };
    } else {
      // Android - we can't control the theme, so just use default
      return {
        display: 'default' as const,
      };
    }
  };

  const themeProps = getThemeProps();

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
        <>
          {Platform.OS === 'ios' && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: theme.cardBackground,
              borderTopWidth: 1,
              borderTopColor: theme.borderColor,
            }}>
              <TouchableOpacity
                onPress={() => setShow(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: theme.primaryColor,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={value}
            mode="date"
            onChange={onDateChange}
            minimumDate={minimumDate}
            {...themeProps}
          />
        </>
      )}
    </>
  );
} 