import * as Font from 'expo-font';
import { FONTS_TO_LOAD } from './typography';

// Custom font URLs (for Shippori Mincho)
// Note: In production, these should be downloaded and stored locally in assets/fonts/
const CUSTOM_FONTS = {
  'ShipporiMincho-Regular': 'https://fonts.gstatic.com/s/shipporimincho/v12/VdGfAZUfHosahXxoCUOVCX7KQx0.woff2',
  'ShipporiMincho-Medium': 'https://fonts.gstatic.com/s/shipporimincho/v12/VdGfAZUfHosahXxoCUOVCX7KQx0.woff2', // Using regular as fallback
  'ShipporiMincho-SemiBold': 'https://fonts.gstatic.com/s/shipporimincho/v12/VdGfAZUfHosahXxoCUOVCX7KQx0.woff2', // Using regular as fallback
  'ShipporiMincho-Bold': 'https://fonts.gstatic.com/s/shipporimincho/v12/VdGfAZUfHosahXxoCUOVCX7KQx0.woff2', // Using regular as fallback
};

// For local assets (preferred method), place font files in assets/fonts/ and use:
// Commented out until font files are actually downloaded and placed in assets/fonts/
const LOCAL_CUSTOM_FONTS = {
  // 'ShipporiMincho-Regular': require('../assets/fonts/ShipporiMincho-Regular.otf'),
  // 'ShipporiMincho-Medium': require('../assets/fonts/ShipporiMincho-Medium.otf'),
  // 'ShipporiMincho-SemiBold': require('../assets/fonts/ShipporiMincho-SemiBold.otf'),
  // 'ShipporiMincho-Bold': require('../assets/fonts/ShipporiMincho-Bold.otf'),
};

export const loadCustomFonts = async () => {
  try {
    // Load Google Fonts (Expo managed)
    await Font.loadAsync(FONTS_TO_LOAD);
    
    // Attempt to load local custom fonts
    // Comment out the line below if font files are not available locally
    // await Font.loadAsync(LOCAL_CUSTOM_FONTS);
    
    console.log('✅ Fonts loaded successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Some fonts failed to load:', error);
    // App will fallback to system fonts
    return false;
  }
};

// Utility to check if a font is loaded
export const isFontLoaded = (fontFamily: string): boolean => {
  try {
    return Font.isLoaded(fontFamily);
  } catch {
    return false;
  }
};

// Font fallback helper
export const getFontWithFallback = (
  primaryFont: string,
  fallbackFont: string = 'System'
): string => {
  return isFontLoaded(primaryFont) ? primaryFont : fallbackFont;
}; 