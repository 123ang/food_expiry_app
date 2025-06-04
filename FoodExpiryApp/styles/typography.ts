import {
  Inter_400Regular,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Font families configuration - simplified to avoid font loading issues
export const FONT_FAMILIES = {
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_400Regular', // Fallback to regular
    semiBold: 'Inter_700Bold',   // Use bold instead
    bold: 'Inter_700Bold',
  },
  system: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
};

// Font weights mapping
export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

// Current font family - change this to switch fonts globally
export const CURRENT_FONT_FAMILY = 'inter'; // Options: 'inter', 'system'

// Typography styles
export const getTypography = (fontFamily: keyof typeof FONT_FAMILIES = CURRENT_FONT_FAMILY) => {
  const fonts = FONT_FAMILIES[fontFamily];
  
  return {
    // Headers
    h1: {
      fontFamily: fonts.bold,
      fontSize: 28,
      lineHeight: 36,
      fontWeight: FONT_WEIGHTS.bold as any,
    },
    h2: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: FONT_WEIGHTS.bold as any,
    },
    h3: {
      fontFamily: fonts.semiBold,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: FONT_WEIGHTS.semiBold as any,
    },
    h4: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: FONT_WEIGHTS.semiBold as any,
    },
    h5: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    h6: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    
    // Body text
    body1: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: FONT_WEIGHTS.regular as any,
    },
    body2: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: FONT_WEIGHTS.regular as any,
    },
    body3: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: FONT_WEIGHTS.regular as any,
    },
    
    // Button text
    button: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    buttonSmall: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    
    // Caption and labels
    caption: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: FONT_WEIGHTS.regular as any,
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    
    // Navigation
    navLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: FONT_WEIGHTS.medium as any,
    },
  };
};

// Font loading configuration - simplified
export const FONTS_TO_LOAD = {
  // Inter fonts - only the essential ones
  Inter_400Regular,
  Inter_700Bold,
};

// Default typography export
export const typography = getTypography(); 