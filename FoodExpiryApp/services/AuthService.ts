import apiClient from './ApiClient';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  device: any;
}

class AuthService {
  // Get device info for registration
  private getDeviceInfo() {
    return {
      device_uuid: Constants.deviceId || `${Device.osName}-${Date.now()}`,
      device_name: Device.deviceName || Device.modelName || 'Unknown Device',
      device_type: Device.deviceType === Device.DeviceType.PHONE ? 'mobile' : 
                    Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'mobile',
      platform: Device.osName || 'unknown',
    };
  }

  // Register new user
  async register(email: string, password: string, full_name?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const deviceInfo = this.getDeviceInfo();

    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email,
      password,
      full_name,
      device_info: deviceInfo,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    const { user, tokens } = response.data!;
    await apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

    return { success: true, user };
  }

  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const deviceInfo = this.getDeviceInfo();

    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
      device_info: deviceInfo,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    const { user, tokens } = response.data!;
    await apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

    return { success: true, user };
  }

  // Logout user
  async logout(): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post('/auth/logout');

    await apiClient.clearTokens();

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Get current user
  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    const response = await apiClient.get<{ user: User }>('/users/me');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, user: response.data!.user };
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    const response = await apiClient.patch<{ user: User }>('/users/me', updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, user: response.data!.user };
  }

  // Get user settings
  async getSettings(): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
    const response = await apiClient.get<{ settings: UserSettings }>('/users/me/settings');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, settings: response.data!.settings };
  }

  // Update user settings
  async updateSettings(updates: Partial<UserSettings>): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
    const response = await apiClient.patch<{ settings: UserSettings }>('/users/me/settings', updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, settings: response.data!.settings };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return apiClient.getAccessToken() !== null;
  }
}

export const authService = new AuthService();
export default authService;

