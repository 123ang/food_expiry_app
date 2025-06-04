import {
  Inter_400Regular,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';

// Font families configuration with new color-themed fonts
export const FONT_FAMILIES = {
  merriweather: {
    regular: 'Merriweather_400Regular',
    medium: 'Merriweather_400Regular', // Fallback to regular
    semiBold: 'Merriweather_700Bold',   // Use bold instead
    bold: 'Merriweather_700Bold',
  },
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_400Regular', // Fallback to regular
    semiBold: 'Inter_700Bold',   // Use bold instead
    bold: 'Inter_700Bold',
  },
  // For Japanese text - using Shippori Mincho
  japanese: {
    regular: 'ShipporiMincho-Regular',
    medium: 'ShipporiMincho-Regular',
    semiBold: 'ShipporiMincho-Bold',
    bold: 'ShipporiMincho-Bold',
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

// Current font family - using Merriweather for English
export const CURRENT_FONT_FAMILY = 'merriweather'; // Options: 'merriweather', 'inter', 'japanese', 'system'

// Font color matching the new theme
export const FONT_COLOR = '#594d3e';
export const WELCOME_BACK_COLOR = '#594D3E';

// Typography styles with language support
export const getTypography = (fontFamily: keyof typeof FONT_FAMILIES = CURRENT_FONT_FAMILY, currentLanguage?: string) => {
  // Use Japanese font for Japanese text, Merriweather for English, system default for others
  let selectedFont = fontFamily;
  if (currentLanguage === 'ja') {
    selectedFont = 'japanese';
  } else if (currentLanguage === 'en') {
    selectedFont = 'merriweather';
  } else if (currentLanguage === 'zh') {
    selectedFont = 'system'; // Use system font for Chinese
  }
  
  const fonts = FONT_FAMILIES[selectedFont];
  
  return {
    // Headers
    h1: {
      fontFamily: fonts.bold,
      fontSize: 28,
      lineHeight: 36,
      fontWeight: FONT_WEIGHTS.bold as any,
      color: FONT_COLOR,
    },
    h2: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: FONT_WEIGHTS.bold as any,
      color: FONT_COLOR,
    },
    h3: {
      fontFamily: fonts.semiBold,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: FONT_WEIGHTS.semiBold as any,
      color: FONT_COLOR,
    },
    h4: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: FONT_WEIGHTS.semiBold as any,
      color: FONT_COLOR,
    },
    h5: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: FONT_WEIGHTS.medium as any,
      color: FONT_COLOR,
    },
    h6: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: FONT_WEIGHTS.medium as any,
      color: FONT_COLOR,
    },
    
    // Body text
    body1: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: FONT_WEIGHTS.regular as any,
      color: FONT_COLOR,
    },
    body2: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: FONT_WEIGHTS.regular as any,
      color: FONT_COLOR,
    },
    body3: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: FONT_WEIGHTS.regular as any,
      color: FONT_COLOR,
    },
    
    // Button text
    button: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: FONT_WEIGHTS.medium as any,
      color: FONT_COLOR,
    },
    buttonSmall: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: FONT_WEIGHTS.medium as any,
      color: FONT_COLOR,
    },
    
    // Caption and labels
    caption: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: FONT_WEIGHTS.regular as any,
      color: FONT_COLOR,
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: FONT_WEIGHTS.medium as any,
      color: FONT_COLOR,
    },
    
    // Navigation
    navLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: FONT_WEIGHTS.medium as any,
      color: FONT_COLOR,
    },
    
    // Welcome text with special color
    welcomeTitle: {
      fontFamily: fonts.bold,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: FONT_WEIGHTS.bold as any,
      color: WELCOME_BACK_COLOR,
    },
  };
};

// Font loading configuration - including new fonts
export const FONTS_TO_LOAD = {
  // Inter fonts - only the essential ones
  Inter_400Regular,
  Inter_700Bold,
  // Merriweather fonts for English text
  Merriweather_400Regular,
  Merriweather_700Bold,
  // Custom Japanese fonts - Shippori Mincho
  'ShipporiMincho-Regular': require('../assets/fonts/ShipporiMincho-Regular.ttf'),
  'ShipporiMincho-Bold': require('../assets/fonts/ShipporiMincho-Bold.ttf'),
};

// Default typography export
export const typography = getTypography(); 