import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabaseSyncService } from '../services/SupabaseSyncService';
import { useApi } from '../context/ApiContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/database';

const SyncDebugger: React.FC = () => {
  const [syncInfo, setSyncInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { user, currentGroup } = useApi();

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    setLoading(true);
    try {
      const info = await getSyncInfo();
      setSyncInfo(info);
    } catch (error) {
      console.error('Error loading sync info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSyncInfo = async () => {
    const info: any = {};
    
    // Last sync time
    try {
      const lastSyncTime = await AsyncStorage.getItem('last_sync_time');
      info.lastSyncTime = lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never';
    } catch (e) {
      info.lastSyncTime = 'Error';
    }
    
    // Sync log entries
    try {
      const db = await getDatabase();
      if (db) {
        const syncLogs = await db.getAllAsync('SELECT * FROM sync_log ORDER BY sync_time DESC LIMIT 5');
        info.syncLogs = syncLogs;
      }
    } catch (e) {
      info.syncLogs = [];
    }
    
    // Pending items count
    try {
      const db = await getDatabase();
      if (db) {
        const pendingFoodItems = await db.getFirstAsync("SELECT COUNT(*) as count FROM food_items WHERE sync_status = 'pending'");
        const pendingCategories = await db.getFirstAsync("SELECT COUNT(*) as count FROM categories WHERE sync_status = 'pending'");
        const pendingLocations = await db.getFirstAsync("SELECT COUNT(*) as count FROM locations WHERE sync_status = 'pending'");
        
        info.pendingCounts = {
          foodItems: pendingFoodItems?.count || 0,
          categories: pendingCategories?.count || 0,
          locations: pendingLocations?.count || 0,
          total: (pendingFoodItems?.count || 0) + (pendingCategories?.count || 0) + (pendingLocations?.count || 0)
        };
      }
    } catch (e) {
      info.pendingCounts = { total: 'Error' };
    }
    
    // Conflict items count
    try {
      const db = await getDatabase();
      if (db) {
        const conflictFoodItems = await db.getFirstAsync("SELECT COUNT(*) as count FROM food_items WHERE sync_status = 'conflict'");
        const conflictCategories = await db.getFirstAsync("SELECT COUNT(*) as count FROM categories WHERE sync_status = 'conflict'");
        const conflictLocations = await db.getFirstAsync("SELECT COUNT(*) as count FROM locations WHERE sync_status = 'conflict'");
        
        info.conflictCounts = {
          foodItems: conflictFoodItems?.count || 0,
          categories: conflictCategories?.count || 0,
          locations: conflictLocations?.count || 0,
          total: (conflictFoodItems?.count || 0) + (conflictCategories?.count || 0) + (conflictLocations?.count || 0)
        };
      }
    } catch (e) {
      info.conflictCounts = { total: 'Error' };
    }
    
    // Deleted items
    try {
      const db = await getDatabase();
      if (db) {
        const deletedItems = await db.getAllAsync('SELECT * FROM deleted_items ORDER BY deleted_at DESC LIMIT 5');
        info.deletedItems = deletedItems;
      }
    } catch (e) {
      info.deletedItems = [];
    }
    
    return info;
  };

  const runSync = async () => {
    if (!user || !currentGroup) {
      console.error('User or group not available for sync');
      return;
    }
    
    setLoading(true);
    try {
      await supabaseSyncService.syncDatabase(user.supabase_id, currentGroup.id);
      await loadSyncInfo();
    } catch (error) {
      console.error('Error running sync:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSyncData = async () => {
    setLoading(true);
    try {
      await supabaseSyncService.clearSyncLog();
      await loadSyncInfo();
    } catch (error) {
      console.error('Error clearing sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Supabase Sync Debugger</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runSync}
          disabled={loading || !user || !currentGroup}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Run Sync</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearSyncData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Sync Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={loadSyncInfo}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <ActivityIndicator style={styles.loader} size="large" color="#0066cc" />
      )}
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sync Status</Text>
        <Text>Last Sync: {syncInfo.lastSyncTime || 'Unknown'}</Text>
        <Text>Current User: {user?.email || 'Not logged in'}</Text>
        <Text>Current Group: {currentGroup?.name || 'None'}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Items</Text>
        {syncInfo.pendingCounts ? (
          <View>
            <Text>Food Items: {syncInfo.pendingCounts.foodItems}</Text>
            <Text>Categories: {syncInfo.pendingCounts.categories}</Text>
            <Text>Locations: {syncInfo.pendingCounts.locations}</Text>
            <Text style={styles.totalCount}>Total: {syncInfo.pendingCounts.total}</Text>
          </View>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conflicts</Text>
        {syncInfo.conflictCounts ? (
          <View>
            <Text>Food Items: {syncInfo.conflictCounts.foodItems}</Text>
            <Text>Categories: {syncInfo.conflictCounts.categories}</Text>
            <Text>Locations: {syncInfo.conflictCounts.locations}</Text>
            <Text style={styles.totalCount}>Total: {syncInfo.conflictCounts.total}</Text>
          </View>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Sync Logs</Text>
        {syncInfo.syncLogs && syncInfo.syncLogs.length > 0 ? (
          syncInfo.syncLogs.map((log: any, index: number) => (
            <View key={index} style={styles.logEntry}>
              <Text>Time: {new Date(log.sync_time).toLocaleString()}</Text>
              <Text>Status: {log.status}</Text>
              <Text>Uploaded: {log.items_uploaded} items, {log.images_uploaded} images</Text>
              <Text>Downloaded: {log.items_downloaded} items, {log.images_downloaded} images</Text>
              {log.error && <Text style={styles.errorText}>Error: {log.error}</Text>}
            </View>
          ))
        ) : (
          <Text>No sync logs available</Text>
        )}
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Deleted Items</Text>
        {syncInfo.deletedItems && syncInfo.deletedItems.length > 0 ? (
          syncInfo.deletedItems.map((item: any, index: number) => (
            <View key={index} style={styles.logEntry}>
              <Text>Table: {item.table_name}</Text>
              <Text>Item ID: {item.item_id}</Text>
              <Text>Cloud ID: {item.cloud_id || 'None'}</Text>
              <Text>Deleted At: {new Date(item.deleted_at).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text>No deleted items</Text>
        )}
      </View>
      
      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  dangerButton: {
    backgroundColor: '#cc3300',
  },
  infoButton: {
    backgroundColor: '#33cc33',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  totalCount: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  logEntry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  errorText: {
    color: 'red',
  },
  spacer: {
    height: 50,
  }
});

export default SyncDebugger;