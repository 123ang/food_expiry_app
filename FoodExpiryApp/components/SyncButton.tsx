import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabaseSyncService } from '../services/SupabaseSyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncButtonProps {
  userId?: string;
  groupId?: string;
  onSyncComplete?: (result: any) => void;
  disabled?: boolean;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ 
  userId, 
  groupId, 
  onSyncComplete, 
  disabled = false 
}) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Load the last sync time when component mounts
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const timestamp = await AsyncStorage.getItem('last_sync_time');
        if (timestamp) {
          setLastSyncTime(new Date(timestamp));
        }
      } catch (error) {
        console.error('Error loading last sync time:', error);
      }
    };
    
    loadLastSyncTime();
  }, []);
  
  const handleSync = async () => {
    if (!userId || !groupId) {
      Alert.alert(
        'Authentication Required',
        'You need to be logged in and have a group selected to sync data.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (syncing) {
      return;
    }
    
    setSyncing(true);
    
    try {
      // First make sure the database has the necessary sync columns
      await supabaseSyncService.updateDatabaseForSync();
      
      // Then perform the sync
      const result = await supabaseSyncService.syncDatabase(userId, groupId);
      
      if (result.success) {
        // Update the last sync time display
        setLastSyncTime(result.syncedAt);
        
        // Show success message
        const uploadStats = result.stats?.uploaded;
        const downloadStats = result.stats?.downloaded;
        
        // Calculate total numbers for a cleaner display
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
          'Supabase Sync Complete',
          `Successfully synchronized with Supabase.\n\nUploaded: ${totalUploaded} items, ${uploadStats?.images || 0} images\nDownloaded: ${totalDownloaded} items, ${downloadStats?.images || 0} images`
        );
        
        // Callback with result
        if (onSyncComplete) {
          onSyncComplete(result);
        }
      } else {
        Alert.alert(
          'Supabase Sync Failed',
          result.error || 'An unknown error occurred while syncing with Supabase'
        );
      }
    } catch (error) {
      console.error('Supabase sync error:', error);
      Alert.alert(
        'Sync Error',
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    } finally {
      setSyncing(false);
    }
  };
  
  // Format the last sync time for display
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    
    return lastSyncTime.toLocaleDateString();
  };
  
  return (
    <>
      <TouchableOpacity 
        style={[styles.button, (disabled || syncing) && styles.buttonDisabled]} 
        onPress={handleSync}
        disabled={disabled || syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.text}>Sync</Text>
        )}
      </TouchableOpacity>
      
      {lastSyncTime && (
        <Text style={styles.lastSyncText}>Last sync: {formatLastSyncTime()}</Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  buttonDisabled: {
    backgroundColor: '#a0c1e7',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    textAlign: 'center'
  }
});

export default SyncButton;

