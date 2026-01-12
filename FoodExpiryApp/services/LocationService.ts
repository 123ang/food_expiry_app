import apiClient from './ApiClient';

export interface Location {
  id: string;
  name: string;
  icon?: string;
  is_default: boolean;
  group_id?: string;
  created_by?: string;
  created_at: string;
}

class LocationService {
  // Get all locations (default + group-specific)
  async getLocations(groupId?: string): Promise<{ success: boolean; locations?: Location[]; error?: string }> {
    const url = groupId ? `/locations?group_id=${groupId}` : '/locations';
    const response = await apiClient.get<{ locations: Location[] }>(url);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, locations: response.data!.locations };
  }

  // Get location by ID
  async getLocation(locationId: string): Promise<{ success: boolean; location?: Location; error?: string }> {
    const response = await apiClient.get<{ location: Location }>(`/locations/${locationId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, location: response.data!.location };
  }

  // Create custom location
  async createLocation(groupId: string, locationData: { name: string; icon?: string }): Promise<{ success: boolean; location?: Location; error?: string }> {
    const response = await apiClient.post<{ location: Location }>('/locations', {
      group_id: groupId,
      ...locationData,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, location: response.data!.location };
  }

  // Update location
  async updateLocation(locationId: string, updates: { name?: string; icon?: string }): Promise<{ success: boolean; location?: Location; error?: string }> {
    const response = await apiClient.patch<{ location: Location }>(`/locations/${locationId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, location: response.data!.location };
  }

  // Delete location
  async deleteLocation(locationId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.delete(`/locations/${locationId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

export const locationService = new LocationService();
export default locationService;

