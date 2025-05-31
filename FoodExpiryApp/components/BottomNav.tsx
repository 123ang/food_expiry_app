import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

type IconName = keyof typeof FontAwesome.glyphMap;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.cardBackground,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: Platform.OS === 'ios' ? 24 : 12,
      paddingTop: 12,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 8,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
    },
    navItemActive: {
      color: theme.primaryColor,
    },
    addButton: {
      backgroundColor: theme.primaryColor,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -28,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 8,
    },
    navText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    navTextActive: {
      color: theme.primaryColor,
    },
  });

  const navItems = [
    { name: 'Home', icon: 'home', path: '/' },
    { name: 'List', icon: 'list', path: '/list' },
    { name: 'Add', icon: 'plus', path: '/add' },
    { name: 'Calendar', icon: 'calendar', path: '/calendar' },
    { name: 'Settings', icon: 'cog', path: '/settings' },
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
                <FontAwesome name={item.icon as IconName} size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.push(item.path)}
          >
            <FontAwesome
              name={item.icon as IconName}
              size={20}
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