import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { saveUserToLocal, getLocalUser, getActiveLocalUser, deactivateUser, updateUserSubscription } from '../database/database';
import { User as LocalUser } from '../database/models';
import { useDatabase } from './DatabaseContext';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { supabaseSyncService } from '../services/SupabaseSyncService';

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
        
        // Auto-load user data
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
      
      // Get groups from Supabase where the user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('group_memberships')
        .select(`
          id,
          group_id,
          user_id,
          role,
          joined_at,
          groups:group_id(*)
        `)
        .eq('user_id', userId);
      
      if (membershipError) {
        console.error('ApiContext: Error fetching group memberships:', membershipError);
        throw membershipError;
      }
      
      console.log(`ApiContext: Found ${memberships?.length || 0} groups for user`);
      
      // Set user groups from Supabase data
      setUserGroups(memberships || []);
      
      // Set current group to the first group (usually Personal)
      if (memberships && memberships.length > 0) {
        setCurrentGroup(memberships[0].groups);
        console.log('ApiContext: Set current group to:', memberships[0].groups.name);
      } else {
        // Create default Personal group if none exists
        console.log('ApiContext: No groups found, creating Personal group');
        await createGroup('Personal', 'Your personal food management group');
      }
      
      console.log('ApiContext: User data loaded successfully from Supabase');
    } catch (error) {
      console.error('ApiContext: Error loading user data from Supabase:', error);
      
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
      // Sign up with Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || email
          }
        }
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('User was not created');
      
      console.log('ApiContext: Signup successful, user:', data.user.id);
      
      // Store token if provided
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
      
      // Save to local database
      const localUser = {
        supabase_id: data.user.id,
        email: data.user.email!,
        full_name: userData.full_name || email,
        subscription_type: 'free'
      };
      
      await saveUserToLocal(localUser);
      
      // Set user state
      setUser(localUser);
      
      // Create user metadata in Supabase
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: userData.full_name || email,
        language_preference: 'en'
      });
      
      // Load user data
      await loadUserData(data.user.id);
    } catch (error) {
      console.error('ApiContext: Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('ApiContext: Starting sign in with Supabase...');
    
    try {
      // Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Failed to retrieve user details');
      
      console.log('ApiContext: Sign in successful');
      
      // Store token if provided
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
      
      // Get user profile from Supabase
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Could not fetch user profile:', profileError);
      }
      
      // Save to local database
      const localUser = {
        supabase_id: data.user.id,
        email: data.user.email!,
        full_name: userData?.full_name || data.user.email!,
        subscription_type: userData?.subscription_type || 'free'
      };
      
      await saveUserToLocal(localUser);
      
      // Set user state
      setUser(localUser);
      
      // Load user data
      await loadUserData(data.user.id);
    } catch (error) {
      console.error('ApiContext: Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('ApiContext: Starting sign out from Supabase...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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
      throw error;
    }
  };

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    console.log('ApiContext: Creating group:', name);
    
    const currentUserId = user?.supabase_id;
    if (!currentUserId) {
      throw new Error('Must have a user to create a group');
    }

    try {
      // Create the group in Supabase first
      const { data: groupData, error: createError } = await supabase
        .from('groups')
        .insert({
          name,
          description: description || null,
          created_by: currentUserId
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!groupData) throw new Error('Failed to create group');
      
      console.log('ApiContext: Group created in Supabase with ID:', groupData.id);
      
      // Add the creator as an owner in group_memberships
      const { error: memberError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupData.id,
          user_id: currentUserId,
          role: 'owner'
        });
        
      if (memberError) throw memberError;
      
      // Create the group object
      const newGroup: Group = {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        created_by: currentUserId,
        invite_code: groupData.invite_code,
        max_members: groupData.max_members || 4,
        created_at: groupData.created_at,
        updated_at: groupData.updated_at
      };

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
      console.log('ApiContext: Starting sync with Supabase...');
      
      // Perform bidirectional sync using SupabaseSyncService
      const result = await supabaseSyncService.syncDatabase(user.supabase_id, currentGroup.id);
      
      if (result.success) {
        console.log('ApiContext: Supabase sync completed successfully');
        console.log('ApiContext: Sync results:', result.stats);
        
        // Update last sync time
        setLastSyncTime(result.syncedAt);
        
        // Refresh local data
        await database.refreshAll();
        
        // Calculate sync stats for the alert
        const uploadStats = result.stats?.uploaded;
        const downloadStats = result.stats?.downloaded;
        
        const totalUploaded = (
          (uploadStats?.categories || 0) + 
          (uploadStats?.locations || 0) + 
          (uploadStats?.foodItems || 0)
        );
        
        const totalDownloaded = (
          (downloadStats?.categories || 0) + 
          (downloadStats?.locations || 0) + 
          (downloadStats?.foodItems || 0)
        );
        
        Alert.alert(
          'Sync Complete', 
          `Your data has been synchronized with Supabase.\n\n` +
          `Uploaded: ${totalUploaded} items, ${uploadStats?.images || 0} images\n` +
          `Downloaded: ${totalDownloaded} items, ${downloadStats?.images || 0} images`
        );
      } else {
        Alert.alert('Sync Failed', result.error || 'An unknown error occurred during sync');
      }
      
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
      await supabaseSyncService.clearSyncLog();
      setLastSyncTime(null);
      Alert.alert('Sync Data Cleared', 'All sync history has been cleared.');
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
