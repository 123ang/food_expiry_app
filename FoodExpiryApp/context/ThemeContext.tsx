import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, themes, ThemeType, originalTheme } from '../theme/index';

interface ThemeContextType {
  theme: Theme;
  currentThemeType: ThemeType;
  setTheme: (themeType: ThemeType) => void;
  // Keep legacy support
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: originalTheme,
  currentThemeType: 'original',
  setTheme: () => {},
  isDark: false,
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = '@food_expiry_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeType, setCurrentThemeType] = useState<ThemeType>('original'); // Default to original theme for new users
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on app start
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme as ThemeType) in themes) {
        setCurrentThemeType(savedTheme as ThemeType);
      } else {
        // Default to original theme (white background) for all users
        setCurrentThemeType('original');
      }
    } catch (error) {
      console.log('Error loading saved theme:', error);
      // Fallback to original theme on error
      setCurrentThemeType('original');
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (themeType: ThemeType) => {
    try {
      setCurrentThemeType(themeType);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeType);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Legacy support for dark theme toggle
  const isDark = currentThemeType === 'dark';
  const toggleTheme = () => {
    const newTheme = isDark ? 'recycled' : 'dark';
    setTheme(newTheme);
  };

  const theme = themes[currentThemeType];

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      currentThemeType, 
      setTheme, 
      isDark, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 