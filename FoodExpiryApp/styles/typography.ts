import {
  Inter_400Regular,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';

// Font families configuration with fallbacks
export const FONT_FAMILIES = {
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_400Regular',
    semiBold: 'Inter_700Bold',
    bold: 'Inter_700Bold',
  },
  merriweather: {
    regular: 'Merriweather_400Regular',
    medium: 'Merriweather_400Regular',
    semiBold: 'Merriweather_700Bold',
    bold: 'Merriweather_700Bold',
  },
  shippori: {
    regular: 'ShipporiMincho-Regular',
    medium: 'ShipporiMincho-Medium',
    semiBold: 'ShipporiMincho-SemiBold',
    bold: 'ShipporiMincho-Bold',
  },
  system: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
};

// Font fallbacks for when custom fonts are not loaded
export const FONT_FALLBACKS = {
  merriweather: 'inter',
  shippori: 'inter',
  inter: 'system',
} as const;

// Language to font mapping with fallbacks
export const LANGUAGE_FONTS = {
  en: 'merriweather',
  zh: 'inter', // Chinese uses Inter for now
  ja: 'inter', // Use Inter as fallback for Japanese until Shippori Mincho is set up
} as const;

// Font weights mapping
export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

// Current font family - can be overridden by language
export const CURRENT_FONT_FAMILY = 'inter';

// Get font family based on language with fallback support
export const getFontFamilyForLanguage = (
  language?: 'en' | 'zh' | 'ja',
  enableFallback: boolean = true
): keyof typeof FONT_FAMILIES => {
  if (language && LANGUAGE_FONTS[language]) {
    const preferredFont = LANGUAGE_FONTS[language] as keyof typeof FONT_FAMILIES;
    
    // If fallbacks are enabled and we can check font availability
    if (enableFallback) {
      // For now, always return the preferred font
      // Font availability checking would be done in the component
      return preferredFont;
    }
    
    return preferredFont;
  }
  return CURRENT_FONT_FAMILY as keyof typeof FONT_FAMILIES;
};

// Typography styles with enhanced language support
export const getTypography = (
  fontFamily: keyof typeof FONT_FAMILIES = CURRENT_FONT_FAMILY,
  language?: 'en' | 'zh' | 'ja'
) => {
  // Use language-specific font if language is provided
  const selectedFontFamily = language ? getFontFamilyForLanguage(language) : fontFamily;
  const fonts = FONT_FAMILIES[selectedFontFamily];
  
  // Additional line height adjustments for different scripts
  const getLineHeightMultiplier = (lang?: string) => {
    switch (lang) {
      case 'ja': return 1.6; // Japanese needs more line height for readability
      case 'zh': return 1.5; // Chinese also benefits from extra line height
      default: return 1.4; // Default for Latin scripts
    }
  };
  
  const lineHeightMultiplier = getLineHeightMultiplier(language);
  
  return {
    // Headers
    h1: {
      fontFamily: fonts.bold,
      fontSize: 28,
      lineHeight: Math.round(28 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.bold as any,
    },
    h2: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: Math.round(24 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.bold as any,
    },
    h3: {
      fontFamily: fonts.semiBold,
      fontSize: 20,
      lineHeight: Math.round(20 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.semiBold as any,
    },
    h4: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: Math.round(18 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.semiBold as any,
    },
    h5: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: Math.round(16 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    h6: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: Math.round(14 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.medium as any,
    },
    
    // Body text
    body1: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: Math.round(16 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.regular as any,
    },
    body2: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: Math.round(14 * lineHeightMultiplier),
      fontWeight: FONT_WEIGHTS.regular as any,
    },
    body3: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: Math.round(12 * lineHeightMultiplier),
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

// Font loading configuration
export const FONTS_TO_LOAD = {
  // Inter fonts
  Inter_400Regular,
  Inter_700Bold,
  
  // Merriweather fonts for English
  Merriweather_400Regular,
  Merriweather_700Bold,
  
  // Note: Shippori Mincho fonts would need to be loaded as custom fonts
  // Add them to the assets/fonts directory and load via expo-font
};

// Default typography export
export const typography = getTypography(); 