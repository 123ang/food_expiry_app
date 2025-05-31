export interface BaseItem {
  id?: number;
  name: string;
  icon: string;
}

export interface Category extends BaseItem {}

export interface Location extends BaseItem {}

export interface FoodItem {
  id?: number;
  name: string;
  quantity: number;
  category_id: number | null;
  location_id: number | null;
  expiry_date: string;
  reminder_days: number;
  notes: string | null;
  image_uri: string | null;
  created_at: string;
}

export interface FoodItemWithDetails extends Omit<FoodItem, 'id'> {
  id: number;  // Make id required for items from database
  category_name: string;
  category_icon: string;
  location_name: string;
  location_icon: string;
  days_until_expiry: number;
  status?: 'expired' | 'expiring_soon' | 'fresh';
}

// Type guard to check if an item has an ID
export function hasId<T extends { id?: number }>(item: T): item is T & { id: number } {
  return typeof item.id === 'number';
} 