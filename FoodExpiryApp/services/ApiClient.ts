import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration
// For Expo: __DEV__ is true in development mode
// For physical device testing, use your computer's IP address instead of localhost
// Your IP: 192.168.100.3
const API_URL = __DEV__ 
  ? 'http://192.168.100.3:3000/api'  // Development - Use your IP for physical device, localhost for simulator
  : 'https://api.expiry-alert.link/api';  // Production

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.loadTokens();
  }

  // Load tokens from storage
  private async loadTokens() {
    try {
      const [access, refresh] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);
      this.accessToken = access;
      this.refreshToken = refresh;
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  // Save tokens to storage
  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    try {
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      ]);
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Clear tokens
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const { accessToken, refreshToken } = data.tokens;

      await this.setTokens(accessToken, refreshToken);
      return accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearTokens();
      return null;
    }
  }

  // Subscribe to token refresh
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  // Notify subscribers of new token
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  // Make authenticated request
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add access token if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 (token expired)
      if (response.status === 401 && this.refreshToken && !this.isRefreshing) {
        this.isRefreshing = true;

        const newToken = await this.refreshAccessToken();

        if (newToken) {
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          this.isRefreshing = false;
          return {
            error: 'Session expired. Please login again.',
          };
        }
      } else if (response.status === 401 && this.isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          this.subscribeTokenRefresh(async (token) => {
            headers['Authorization'] = `Bearer ${token}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            const data = await retryResponse.json();
            resolve({ data });
          });
        });
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
        };
      }

      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file (for images)
  async uploadFile(endpoint: string, file: any): Promise<ApiResponse> {
    const url = `${API_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Upload failed',
        };
      }

      return { data };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

