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

// Category emojis for selection
const CATEGORY_EMOJIS = [
  { key: 'apple', emoji: '🍎', label: 'Apple' },
  { key: 'dairy', emoji: '🥛', label: 'Dairy' },
  { key: 'fruits', emoji: '🍇', label: 'Fruits' },
  { key: 'vegetables', emoji: '🥕', label: 'Vegetables' },
  { key: 'meat', emoji: '🥩', label: 'Meat' },
  { key: 'bread', emoji: '🍞', label: 'Bread' },
  { key: 'beverages', emoji: '🥤', label: 'Beverages' },
  { key: 'snacks', emoji: '🍿', label: 'Snacks' },
  { key: 'frozen', emoji: '🧊', label: 'Frozen' },
  { key: 'canned', emoji: '🥫', label: 'Canned' },
  { key: 'seafood', emoji: '🐟', label: 'Seafood' },
  { key: 'spices', emoji: '🌶️', label: 'Spices' },
  { key: 'dessert', emoji: '🍰', label: 'Dessert' },
  { key: 'grains', emoji: '🌾', label: 'Grains' },
];

// Location emojis for selection
const LOCATION_EMOJIS = [
  { key: 'fridge', emoji: '❄️', label: 'Fridge' },
  { key: 'freezer', emoji: '🧊', label: 'Freezer' },
  { key: 'pantry', emoji: '🏠', label: 'Pantry' },
  { key: 'cabinet', emoji: '🗄️', label: 'Cabinet' },
  { key: 'counter', emoji: '🍽️', label: 'Counter' },
  { key: 'basement', emoji: '⬇️', label: 'Basement' },
  { key: 'garage', emoji: '🏢', label: 'Garage' },
  { key: 'kitchen', emoji: '🍳', label: 'Kitchen' },
  { key: 'cupboard', emoji: '🗃️', label: 'Cupboard' },
  { key: 'shelf', emoji: '📚', label: 'Shelf' },
  { key: 'storage', emoji: '📦', label: 'Storage' },
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
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    emojiItem: {
      width: '22%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
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
      fontSize: 28,
      marginBottom: 4,
      textAlign: 'center',
    },
    emojiName: {
      fontSize: 10,
      color: theme.textSecondary,
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
                  <Text style={styles.emojiName}>{item.label}</Text>
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
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { categories, locations, createCategory, updateCategory, deleteCategory, createLocation, updateLocation, deleteLocation } = useDatabase();
  const router = useRouter();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | Location | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

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
      icon: 'moon-o',
      title: t('settings.darkMode'),
      description: t('settings.darkModeDescription'),
      type: 'switch',
      value: isDark,
      onValueChange: toggleTheme,
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
        {renderAboutModal()}
        <BottomNav />
      </View>
    </>
  );
} 