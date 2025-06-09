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

  // Enhanced theme detection logic for better black/dark theme recognition
  const isDarkTheme = 
    theme.backgroundColor === '#2C2417' || // Dark brown theme background
    theme.backgroundColor === '#000000' || // Pure black theme background
    theme.backgroundColor === '#1A1A1A' || // Black theme variant background
    theme.textColor === '#F5EFE7' || // Dark brown theme text color
    theme.textColor === '#FFFFFF' || // Black theme text color (white text indicates dark background)
    (theme.backgroundColor?.toLowerCase().includes('#2c')) || // Any dark background
    (theme.backgroundColor?.toLowerCase().includes('#000')) || // Black backgrounds
    (theme.backgroundColor?.toLowerCase().includes('#1a1')) || // Very dark backgrounds
    (theme.textColor?.toLowerCase().includes('#f5')) || // Light text colors
    (theme.textColor?.toLowerCase().includes('#fff')); // White text colors

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        style={{
          backgroundColor: 'transparent', // Use transparent to inherit from container
          padding: 12,
          borderRadius: 8,
          color: isDarkTheme ? '#FFFFFF' : '#000000',
          border: 'none', // Remove border since container handles it
          width: '100%',
          height: 40,
          fontSize: 16,
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
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else if (Platform.OS === 'ios') {
      // On iOS, handle different event types
      if (event.type === 'dismissed') {
        // User cancelled or tapped outside
        setShow(false);
      } else if (selectedDate) {
        // User is scrolling/selecting - update value immediately
        onChange(selectedDate);
        // Keep picker open for iOS to allow continued scrolling
      }
    }
  };

  const handleDone = () => {
    setShow(false);
  };

  // Platform-specific theme configuration
  const getThemeProps = () => {
    if (Platform.OS === 'ios') {
      return {
        // iOS supports these theme props - ensure proper color configuration
        textColor: isDarkTheme ? '#FFFFFF' : '#000000',
        themeVariant: (isDarkTheme ? 'dark' : 'light') as 'dark' | 'light',
        accentColor: theme.primaryColor || '#4CAF50',
        // Use compact display for better theme support
        display: 'compact' as const,
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
          // The container will handle the background and border
          padding: Platform.OS === 'ios' ? 0 : 12, // No padding on iOS
          borderRadius: 8,
          minHeight: 44,
          justifyContent: 'center',
          // If using compact picker, it fills the container, so no extra styling needed
        }}
      >
        {/* On iOS with compact display, the picker itself is the button */}
        {Platform.OS === 'ios' && show ? (
           <DateTimePicker
              value={value}
              mode="date"
              onChange={onDateChange}
              minimumDate={minimumDate}
              {...themeProps}
            />
        ) : (
          <Text style={{ 
            color: theme.textColor,
            fontSize: 16,
          }}>
            {value.toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>

      {/* For Android, the picker appears in a modal */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={value}
          mode="date"
          onChange={onDateChange}
          minimumDate={minimumDate}
          {...themeProps}
        />
      )}
    </>
  );
} 