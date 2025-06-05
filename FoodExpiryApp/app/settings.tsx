import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../components/BottomNav';
import { Category, Location } from '../database/models';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

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

// Location emojis for selection - All 9 location emojis
const LOCATION_EMOJIS = [
  { key: 'freezer', emoji: '🧊', label: 'Freezer' },
  { key: 'fridge', emoji: '❄️', label: 'Fridge' },
  { key: 'cabinet', emoji: '📦', label: 'Cabinet' },
  { key: 'lunch_box', emoji: '🍱', label: 'Lunch Box' },
  { key: 'takeout_container', emoji: '🥡', label: 'Takeout Container' },
  { key: 'pantry', emoji: '🏠', label: 'Pantry' },
  { key: 'dining_area', emoji: '🍽️', label: 'Dining Area' },
  { key: 'storage_box', emoji: '📦', label: 'Storage Box' },
  { key: 'shopping_cart', emoji: '🛒', label: 'Shopping Cart' }
];

type SettingItem = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  type: 'switch' | 'language' | 'navigation';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
};

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
  title: string;
  initialName?: string;
  initialIcon?: string;
  isCategory?: boolean;
};

type EmojiSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  isCategory: boolean;
  selectedEmoji?: string;
};

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  isCategory,
  selectedEmoji,
}) => {
  const { theme } = useTheme();
  const emojis = isCategory ? CATEGORY_EMOJIS : LOCATION_EMOJIS;
  
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
    scrollContainer: {
      maxHeight: 400,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      paddingVertical: 8,
      gap: 8,
    },
    emojiItem: {
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiItemSelected: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}20`,
    },
    emojiIcon: {
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
          <Text style={styles.title}>
            Select {isCategory ? 'Category' : 'Location'} Icon ({emojis.length} options)
          </Text>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            <View style={styles.emojiGrid}>
              {emojis.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.emojiItem,
                    selectedEmoji === item.key && styles.emojiItemSelected
                  ]}
                  onPress={() => {
                    onSelect(item.key);
                  }}
                >
                  <Text style={styles.emojiIcon}>{item.emoji}</Text>
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      height: '100vh',
    }),
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${theme.primaryColor}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textColor,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  addButton: {
    backgroundColor: theme.primaryColor,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  languageModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  languageText: {
    fontSize: 16,
    color: theme.textColor,
  },
  languageSelected: {
    color: theme.primaryColor,
    fontWeight: '600',
  },
  expandableContent: {
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.cardBackground,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  managementItemIcon: {
    marginRight: 12,
  },
  managementItemText: {
    flex: 1,
    fontSize: 16,
    color: theme.textColor,
  },
  managementItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.backgroundColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.primaryColor,
    marginTop: 8,
    borderRadius: 8,
  },
  addNewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expandIcon: {
    marginLeft: 8,
  },
  customHeader: {
    backgroundColor: theme.cardBackground,
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textColor,
    textAlign: 'center',
  },
  // About modal styles
  aboutModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutContent: {
    flex: 1,
  },
  aboutSection: {
    marginBottom: 16,
  },
  aboutSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textColor,
    marginBottom: 8,
  },
  aboutSectionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  aboutFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aboutFeatureText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  aboutFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    paddingTop: 16,
    alignItems: 'center',
  },
  aboutFooterText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeAboutButton: {
    backgroundColor: theme.primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeAboutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iconSelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPreview: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themePreview: {
    flexDirection: 'row',
    width: 60,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  themeColorBox: {
    flex: 1,
    height: 20,
  },
  themeInfo: {
    flex: 1,
  },
  themeDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
});

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  initialName = '',
  initialIcon = '',
  isCategory = true,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon || (isCategory ? 'apple' : 'fridge'));
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const styles = createStyles(theme);

  // Reset state when modal opens/closes or when initial values change
  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setIcon(initialIcon || (isCategory ? 'apple' : 'fridge'));
    }
  }, [visible, initialName, initialIcon, isCategory]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), icon);
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setIcon(isCategory ? 'apple' : 'fridge');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>{title}</Text>
            
            <TextInput
              style={[styles.input, { 
                color: theme.textColor,
                borderColor: theme.borderColor,
                backgroundColor: theme.backgroundColor
              }]}
              placeholder="Name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
            
            <TouchableOpacity
              style={[styles.iconSelector, { 
                borderColor: theme.borderColor,
                backgroundColor: theme.backgroundColor
              }]}
              onPress={() => setShowEmojiSelector(true)}
            >
              <View style={styles.iconPreview}>
                {isCategory ? (
                  <CategoryIcon iconName={icon} size={24} />
                ) : (
                  <LocationIcon iconName={icon} size={24} />
                )}
              </View>
              <Text style={[styles.iconText, { color: theme.textColor }]}>
                Select Icon (Current: {icon})
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>▶</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.dangerColor }]}
                onPress={handleClose}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EmojiSelector
        visible={showEmojiSelector}
        onClose={() => setShowEmojiSelector(false)}
        onSelect={(selectedIcon) => {
          setIcon(selectedIcon);
          setShowEmojiSelector(false);
        }}
        isCategory={isCategory}
        selectedEmoji={icon}
      />
    </>
  );
};

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme, currentThemeType, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { categories, locations, createCategory, updateCategory, deleteCategory, createLocation, updateLocation, deleteLocation, resetDatabase } = useDatabase();
  const router = useRouter();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | Location | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const getThemeDisplayName = (themeType: string) => {
    switch (themeType) {
      case 'original':
        return t('settings.themeOriginal') || 'Original (White & Green)';
      case 'recycled':
        return t('settings.themeRecycled') || 'Recycled (Warm & Eco)';
      case 'dark':
        return t('settings.themeDark') || 'Dark Mode';
      default:
        return themeType;
    }
  };

  const settings: SettingItem[] = [
    {
      id: 'language',
      icon: 'language',
      title: t('settings.language'),
      description: t('settings.languageDescription'),
      type: 'language',
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'theme',
      icon: 'paint-brush',
      title: t('settings.theme') || 'Theme',
      description: `${t('settings.themeDescription') || 'Choose your preferred theme'}: ${getThemeDisplayName(currentThemeType)}`,
      type: 'navigation',
      onPress: () => setShowThemeModal(true),
    },
    {
      id: 'categories',
      icon: 'tags',
      title: t('settings.categories'),
      description: t('settings.categoriesDescription'),
      type: 'navigation',
      onPress: () => router.push('/categories'),
    },
    {
      id: 'locations',
      icon: 'map-marker',
      title: t('settings.storageLocations'),
      description: t('settings.storageLocationsDescription'),
      type: 'navigation',
      onPress: () => router.push('/locations'),
    },
    {
      id: 'notifications',
      icon: 'bell',
      title: t('settings.notifications'),
      description: t('settings.notificationsDescription'),
      type: 'navigation',
      onPress: () => router.push('/notifications'),
    },
    // {
    //   id: 'backup',
    //   icon: 'cloud',
    //   title: t('settings.backupSync'),
    //   description: t('settings.backupSyncDescription'),
    //   type: 'navigation',
    //   onPress: () => router.push('/backup'),
    // },
    {
      id: 'reset',
      icon: 'refresh',
      title: t('settings.resetDatabase') || 'Reset Database',
      description: t('settings.resetDatabaseDescription') || 'Reset to original 8 categories and 4 locations',
      type: 'navigation',
      onPress: () => {
        handleResetDatabase();
      },
    },
    {
      id: 'about',
      icon: 'info-circle',
      title: t('settings.about'),
      description: t('settings.aboutDescription'),
      type: 'navigation',
      onPress: () => setShowAboutModal(true),
    },
  ];

  const handleDeleteCategory = async (id: number) => {
    Alert.alert(
      t('deleteCategory'),
      t('deleteCategoryConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteCategory(id)
        }
      ]
    );
  };

  const handleDeleteLocation = async (id: number) => {
    Alert.alert(
      t('deleteLocation'),
      t('deleteLocationConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteLocation(id)
        }
      ]
    );
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      t('settings.resetDatabase') || 'Reset Database',
      t('settings.resetDatabaseConfirmation') || 'This will reset all categories and locations to the original 8 categories and 4 locations. Your food items will be preserved. This action cannot be undone.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('settings.reset') || 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert(
                t('common.success') || 'Success', 
                t('settings.resetDatabaseSuccess') || 'Database has been reset to original defaults!'
              );
            } catch (error) {
              Alert.alert(
                t('common.error') || 'Error', 
                t('settings.resetDatabaseError') || 'Failed to reset database. Please try again.'
              );
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(theme);

  const renderSettingItem = (item: SettingItem, index: number, total: number) => {
    const isLast = index === total - 1;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, isLast && styles.settingItemLast]}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
      >
        <View style={styles.settingIcon}>
          <FontAwesome name={item.icon} size={16} color={theme.primaryColor} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: theme.borderColor, true: theme.primaryColor }}
            thumbColor={theme.cardBackground}
          />
        )}
        {item.type === 'navigation' && (
          <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.languageModal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('settings.language')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <FontAwesome name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setLanguage('en');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'en' && styles.languageSelected
            ]}>
              {t('language.english')}
            </Text>
            {language === 'en' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setLanguage('zh');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'zh' && styles.languageSelected
            ]}>
              {t('language.chinese')}
            </Text>
            {language === 'zh' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setLanguage('ja');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'ja' && styles.languageSelected
            ]}>
              {t('language.japanese')}
            </Text>
            {language === 'ja' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderThemeModal = () => (
    <Modal
      visible={showThemeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowThemeModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowThemeModal(false)}
      >
        <TouchableOpacity 
          style={styles.languageModal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('settings.theme') || 'Choose Theme'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowThemeModal(false)}
            >
              <FontAwesome name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Original Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('original');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', borderWidth: 1 }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#2E7D32' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#000000' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'original' && styles.languageSelected
                ]}>
                  {t('settings.themeOriginal') || 'Original'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeOriginalDesc') || 'Clean white background with dark green accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'original' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Recycled Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('recycled');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#F3C88B' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#4CAF50' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#FDF0C0' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'recycled' && styles.languageSelected
                ]}>
                  {t('settings.themeRecycled') || 'Recycled'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeRecycledDesc') || 'Warm eco-friendly peach and cream tones'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'recycled' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Dark Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setTheme('dark');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#2C2417' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#4CAF50' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#3D3426' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'dark' && styles.languageSelected
                ]}>
                  {t('settings.themeDark') || 'Dark'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeDarkDesc') || 'Dark warm brown with green accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'dark' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderAboutModal = () => (
    <Modal
      visible={showAboutModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAboutModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAboutModal(false)}
      >
        <TouchableOpacity 
          style={styles.aboutModal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* App Header */}
          <View style={styles.aboutHeader}>
            <View style={styles.appIcon}>
              <Image 
                source={require('../assets/food_expiry_logo.png')} 
                style={{ width: 64, height: 64, borderRadius: 16 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>{t('about.appName')}</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appTagline}>"{t('about.appTagline')}"</Text>
          </View>

          {/* App Content */}
          <ScrollView 
            style={styles.aboutContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>{t('about.sectionAbout')}</Text>
              <Text style={styles.aboutSectionText}>
                {t('about.description')}
              </Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>{t('about.sectionFeatures')}</Text>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>📅</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureCalendar')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>🏷️</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureCategories')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>📊</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureDashboard')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>🔍</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureSearch')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>🌙</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureDarkMode')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>📱</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureCrossPlatform')}</Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>{t('about.sectionTechnology')}</Text>
              <Text style={styles.aboutSectionText}>
                {t('about.technologyDescription')}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.aboutFooter}>
            <Text style={styles.aboutFooterText}>
              {t('about.footerText')}
            </Text>
            <TouchableOpacity 
              style={styles.closeAboutButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.closeAboutButtonText}>{t('about.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <Text style={styles.headerTitle}>{t('header.settings')}</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            {settings.map((item, index) => renderSettingItem(item, index, settings.length))}
          </View>
        </ScrollView>

        <EditModal
          visible={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditItem(null);
          }}
          onSave={async (name, icon) => {
            if (editItem) {
              await updateCategory({ ...editItem as Category, name, icon });
            } else {
              await createCategory({ name, icon } as Category);
            }
          }}
          title={editItem ? t('editCategory') : t('addCategory')}
          initialName={editItem?.name}
          initialIcon={editItem?.icon}
          isCategory={true}
        />

        <EditModal
          visible={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setEditItem(null);
          }}
          onSave={async (name, icon) => {
            if (editItem) {
              await updateLocation({ ...editItem as Location, name, icon });
            } else {
              await createLocation({ name, icon } as Location);
            }
          }}
          title={editItem ? t('editLocation') : t('addLocation')}
          initialName={editItem?.name}
          initialIcon={editItem?.icon}
          isCategory={false}
        />

        {renderLanguageModal()}
        {renderThemeModal()}
        {renderAboutModal()}
        <BottomNav />
      </View>
    </>
  );
} 