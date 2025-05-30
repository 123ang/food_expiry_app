import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

// Light theme colors
export const lightColors = {
  background: '#F9F9F9',
  card: '#FFFFFF',
  primary: '#4CAF50',
  secondary: '#FFA726',
  tertiary: '#8D6E63',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.08)',
  success: '#4CAF50',
  warning: '#FFA726',
  danger: '#FF5252',
  headerBackground: '#FFFFFF',
};

// Dark theme colors
export const darkColors = {
  background: '#1A1B1E',
  card: '#2D2F34',
  primary: '#4CAF50',
  secondary: '#FFA726',
  tertiary: '#8D6E63',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.2)',
  success: '#4CAF50',
  warning: '#FFA726',
  danger: '#FF5252',
  headerBackground: '#2D2F34',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setTheme] = useState<ThemeType>('light');

  // Initialize theme based on device preference
  useEffect(() => {
    // Check if there's a saved theme preference
    const loadTheme = async () => {
      try {
        // You can use AsyncStorage here if needed
        // For now, we'll just use the device color scheme
        setTheme(deviceColorScheme === 'dark' ? 'dark' : 'light');
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, [deviceColorScheme]);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save theme preference if needed
    // You can use AsyncStorage here
  };

  // Get colors based on current theme
  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};