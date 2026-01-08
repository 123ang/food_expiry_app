import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type SyncStatus = 'pending' | 'synced' | 'conflict' | undefined;

interface SyncStatusBadgeProps {
  status?: SyncStatus;
  small?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status, small = false }) => {
  if (!status || status === 'synced') {
    return null; // Don't show anything if synced (default state) or no status
  }

  return (
    <View style={[
      styles.badge, 
      styles[status], 
      small ? styles.small : null
    ]}>
      <Text style={[styles.text, small ? styles.smallText : null]}>
        {status === 'pending' ? '↑' : '!'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  small: {
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -2,
    right: -2,
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 8,
  },
  pending: {
    backgroundColor: '#4a90e2', // Blue
  },
  conflict: {
    backgroundColor: '#e74c3c', // Red
  }
});

export default SyncStatusBadge;

