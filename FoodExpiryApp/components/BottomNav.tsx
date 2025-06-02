import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, BackHandler } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

type IconName = keyof typeof FontAwesome.glyphMap;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleNavigation = (path: string) => {
    console.log('BottomNav - Current pathname:', pathname);
    console.log('BottomNav - Navigating to:', path);
    
    if (path === '/') {
      // If we're already on the home screen, exit the app
      if (pathname === '/') {
        console.log('BottomNav - Already on home, exiting app');
        BackHandler.exitApp();
        return;
      }
      
      // Special handling for location detail screens
      if (pathname.startsWith('/locations/')) {
        console.log('BottomNav - Navigating from location detail to home');
        // First go back to clear the location detail, then navigate to home
        router.back();
        setTimeout(() => {
          router.replace('/');
        }, 200);
        return;
      }
      
      // Special handling for category detail screens
      if (pathname.startsWith('/categories/')) {
        console.log('BottomNav - Navigating from category detail to home');
        // First go back to clear the category detail, then navigate to home
        router.back();
        setTimeout(() => {
          router.replace('/');
        }, 200);
        return;
      }
      
      // For other screens, direct navigation to home
      console.log('BottomNav - Direct navigation to home from:', pathname);
      router.replace('/');
      return;
    }

    // For other screens, just push to the navigation stack
    console.log('BottomNav - Pushing to:', path);
    router.push(path);
  };

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
    { name: t('nav.home'), icon: 'home', path: '/' },
    { name: t('nav.list'), icon: 'list', path: '/list' },
    { name: t('nav.add'), icon: 'plus', path: '/add' },
    { name: t('nav.calendar'), icon: 'calendar', path: '/calendar' },
    { name: t('nav.settings'), icon: 'cog', path: '/settings' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const isAdd = item.path === '/add';

        if (isAdd) {
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => handleNavigation(item.path)}
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
            onPress={() => handleNavigation(item.path)}
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