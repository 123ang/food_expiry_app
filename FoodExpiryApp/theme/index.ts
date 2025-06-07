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

export type ThemeType = 'original' | 'recycled' | 'darkBrown' | 'black' | 'blue' | 'green' | 'softPink' | 'brightPink' | 'naturalGreen' | 'mintRed' | 'darkGold';

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
  textSecondary: '#9CA3AF',       // Lighter gray for inactive tabs (better contrast)
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
  primaryColor: '#2E7D32',        // Darker, more vibrant green for better contrast
  secondaryColor: '#FFF1D6',      // Header/"Expiry Alert" banner background (cream)
  textColor: '#2E2E2E',          // Card icon/text color (dark charcoal)
  tertiaryColor: '#B8860B',      // Keep existing tertiary color

  // UI Colors
  cardBackground: '#FDF0C0',     // Card background (pale cream)
  borderColor: '#E8DCC6',        // Soft border color
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  textSecondary: '#8A7A6B',      // Lighter brown for inactive tabs (better contrast from active)
  successColor: '#2E7D32',       // Match new primary color
  warningColor: '#F4A460',       // Sandy brown for warnings
  dangerColor: '#CD5C5C',        // Indian red for dangers

  // Header
  headerBackground: '#FFF1D6',   // Header/"Expiry Alert" banner background (cream)

  // Gradients
  gradientPrimary: ['#2E7D32', '#1B5E20'],  // Updated to use darker green
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
  primaryColor: '#2d4e68',       // Dark blue primary for active tabs
  secondaryColor: '#a1c0d8',     // Light blue secondary
  textColor: '#2d4e68',          // Dark blue text
  tertiaryColor: '#5b88a8',      // Medium blue tertiary

  // UI Colors
  cardBackground: '#edf4f7',     // Very light blue/white cards
  borderColor: '#a1c0d8',        // Light blue borders
  shadowColor: 'rgba(45, 78, 104, 0.2)', // Blue-tinted shadow
  textSecondary: '#9BB5CC',      // Lighter blue for inactive tabs
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#a1c0d8',   // Light blue header

  // Gradients
  gradientPrimary: ['#2d4e68', '#1a3240'], // Dark blue gradient
  gradientSecondary: ['#c1d9e3', '#edf4f7'], // Light blue gradient
  
  borderRadius: 16,
};

export const greenTheme: Theme = {
  // Green theme - natural earth tones
  backgroundColor: '#dbe1c0',    // Light green background
  primaryColor: '#2d4e20',       // Darker green primary for active tabs
  secondaryColor: '#d8c58d',     // Golden beige secondary
  textColor: '#3164a3',          // Blue text
  tertiaryColor: '#3d6a28',      // Dark green tertiary

  // UI Colors
  cardBackground: '#fafaf0',     // Very light cream cards
  borderColor: '#d8c58d',        // Golden beige borders
  shadowColor: 'rgba(61, 106, 40, 0.2)', // Green-tinted shadow
  textSecondary: '#A8B88E',      // Lighter green for inactive tabs
  successColor: '#2d4e20',       // Darker green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#d8c58d',   // Golden beige header

  // Gradients
  gradientPrimary: ['#2d4e20', '#1a2e14'], // Darker green gradient
  gradientSecondary: ['#dbe1c0', '#fafaf0'], // Light green gradient
  
  borderRadius: 16,
};

export const softPinkTheme: Theme = {
  // Soft Pink theme - warm and cozy
  backgroundColor: '#fce7dd',    // Light pink background
  primaryColor: '#8B5A47',       // Darker brown-pink primary for active tabs
  secondaryColor: '#e9c9b2',     // Light brown secondary
  textColor: '#44281c',          // Dark brown text
  tertiaryColor: '#a37d6c',      // Brown-pink tertiary

  // UI Colors
  cardBackground: '#f5d3d3',     // Light pink cards
  borderColor: '#e9c9b2',        // Light brown borders
  shadowColor: 'rgba(68, 40, 28, 0.2)', // Brown-tinted shadow
  textSecondary: '#C4A193',      // Lighter brown-pink for inactive tabs
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#e9c9b2',   // Light brown header

  // Gradients
  gradientPrimary: ['#8B5A47', '#44281c'], // Darker brown gradient
  gradientSecondary: ['#fce7dd', '#f5d3d3'], // Light pink gradient
  
  borderRadius: 16,
};

export const brightPinkTheme: Theme = {
  // Bright Pink theme - vibrant and energetic
  backgroundColor: '#fdd0d4',    // Light bright pink background
  primaryColor: '#8B3A42',       // Darker pink primary for active tabs
  secondaryColor: '#f2bcbc',     // Medium pink secondary
  textColor: '#3c1d20',          // Dark red-brown text
  tertiaryColor: '#ad5b62',      // Dark pink tertiary

  // UI Colors
  cardBackground: '#ffe5e5',     // Very light pink cards
  borderColor: '#f2bcbc',        // Medium pink borders
  shadowColor: 'rgba(60, 29, 32, 0.2)', // Dark red-tinted shadow
  textSecondary: '#D18B94',      // Lighter pink for inactive tabs
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#f2bcbc',   // Medium pink header

  // Gradients
  gradientPrimary: ['#8B3A42', '#3c1d20'], // Darker pink gradient
  gradientSecondary: ['#fdd0d4', '#ffe5e5'], // Light pink gradient
  
  borderRadius: 16,
};

export const naturalGreenTheme: Theme = {
  // Yellow theme - warm and bright
  backgroundColor: '#fbfcee',    // Very light cream background
  primaryColor: '#3971b8',       // Blue primary for active tabs
  secondaryColor: '#c8d69b',     // Light green secondary
  textColor: '#182020',          // Dark gray text
  tertiaryColor: '#3971b8',      // Blue tertiary

  // UI Colors
  cardBackground: '#f6e6a5',     // Light yellow cards
  borderColor: '#c8d69b',        // Light green borders
  shadowColor: 'rgba(24, 32, 32, 0.1)', // Subtle shadow with text color tint
  textSecondary: '#7A9C6E',      // Light green for inactive tabs
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#c8d69b',   // Light green header

  // Gradients
  gradientPrimary: ['#3971b8', '#2d5a94'], // Blue gradient
  gradientSecondary: ['#fbfcee', '#f6e6a5'], // Light cream to yellow gradient
  
  borderRadius: 16,
};

export const mintRedTheme: Theme = {
  // Mint-Red theme - fresh mint with red accents
  backgroundColor: '#d8f2c9',    // Light mint background
  primaryColor: '#d84444',       // Darker red primary for active tabs (darker than #ef5f5f)
  secondaryColor: '#68b9a6',     // Teal secondary
  textColor: '#000000',          // Black text
  tertiaryColor: '#ef5f5f',      // Red tertiary

  // UI Colors
  cardBackground: '#8cd1b8',     // Mint cards
  borderColor: '#68b9a6',        // Teal borders
  shadowColor: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  textSecondary: '#2E5B4F',      // Darker teal for inactive tabs (better contrast)
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#d84444',        // Match primary for danger

  // Header
  headerBackground: '#68b9a6',   // Teal header

  // Gradients
  gradientPrimary: ['#d84444', '#b33030'], // Red gradient
  gradientSecondary: ['#d8f2c9', '#8cd1b8'], // Mint gradient
  
  borderRadius: 16,
};

export const darkGoldTheme: Theme = {
  // Dark Gold theme - elegant dark with gold accents
  backgroundColor: '#2c2c2c',    // Dark gray background
  primaryColor: '#d4a332',       // Brighter gold primary for active tabs (brighter than #b6862e)
  secondaryColor: '#3e3e42',     // Dark gray secondary
  textColor: '#ffffff',          // White text
  tertiaryColor: '#b6862e',      // Gold tertiary

  // UI Colors
  cardBackground: '#494949',     // Medium gray cards
  borderColor: '#3e3e42',        // Dark gray borders
  shadowColor: 'rgba(0, 0, 0, 0.3)', // Strong shadow
  textSecondary: '#999999',      // Light gray for inactive tabs
  successColor: '#4CAF50',       // Green for success
  warningColor: '#FF9800',       // Orange for warnings
  dangerColor: '#F44336',        // Red for danger

  // Header
  headerBackground: '#3e3e42',   // Dark gray header

  // Gradients
  gradientPrimary: ['#d4a332', '#b6862e'], // Gold gradient
  gradientSecondary: ['#2c2c2c', '#494949'], // Dark gradient
  
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
  naturalGreen: naturalGreenTheme,
  mintRed: mintRedTheme,
  darkGold: darkGoldTheme,
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