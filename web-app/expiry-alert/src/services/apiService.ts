import apiClient from './apiClient';

// ==================== INTERFACES ====================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  language_preference: string;
  timezone: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  price_tracking_enabled: boolean;
  notification_time: string;
  expiring_soon_days: number;
  expiring_today_alerts: boolean;
  expired_alerts: boolean;
  theme: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  invite_code: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  role?: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
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
  category_name?: string;
  category_icon?: string;
  location_name?: string;
  location_icon?: string;
  status?: string;
  days_until_expiry?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  group_id?: string;
  created_by?: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  icon?: string;
  temperature_zone?: string;
  is_default: boolean;
  group_id?: string;
  created_by?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_items: number;
  items_used: number;
  items_wasted: number;
  waste_percentage: number;
  total_waste_value: number;
  avg_days_before_expiry: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  total_events: number;
  used_count: number;
  wasted_count: number;
  waste_percentage: number;
  total_waste_value: number;
}

export interface MonthlyTrend {
  month: string;
  items_added: number;
  items_used: number;
  items_wasted: number;
  waste_percentage: number;
  total_waste_value: number;
}

// ==================== AUTH SERVICE ====================

export class AuthService {
  async register(email: string, password: string, full_name?: string) {
    const response = await apiClient.post<{ user: User; tokens: any }>('/auth/register', {
      email,
      password,
      full_name,
      device_info: {
        device_uuid: `web-${Date.now()}`,
        device_name: navigator.userAgent,
        device_type: 'web',
        platform: 'web',
      },
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    const { user, tokens } = response.data!;
    apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

    return { success: true, user };
  }

  async login(email: string, password: string) {
    const response = await apiClient.post<{ user: User; tokens: any }>('/auth/login', {
      email,
      password,
      device_info: {
        device_uuid: `web-${Date.now()}`,
        device_name: navigator.userAgent,
        device_type: 'web',
        platform: 'web',
      },
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    const { user, tokens } = response.data!;
    apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

    return { success: true, user };
  }

  async logout() {
    const response = await apiClient.post('/auth/logout');
    apiClient.clearTokens();

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  async getCurrentUser() {
    const response = await apiClient.get<{ user: User }>('/users/me');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, user: response.data!.user };
  }

  async updateProfile(updates: Partial<User>) {
    const response = await apiClient.patch<{ user: User }>('/users/me', updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, user: response.data!.user };
  }

  async getSettings() {
    const response = await apiClient.get<{ settings: UserSettings }>('/users/me/settings');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, settings: response.data!.settings };
  }

  async updateSettings(updates: Partial<UserSettings>) {
    const response = await apiClient.patch<{ settings: UserSettings }>('/users/me/settings', updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, settings: response.data!.settings };
  }

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }
}

// ==================== GROUP SERVICE ====================

export class GroupService {
  async createGroup(name: string, description?: string) {
    const response = await apiClient.post<{ group: Group }>('/groups', {
      name,
      description,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, group: response.data!.group };
  }

  async getGroups() {
    const response = await apiClient.get<{ groups: Group[] }>('/groups');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, groups: response.data!.groups };
  }

  async getGroup(groupId: string) {
    const response = await apiClient.get<{ group: Group }>(`/groups/${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, group: response.data!.group };
  }

  async updateGroup(groupId: string, updates: { name?: string; description?: string }) {
    const response = await apiClient.patch<{ group: Group }>(`/groups/${groupId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, group: response.data!.group };
  }

  async deleteGroup(groupId: string) {
    const response = await apiClient.delete(`/groups/${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  async getMembers(groupId: string) {
    const response = await apiClient.get<{ members: GroupMember[] }>(`/groups/${groupId}/members`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, members: response.data!.members };
  }

  async removeMember(groupId: string, memberId: string) {
    const response = await apiClient.delete(`/groups/${groupId}/members/${memberId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  async updateMemberRole(groupId: string, memberId: string, role: string) {
    const response = await apiClient.patch(`/groups/${groupId}/members/${memberId}`, { role });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

// ==================== FOOD ITEM SERVICE ====================

export class FoodItemService {
  async createItem(itemData: Partial<FoodItem>) {
    const response = await apiClient.post<{ item: FoodItem }>('/food-items', itemData);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, item: response.data!.item };
  }

  async getItems(groupId: string, filters?: {
    category_id?: string;
    location_id?: string;
    is_consumed?: boolean;
    status?: string;
  }) {
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

  async getExpiringItems(groupId: string, days: number = 3) {
    const response = await apiClient.get<{ items: FoodItem[] }>(`/food-items/expiring?group_id=${groupId}&days=${days}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, items: response.data!.items };
  }

  async getExpiredItems(groupId: string) {
    const response = await apiClient.get<{ items: FoodItem[] }>(`/food-items/expired?group_id=${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, items: response.data!.items };
  }

  async getItem(itemId: string) {
    const response = await apiClient.get<{ item: FoodItem }>(`/food-items/${itemId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, item: response.data!.item };
  }

  async updateItem(itemId: string, updates: Partial<FoodItem>) {
    const response = await apiClient.patch<{ item: FoodItem }>(`/food-items/${itemId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, item: response.data!.item };
  }

  async deleteItem(itemId: string) {
    const response = await apiClient.delete(`/food-items/${itemId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  async logEvent(itemId: string, eventData: {
    event_type: string;
    quantity_affected?: number;
    disposal_reason?: string;
    price_at_disposal?: number;
  }) {
    const response = await apiClient.post(`/food-items/${itemId}/events`, eventData);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, event: response.data!.event };
  }

  async uploadImage(itemId: string, file: File) {
    const response = await apiClient.uploadFile(`/food-items/${itemId}/image`, file);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, imageUrl: response.data!.image_url };
  }
}

// ==================== ANALYTICS SERVICE ====================

export class AnalyticsService {
  async getSummary(groupId: string, months: number = 3) {
    const response = await apiClient.get<{ summary: AnalyticsSummary }>(`/analytics/summary?group_id=${groupId}&months=${months}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, summary: response.data!.summary };
  }

  async getCategoryBreakdown(groupId: string) {
    const response = await apiClient.get<{ breakdown: CategoryBreakdown[] }>(`/analytics/category-breakdown?group_id=${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, breakdown: response.data!.breakdown };
  }

  async getMonthlyTrends(groupId: string, months: number = 12) {
    const response = await apiClient.get<{ trends: MonthlyTrend[] }>(`/analytics/monthly-trends?group_id=${groupId}&months=${months}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, trends: response.data!.trends };
  }

  async getComprehensive(groupId: string, months: number = 3) {
    const response = await apiClient.get<{ analytics: any }>(`/analytics/comprehensive?group_id=${groupId}&months=${months}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, analytics: response.data!.analytics };
  }
}

// ==================== CATEGORY SERVICE ====================

export class CategoryService {
  async getCategories(groupId?: string) {
    const url = groupId ? `/categories?group_id=${groupId}` : '/categories';
    const response = await apiClient.get<{ categories: Category[] }>(url);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, categories: response.data!.categories };
  }

  async createCategory(groupId: string, categoryData: { name: string; icon?: string; color?: string }) {
    const response = await apiClient.post<{ category: Category }>('/categories', {
      group_id: groupId,
      ...categoryData,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, category: response.data!.category };
  }

  async updateCategory(categoryId: string, updates: { name?: string; icon?: string; color?: string }) {
    const response = await apiClient.patch<{ category: Category }>(`/categories/${categoryId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, category: response.data!.category };
  }

  async deleteCategory(categoryId: string) {
    const response = await apiClient.delete(`/categories/${categoryId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

// ==================== LOCATION SERVICE ====================

export class LocationService {
  async getLocations(groupId?: string) {
    const url = groupId ? `/locations?group_id=${groupId}` : '/locations';
    const response = await apiClient.get<{ locations: Location[] }>(url);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, locations: response.data!.locations };
  }

  async createLocation(groupId: string, locationData: { name: string; icon?: string; temperature_zone?: string }) {
    const response = await apiClient.post<{ location: Location }>('/locations', {
      group_id: groupId,
      ...locationData,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, location: response.data!.location };
  }

  async updateLocation(locationId: string, updates: { name?: string; icon?: string; temperature_zone?: string }) {
    const response = await apiClient.patch<{ location: Location }>(`/locations/${locationId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, location: response.data!.location };
  }

  async deleteLocation(locationId: string) {
    const response = await apiClient.delete(`/locations/${locationId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

// ==================== INVITATION SERVICE ====================

export class InvitationService {
  async sendInvitation(groupId: string, email: string) {
    const response = await apiClient.post('/invitations/send', {
      group_id: groupId,
      email,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, invitation: response.data!.invitation };
  }

  async getInvitations() {
    const response = await apiClient.get('/invitations');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, invitations: response.data!.invitations };
  }

  async joinWithCode(inviteCode: string) {
    const response = await apiClient.post('/invitations/join', {
      invite_code: inviteCode,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  async acceptInvitation(invitationId: string) {
    const response = await apiClient.post(`/invitations/${invitationId}/accept`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  async declineInvitation(invitationId: string) {
    const response = await apiClient.post(`/invitations/${invitationId}/decline`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

// ==================== EXPORT SERVICE INSTANCES ====================

export const authService = new AuthService();
export const groupService = new GroupService();
export const foodItemService = new FoodItemService();
export const analyticsService = new AnalyticsService();
export const categoryService = new CategoryService();
export const locationService = new LocationService();
export const invitationService = new InvitationService();

