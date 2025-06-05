import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import CategoryIcon from '../../components/CategoryIcon';
import { Category } from '../../database/models';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesome } from '@expo/vector-icons';

// Category emojis for selection - All 91 food emojis
const CATEGORY_EMOJIS = [
  // Fruits (15 emojis)
  { key: 'apples', emoji: '🍎', label: 'Apples' },
  { key: 'green_apples', emoji: '🍏', label: 'Green Apples' },
  { key: 'pears', emoji: '🍐', label: 'Pears' },
  { key: 'oranges', emoji: '🍊', label: 'Oranges' },
  { key: 'lemons', emoji: '🍋', label: 'Lemons' },
  { key: 'bananas', emoji: '🍌', label: 'Bananas' },
  { key: 'watermelon', emoji: '🍉', label: 'Watermelon' },
  { key: 'grapes', emoji: '🍇', label: 'Grapes' },
  { key: 'strawberries', emoji: '🍓', label: 'Strawberries' },
  { key: 'melon', emoji: '🍈', label: 'Melon' },
  { key: 'cherries', emoji: '🍒', label: 'Cherries' },
  { key: 'peaches', emoji: '🍑', label: 'Peaches' },
  { key: 'pineapple', emoji: '🍍', label: 'Pineapple' },
  { key: 'mango', emoji: '🥭', label: 'Mango' },
  { key: 'coconut', emoji: '🥥', label: 'Coconut' },
  
  // Vegetables (11 emojis)
  { key: 'tomatoes', emoji: '🍅', label: 'Tomatoes' },
  { key: 'eggplant', emoji: '🍆', label: 'Eggplant' },
  { key: 'corn', emoji: '🌽', label: 'Corn' },
  { key: 'peppers', emoji: '🌶️', label: 'Peppers' },
  { key: 'cucumber', emoji: '🥒', label: 'Cucumber' },
  { key: 'carrots', emoji: '🥕', label: 'Carrots' },
  { key: 'potatoes', emoji: '🥔', label: 'Potatoes' },
  { key: 'garlic', emoji: '🧄', label: 'Garlic' },
  { key: 'onions', emoji: '🧅', label: 'Onions' },
  { key: 'broccoli', emoji: '🥦', label: 'Broccoli' },
  { key: 'chestnuts', emoji: '🌰', label: 'Chestnuts' },
  
  // Bread & Grains (8 emojis)
  { key: 'bread', emoji: '🍞', label: 'Bread' },
  { key: 'baguette', emoji: '🥖', label: 'Baguette' },
  { key: 'croissant', emoji: '🥐', label: 'Croissant' },
  { key: 'bagel', emoji: '🥯', label: 'Bagel' },
  { key: 'pancakes', emoji: '🥞', label: 'Pancakes' },
  { key: 'pretzel', emoji: '🥨', label: 'Pretzel' },
  { key: 'rice', emoji: '🍚', label: 'Rice' },
  { key: 'rice_ball', emoji: '🍙', label: 'Rice Ball' },
  
  // Prepared Foods (16 emojis)
  { key: 'salad', emoji: '🥗', label: 'Salad' },
  { key: 'sandwich', emoji: '🥪', label: 'Sandwich' },
  { key: 'curry', emoji: '🍛', label: 'Curry' },
  { key: 'ramen', emoji: '🍜', label: 'Ramen' },
  { key: 'pasta', emoji: '🍝', label: 'Pasta' },
  { key: 'sushi', emoji: '🍣', label: 'Sushi' },
  { key: 'oden', emoji: '🍢', label: 'Oden' },
  { key: 'rice_cracker', emoji: '🍘', label: 'Rice Cracker' },
  { key: 'tacos', emoji: '🌮', label: 'Tacos' },
  { key: 'burrito', emoji: '🌯', label: 'Burrito' },
  { key: 'burger', emoji: '🍔', label: 'Burger' },
  { key: 'fries', emoji: '🍟', label: 'Fries' },
  { key: 'hot_dog', emoji: '🌭', label: 'Hot Dog' },
  { key: 'pizza', emoji: '🍕', label: 'Pizza' },
  { key: 'flatbread', emoji: '🥙', label: 'Flatbread' },
  { key: 'paella', emoji: '🥘', label: 'Paella' },
  
  // Meat & Protein (9 emojis)
  { key: 'chicken', emoji: '🍗', label: 'Chicken' },
  { key: 'meat', emoji: '🍖', label: 'Meat' },
  { key: 'bacon', emoji: '🥓', label: 'Bacon' },
  { key: 'steak', emoji: '🥩', label: 'Steak' },
  { key: 'fish', emoji: '🐟', label: 'Fish' },
  { key: 'shrimp', emoji: '🍤', label: 'Shrimp' },
  { key: 'prawns', emoji: '🦐', label: 'Prawns' },
  { key: 'eggs', emoji: '🥚', label: 'Eggs' },
  { key: 'fried_egg', emoji: '🍳', label: 'Fried Egg' },
  
  // Dairy (3 emojis)
  { key: 'milk', emoji: '🥛', label: 'Milk' },
  { key: 'cheese', emoji: '🧀', label: 'Cheese' },
  { key: 'butter', emoji: '🧈', label: 'Butter' },
  
  // Snacks (2 emojis)
  { key: 'popcorn', emoji: '🍿', label: 'Popcorn' },
  { key: 'nuts', emoji: '🥜', label: 'Nuts' },
  
  // Desserts & Sweets (11 emojis)
  { key: 'cookies', emoji: '🍪', label: 'Cookies' },
  { key: 'donuts', emoji: '🍩', label: 'Donuts' },
  { key: 'cupcake', emoji: '🧁', label: 'Cupcake' },
  { key: 'birthday_cake', emoji: '🎂', label: 'Birthday Cake' },
  { key: 'cake', emoji: '🍰', label: 'Cake' },
  { key: 'chocolate', emoji: '🍫', label: 'Chocolate' },
  { key: 'candy', emoji: '🍬', label: 'Candy' },
  { key: 'lollipop', emoji: '🍭', label: 'Lollipop' },
  { key: 'ice_cream', emoji: '🍦', label: 'Ice Cream' },
  { key: 'ice_cream_cup', emoji: '🍨', label: 'Ice Cream Cup' },
  { key: 'shaved_ice', emoji: '🍧', label: 'Shaved Ice' },
  
  // Beverages (13 emojis)
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'tea', emoji: '🍵', label: 'Tea' },
  { key: 'baby_bottle', emoji: '🍼', label: 'Baby Bottle' },
  { key: 'soft_drink', emoji: '🥤', label: 'Soft Drink' },
  { key: 'juice_box', emoji: '🧃', label: 'Juice Box' },
  { key: 'sake', emoji: '🍶', label: 'Sake' },
  { key: 'beer_mugs', emoji: '🍻', label: 'Beer Mugs' },
  { key: 'beer', emoji: '🍺', label: 'Beer' },
  { key: 'wine', emoji: '🍷', label: 'Wine' },
  { key: 'champagne', emoji: '🥂', label: 'Champagne' },
  { key: 'martini', emoji: '🍸', label: 'Martini' },
  { key: 'cocktail', emoji: '🍹', label: 'Cocktail' },
  { key: 'whiskey', emoji: '🥃', label: 'Whiskey' },
  
  // Condiments & Seasonings (2 emojis)
  { key: 'salt', emoji: '🧂', label: 'Salt' },
  { key: 'honey', emoji: '🍯', label: 'Honey' },
  
  // Kitchen Items (1 emoji)
  { key: 'bowl', emoji: '🥣', label: 'Bowl' },
  
  // Payment & Cards (3 emojis)
  { key: 'credit_card', emoji: '💳', label: 'Credit Card' },
  { key: 'gift_card', emoji: '🎁', label: 'Gift Card' },
  { key: 'receipt', emoji: '🧾', label: 'Receipt' }
];

// Emoji Selector Component
const EmojiSelector: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}> = ({ visible, onClose, onSelect, selectedEmoji }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      paddingVertical: 8,
      gap: 8,
    },
    emojiButton: {
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedEmoji: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}20`,
    },
    emojiText: {
      fontSize: 32,
      textAlign: 'center',
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Select Category Icon</Text>
          <ScrollView showsVerticalScrollIndicator={true}>
            <View style={styles.emojiGrid}>
              {CATEGORY_EMOJIS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === item.key && styles.selectedEmoji,
                  ]}
                  onPress={() => onSelect(item.key)}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { categories, createCategory, updateCategory, deleteCategory, refreshCategories } = useDatabase();
  const router = useRouter();
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('apple');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshCategories();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    inputContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    input: {
      fontSize: 16,
      color: theme.textColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingVertical: 8,
      marginBottom: 16,
    },
    iconSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconText: {
      color: theme.textColor,
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    categoryList: {
      flex: 1,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryName: {
      flex: 1,
      fontSize: 16,
      color: theme.textColor,
    },
    actionButton: {
      padding: 8,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 50,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    addButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 8,
      width: 40,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handleSave = async () => {
    try {
      setIsLoading(true);
      if (!newName.trim()) {
        Alert.alert('Error', 'Please enter a category name');
        return;
      }

      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: newName.trim(),
          icon: selectedIcon,
        });
      } else {
        await createCategory({
          name: newName.trim(),
          icon: selectedIcon,
        });
      }

      setNewName('');
      setSelectedIcon('apple');
      setEditingCategory(null);
      await refreshCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setSelectedIcon(category.icon);
  };

  const handleDelete = async (category: Category) => {
    if (!category.id) return;

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteCategory(category.id!);
              await refreshCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.textColor }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setEditingCategory(null)}
        >
          <FontAwesome name="plus" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
          />
          
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconSelector(true)}
          >
            <View style={styles.iconPreview}>
              <CategoryIcon iconName={selectedIcon} size={20} />
            </View>
            <Text style={styles.iconText}>Select Icon</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.categoryList}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <CategoryIcon iconName={category.icon} size={20} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(category)}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 20, color: theme.primaryColor }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(category)}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 20, color: theme.dangerColor }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <EmojiSelector
        visible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(icon) => {
          setSelectedIcon(icon);
          setShowIconSelector(false);
        }}
        selectedEmoji={selectedIcon}
      />

      <BottomNav />
    </View>
  );
} 