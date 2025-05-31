import { DefaultTheme } from '@react-navigation/native';

export interface Theme {
  // Main Colors
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  tertiaryColor: string;

  // UI Colors
  cardBackground: string;
  borderColor: string;
  shadowColor: string;
  textSecondary: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;

  // Header
  headerBackground: string;

  // Gradients
  gradientPrimary: string[];
  gradientSecondary: string[];

  borderRadius: number;
}

export const lightTheme: Theme = {
  // Main Colors - matching mobile app design
  backgroundColor: '#F9F9F9',
  primaryColor: '#0f7714', // Updated to match design
  secondaryColor: '#FFA726',
  textColor: '#333333',
  tertiaryColor: '#8D6E63',

  // UI Colors
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  textSecondary: '#666666',
  successColor: '#0f7714', // Match primary color
  warningColor: '#FFA726',
  dangerColor: '#FF5252',

  // Header
  headerBackground: '#FFFFFF',

  // Gradients
  gradientPrimary: ['#FF6B6B', '#FFA07A'],
  gradientSecondary: ['#4ECDC4', '#95E1D3'],
  
  borderRadius: 16,
};

export const darkTheme: Theme = {
  // Main Colors
  backgroundColor: '#1A1B1E',
  primaryColor: '#0f7714', // Keep consistent primary color
  secondaryColor: '#FFA726',
  textColor: '#FFFFFF',
  tertiaryColor: '#8D6E63',

  // UI Colors
  cardBackground: '#2D2F34',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  shadowColor: 'rgba(0, 0, 0, 0.2)',
  textSecondary: '#A0A0A0',
  successColor: '#0f7714', // Match primary color
  warningColor: '#FFA726',
  dangerColor: '#FF5252',

  // Header
  headerBackground: '#2D2F34',

  // Gradients
  gradientPrimary: ['#FF6B6B', '#FFA07A'],
  gradientSecondary: ['#4ECDC4', '#95E1D3'],
  
  borderRadius: 16,
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0f7714',
    background: '#F9F9F9',
    card: '#FFFFFF',
    text: '#333333',
    border: '#E0E0E0',
  },
}; 