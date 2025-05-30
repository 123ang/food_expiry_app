import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

type IconName = keyof typeof FontAwesome.glyphMap;

export function BottomNav() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.cardBackground,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    navItem: {
      alignItems: 'center',
      minWidth: 64,
    },
    navItemActive: {
      transform: [{ scale: 1.1 }],
    },
    navText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    navTextActive: {
      color: theme.primaryColor,
      fontWeight: '500',
    },
    addButton: {
      backgroundColor: theme.primaryColor,
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -32,
      ...Platform.select({
        ios: {
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
  });

  const navItems = [
    { name: 'Home', icon: 'home' as IconName, path: '/' },
    { name: 'List', icon: 'list' as IconName, path: '/list' },
    { name: 'Add', icon: 'plus' as IconName, path: '/add' },
    { name: 'Calendar', icon: 'calendar' as IconName, path: '/calendar' },
    { name: 'Settings', icon: 'cog' as IconName, path: '/settings' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const isAdd = item.name === 'Add';

        if (isAdd) {
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => router.push(item.path)}
            >
              <View style={styles.addButton}>
                <FontAwesome name={item.icon} size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => router.push(item.path)}
          >
            <FontAwesome
              name={item.icon}
              size={24}
              color={isActive ? theme.primaryColor : theme.textSecondary}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
} 