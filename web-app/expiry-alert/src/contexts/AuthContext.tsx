import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/apiClient';

// User interface matching PostgreSQL backend
interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  language_preference: string;
  timezone: string;
  created_at: string;
  // Legacy compatibility
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    language_preference: string;
    timezone: string;
    created_at: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  device: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Get device info for API calls
const getDeviceInfo = () => {
  return {
    device_uuid: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    device_name: navigator.userAgent.includes('Chrome') ? 'Chrome Browser' : 
                 navigator.userAgent.includes('Firefox') ? 'Firefox Browser' :
                 navigator.userAgent.includes('Safari') ? 'Safari Browser' : 'Web Browser',
    device_type: 'web',
    platform: navigator.platform || 'web',
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have tokens stored
        if (apiClient.isAuthenticated()) {
          // Try to get current user
          const response = await apiClient.get<{ user: AuthResponse['user'] }>('/users/me');
          
          if (response.data?.user) {
            const backendUser = response.data.user;
            setUser({
              ...backendUser,
              uid: backendUser.id,
              displayName: backendUser.full_name || null,
              photoURL: backendUser.avatar_url || null,
              isAnonymous: false,
            });
          } else {
            // Token invalid, clear it
            apiClient.clearTokens();
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        apiClient.clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      const deviceInfo = getDeviceInfo();
      
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        device_info: deviceInfo,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.user || !response.data?.tokens) {
        throw new Error('Invalid response from server');
      }

      const { user: backendUser, tokens } = response.data;
      
      // Save tokens
      apiClient.setTokens(tokens.accessToken, tokens.refreshToken);
      
      // Set user state with legacy compatibility
      setUser({
        ...backendUser,
        uid: backendUser.id,
        displayName: backendUser.full_name || null,
        photoURL: backendUser.avatar_url || null,
        isAnonymous: false,
      });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      const deviceInfo = getDeviceInfo();
      
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        full_name: displayName || email.split('@')[0],
        device_info: deviceInfo,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.user || !response.data?.tokens) {
        throw new Error('Invalid response from server');
      }

      const { user: backendUser, tokens } = response.data;
      
      // Save tokens
      apiClient.setTokens(tokens.accessToken, tokens.refreshToken);
      
      // Set user state with legacy compatibility
      setUser({
        ...backendUser,
        uid: backendUser.id,
        displayName: backendUser.full_name || null,
        photoURL: backendUser.avatar_url || null,
        isAnonymous: false,
      });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      
      // Call logout API
      await apiClient.post('/auth/logout');
      
    } catch (err: any) {
      console.error('Logout API error:', err);
      // Continue with local logout even if API fails
    } finally {
      // Always clear local state
      apiClient.clearTokens();
      setUser(null);
    }
  };

  const signInAsGuest = async (): Promise<void> => {
    // Guest mode - create a local-only user
    try {
      setError(null);
      setLoading(true);
      
      // Create a guest user locally (no server interaction)
      const guestUser: User = {
        id: `guest-${Date.now()}`,
        uid: `guest-${Date.now()}`,
        email: 'guest@local',
        full_name: 'Guest User',
        displayName: 'Guest User',
        photoURL: null,
        avatar_url: undefined,
        language_preference: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: new Date().toISOString(),
        isAnonymous: true,
      };
      
      setUser(guestUser);
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as guest');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInAsGuest,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
