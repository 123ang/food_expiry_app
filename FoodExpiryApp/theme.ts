export interface Theme {
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  borderColor: string;
  shadowColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  borderRadius: number;
}

export const lightTheme: Theme = {
  backgroundColor: '#F3C88B',    // Overall page background (pale peach/beige)
  cardBackground: '#FDF0C0',     // Card background (pale cream)
  textColor: '#2E2E2E',          // Card icon/text color (dark charcoal)
  textSecondary: '#4A4A4A',      // Secondary text (slightly lighter charcoal)
  primaryColor: '#4CAF50',       // Accent green (buttons, highlights)
  secondaryColor: '#FFF1D6',     // Header/banner background (cream)
  tertiaryColor: '#B8860B',      // Keep existing tertiary color
  borderColor: '#E8E0D5',        // Keep existing border color
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  successColor: '#4CAF50',       // Match accent green
  warningColor: '#F4A460',
  dangerColor: '#E74C3C',
  borderRadius: 16,
};

export const darkTheme: Theme = {
  backgroundColor: '#2C2417',
  cardBackground: '#3D3426',
  textColor: '#F5EFE7',
  textSecondary: '#C0B494',
  primaryColor: '#4CAF50',       // Updated to match new accent green
  secondaryColor: '#B8860B',
  tertiaryColor: '#8D6E63',
  borderColor: 'rgba(245, 239, 231, 0.2)',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  successColor: '#4CAF50',       // Updated to match new accent green
  warningColor: '#F4A460',
  dangerColor: '#CD5C5C',
  borderRadius: 16,
}; 