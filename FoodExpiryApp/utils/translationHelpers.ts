import { Category, Location, FoodItemWithDetails } from '../database/models';

export interface TranslationHelpers {
  getCategoryName: (category: Category) => string;
  getLocationName: (location: Location) => string;
  t: (key: string) => string;
}

export const getItemCategoryName = (
  categoryId: string | string[] | number | null,
  categories: Category[],
  { getCategoryName, t }: Pick<TranslationHelpers, 'getCategoryName' | 't'>
) => {
  if (categoryId === null) return t('common.unknownCategory');
  
  // Convert string/array to number
  const numericId = typeof categoryId === 'number' 
    ? categoryId 
    : parseInt(Array.isArray(categoryId) ? categoryId[0] : categoryId);
  
  if (isNaN(numericId)) return t('common.unknownCategory');
  
  const category = categories.find(cat => cat.id === numericId);
  return category ? getCategoryName(category) : t('common.unknownCategory');
};

export const getItemLocationName = (
  locationId: string | string[] | number | null,
  locations: Location[],
  { getLocationName, t }: Pick<TranslationHelpers, 'getLocationName' | 't'>
) => {
  if (locationId === null) return t('common.unknownLocation');
  
  // Convert string/array to number
  const numericId = typeof locationId === 'number'
    ? locationId
    : parseInt(Array.isArray(locationId) ? locationId[0] : locationId);
  
  if (isNaN(numericId)) return t('common.unknownLocation');
  
  const location = locations.find(loc => loc.id === numericId);
  return location ? getLocationName(location) : t('common.unknownLocation');
};

// Helper for FoodItemWithDetails objects
export const getTranslatedItemNames = (
  item: FoodItemWithDetails,
  categories: Category[],
  locations: Location[],
  helpers: TranslationHelpers
) => {
  return {
    categoryName: getItemCategoryName(item.category_id, categories, helpers),
    locationName: getItemLocationName(item.location_id, locations, helpers)
  };
}; 