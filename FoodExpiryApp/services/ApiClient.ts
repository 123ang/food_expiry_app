import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration
// Production API URL - use the API subdomain (api.expiry-alert.link)
export const API_URL = 'https://api.expiry-alert.link/api';

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
      console.log('[API CLIENT] Error loading tokens:', error);
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
      console.log('[API CLIENT] Error saving tokens:', error);
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
      console.log('[API CLIENT] Error clearing tokens:', error);
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
      console.log('[API CLIENT] Error refreshing token:', error);
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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

      // Get response as text first to handle HTML error pages
      const responseText = await response.text();
      
      // Check if response is HTML (server error page)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html') || responseText.startsWith('<')) {
        console.log(`[API DEBUG] Server returned HTML instead of JSON for: ${url}`);
        console.log('[API DEBUG] Response status:', response.status);
        console.log('[API DEBUG] This usually means:');
        console.log('  1. The API server is not running');
        console.log('  2. A reverse proxy (nginx) is returning an error page');
        console.log('  3. The API route does not exist');
        return {
          error: `Server error (${response.status}). Please try again later.`,
        };
      }
      
      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log(`[API DEBUG] Failed to parse JSON response for: ${url}`);
        console.log('[API DEBUG] Response text:', responseText.substring(0, 200));
        return {
          error: 'Invalid server response. Please try again later.',
        };
      }

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
        };
      }

      return { data };
    } catch (error) {
      console.log(`[API DEBUG] Request failed for: ${url}`);
      console.log('[API DEBUG] Error details:', error);
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.log(`[API DEBUG] Network error - Backend might not be reachable at ${API_URL}`);
        console.log('[API DEBUG] Check if:');
        console.log('  1. Backend server is running');
        console.log('  2. IP address is correct (current:', API_URL, ')');
        console.log('  3. Device/emulator can reach the backend IP');
        console.log('  4. Firewall is not blocking the connection');
        return {
          error: 'Cannot connect to server. Please check your internet connection.',
        };
      }
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
  async uploadFile(endpoint: string, formData: FormData): Promise<ApiResponse> {
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    // Don't set Content-Type for FormData - let React Native set it with boundary

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.log(`[API CLIENT] Failed to parse upload response:`, parseError);
        return {
          error: 'Failed to parse server response',
        };
      }

      if (!response.ok) {
        console.log(`[API CLIENT] Upload failed with status ${response.status}:`, data);
        return {
          error: data.error || `Upload failed with status ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      console.log(`[API CLIENT] ❌ Upload exception:`, error);
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

