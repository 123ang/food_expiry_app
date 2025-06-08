import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DatabaseProvider } from '../context/DatabaseContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { useNotificationChecker } from '../hooks/useNotificationChecker';
import { useFonts } from 'expo-font';
import { FONTS_TO_LOAD } from '../styles/typography';
import { useTypography } from '../hooks/useTypography';
import { loadCustomFonts } from '../styles/fontLoader';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [customFontsLoaded, setCustomFontsLoaded] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  
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

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading time to show splash
        await new Promise(resolve => setTimeout(resolve, 2000));
      } finally {
        setAppIsReady(true);
      }
    }

    if (fontsLoaded && customFontsLoaded) {
      prepare();
    }
  }, [fontsLoaded, customFontsLoaded]);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);
  
  // Initialize notification checker for automatic expiry notifications
  useNotificationChecker();

  // Show custom green splash screen while loading
  if (!appIsReady) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#006b29', // Your updated green color
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Image 
          source={require('../assets/food_expiry_logo_adaptive.png')}
          style={{
            width: 200,
            height: 200,
            marginBottom: 20,
            resizeMode: 'contain'
          }}
        />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{
          color: '#ffffff',
          marginTop: 20,
          fontSize: 16,
          fontWeight: '600'
        }}>
          Loading Expiry Alert...
        </Text>
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