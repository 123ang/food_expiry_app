import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function LocationsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.textColor,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Storage Locations',
        }}
      />
    </Stack>
  );
} 