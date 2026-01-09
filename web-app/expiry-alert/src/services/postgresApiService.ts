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
  temperature_zone?: string;
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
  const stats: DashboardStats = {
    total: items.length,
    fresh: 0,
    expiringSoon: 0,
    expired: 0,
  };
  
  items.forEach(item => {
    if (item.expiry_date) {
      const { status } = calculateItemStatus(item.expiry_date);
      if (status === 'fresh') stats.fresh++;
      else if (status === 'expiring-soon') stats.expiringSoon++;
      else if (status === 'expired') stats.expired++;
    } else {
      stats.fresh++; // No expiry date = fresh
    }
  });
  
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
