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

/* Default theme – green + teal + warm neutrals (mixed, not only green) */
export const originalTheme: Theme = {
  backgroundColor: '#f8faf9',
  primaryColor: '#22c55e',
  secondaryColor: '#e0f2fe',
  textColor: '#171717',
  tertiaryColor: '#0d9488',
  cardBackground: '#ffffff',
  borderColor: '#e2e8f0',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  textSecondary: '#525252',
  successColor: '#22c55e',
  warningColor: '#f59e0b',
  dangerColor: '#ef4444',
  headerBackground: '#ffffff',
  gradientPrimary: ['#22c55e', '#0d9488'],
  gradientSecondary: ['#f8faf9', '#f0fdf4', '#ecfeff'],
  borderRadius: 12,
};

export const recycledTheme: Theme = {
  backgroundColor: '#F3C88B',
  primaryColor: '#2E7D32',
  secondaryColor: '#FFF1D6',
  textColor: '#2E2E2E',
  tertiaryColor: '#B8860B',
  cardBackground: '#FDF0C0',
  borderColor: '#E8DCC6',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  textSecondary: '#8A7A6B',
  successColor: '#2E7D32',
  warningColor: '#F4A460',
  dangerColor: '#CD5C5C',
  headerBackground: '#FFF1D6',
  gradientPrimary: ['#2E7D32', '#1B5E20'],
  gradientSecondary: ['#F3C88B', '#E8DCC6'],
  borderRadius: 16,
};

export const darkBrownTheme: Theme = {
  backgroundColor: '#2C2417',
  primaryColor: '#4CAF50',
  secondaryColor: '#B8860B',
  textColor: '#F5EFE7',
  tertiaryColor: '#8D6E63',
  cardBackground: '#3D3426',
  borderColor: 'rgba(245, 239, 231, 0.2)',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  textSecondary: '#C0B494',
  successColor: '#4CAF50',
  warningColor: '#F4A460',
  dangerColor: '#CD5C5C',
  headerBackground: '#3D3426',
  gradientPrimary: ['#4CAF50', '#45A049'],
  gradientSecondary: ['#3D3426', '#2C2417'],
  borderRadius: 16,
};

export const blackTheme: Theme = {
  backgroundColor: '#000000',
  primaryColor: '#4CAF50',
  secondaryColor: '#1A1A1A',
  textColor: '#FFFFFF',
  tertiaryColor: '#66BB6A',
  cardBackground: '#1A1A1A',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  textSecondary: '#B0B0B0',
  successColor: '#4CAF50',
  warningColor: '#FFA726',
  dangerColor: '#F44336',
  headerBackground: '#1A1A1A',
  gradientPrimary: ['#4CAF50', '#388E3C'],
  gradientSecondary: ['#1A1A1A', '#000000'],
  borderRadius: 16,
};

export const blueTheme: Theme = {
  backgroundColor: '#c1d9e3',
  primaryColor: '#2d4e68',
  secondaryColor: '#a1c0d8',
  textColor: '#2d4e68',
  tertiaryColor: '#5b88a8',
  cardBackground: '#edf4f7',
  borderColor: '#a1c0d8',
  shadowColor: 'rgba(45, 78, 104, 0.2)',
  textSecondary: '#9BB5CC',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  dangerColor: '#F44336',
  headerBackground: '#a1c0d8',
  gradientPrimary: ['#2d4e68', '#1a3240'],
  gradientSecondary: ['#c1d9e3', '#edf4f7'],
  borderRadius: 16,
};

export const greenTheme: Theme = {
  backgroundColor: '#dbe1c0',
  primaryColor: '#2d4e20',
  secondaryColor: '#d8c58d',
  textColor: '#3164a3',
  tertiaryColor: '#3d6a28',
  cardBackground: '#fafaf0',
  borderColor: '#d8c58d',
  shadowColor: 'rgba(61, 106, 40, 0.2)',
  textSecondary: '#A8B88E',
  successColor: '#2d4e20',
  warningColor: '#FF9800',
  dangerColor: '#F44336',
  headerBackground: '#d8c58d',
  gradientPrimary: ['#2d4e20', '#1a2e14'],
  gradientSecondary: ['#dbe1c0', '#fafaf0'],
  borderRadius: 16,
};

export const softPinkTheme: Theme = {
  backgroundColor: '#fce7dd',
  primaryColor: '#8B5A47',
  secondaryColor: '#e9c9b2',
  textColor: '#44281c',
  tertiaryColor: '#a37d6c',
  cardBackground: '#f5d3d3',
  borderColor: '#e9c9b2',
  shadowColor: 'rgba(68, 40, 28, 0.2)',
  textSecondary: '#C4A193',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  dangerColor: '#F44336',
  headerBackground: '#e9c9b2',
  gradientPrimary: ['#8B5A47', '#44281c'],
  gradientSecondary: ['#fce7dd', '#f5d3d3'],
  borderRadius: 16,
};

export const brightPinkTheme: Theme = {
  backgroundColor: '#fdd0d4',
  primaryColor: '#8B3A42',
  secondaryColor: '#f2bcbc',
  textColor: '#3c1d20',
  tertiaryColor: '#ad5b62',
  cardBackground: '#ffe5e5',
  borderColor: '#f2bcbc',
  shadowColor: 'rgba(60, 29, 32, 0.2)',
  textSecondary: '#D18B94',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  dangerColor: '#F44336',
  headerBackground: '#f2bcbc',
  gradientPrimary: ['#8B3A42', '#3c1d20'],
  gradientSecondary: ['#fdd0d4', '#ffe5e5'],
  borderRadius: 16,
};

export const naturalGreenTheme: Theme = {
  backgroundColor: '#fbfcee',
  primaryColor: '#3971b8',
  secondaryColor: '#c8d69b',
  textColor: '#182020',
  tertiaryColor: '#3971b8',
  cardBackground: '#f6e6a5',
  borderColor: '#c8d69b',
  shadowColor: 'rgba(24, 32, 32, 0.1)',
  textSecondary: '#7A9C6E',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  dangerColor: '#F44336',
  headerBackground: '#c8d69b',
  gradientPrimary: ['#3971b8', '#2d5a94'],
  gradientSecondary: ['#fbfcee', '#f6e6a5'],
  borderRadius: 16,
};

export const mintRedTheme: Theme = {
  backgroundColor: '#d8f2c9',
  primaryColor: '#d84444',
  secondaryColor: '#68b9a6',
  textColor: '#000000',
  tertiaryColor: '#ef5f5f',
  cardBackground: '#8cd1b8',
  borderColor: '#68b9a6',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  textSecondary: '#2E5B4F',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  dangerColor: '#d84444',
  headerBackground: '#68b9a6',
  gradientPrimary: ['#d84444', '#b33030'],
  gradientSecondary: ['#d8f2c9', '#8cd1b8'],
  borderRadius: 16,
};

export const darkGoldTheme: Theme = {
  backgroundColor: '#2c2c2c',
  primaryColor: '#d4a332',
  secondaryColor: '#3e3e42',
  textColor: '#ffffff',
  tertiaryColor: '#b6862e',
  cardBackground: '#494949',
  borderColor: '#3e3e42',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  textSecondary: '#999999',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  dangerColor: '#F44336',
  headerBackground: '#3e3e42',
  gradientPrimary: ['#d4a332', '#b6862e'],
  gradientSecondary: ['#2c2c2c', '#494949'],
  borderRadius: 16,
};

export const themes: Record<ThemeType, Theme> = {
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
