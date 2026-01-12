import apiClient from './apiClient';

// Types matching backend PostgreSQL schema
export interface FoodItem {
  id?: string;
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
  estimated_value?: number;
  original_quantity: number;
  remaining_quantity: number;
  is_consumed: boolean;
  consumed_at?: string;
  consumed_by?: string;
  last_used_at?: string;
  usage_frequency: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  // Computed fields
  status?: 'fresh' | 'expiring-soon' | 'expired';
  daysUntilExpiry?: number;
}

export interface Category {
  id?: string;
  group_id?: string;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version: number;
}

export interface Location {
  id?: string;
  group_id?: string;
  name: string;
  icon?: string;
  is_default: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version: number;
}

export interface DashboardStats {
  total: number;
  fresh: number;
  expiringSoon: number;
  expired: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  invite_code?: string;
  max_members?: number;
  created_at: string;
  updated_at: string;
  role?: 'owner' | 'admin' | 'member'; // User's role in the group (from group_memberships)
  member_count?: number; // Number of members in the group
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface Invitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  group?: Group;
}

// Food Items API
export const getFoodItems = async (groupId?: string): Promise<FoodItem[]> => {
  try {
    const endpoint = groupId ? `/food-items?group_id=${groupId}` : '/food-items';
    const response = await apiClient.get<{ items: FoodItem[] }>(endpoint);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.items || [];
  } catch (error) {
    console.error('Error getting food items:', error);
    throw error;
  }
};

export const getFoodItemById = async (id: string): Promise<FoodItem | null> => {
  try {
    const response = await apiClient.get<{ item: FoodItem }>(`/food-items/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.item || null;
  } catch (error) {
    console.error('Error getting food item:', error);
    throw error;
  }
};

export const addFoodItem = async (item: Partial<FoodItem>): Promise<FoodItem> => {
  try {
    const response = await apiClient.post<{ item: FoodItem }>('/food-items', item);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.item) {
      throw new Error('Failed to create food item');
    }
    
    return response.data.item;
  } catch (error) {
    console.error('Error adding food item:', error);
    throw error;
  }
};

export const updateFoodItem = async (id: string, updates: Partial<FoodItem>): Promise<FoodItem> => {
  try {
    const response = await apiClient.patch<{ item: FoodItem }>(`/food-items/${id}`, updates);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.item) {
      throw new Error('Failed to update food item');
    }
    
    return response.data.item;
  } catch (error) {
    console.error('Error updating food item:', error);
    throw error;
  }
};

export const deleteFoodItem = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/food-items/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error deleting food item:', error);
    throw error;
  }
};

// Categories API
export const getCategories = async (groupId?: string): Promise<Category[]> => {
  try {
    const endpoint = groupId ? `/categories?group_id=${groupId}` : '/categories';
    const response = await apiClient.get<{ categories: Category[] }>(endpoint);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.categories || [];
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

export const addCategory = async (category: Partial<Category>): Promise<Category> => {
  try {
    const response = await apiClient.post<{ category: Category }>('/categories', category);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.category) {
      throw new Error('Failed to create category');
    }
    
    return response.data.category;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  try {
    const response = await apiClient.patch<{ category: Category }>(`/categories/${id}`, updates);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.category) {
      throw new Error('Failed to update category');
    }
    
    return response.data.category;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/categories/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Locations API
export const getLocations = async (groupId?: string): Promise<Location[]> => {
  try {
    const endpoint = groupId ? `/locations?group_id=${groupId}` : '/locations';
    const response = await apiClient.get<{ locations: Location[] }>(endpoint);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.locations || [];
  } catch (error) {
    console.error('Error getting locations:', error);
    throw error;
  }
};

export const addLocation = async (location: Partial<Location>): Promise<Location> => {
  try {
    const response = await apiClient.post<{ location: Location }>('/locations', location);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.location) {
      throw new Error('Failed to create location');
    }
    
    return response.data.location;
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
};

export const updateLocation = async (id: string, updates: Partial<Location>): Promise<Location> => {
  try {
    const response = await apiClient.patch<{ location: Location }>(`/locations/${id}`, updates);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.location) {
      throw new Error('Failed to update location');
    }
    
    return response.data.location;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const deleteLocation = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/locations/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

// Groups API
export const getGroups = async (): Promise<Group[]> => {
  try {
    const response = await apiClient.get<{ groups: Group[] }>('/groups');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.groups || [];
  } catch (error) {
    console.error('Error getting groups:', error);
    throw error;
  }
};

export const createGroup = async (name: string, description?: string): Promise<Group> => {
  try {
    const response = await apiClient.post<{ group: Group }>('/groups', { name, description });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data?.group) {
      throw new Error('Failed to create group');
    }
    
    return response.data.group;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Helper function to calculate item status
export const calculateItemStatus = (expiryDate: string): { status: 'fresh' | 'expiring-soon' | 'expired'; daysUntilExpiry: number } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: 'fresh' | 'expiring-soon' | 'expired';
  if (daysUntilExpiry < 0) {
    status = 'expired';
  } else if (daysUntilExpiry <= 7) {
    status = 'expiring-soon';
  } else {
    status = 'fresh';
  }
  
  return { status, daysUntilExpiry };
};

// Helper function to get dashboard stats
export const getDashboardStats = (items: FoodItem[]): DashboardStats => {
  // Filter out consumed items before calculating stats
  const activeItems = items.filter(item => !item.is_consumed);
  
  const stats: DashboardStats = {
    total: activeItems.length,
    fresh: 0,
    expiringSoon: 0,
    expired: 0,
  };
  
  activeItems.forEach(item => {
    if (item.expiry_date) {
      const { status } = calculateItemStatus(item.expiry_date);
      if (status === 'fresh') stats.fresh++;
      else if (status === 'expiring-soon') stats.expiringSoon++;
      else if (status === 'expired') stats.expired++;
    } else {
      stats.fresh++; // No expiry date = fresh
    }
  });
  
  console.log('Dashboard Stats:', stats, 'from', activeItems.length, 'active items');
  
  return stats;
};

// Initialize user data (create default group if needed)
export const initializeUserData = async (): Promise<void> => {
  try {
    // Check if user has any groups
    const groups = await getGroups();
    
    // If no groups, create a default "Personal" group
    if (groups.length === 0) {
      await createGroup('Personal', 'Your personal food management group');
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};

// Analytics interfaces
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

export interface LocationBreakdown {
  location_id: string;
  location_name: string;
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

export interface MostWastedItem {
  item_name: string;
  category_name: string;
  waste_count: number;
  total_waste_value: number;
  avg_days_before_expiry: number;
}

export interface DisposalReason {
  reason: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface ExpiryPattern {
  discarded_very_late: number;
  discarded_after_expiry: number;
  discarded_on_expiry: number;
  discarded_near_expiry: number;
  discarded_well_before_expiry: number;
  avg_days_before_expiry: number;
  avg_days_since_purchase: number;
}

export interface ComprehensiveAnalytics {
  summary: AnalyticsSummary;
  category_breakdown: CategoryBreakdown[];
  location_breakdown: LocationBreakdown[];
  monthly_trends: MonthlyTrend[];
  most_wasted_items: MostWastedItem[];
  disposal_reasons: DisposalReason[];
  expiry_patterns: ExpiryPattern;
}

// Analytics API
export const getAnalyticsSummary = async (
  groupId: string,
  months: number = 3
): Promise<AnalyticsSummary> => {
  try {
    const response = await apiClient.get<{ summary: AnalyticsSummary }>(
      `/analytics/summary?group_id=${groupId}&months=${months}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.summary || {
      total_items: 0,
      items_used: 0,
      items_wasted: 0,
      waste_percentage: 0,
      total_waste_value: 0,
      avg_days_before_expiry: 0,
      period: { start: '', end: '' }
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw error;
  }
};

export const getCategoryBreakdown = async (
  groupId: string
): Promise<CategoryBreakdown[]> => {
  try {
    const response = await apiClient.get<{ breakdown: CategoryBreakdown[] }>(
      `/analytics/category-breakdown?group_id=${groupId}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.breakdown || [];
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    throw error;
  }
};

export const getLocationBreakdown = async (
  groupId: string
): Promise<LocationBreakdown[]> => {
  try {
    const response = await apiClient.get<{ breakdown: LocationBreakdown[] }>(
      `/analytics/location-breakdown?group_id=${groupId}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.breakdown || [];
  } catch (error) {
    console.error('Error getting location breakdown:', error);
    throw error;
  }
};

export const getMonthlyTrends = async (
  groupId: string,
  months: number = 12
): Promise<MonthlyTrend[]> => {
  try {
    const response = await apiClient.get<{ trends: MonthlyTrend[] }>(
      `/analytics/monthly-trends?group_id=${groupId}&months=${months}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.trends || [];
  } catch (error) {
    console.error('Error getting monthly trends:', error);
    throw error;
  }
};

export const getMostWastedItems = async (
  groupId: string,
  limit: number = 10
): Promise<MostWastedItem[]> => {
  try {
    const response = await apiClient.get<{ items: MostWastedItem[] }>(
      `/analytics/most-wasted?group_id=${groupId}&limit=${limit}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.items || [];
  } catch (error) {
    console.error('Error getting most wasted items:', error);
    throw error;
  }
};

export const getDisposalReasons = async (
  groupId: string
): Promise<DisposalReason[]> => {
  try {
    const response = await apiClient.get<{ reasons: DisposalReason[] }>(
      `/analytics/disposal-reasons?group_id=${groupId}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.reasons || [];
  } catch (error) {
    console.error('Error getting disposal reasons:', error);
    throw error;
  }
};

export const getExpiryPatterns = async (
  groupId: string
): Promise<ExpiryPattern> => {
  try {
    const response = await apiClient.get<{ patterns: ExpiryPattern }>(
      `/analytics/expiry-patterns?group_id=${groupId}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.patterns || {
      discarded_very_late: 0,
      discarded_after_expiry: 0,
      discarded_on_expiry: 0,
      discarded_near_expiry: 0,
      discarded_well_before_expiry: 0,
      avg_days_before_expiry: 0,
      avg_days_since_purchase: 0
    };
  } catch (error) {
    console.error('Error getting expiry patterns:', error);
    throw error;
  }
};

export const getComprehensiveAnalytics = async (
  groupId: string,
  months: number = 3
): Promise<ComprehensiveAnalytics> => {
  try {
    const response = await apiClient.get<{ analytics: ComprehensiveAnalytics }>(
      `/analytics/comprehensive?group_id=${groupId}&months=${months}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.analytics || {
      summary: {
        total_items: 0,
        items_used: 0,
        items_wasted: 0,
        waste_percentage: 0,
        total_waste_value: 0,
        avg_days_before_expiry: 0,
        period: { start: '', end: '' }
      },
      category_breakdown: [],
      location_breakdown: [],
      monthly_trends: [],
      most_wasted_items: [],
      disposal_reasons: [],
      expiry_patterns: {
        discarded_very_late: 0,
        discarded_after_expiry: 0,
        discarded_on_expiry: 0,
        discarded_near_expiry: 0,
        discarded_well_before_expiry: 0,
        avg_days_before_expiry: 0,
        avg_days_since_purchase: 0
      }
    };
  } catch (error) {
    console.error('Error getting comprehensive analytics:', error);
    throw error;
  }
};

// Shopping Item interfaces
export interface ShoppingItem {
  id?: string;
  group_id: string;
  created_by?: string;
  name: string;
  quantity?: number;
  unit?: string;
  category_id?: string;
  is_purchased?: boolean;
  purchased_at?: string;
  purchased_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

// Wish Item interfaces
export interface WishItem {
  id?: string;
  group_id: string;
  created_by?: string;
  name: string;
  notes?: string;
  price?: number;
  rating?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

// Shopping Items API
export const getShoppingItems = async (groupId: string, includePurchased: boolean = false): Promise<ShoppingItem[]> => {
  try {
    const response = await apiClient.get<{ items: ShoppingItem[] }>(
      `/shopping-items?group_id=${groupId}&include_purchased=${includePurchased}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.items || [];
  } catch (error) {
    console.error('Error getting shopping items:', error);
    throw error;
  }
};

export const getShoppingItemById = async (itemId: string): Promise<ShoppingItem | null> => {
  try {
    const response = await apiClient.get<{ item: ShoppingItem }>(`/shopping-items/${itemId}`);
    
    if (response.error) {
      if (response.error.includes('not found')) {
        return null;
      }
      throw new Error(response.error);
    }
    
    return response.data?.item || null;
  } catch (error) {
    console.error('Error getting shopping item:', error);
    throw error;
  }
};

export const addShoppingItem = async (item: Partial<ShoppingItem>): Promise<ShoppingItem> => {
  try {
    const response = await apiClient.post<{ item: ShoppingItem }>('/shopping-items', item);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.item!;
  } catch (error) {
    console.error('Error adding shopping item:', error);
    throw error;
  }
};

export const updateShoppingItem = async (itemId: string, item: Partial<ShoppingItem>): Promise<ShoppingItem> => {
  try {
    const response = await apiClient.patch<{ item: ShoppingItem }>(`/shopping-items/${itemId}`, item);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.item!;
  } catch (error) {
    console.error('Error updating shopping item:', error);
    throw error;
  }
};

export const deleteShoppingItem = async (itemId: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/shopping-items/${itemId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    throw error;
  }
};

export const toggleShoppingItemPurchase = async (itemId: string): Promise<ShoppingItem> => {
  try {
    const response = await apiClient.post<{ item: ShoppingItem }>(`/shopping-items/${itemId}/toggle`, {});
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.item!;
  } catch (error) {
    console.error('Error toggling shopping item purchase:', error);
    throw error;
  }
};

export const clearPurchasedShoppingItems = async (groupId: string): Promise<number> => {
  try {
    const response = await apiClient.post<{ deleted_count: number }>('/shopping-items/clear-purchased', { group_id: groupId });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.deleted_count || 0;
  } catch (error) {
    console.error('Error clearing purchased shopping items:', error);
    throw error;
  }
};

// Wish Items API
export const getWishItems = async (groupId: string): Promise<WishItem[]> => {
  try {
    const response = await apiClient.get<{ items: WishItem[] }>(
      `/wish-items?group_id=${groupId}`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.items || [];
  } catch (error) {
    console.error('Error getting wish items:', error);
    throw error;
  }
};

export const getWishItemById = async (itemId: string): Promise<WishItem | null> => {
  try {
    const response = await apiClient.get<{ item: WishItem }>(`/wish-items/${itemId}`);
    
    if (response.error) {
      if (response.error.includes('not found')) {
        return null;
      }
      throw new Error(response.error);
    }
    
    return response.data?.item || null;
  } catch (error) {
    console.error('Error getting wish item:', error);
    throw error;
  }
};

export const addWishItem = async (item: Partial<WishItem>): Promise<WishItem> => {
  try {
    const response = await apiClient.post<{ item: WishItem }>('/wish-items', item);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.item!;
  } catch (error) {
    console.error('Error adding wish item:', error);
    throw error;
  }
};

export const updateWishItem = async (itemId: string, item: Partial<WishItem>): Promise<WishItem> => {
  try {
    const response = await apiClient.patch<{ item: WishItem }>(`/wish-items/${itemId}`, item);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.item!;
  } catch (error) {
    console.error('Error updating wish item:', error);
    throw error;
  }
};

export const deleteWishItem = async (itemId: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/wish-items/${itemId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error deleting wish item:', error);
    throw error;
  }
};

// Group Management API
export const getGroupMembers = async (groupId: string): Promise<GroupMembership[]> => {
  try {
    const response = await apiClient.get<{ members: GroupMembership[] }>(`/groups/${groupId}/members`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.members || [];
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
};

export const removeMember = async (groupId: string, memberId: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

export const updateMemberRole = async (groupId: string, memberId: string, role: 'owner' | 'admin' | 'member'): Promise<void> => {
  try {
    const response = await apiClient.patch(`/groups/${groupId}/members/${memberId}`, { role });
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

export const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<Group> => {
  try {
    const response = await apiClient.patch<{ group: Group }>(`/groups/${groupId}`, updates);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.group!;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/groups/${groupId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// Invitation API
export const sendInvitation = async (groupId: string, email: string): Promise<Invitation> => {
  try {
    const response = await apiClient.post<{ invitation: Invitation }>('/invitations/send', {
      group_id: groupId,
      email
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.invitation!;
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw error;
  }
};

export const getUserInvitations = async (): Promise<Invitation[]> => {
  try {
    const response = await apiClient.get<{ invitations: Invitation[] }>('/invitations');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.invitations || [];
  } catch (error) {
    console.error('Error getting invitations:', error);
    throw error;
  }
};

export const acceptInvitation = async (invitationId: string): Promise<void> => {
  try {
    const response = await apiClient.post(`/invitations/${invitationId}/accept`, {});
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
};

export const declineInvitation = async (invitationId: string): Promise<void> => {
  try {
    const response = await apiClient.post(`/invitations/${invitationId}/decline`, {});
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error declining invitation:', error);
    throw error;
  }
};

export const joinGroupWithCode = async (inviteCode: string): Promise<void> => {
  try {
    const response = await apiClient.post('/invitations/join', { invite_code: inviteCode });
    
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error joining group with code:', error);
    throw error;
  }
};

export const verifyInviteCode = async (code: string): Promise<{ valid: boolean; group?: Group }> => {
  try {
    const response = await apiClient.get<{ valid: boolean; group?: Group }>(`/invitations/verify/${code}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || { valid: false };
  } catch (error) {
    console.error('Error verifying invite code:', error);
    throw error;
  }
};
