import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ItemsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide all headers by default
        contentStyle: { backgroundColor: theme.backgroundColor },
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="[status]/index"
        options={{
          headerShown: false, // Completely hide navigation header
        }}
      />
    </Stack>
  );
} 