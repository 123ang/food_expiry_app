import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useApi } from '../context/ApiContext';
import { ShoppingItem, WishItem } from '../database/models';
import {
  getShoppingItemsByGroup,
  getWishItemsByGroup,
} from '../database/shoppingRepository';
import { BottomNav } from '../components/BottomNav';
import { ShoppingList } from '../components/ShoppingList';
import { WishList } from '../components/WishList';

type Tab = 'shopping' | 'wish';

export const ListScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme;
  const { t } = useLanguage();
  const { currentGroup } = useApi();
  const [activeTab, setActiveTab] = useState<Tab>('shopping');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [wishItems, setWishItems] = useState<WishItem[]>([]);

  // Load items filtered by current group
  const loadItems = useCallback(async () => {
    try {
      if (!currentGroup?.id) {
        // If no group selected, show empty lists
        setShoppingItems([]);
        setWishItems([]);
        return;
      }

      const [shopping, wish] = await Promise.all([
        getShoppingItemsByGroup(currentGroup.id, true), // Include completed items
        getWishItemsByGroup(currentGroup.id, true), // Include completed items
      ]);
      setShoppingItems(shopping);
      setWishItems(wish);
    } catch (error) {
      console.error('Failed to load items:', error);
      setShoppingItems([]);
      setWishItems([]);
    }
  }, [currentGroup?.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
        <Ionicons name="list" size={24} color={colors.primaryColor} />
        <Text style={[styles.headerTitle, { color: colors.textColor }]}>Lists</Text>
      </View>

      {/* Tab Container */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'shopping' && [styles.activeTabButton, { borderBottomColor: colors.primaryColor }],
          ]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textColor },
              activeTab === 'shopping' && [styles.activeTabText, { color: colors.primaryColor }],
            ]}
          >
            {t('Shopping List')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'wish' && [styles.activeTabButton, { borderBottomColor: colors.primaryColor }],
          ]}
          onPress={() => setActiveTab('wish')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textColor },
              activeTab === 'wish' && [styles.activeTabText, { color: colors.primaryColor }],
            ]}
          >
            {t('Wish List')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'shopping' ? (
        <ShoppingList items={shoppingItems} onItemsChange={loadItems} />
      ) : (
        <WishList items={wishItems} onItemsChange={loadItems} />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
};

export default ListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: '600',
  },
}); 