export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface Location {
  id: number;
  name: string;
  icon: string;
}

export interface FoodItem {
  id: number;
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

export interface FoodItemWithDetails extends FoodItem {
  category_name: string;
  category_icon: string;
  location_name: string;
  location_icon: string;
  days_until_expiry: number;
} 