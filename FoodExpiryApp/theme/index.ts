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
  // Main Colors - updated to match the warm peach/beige design
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

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4CAF50',    // Updated to match new accent green
    background: '#F3C88B', // Updated to match new page background
    card: '#FDF0C0',       // Updated to match new card background
    text: '#2E2E2E',       // Updated to match new text color
    border: '#E8DCC6',     // Updated to match border color
  },
}; 