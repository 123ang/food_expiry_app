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
import { useResponsive } from '../hooks/useResponsive';
import { CATEGORY_EMOJIS, LOCATION_EMOJIS, EMOJI_CATEGORIES, EmojiItem, EmojiCategory } from '../constants/emojis';

type IconName = keyof typeof FontAwesome.glyphMap;



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
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['emojiCategory.food'])); // Food expanded by default
  
  const emojis = isCategory ? CATEGORY_EMOJIS : LOCATION_EMOJIS;
  const categories = isCategory ? EMOJI_CATEGORIES : [{ title: 'Locations', icon: '📍', items: LOCATION_EMOJIS }];
  
  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };
  
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
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      marginVertical: 4,
    },
    categoryIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      flex: 1,
    },
    expandIcon: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 8,
    },
    emojiItem: {
      width: 60,
      height: 60,
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
      fontSize: 28,
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
            {categories.map((category) => (
              <View key={category.title}>
                <TouchableOpacity 
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.title)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryTitle}>{t(category.title)}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedCategories.has(category.title) ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                
                {expandedCategories.has(category.title) && (
                  <View style={styles.emojiGrid}>
                    {category.items.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.emojiItem,
                          selectedEmoji === item.emoji && styles.emojiItemSelected
                        ]}
                        onPress={() => {
                          onSelect(item.emoji);
                        }}
                      >
                        <Text style={styles.emojiIcon}>{item.emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
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
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center' as any,
      height: '100vh' as any,
    }),
  } as any,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Space for bottom navigation
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
    display: 'flex',
    flexDirection: 'column',
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
} as any);

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
  const [icon, setIcon] = useState(initialIcon || (isCategory ? '🍎' : '❄️'));
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const iconWasManuallySet = React.useRef(false);
  const styles = createStyles(theme);

  // Reset state when modal opens/closes or when initial values change
  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      // Only set icon when modal first opens, not on subsequent renders
      if (initialIcon) {
        setIcon(initialIcon);
        iconWasManuallySet.current = false; // Reset flag for editing existing items
      } else if (!initialName && !iconWasManuallySet.current) {
        // Creating new item - only set default if icon hasn't been manually set
        setIcon(isCategory ? '🍎' : '❄️');
      }
      // If editing existing item (has initialName) but no initialIcon, keep current icon
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
    iconWasManuallySet.current = false; // Reset flag for next use
    // Don't reset icon here - let the useEffect handle icon state properly
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
                <Text style={{ fontSize: 24 }}>{icon}</Text>
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
          console.log('Selected emoji:', selectedIcon); // Debug log
          setIcon(selectedIcon);
          iconWasManuallySet.current = true; // Mark as manually set
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
  const { categories, locations, createCategory, updateCategory, deleteCategory, createLocation, updateLocation, deleteLocation, resetDatabase, deleteAllExpired } = useDatabase();
  const responsive = useResponsive();
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
      case 'darkBrown':
        return t('settings.themeDarkBrown') || 'Dark Brown Theme';
      case 'black':
        return t('settings.themeBlack') || 'Black Theme';
      case 'blue':
        return t('settings.themeBlue') || 'Blue Theme';
      case 'green':
        return t('settings.themeGreen') || 'Green Theme';
      case 'softPink':
        return t('settings.themeSoftPink') || 'Soft Pink Theme';
      case 'brightPink':
        return t('settings.themeBrightPink') || 'Bright Pink Theme';
      case 'naturalGreen':
        return t('settings.themeNaturalGreen') || 'Natural Green Theme';
      case 'mintRed':
        return t('settings.themeMintRed') || 'Mint-Red Theme';
      case 'darkGold':
        return t('settings.themeDarkGold') || 'Dark Gold Theme';
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
      id: 'clearExpired',
      icon: 'trash',
      title: t('settings.clearExpiredItems'),
      description: t('settings.clearExpiredItemsDescription'),
      type: 'navigation',
      onPress: () => {
        handleClearExpired();
      },
    },
    {
      id: 'clearUsed',
      icon: 'check-circle',
      title: t('settings.clearUsedItems'),
      description: t('settings.clearUsedItemsDescription'),
      type: 'navigation',
      onPress: () => {
        handleClearUsedItems();
      },
    },
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

  const handleClearExpired = async () => {
    Alert.alert(
      t('settings.clearExpiredConfirmTitle'),
      t('settings.clearExpiredConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.clearExpiredButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await deleteAllExpired();
              const plural = deletedCount === 1 ? '' : 's';
              Alert.alert(
                t('common.success'), 
                t('settings.clearExpiredSuccess').replace('{count}', deletedCount.toString()).replace('{plural}', plural)
              );
            } catch (error) {
              Alert.alert(
                t('common.error'), 
                t('settings.clearExpiredError')
              );
            }
          }
        }
      ]
    );
  };

  const handleClearUsedItems = async () => {
    // Navigate to a selection screen where users can select items to mark as used/removed
    router.push('/clear-items');
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
          style={[styles.languageModal, { maxHeight: '80%', flex: 0 }]}
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
          
          <ScrollView 
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
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
                <View style={[styles.themeColorBox, { backgroundColor: '#F8F9FA', borderColor: '#CED4DA', borderWidth: 1 }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#2E7D32' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#FFFFFF', borderColor: '#CED4DA', borderWidth: 1 }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'original' && styles.languageSelected
                ]}>
                  {t('settings.themeOriginal') || 'Original'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeOriginalDesc') || 'Improved contrast white theme with better visibility'}
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

          {/* Dark Brown Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('darkBrown');
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
                  currentThemeType === 'darkBrown' && styles.languageSelected
                ]}>
                  {t('settings.themeDarkBrown') || 'Dark Brown'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeDarkBrownDesc') || 'Dark warm brown with green accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'darkBrown' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Black Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('black');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#000000' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#4CAF50' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#1A1A1A' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'black' && styles.languageSelected
                ]}>
                  {t('settings.themeBlack') || 'Black'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeBlackDesc') || 'Pure black background with high contrast'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'black' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Blue Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setTheme('blue');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#c1d9e3' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#5b88a8' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#edf4f7' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'blue' && styles.languageSelected
                ]}>
                  {t('settings.themeBlue') || 'Blue'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeBlueDesc') || 'Cool blue tones with light backgrounds'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'blue' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Green Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('green');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#dbe1c0' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#3d6a28' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#fafaf0' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'green' && styles.languageSelected
                ]}>
                  {t('settings.themeGreen') || 'Green'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeGreenDesc') || 'Natural earth tones with green accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'green' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Soft Pink Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('softPink');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#fce7dd' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#a37d6c' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#f5d3d3' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'softPink' && styles.languageSelected
                ]}>
                  {t('settings.themeSoftPink') || 'Soft Pink'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeSoftPinkDesc') || 'Warm and cozy pink tones'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'softPink' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Bright Pink Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('brightPink');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#fdd0d4' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#ad5b62' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#ffe5e5' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'brightPink' && styles.languageSelected
                ]}>
                  {t('settings.themeBrightPink') || 'Bright Pink'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeBrightPinkDesc') || 'Vibrant and energetic pink theme'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'brightPink' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Natural Green Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('naturalGreen');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#dae4b6' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#3164a3' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#f9f4da' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'naturalGreen' && styles.languageSelected
                ]}>
                  {t('settings.themeNaturalGreen') || 'Natural Green'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeNaturalGreenDesc') || 'Fresh and natural green tones'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'naturalGreen' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Mint-Red Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('mintRed');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#d8f2c9' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#ef5f5f' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#8cd1b8' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'mintRed' && styles.languageSelected
                ]}>
                  {t('settings.themeMintRed') || 'Mint-Red'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeMintRedDesc') || 'Fresh mint with vibrant red accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'mintRed' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Dark Gold Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setTheme('darkGold');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#2c2c2c' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#b6862e' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#494949' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'darkGold' && styles.languageSelected
                ]}>
                  {t('settings.themeDarkGold') || 'Dark Gold'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeDarkGoldDesc') || 'Elegant dark theme with gold accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'darkGold' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          
          </ScrollView>
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