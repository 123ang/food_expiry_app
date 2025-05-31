import { ImageSourcePropType } from 'react-native';

// Category Icons Registry
export const CATEGORY_ICONS: { [key: string]: ImageSourcePropType } = {
  apple: require('../assets/icons/categories/apple.png'),
  dairy: require('../assets/icons/categories/dairy.png'),
  fruits: require('../assets/icons/categories/fruits.png'),
  vegetables: require('../assets/icons/categories/vegetables.png'),
  meat: require('../assets/icons/categories/meat.png'),
  bread: require('../assets/icons/categories/bread.png'),
  beverages: require('../assets/icons/categories/beverages.png'),
  snacks: require('../assets/icons/categories/snacks.png'),
  frozen: require('../assets/icons/categories/frozen.png'),
  canned: require('../assets/icons/categories/canned.png'),
  // Fallback icon for unknown categories
  default: require('../assets/icons/categories/apple.png'),
};

// Location Icons Registry
export const LOCATION_ICONS: { [key: string]: ImageSourcePropType } = {
  fridge: require('../assets/icons/locations/fridge.png'),
  freezer: require('../assets/icons/locations/freezer.png'),
  pantry: require('../assets/icons/locations/pantry.png'),
  cabinet: require('../assets/icons/locations/cabinet.png'),
  counter: require('../assets/icons/locations/counter.png'),
  basement: require('../assets/icons/locations/basement.png'),
  garage: require('../assets/icons/locations/garage.png'),
  office: require('../assets/icons/locations/office.png'),
  // Fallback icon for unknown locations
  default: require('../assets/icons/locations/fridge.png'),
};

// Get category icon with fallback
export function getCategoryIcon(iconName: string | null | undefined): ImageSourcePropType {
  if (!iconName || !CATEGORY_ICONS[iconName]) {
    return CATEGORY_ICONS.default;
  }
  return CATEGORY_ICONS[iconName];
}

// Get location icon with fallback
export function getLocationIcon(iconName: string | null | undefined): ImageSourcePropType {
  if (!iconName || !LOCATION_ICONS[iconName]) {
    return LOCATION_ICONS.default;
  }
  return LOCATION_ICONS[iconName];
}

// Get available category icon names
export function getCategoryIconNames(): string[] {
  return Object.keys(CATEGORY_ICONS).filter(key => key !== 'default');
}

// Get available location icon names
export function getLocationIconNames(): string[] {
  return Object.keys(LOCATION_ICONS).filter(key => key !== 'default');
} 