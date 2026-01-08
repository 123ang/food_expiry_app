// Type definitions for database models

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  avatar_url?: string;
  language_preference: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Device {
  id: string;
  user_id: string;
  device_uuid: string;
  device_name?: string;
  device_type?: string;
  platform?: string;
  refresh_token_hash?: string;
  last_active_at: Date;
  created_at: Date;
}

export interface UserSettings {
  user_id: string;
  price_tracking_enabled: boolean;
  notification_time: string;
  expiring_soon_days: number;
  expiring_today_alerts: boolean;
  expired_alerts: boolean;
  theme: string;
  created_at: Date;
  updated_at: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  invite_code: string;
  max_members: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: Date;
}

export interface Invitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id?: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: Date;
  responded_at?: Date;
  created_at: Date;
}

export interface Category {
  id: string;
  group_id?: string;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  version: number;
}

export interface Location {
  id: string;
  group_id?: string;
  name: string;
  icon?: string;
  temperature_zone?: string;
  is_default: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  version: number;
}

export interface FoodItem {
  id: string;
  group_id: string;
  created_by: string;
  name: string;
  brand?: string;
  quantity: number;
  unit?: string;
  category_id?: string;
  location_id?: string;
  purchase_date?: Date;
  expiry_date?: Date;
  notes?: string;
  image_url?: string;
  barcode?: string;
  purchase_price?: number;
  estimated_value?: number;
  original_quantity: number;
  remaining_quantity: number;
  is_consumed: boolean;
  consumed_at?: Date;
  consumed_by?: string;
  last_used_at?: Date;
  usage_frequency: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  version: number;
  sync_status: 'pending' | 'synced' | 'conflict';
}

export interface FoodItemEvent {
  id: string;
  food_item_id: string;
  group_id: string;
  user_id: string;
  event_type: 'used_completely' | 'used_partially' | 'thrown_away' | 'gifted' | 'expired_unused';
  quantity_affected: number;
  disposal_reason?: 'expired' | 'spoiled' | 'too_much' | 'dislike' | 'forgotten' | 'other';
  price_at_disposal?: number;
  days_since_purchase?: number;
  days_before_expiry?: number;
  location_at_disposal?: string;
  category_at_disposal?: string;
  created_at: Date;
}

export interface GroupAnalytics {
  id: string;
  group_id: string;
  analysis_date: Date;
  total_items_added: number;
  total_items_used: number;
  total_items_thrown_away: number;
  total_items_expired: number;
  waste_percentage: number;
  avg_days_before_expiry: number;
  most_wasted_category?: string;
  most_wasted_location?: string;
  estimated_waste_value: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingItem {
  id: string;
  group_id: string;
  created_by: string;
  name: string;
  quantity: number;
  unit?: string;
  category_id?: string;
  is_purchased: boolean;
  purchased_at?: Date;
  purchased_by?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  version: number;
}

export interface WishItem {
  id: string;
  group_id: string;
  created_by: string;
  name: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  version: number;
}

export interface SyncLog {
  id: string;
  device_id: string;
  user_id: string;
  last_sync_at: Date;
  items_pushed: number;
  items_pulled: number;
  sync_status: 'success' | 'partial' | 'failed';
  error_message?: string;
  created_at: Date;
}

// Request/Response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  deviceId?: string;
}

export interface SyncPayload {
  since?: string;
  device_id: string;
  payload: {
    categories?: Category[];
    locations?: Location[];
    food_items?: FoodItem[];
    shopping_items?: ShoppingItem[];
    wish_items?: WishItem[];
    user_settings?: Partial<UserSettings>;
  };
}

export interface SyncResponse {
  server_time: string;
  changes: {
    categories: Category[];
    locations: Location[];
    food_items: FoodItem[];
    shopping_items: ShoppingItem[];
    wish_items: WishItem[];
    user_settings?: UserSettings;
  };
  stats: {
    pushed: number;
    pulled: number;
  };
}

