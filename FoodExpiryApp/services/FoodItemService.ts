import apiClient from './ApiClient';

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
  purchase_date?: string;
  expiry_date?: string;
  notes?: string;
  image_url?: string;
  barcode?: string;
  purchase_price?: number;
  remaining_quantity: number;
  is_consumed: boolean;
  created_at: string;
  updated_at: string;
  // Enriched fields
  category_name?: string;
  category_icon?: string;
  location_name?: string;
  location_icon?: string;
  status?: string;
  days_until_expiry?: number;
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
  created_at: string;
  user_name?: string;
  category_name?: string;
  location_name?: string;
}

class FoodItemService {
  // Create food item
  async createItem(itemData: Partial<FoodItem>): Promise<{ success: boolean; item?: FoodItem; error?: string }> {
    const response = await apiClient.post<{ item: FoodItem }>('/food-items', itemData);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, item: response.data!.item };
  }

  // Get food items for a group
  async getItems(groupId: string, filters?: {
    category_id?: string;
    location_id?: string;
    is_consumed?: boolean;
    status?: string;
  }): Promise<{ success: boolean; items?: FoodItem[]; error?: string }> {
    const params = new URLSearchParams({ group_id: groupId });
    
    if (filters) {
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.location_id) params.append('location_id', filters.location_id);
      if (filters.is_consumed !== undefined) params.append('is_consumed', String(filters.is_consumed));
      if (filters.status) params.append('status', filters.status);
    }

    const response = await apiClient.get<{ items: FoodItem[] }>(`/food-items?${params.toString()}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, items: response.data!.items };
  }

  // Get items expiring soon
  async getExpiringItems(groupId: string, days: number = 3): Promise<{ success: boolean; items?: FoodItem[]; error?: string }> {
    const response = await apiClient.get<{ items: FoodItem[] }>(`/food-items/expiring?group_id=${groupId}&days=${days}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, items: response.data!.items };
  }

  // Get expired items
  async getExpiredItems(groupId: string): Promise<{ success: boolean; items?: FoodItem[]; error?: string }> {
    const response = await apiClient.get<{ items: FoodItem[] }>(`/food-items/expired?group_id=${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, items: response.data!.items };
  }

  // Get single food item
  async getItem(itemId: string): Promise<{ success: boolean; item?: FoodItem; error?: string }> {
    const response = await apiClient.get<{ item: FoodItem }>(`/food-items/${itemId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, item: response.data!.item };
  }

  // Update food item
  async updateItem(itemId: string, updates: Partial<FoodItem>): Promise<{ success: boolean; item?: FoodItem; error?: string }> {
    const response = await apiClient.patch<{ item: FoodItem }>(`/food-items/${itemId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, item: response.data!.item };
  }

  // Delete food item
  async deleteItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.delete(`/food-items/${itemId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Log food item event (consumption/disposal)
  async logEvent(itemId: string, eventData: {
    event_type: string;
    quantity_affected?: number;
    disposal_reason?: string;
    price_at_disposal?: number;
  }): Promise<{ success: boolean; event?: FoodItemEvent; error?: string }> {
    const response = await apiClient.post<{ event: FoodItemEvent }>(`/food-items/${itemId}/events`, eventData);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, event: response.data!.event };
  }

  // Get event history for an item
  async getEvents(itemId: string): Promise<{ success: boolean; events?: FoodItemEvent[]; error?: string }> {
    const response = await apiClient.get<{ events: FoodItemEvent[] }>(`/food-items/${itemId}/events`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, events: response.data!.events };
  }
}

export const foodItemService = new FoodItemService();
export default foodItemService;

