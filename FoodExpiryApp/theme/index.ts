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

export type ThemeType = 'original' | 'recycled' | 'dark';

export const originalTheme: Theme = {
  // Original white theme - clean and minimal
  backgroundColor: '#FFFFFF',     // Pure white background
  primaryColor: '#2E7D32',        // Dark green (darker than current green)
  secondaryColor: '#F5F5F5',      // Light gray for secondary elements
  textColor: '#000000',           // Pure black text
  tertiaryColor: '#4CAF50',       // Medium green

  // UI Colors
  cardBackground: '#FFFFFF',      // White cards
  borderColor: '#E0E0E0',         // Light gray borders
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  textSecondary: '#666666',       // Gray secondary text
  successColor: '#2E7D32',        // Dark green for success
  warningColor: '#FF9800',        // Orange for warnings
  dangerColor: '#F44336',         // Red for danger

  // Header
  headerBackground: '#FFFFFF',    // White header

  // Gradients
  gradientPrimary: ['#2E7D32', '#1B5E20'],  // Dark green gradient
  gradientSecondary: ['#F5F5F5', '#EEEEEE'], // Light gray gradient
  
  borderRadius: 8,  // Smaller radius for cleaner look
};

export const recycledTheme: Theme = {
  // Current recycled/eco theme - warm peach/beige design
  backgroundColor: '#F3C88B',     // Overall page background (pale peach/beige)
  primaryColor: '#4CAF50',        // Accent green (buttons, "0 items," bottom tab highlight)
  secondaryColor: '#FFF1D6',      // Header/"Expiry Alert" banner background (cream)
  textColor: '#2E2E2E',          // Card icon/text color (dark charcoal)
  tertiaryColor: '#B8860B',      // Keep existing tertiary color

  // UI Colors
  cardBackground: '#FDF0C0',     // Card background (pale cream)
  borderColor: '#E8DCC6',        // Soft border color
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  textSecondary: '#4A4A4A',      // Secondary text (slightly lighter charcoal)
  successColor: '#4CAF50',       // Match accent green
  warningColor: '#F4A460',       // Sandy brown for warnings
  dangerColor: '#CD5C5C',        // Indian red for dangers

  // Header
  headerBackground: '#FFF1D6',   // Header/"Expiry Alert" banner background (cream)

  // Gradients
  gradientPrimary: ['#4CAF50', '#45A049'],  // Updated to use new accent green
  gradientSecondary: ['#F3C88B', '#E8DCC6'], // Updated to use new background colors
  
  borderRadius: 16,
};

export const darkTheme: Theme = {
  // Main Colors - dark version with warm tones
  backgroundColor: '#2C2417',    // Dark warm brown
  primaryColor: '#4CAF50',       // Updated to match new accent green
  secondaryColor: '#B8860B',     // Gold accent
  textColor: '#F5EFE7',         // Light warm text
  tertiaryColor: '#8D6E63',

  // UI Colors
  cardBackground: '#3D3426',     // Darker warm brown for cards
  borderColor: 'rgba(245, 239, 231, 0.2)',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  textSecondary: '#C0B494',      // Warm gray for secondary text
  successColor: '#4CAF50',       // Updated to match new accent green
  warningColor: '#F4A460',
  dangerColor: '#CD5C5C',

  // Header
  headerBackground: '#3D3426',

  // Gradients
  gradientPrimary: ['#4CAF50', '#45A049'],  // Updated to use new accent green
  gradientSecondary: ['#3D3426', '#2C2417'],
  
  borderRadius: 16,
};

export const themes = {
  original: originalTheme,
  recycled: recycledTheme,
  dark: darkTheme,
};

// Keep lightTheme as recycledTheme for backward compatibility
export const lightTheme = recycledTheme;

export const getNavigationTheme = (themeType: ThemeType) => {
  const theme = themes[themeType];
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primaryColor,
      background: theme.backgroundColor,
      card: theme.cardBackground,
      text: theme.textColor,
      border: theme.borderColor,
    },
  };
};

export const navigationTheme = getNavigationTheme('original'); 