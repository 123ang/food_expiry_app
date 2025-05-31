import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function CategoriesLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.backgroundColor,
        },
        headerTintColor: theme.textColor,
        headerTitleStyle: {
          color: theme.textColor,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Categories',
        }}
      />
    </Stack>
  );
} 