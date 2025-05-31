import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ItemLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide all headers by default since we have custom UI
        contentStyle: { backgroundColor: theme.backgroundColor },
      }}
    >
      <Stack.Screen 
        name="[id]"
        options={{
          headerShown: false, // Completely hide navigation header for item details
        }}
      />
    </Stack>
  );
} 