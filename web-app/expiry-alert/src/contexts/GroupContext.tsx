import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getGroups, Group } from '../services/postgresApiService';

interface GroupContextType {
  currentGroup: Group | null;
  groups: Group[];
  setCurrentGroup: (group: Group | null) => void;
  loading: boolean;
  error: string | null;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

const CURRENT_GROUP_KEY = '@food_expiry_current_group';

export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentGroup, setCurrentGroupState] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load saved group from localStorage
  useEffect(() => {
    if (!user) {
      setCurrentGroupState(null);
      setGroups([]);
      setLoading(false);
      return;
    }

    const loadGroups = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userGroups = await getGroups();
        setGroups(userGroups);

        if (userGroups.length === 0) {
          setCurrentGroupState(null);
          setLoading(false);
          return;
        }

        // Try to restore saved group from localStorage
        const savedGroupId = localStorage.getItem(CURRENT_GROUP_KEY);
        const savedGroup = savedGroupId 
          ? userGroups.find(g => g.id === savedGroupId)
          : null;

        // Set current group: saved group or first group
        const groupToSet = savedGroup || userGroups[0];
        setCurrentGroupState(groupToSet);
        localStorage.setItem(CURRENT_GROUP_KEY, groupToSet.id);
      } catch (err) {
        console.error('Error loading groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  const setCurrentGroup = (group: Group | null) => {
    setCurrentGroupState(group);
    if (group) {
      localStorage.setItem(CURRENT_GROUP_KEY, group.id);
    } else {
      localStorage.removeItem(CURRENT_GROUP_KEY);
    }
  };

  const refreshGroups = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const userGroups = await getGroups();
      setGroups(userGroups);

      // If current group was deleted, switch to first available group
      if (currentGroup && !userGroups.find(g => g.id === currentGroup.id)) {
        if (userGroups.length > 0) {
          setCurrentGroup(userGroups[0]);
        } else {
          setCurrentGroup(null);
        }
      } else if (currentGroup) {
        // Update current group data
        const updatedGroup = userGroups.find(g => g.id === currentGroup.id);
        if (updatedGroup) {
          setCurrentGroupState(updatedGroup);
        }
      } else if (userGroups.length > 0) {
        // If no current group but groups exist, set first one
        setCurrentGroup(userGroups[0]);
      }
    } catch (err) {
      console.error('Error refreshing groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh groups');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GroupContext.Provider
      value={{
        currentGroup,
        groups,
        setCurrentGroup,
        loading,
        error,
        refreshGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = (): GroupContextType => {
  const context = useContext(GroupContext);
  if (!context) {
    // Return a default context instead of throwing to prevent crashes during HMR
    console.warn('useGroup must be used within a GroupProvider, returning default context');
    return {
      currentGroup: null,
      groups: [],
      setCurrentGroup: () => {},
      loading: true,
      error: 'GroupProvider not available',
      refreshGroups: async () => {},
    };
  }
  return context;
};
