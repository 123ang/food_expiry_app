import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';

interface StatItemProps {
  label: string;
  count: number;
  icon: string;
  color: string;
  onPress?: () => void;
}

const StatItem: React.FC<StatItemProps> = ({ label, count, icon, color, onPress }) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={styles.statItem} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <FontAwesome name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statCount, { color: colors.text }]}>{count}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

interface DashboardStatsProps {
  totalCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  freshCount: number;
  onPressTotal?: () => void;
  onPressExpired?: () => void;
  onPressExpiringSoon?: () => void;
  onPressFresh?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalCount,
  expiredCount,
  expiringSoonCount,
  freshCount,
  onPressTotal,
  onPressExpired,
  onPressExpiringSoon,
  onPressFresh,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Food Inventory</Text>
      
      <View style={styles.statsContainer}>
        <StatItem 
          label="Total" 
          count={totalCount} 
          icon="list" 
          color={colors.primary}
          onPress={onPressTotal}
        />
        <StatItem 
          label="Expired" 
          count={expiredCount} 
          icon="exclamation-circle" 
          color={colors.danger}
          onPress={onPressExpired}
        />
        <StatItem 
          label="Expiring Soon" 
          count={expiringSoonCount} 
          icon="clock-o" 
          color={colors.warning}
          onPress={onPressExpiringSoon}
        />
        <StatItem 
          label="Fresh" 
          count={freshCount} 
          icon="check-circle" 
          color={colors.success}
          onPress={onPressFresh}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});