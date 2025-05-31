import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDatabase } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';

interface CacheDebugProps {
  visible?: boolean;
}

export const CacheDebug: React.FC<CacheDebugProps> = ({ visible = false }) => {
  const { getCacheStatus, clearCache, invalidateCache } = useDatabase();
  const { theme } = useTheme();

  if (!visible) return null;

  const cacheStatus = getCacheStatus();

  const formatAge = (age: number) => {
    if (age < 1000) return `${age}ms`;
    if (age < 60000) return `${Math.round(age / 1000)}s`;
    return `${Math.round(age / 60000)}m`;
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 100,
      right: 10,
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      minWidth: 200,
      zIndex: 1000,
    },
    title: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      color: theme.textColor,
    },
    status: {
      fontSize: 12,
      fontWeight: '500',
    },
    cached: {
      color: '#4CAF50',
    },
    notCached: {
      color: '#F44336',
    },
    button: {
      backgroundColor: theme.primaryColor,
      borderRadius: 4,
      padding: 6,
      marginTop: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cache Status</Text>
      
      {Object.entries(cacheStatus).map(([key, status]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{key}:</Text>
          <Text style={[styles.status, status.cached ? styles.cached : styles.notCached]}>
            {status.cached ? `✓ ${formatAge(status.age)}` : '✗'}
          </Text>
        </View>
      ))}
      
      <TouchableOpacity style={styles.button} onPress={clearCache}>
        <Text style={styles.buttonText}>Clear Cache</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => invalidateCache()}>
        <Text style={styles.buttonText}>Invalidate All</Text>
      </TouchableOpacity>
    </View>
  );
}; 