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

export type ThemeType = 'original' | 'recycled' | 'darkBrown' | 'black' | 'blue' | 'green' | 'softPink' | 'brightPink';

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
  // Blue theme - updated with new color scheme
  backgroundColor: '#c1d9e3',    // Light blue background
  primaryColor: '#5b88a8',       // Medium blue primary
  secondaryColor: '#a1c0d8',     // Light blue secondary
  textColor: '#2d4e68',          // Dark blue text
  tertiaryColor: '#5b88a8',      // Medium blue tertiary

  // UI Colors
  cardBackground: '#edf4f7',     // Very light blue/white cards
  borderColor: '#a1c0d8',        // Light blue borders
  shadowColor: 'rgba(45, 78, 104, 0.2)', // Blue-tinted shadow
  textSecondary: '#5b88a8',      // Medium blue for secondary text
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#a1c0d8',   // Light blue header

  // Gradients
  gradientPrimary: ['#5b88a8', '#2d4e68'], // Blue gradient
  gradientSecondary: ['#c1d9e3', '#edf4f7'], // Light blue gradient
  
  borderRadius: 16,
};

export const greenTheme: Theme = {
  // Green theme - natural earth tones
  backgroundColor: '#dbe1c0',    // Light green background
  primaryColor: '#3d6a28',       // Dark green primary
  secondaryColor: '#d8c58d',     // Golden beige secondary
  textColor: '#3164a3',          // Blue text
  tertiaryColor: '#3d6a28',      // Dark green tertiary

  // UI Colors
  cardBackground: '#fafaf0',     // Very light cream cards
  borderColor: '#d8c58d',        // Golden beige borders
  shadowColor: 'rgba(61, 106, 40, 0.2)', // Green-tinted shadow
  textSecondary: '#3d6a28',      // Dark green for secondary text
  successColor: '#3d6a28',       // Dark green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#d8c58d',   // Golden beige header

  // Gradients
  gradientPrimary: ['#3d6a28', '#2d4e20'], // Green gradient
  gradientSecondary: ['#dbe1c0', '#fafaf0'], // Light green gradient
  
  borderRadius: 16,
};

export const softPinkTheme: Theme = {
  // Soft Pink theme - warm and cozy
  backgroundColor: '#fce7dd',    // Light pink background
  primaryColor: '#a37d6c',       // Brown-pink primary
  secondaryColor: '#e9c9b2',     // Light brown secondary
  textColor: '#44281c',          // Dark brown text
  tertiaryColor: '#a37d6c',      // Brown-pink tertiary

  // UI Colors
  cardBackground: '#f5d3d3',     // Light pink cards
  borderColor: '#e9c9b2',        // Light brown borders
  shadowColor: 'rgba(68, 40, 28, 0.2)', // Brown-tinted shadow
  textSecondary: '#a37d6c',      // Brown-pink for secondary text
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#e9c9b2',   // Light brown header

  // Gradients
  gradientPrimary: ['#a37d6c', '#44281c'], // Brown gradient
  gradientSecondary: ['#fce7dd', '#f5d3d3'], // Light pink gradient
  
  borderRadius: 16,
};

export const brightPinkTheme: Theme = {
  // Bright Pink theme - vibrant and energetic
  backgroundColor: '#fdd0d4',    // Light bright pink background
  primaryColor: '#ad5b62',       // Dark pink primary
  secondaryColor: '#f2bcbc',     // Medium pink secondary
  textColor: '#3c1d20',          // Dark red-brown text
  tertiaryColor: '#ad5b62',      // Dark pink tertiary

  // UI Colors
  cardBackground: '#ffe5e5',     // Very light pink cards
  borderColor: '#f2bcbc',        // Medium pink borders
  shadowColor: 'rgba(60, 29, 32, 0.2)', // Dark red-tinted shadow
  textSecondary: '#ad5b62',      // Dark pink for secondary text
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#f2bcbc',   // Medium pink header

  // Gradients
  gradientPrimary: ['#ad5b62', '#3c1d20'], // Pink gradient
  gradientSecondary: ['#fdd0d4', '#ffe5e5'], // Light pink gradient
  
  borderRadius: 16,
};

export const themes = {
  original: originalTheme,
  recycled: recycledTheme,
  darkBrown: darkBrownTheme,
  black: blackTheme,
  blue: blueTheme,
  green: greenTheme,
  softPink: softPinkTheme,
  brightPink: brightPinkTheme,
};

// Keep lightTheme and darkTheme for backward compatibility
export const lightTheme = recycledTheme;
export const darkTheme = darkBrownTheme;

export const getNavigationTheme = (themeType: ThemeType) => {
  const theme = (themes as any)[themeType];
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