import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data - replace with your actual data
const locations = [
  {
    id: 1,
    name: 'Fridge',
    icon: 'building' as IconName,
    color: '#2196F3',
    itemCount: 12,
  },
  {
    id: 2,
    name: 'Pantry',
    icon: 'archive' as IconName,
    color: '#9C27B0',
    itemCount: 8,
  },
  {
    id: 3,
    name: 'Freezer',
    icon: 'snowflake-o' as IconName,
    color: '#00BCD4',
    itemCount: 5,
  },
];

export default function LocationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Locations</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {locations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.card}
            onPress={() => router.push(`/locations/${location.id}`)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${location.color}20` }]}>
              <FontAwesome name={location.icon} size={24} color={location.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{location.name}</Text>
              <Text style={styles.cardSubtitle}>{location.itemCount} items</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <BottomNav />
    </View>
  );
} 