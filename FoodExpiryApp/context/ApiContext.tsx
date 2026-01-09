import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { saveUserToLocal, getLocalUser, getActiveLocalUser, deactivateUser, updateUserSubscription } from '../database/database';
import { User as LocalUser } from '../database/models';
import { useDatabase } from './DatabaseContext';
import NetInfo from '@react-native-community/netinfo';
import authService from '../services/AuthService';
import apiClient from '../services/ApiClient';

// Define types
interface ApiContextType {
  // Authentication - simplified for single login
  user: LocalUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Groups & Sync
  currentGroup: Group | null;
  userGroups: GroupMembership[];
  createGroup: (name: string, description?: string) => Promise<Group>;
  
  // Sync
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  syncToServer: () => Promise<void>;
  clearSyncData: () => Promise<void>;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code?: string | null;
  max_members?: number;
  created_at: string;
  updated_at: string;
}

interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  groups: Group;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Helper functions for session storage
const getStoredSession = async (email: string) => {
  try {
    const sessionKey = `api_session_${email}`;
    const storedSession = await AsyncStorage.getItem(sessionKey);
    if (storedSession) {
      return JSON.parse(storedSession);
    }
    return null;
  } catch (error) {
    console.error('Error getting stored session:', error);
    return null;
  }
};

const storeSession = async (email: string, token: string, userId: string) => {
  try {
    const sessionKey = `api_session_${email}`;
    const sessionData = {
      token,
      userId,
      expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
    await AsyncStorage.setItem(sessionKey, JSON.stringify(sessionData));
    console.log('ApiContext: Session stored for:', email);
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

const clearStoredSession = async (email: string) => {
  try {
    const sessionKey = `api_session_${email}`;
    await AsyncStorage.removeItem(sessionKey);
    console.log('ApiContext: Session cleared for:', email);
  } catch (error) {
    console.error('Error clearing stored session:', error);
  }
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [userGroups, setUserGroups] = useState<GroupMembership[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const database = useDatabase();

  // Simplified authentication state
  const isAuthenticated = !!user;

  // Use Supabase client instead of custom API requests

  // Check for existing local user on app start - simplified
  const checkLocalUser = async () => {
    try {
      console.log('ApiContext: Checking for local user...');
      const activeUser = await getActiveLocalUser();
      if (activeUser) {
        console.log('ApiContext: Found active local user:', activeUser.email);
        setUser(activeUser);
        
        // Auto-load user data (supabase_id contains PostgreSQL user ID)
        await loadUserData(activeUser.supabase_id);
      }
      setLoading(false);
    } catch (error) {
      console.error('ApiContext: Error checking local user:', error);
      setLoading(false);
    }
  };

  // Debug authentication status
  useEffect(() => {
    console.log('ApiContext: Auth Status Debug:', {
      hasUser: !!user,
      hasToken: !!token,
      isAuthenticated,
      userEmail: user?.email
    });
  }, [user, token, isAuthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('ApiContext: Initializing authentication...');
        
        // Check for local user - this will also load user data if found
        await checkLocalUser();
        
        console.log('ApiContext: Authentication initialized');
      } catch (error) {
        console.error('ApiContext: Error initializing auth:', error);
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('ApiContext: Auth initialization timeout - forcing loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    initializeAuth();

    return () => clearTimeout(timeoutId);
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      console.log('ApiContext: Loading user data for userId:', userId);
      
      // Get groups from PostgreSQL backend where the user is a member
      // Backend returns: { groups: (Group & { role: string; member_count: number })[] }
      const response = await apiClient.get<{ groups: (Group & { role: string; member_count: number })[] }>('/groups');
      
      if (response.error) {
        console.error('ApiContext: Error fetching groups:', response.error);
        throw new Error(response.error);
      }
      
      const backendGroups = response.data?.groups || [];
      console.log(`ApiContext: Found ${backendGroups.length} groups for user`);
      
      // Map backend groups to GroupMembership format for compatibility
      const memberships: GroupMembership[] = backendGroups.map(group => ({
        id: `${group.id}-${userId}`, // Create membership ID
        group_id: group.id,
        user_id: userId,
        role: group.role as 'owner' | 'admin' | 'member',
        joined_at: group.created_at,
        groups: {
          id: group.id,
          name: group.name,
          description: group.description,
          created_by: group.created_by,
          invite_code: null,
          max_members: 4,
          created_at: group.created_at,
          updated_at: group.updated_at
        }
      }));
      
      // Set user groups from PostgreSQL data
      setUserGroups(memberships);
      
      // Set current group to the first group (usually Personal)
      if (memberships.length > 0) {
        setCurrentGroup(memberships[0].groups);
        console.log('ApiContext: Set current group to:', memberships[0].groups.name);
      } else {
        // Create default Personal group if none exists
        console.log('ApiContext: No groups found, creating Personal group');
        await createGroup('Personal', 'Your personal food management group');
      }
      
      console.log('ApiContext: User data loaded successfully from PostgreSQL');
    } catch (error) {
      console.error('ApiContext: Error loading user data from PostgreSQL:', error);
      
      // As a fallback, create a Personal group
      try {
        if (!currentGroup) {
          console.log('ApiContext: Creating fallback Personal group');
          await createGroup('Personal', 'Your personal food management group');
        }
      } catch (fallbackError) {
        console.error('ApiContext: Error creating fallback group:', fallbackError);
      }
    }
  };

  const signUp = async (email: string, password: string, userData: any): Promise<void> => {
    console.log('ApiContext: Starting signup for email:', email);
    
    try {
      // Sign up with PostgreSQL backend via AuthService
      const result = await authService.register(
        email.trim().toLowerCase(),
        password,
        userData.full_name || email
      );
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Registration failed');
      }
      
      console.log('ApiContext: Signup successful, user:', result.user.id);
      
      // Save to local database (store PostgreSQL user ID in supabase_id field for compatibility)
      const localUser = {
        supabase_id: result.user.id, // PostgreSQL user ID (UUID string)
        email: result.user.email,
        full_name: result.user.full_name || email,
        subscription_type: 'free' as const
      };
      
      await saveUserToLocal(localUser);
      
      // Set user state
      setUser(localUser);
      
      // Load user data (groups, etc.)
      await loadUserData(result.user.id);
    } catch (error: any) {
      console.error('ApiContext: Signup error:', error);
      // Re-throw with a clearer error message
      if (error?.message?.includes('already') || error?.message?.includes('exists')) {
        throw new Error('An account with this email already exists. Please try signing in instead.');
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('ApiContext: Starting sign in with PostgreSQL...');
    
    try {
      // Sign in with PostgreSQL backend via AuthService
      const result = await authService.login(
        email.trim().toLowerCase(),
        password
      );
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }
      
      console.log('ApiContext: Sign in successful, user:', result.user.id);
      
      // Save to local database (store PostgreSQL user ID in supabase_id field for compatibility)
      const localUser = {
        supabase_id: result.user.id, // PostgreSQL user ID (UUID string)
        email: result.user.email,
        full_name: result.user.full_name || email,
        subscription_type: 'free' as const
      };
      
      await saveUserToLocal(localUser);
      
      // Set user state
      setUser(localUser);
      
      // Load user data (groups, etc.)
      await loadUserData(result.user.id);
    } catch (error: any) {
      console.error('ApiContext: Sign in error:', error);
      // Re-throw with a clearer error message
      if (error?.message?.includes('invalid') || error?.message?.includes('incorrect')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('ApiContext: Starting sign out from PostgreSQL...');
      
      // Sign out from PostgreSQL backend via AuthService
      const result = await authService.logout();
      if (!result.success) {
        console.warn('ApiContext: Logout API call failed, but continuing with local sign out');
      }
      
      // Clear local user data
      if (user) {
        try {
          await deactivateUser(user.supabase_id);
          console.log('ApiContext: Local user deactivated');
        } catch (deactivateError) {
          console.error('ApiContext: Error deactivating local user:', deactivateError);
          // Don't throw here - the sign out was successful, just local cleanup failed
        }
      }
      
      // Clear all state
      setUser(null);
      setToken(null);
      setCurrentGroup(null);
      setUserGroups([]);
      
      console.log('ApiContext: Sign out completed successfully');
    } catch (error) {
      console.error('ApiContext: Sign out error:', error);
      // Even if logout API fails, clear local state
      setUser(null);
      setToken(null);
      setCurrentGroup(null);
      setUserGroups([]);
      throw error;
    }
  };

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    console.log('ApiContext: Creating group:', name);
    
    const currentUserId = user?.supabase_id; // PostgreSQL user ID stored here
    if (!currentUserId) {
      throw new Error('Must have a user to create a group');
    }

    try {
      // Create the group in PostgreSQL backend
      const response = await apiClient.post<{ message: string; group: Group }>('/groups', {
        name,
        description: description || null
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.group) {
        throw new Error('Failed to create group');
      }
      
      const newGroup: Group = {
        id: response.data.group.id,
        name: response.data.group.name,
        description: response.data.group.description,
        created_by: currentUserId,
        invite_code: response.data.group.invite_code || null,
        max_members: response.data.group.max_members || 4,
        created_at: response.data.group.created_at,
        updated_at: response.data.group.updated_at
      };
      
      console.log('ApiContext: Group created in PostgreSQL with ID:', newGroup.id);

      // Reload user data to update the groups
      await loadUserData(currentUserId);

      return newGroup;
    } catch (error) {
      console.error('ApiContext: Error creating group:', error);
      throw error;
    }
  };

  const syncToServer = async (): Promise<void> => {
    if (!isOnline) {
      Alert.alert('Offline Mode', 'You are currently offline. Please connect to the internet to sync.');
      return;
    }
    
    if (!user || !currentGroup) {
      Alert.alert('Not Authenticated', 'Please sign in to sync your data.');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      console.log('ApiContext: Starting sync with PostgreSQL...');
      
      // Note: For now, sync functionality needs to be implemented via the PostgreSQL API
      // This is a placeholder - you'll need to implement the sync endpoint in your backend
      Alert.alert(
        'Sync', 
        'Sync functionality is being migrated to PostgreSQL. Please refresh manually for now.'
      );
      
      // Refresh local data from the backend
      await database.refreshAll();
      setLastSyncTime(new Date());
      
      setSyncStatus('idle');
    } catch (error) {
      console.error('ApiContext: Sync error:', error);
      setSyncStatus('error');
      Alert.alert('Sync Error', error instanceof Error ? error.message : 'An error occurred while syncing your data. Please try again later.');
    }
  };
  
  // Function to clear sync data (for debugging)
  const clearSyncData = async (): Promise<void> => {
    try {
      // Clear sync data - this would need to be implemented via the PostgreSQL API
      setLastSyncTime(null);
      Alert.alert('Sync Data Cleared', 'Sync history cleared.');
    } catch (error) {
      console.error('Error clearing sync data:', error);
      Alert.alert('Error', 'Failed to clear sync data');
    }
  };

  const value: ApiContextType = {
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    currentGroup,
    userGroups,
    createGroup,
    syncStatus,
    lastSyncTime,
    syncToServer,
    clearSyncData
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};
