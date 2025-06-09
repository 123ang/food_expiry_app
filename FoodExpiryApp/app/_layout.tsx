import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DatabaseProvider, useDatabase } from '../context/DatabaseContext';
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
import { validateDatabaseImageLinks } from '../utils/fileStorage';
import { FoodItem } from '../database/models';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { foodItems, updateFoodItem, refreshFoodItems, isDataAvailable } = useDatabase();
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
  
  // Image validation and repair logic
  useEffect(() => {
    const runImageValidationAndRepair = async () => {
      if (!isDataAvailable()) {
        console.log("Data not available yet, skipping image validation.");
        return;
      }

      console.log('Running image validation and repair...');
      const imageUris = foodItems
        .map(item => item.image_uri)
        .filter((uri): uri is string => !!uri && !uri.startsWith('emoji:'));

      if (imageUris.length === 0) {
        console.log('No local image URIs to validate.');
        return;
      }

      const { broken, repaired } = await validateDatabaseImageLinks(imageUris);

      if (repaired.length > 0) {
        console.log(`Found ${repaired.length} broken image links to repair.`);
        for (const repairedImage of repaired) {
          const itemToUpdate = foodItems.find(item => item.image_uri === repairedImage.oldUri);
          if (itemToUpdate) {
            console.log(`Repairing image for item: ${itemToUpdate.name}`);
            const updatedItem: FoodItem = {
              id: itemToUpdate.id,
              name: itemToUpdate.name,
              quantity: itemToUpdate.quantity,
              category_id: itemToUpdate.category_id,
              location_id: itemToUpdate.location_id,
              expiry_date: itemToUpdate.expiry_date,
              reminder_days: itemToUpdate.reminder_days,
              notes: itemToUpdate.notes,
              image_uri: repairedImage.newUri, // The new, correct URI
              created_at: itemToUpdate.created_at,
            };
            await updateFoodItem(updatedItem);
          }
        }
        console.log('Finished repairing images. Refreshing food items list.');
        await refreshFoodItems();
      } else {
        console.log('No repairable image links found.');
      }

      if (broken.length > 0) {
        console.warn(`Could not repair ${broken.length} image links:`, broken);
      }
    };

    if (appIsReady) {
        runImageValidationAndRepair();
    }
  }, [appIsReady, isDataAvailable]);

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