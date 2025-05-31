import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { DatabaseProvider } from '../context/DatabaseContext';
import { LanguageProvider } from '../context/LanguageContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RootLayout() {
  const { theme } = useTheme();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <DatabaseProvider>
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
                  title: 'Fresh Food',
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
                  title: 'Settings',
                }}
              />
              <Stack.Screen
                name="calendar"
                options={{
                  title: 'Calendar',
                }}
              />
            </Stack>
          </View>
        </DatabaseProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
} 