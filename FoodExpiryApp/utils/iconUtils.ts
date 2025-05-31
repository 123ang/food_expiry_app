import { FontAwesome } from '@expo/vector-icons';

type IconName = keyof typeof FontAwesome.glyphMap;

// Map of invalid icon names to valid alternatives
const iconMappings: { [key: string]: IconName } = {
  'cookie': 'circle',      // Fallback for cookie
  'carrot': 'leaf',        // Fallback for carrot
  'hamburger': 'cutlery',  // Fallback for hamburger
  'seedling': 'leaf',      // Fallback for seedling
  'fish': 'circle',        // Fallback for fish
  'cheese': 'circle',      // Fallback for cheese
  'ice-cream': 'snowflake-o', // Fallback for ice-cream
  'pizza-slice': 'cutlery', // Fallback for pizza-slice
};

/**
 * Validates an icon name and returns a valid FontAwesome icon name
 * @param iconName - The icon name to validate
 * @param fallback - Default fallback icon (defaults to 'circle')
 * @returns A valid FontAwesome icon name
 */
export function validateIconName(iconName: string | undefined | null, fallback: IconName = 'circle'): IconName {
  if (!iconName) {
    return fallback;
  }

  // Check if it's a direct mapping for known invalid icons
  if (iconMappings[iconName]) {
    return iconMappings[iconName];
  }

  // Check if the icon exists in FontAwesome
  if (iconName in FontAwesome.glyphMap) {
    return iconName as IconName;
  }

  // If not valid, return fallback
  console.warn(`Icon "${iconName}" is not valid, using fallback "${fallback}"`);
  return fallback;
}

/**
 * Safe FontAwesome icon component that handles invalid icon names
 */
export function getSafeIconName(iconName: string | undefined | null, fallback: IconName = 'circle'): IconName {
  return validateIconName(iconName, fallback);
} 