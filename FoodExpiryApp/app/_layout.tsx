import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { DatabaseProvider } from '../context/DatabaseContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function Layout() {
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
            title: 'Fresh Food',
            headerRight: () => null,
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <Layout />
      </DatabaseProvider>
    </ThemeProvider>
  );
} 