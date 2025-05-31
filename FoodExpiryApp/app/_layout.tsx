import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DatabaseProvider } from '../context/DatabaseContext';
import { LanguageProvider } from '../context/LanguageContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

function RootLayoutContent() {
  const { theme } = useTheme();

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
            fontWeight: '600',
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