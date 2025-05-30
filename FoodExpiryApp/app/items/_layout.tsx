import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ParamListBase } from '@react-navigation/native';

type ItemStatusParams = {
  status: string;
}

export default function ItemsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: theme.backgroundColor },
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.textColor,
      }}
    >
      <Stack.Screen 
        name="[status]/index"
        options={{
          title: 'Items',
          headerShown: false, // We're handling the header in the component
        }}
      />
    </Stack>
  );
} 