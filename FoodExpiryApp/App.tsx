import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DatabaseProvider } from './context/DatabaseContext';

function AppContent() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <StatusBar style="auto" />
      <Slot />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </ThemeProvider>
  );
}
