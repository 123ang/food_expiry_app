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
          // Remove all styling to avoid conflicts with container
          backgroundColor: 'transparent',
          padding: 12,
          borderRadius: 8,
          minHeight: 44, // Ensure consistent height
          justifyContent: 'center',
          // Remove border and margin since container handles it
        }}
      >
        <Text style={{ 
          color: theme.textColor,
          fontSize: 16,
          // Ensure consistent text styling
        }}>
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
              backgroundColor: isDarkTheme ? '#1A1A1A' : theme.cardBackground,
              borderTopWidth: 1,
              borderTopColor: theme.borderColor,
            }}>
              <TouchableOpacity
                onPress={handleDone}
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
          <View style={{
            backgroundColor: isDarkTheme ? '#1A1A1A' : '#FFFFFF',
          }}>
            <DateTimePicker
              value={value}
              mode="date"
              onChange={onDateChange}
              minimumDate={minimumDate}
              {...themeProps}
            />
          </View>
        </>
      )}
    </>
  );
} 