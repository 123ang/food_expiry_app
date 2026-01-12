import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeType, themes, originalTheme } from '../theme';

// Re-export ThemeType for convenience
export type { ThemeType } from '../theme';

interface ThemeContextType {
  theme: Theme;
  currentThemeType: ThemeType;
  setTheme: (themeType: ThemeType) => void;
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeType, setCurrentThemeType] = useState<ThemeType>('recycled'); // Default to recycled theme
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme to CSS variables
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', theme.backgroundColor);
    root.style.setProperty('--theme-card', theme.cardBackground);
    root.style.setProperty('--theme-header', theme.headerBackground);
    root.style.setProperty('--theme-text', theme.textColor);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-primary', theme.primaryColor);
    root.style.setProperty('--theme-secondary', theme.secondaryColor);
    root.style.setProperty('--theme-border', theme.borderColor);
    root.style.setProperty('--theme-success', theme.successColor);
    root.style.setProperty('--theme-warning', theme.warningColor);
    root.style.setProperty('--theme-danger', theme.dangerColor);
    root.style.setProperty('--theme-shadow', theme.shadowColor);
    root.style.setProperty('--theme-radius', `${theme.borderRadius}px`);
    
    // Apply body background
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.textColor;
  };

  // Load saved theme on app start
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    const theme = themes[currentThemeType];
    applyTheme(theme);
  }, [currentThemeType]);

  const loadSavedTheme = () => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        // Handle legacy 'dark' theme by mapping it to 'darkBrown'
        if (savedTheme === 'dark') {
          setCurrentThemeType('darkBrown');
        } else if ((savedTheme as ThemeType) in themes) {
          setCurrentThemeType(savedTheme as ThemeType);
        } else {
          // Default to recycled theme (matching mobile app default)
          setCurrentThemeType('recycled');
        }
      } else {
        // Default to recycled theme (matching mobile app default)
        setCurrentThemeType('recycled');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Fallback to recycled theme on error
      setCurrentThemeType('recycled');
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = (themeType: ThemeType) => {
    try {
      setCurrentThemeType(themeType);
      localStorage.setItem(THEME_STORAGE_KEY, themeType);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Legacy support for dark theme toggle
  const isDark = currentThemeType === 'darkBrown' || currentThemeType === 'black' || currentThemeType === 'darkGold';
  const toggleTheme = () => {
    const newTheme = isDark ? 'recycled' : 'darkBrown';
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
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
