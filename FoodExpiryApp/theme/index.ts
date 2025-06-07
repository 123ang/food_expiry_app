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

export type ThemeType = 'original' | 'recycled' | 'darkBrown' | 'black' | 'blue';

export const originalTheme: Theme = {
  // Original white theme - improved contrast for iPhone visibility
  backgroundColor: '#F8F9FA',     // Very light gray background (better than pure white)
  primaryColor: '#2E7D32',        // Dark green (darker than current green)
  secondaryColor: '#E9ECEF',      // Light gray for secondary elements
  textColor: '#212529',           // Dark gray text (better contrast than pure black)
  tertiaryColor: '#4CAF50',       // Medium green

  // UI Colors
  cardBackground: '#FFFFFF',      // White cards with better border contrast
  borderColor: '#CED4DA',         // Darker gray borders for better visibility
  shadowColor: 'rgba(0, 0, 0, 0.15)', // Stronger shadow for better card definition
  textSecondary: '#6C757D',       // Darker gray secondary text
  successColor: '#2E7D32',        // Dark green for success
  warningColor: '#FF9800',        // Orange for warnings
  dangerColor: '#F44336',         // Red for danger

  // Header
  headerBackground: '#FFFFFF',    // White header with border

  // Gradients
  gradientPrimary: ['#2E7D32', '#1B5E20'],  // Dark green gradient
  gradientSecondary: ['#F8F9FA', '#E9ECEF'], // Light gray gradient
  
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

export const darkBrownTheme: Theme = {
  // Dark brown theme - warm dark tones
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

export const blackTheme: Theme = {
  // Pure black theme - high contrast dark theme
  backgroundColor: '#000000',    // Pure black background
  primaryColor: '#4CAF50',       // Bright green for contrast
  secondaryColor: '#1A1A1A',     // Very dark gray for secondary elements
  textColor: '#FFFFFF',          // Pure white text
  tertiaryColor: '#66BB6A',      // Lighter green

  // UI Colors
  cardBackground: '#1A1A1A',     // Very dark gray for cards
  borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle white borders
  shadowColor: 'rgba(0, 0, 0, 0.5)', // Strong shadow
  textSecondary: '#B0B0B0',      // Light gray for secondary text
  successColor: '#4CAF50',       // Bright green for success
  warningColor: '#FFA726',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#1A1A1A',   // Very dark gray header

  // Gradients
  gradientPrimary: ['#4CAF50', '#388E3C'], // Green gradient
  gradientSecondary: ['#1A1A1A', '#000000'], // Dark gradient
  
  borderRadius: 16,
};

export const blueTheme: Theme = {
  // Blue theme - matching the screenshot design
  backgroundColor: '#B3D9F7',    // Light blue background (from screenshot)
  primaryColor: '#1976D2',       // Material Design blue
  secondaryColor: '#64B5F6',     // Medium blue for accents
  textColor: '#1A1A1A',          // Dark text for good contrast
  tertiaryColor: '#2196F3',      // Bright blue

  // UI Colors
  cardBackground: '#90CAF9',     // Slightly darker blue for cards (from screenshot)
  borderColor: '#64B5F6',        // Blue borders
  shadowColor: 'rgba(25, 118, 210, 0.2)', // Blue-tinted shadow
  textSecondary: '#424242',      // Dark gray for secondary text
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#42A5F5',   // Darker blue for header (Welcome Back banner)

  // Gradients
  gradientPrimary: ['#1976D2', '#1565C0'], // Blue gradient
  gradientSecondary: ['#B3D9F7', '#90CAF9'], // Light blue gradient
  
  borderRadius: 16,
};

export const themes = {
  original: originalTheme,
  recycled: recycledTheme,
  darkBrown: darkBrownTheme,
  black: blackTheme,
  blue: blueTheme,
};

// Keep lightTheme and darkTheme for backward compatibility
export const lightTheme = recycledTheme;
export const darkTheme = darkBrownTheme;

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