import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DatabaseProvider } from '../context/DatabaseContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useNotificationChecker } from '../hooks/useNotificationChecker';
import { useFonts } from 'expo-font';
import { FONTS_TO_LOAD } from '../styles/typography';
import { useTypography } from '../hooks/useTypography';
import { loadCustomFonts } from '../styles/fontLoader';
import { useEffect, useState } from 'react';

function RootLayoutContent() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [customFontsLoaded, setCustomFontsLoaded] = useState(false);
  
  // Get typography based on current language
  const typography = useTypography(undefined, language);
  
  // Load standard fonts
  const [fontsLoaded] = useFonts(FONTS_TO_LOAD);
  
  // Load custom fonts (like Shippori Mincho)
  useEffect(() => {
    const loadFonts = async () => {
      const loaded = await loadCustomFonts();
      setCustomFontsLoaded(true); // Always set to true, as we have fallbacks
    };
    
    if (fontsLoaded) {
      loadFonts();
    }
  }, [fontsLoaded]);
  
  // Initialize notification checker for automatic expiry notifications
  useNotificationChecker();

  // Show loading spinner while fonts are loading
  if (!fontsLoaded || !customFontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.backgroundColor, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.cardBackground,
          },
          headerTintColor: theme.textColor,
          headerShadowVisible: false,
          headerTitleStyle: {
            ...typography.h4,
            color: theme.textColor,
          },
          contentStyle: {
            backgroundColor: theme.backgroundColor,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="list"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="items"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="locations"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: 'Add Item',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="item"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DatabaseProvider>
          <RootLayoutContent />
        </DatabaseProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
} 