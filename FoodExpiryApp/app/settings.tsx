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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../components/BottomNav';
import { Category, Location } from '../database/models';

type IconName = keyof typeof FontAwesome.glyphMap;

type SettingItem = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  type: 'switch' | 'language' | 'categories' | 'locations' | 'link';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
  title: string;
  initialName?: string;
  initialIcon?: string;
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  languageText: {
    fontSize: 16,
    color: theme.textColor,
  },
  languageSelected: {
    color: theme.primaryColor,
  },
});

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  initialName = '',
  initialIcon = '',
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon);
  const styles = createStyles(theme);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    onSave(name.trim(), icon.trim() || 'circle');
    setName('');
    setIcon('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          
          <TextInput
            style={[styles.input, { 
              color: theme.textColor,
              borderColor: theme.borderColor,
              backgroundColor: theme.backgroundColor
            }]}
            placeholder="Icon (FontAwesome name)"
            placeholderTextColor={theme.textSecondary}
            value={icon}
            onChangeText={setIcon}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.dangerColor }]}
              onPress={onClose}
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

  const settings: SettingItem[] = [
    {
      id: 'language',
      icon: 'language',
      title: t('language'),
      description: t('languageDescription'),
      type: 'language',
    },
    {
      id: 'theme',
      icon: 'moon-o',
      title: t('darkMode'),
      description: t('darkModeDescription'),
      type: 'switch',
      value: isDark,
      onValueChange: toggleTheme,
    },
    {
      id: 'categories',
      icon: 'tags',
      title: t('categories'),
      description: t('categoriesDescription'),
      type: 'categories',
    },
    {
      id: 'locations',
      icon: 'map-marker',
      title: t('storageLocations'),
      description: t('storageLocationsDescription'),
      type: 'locations',
    },
    {
      id: 'notifications',
      icon: 'bell',
      title: t('notifications'),
      description: t('notificationsDescription'),
      type: 'link',
    },
    {
      id: 'backup',
      icon: 'cloud',
      title: t('backupSync'),
      description: t('backupSyncDescription'),
      type: 'link',
    },
    {
      id: 'about',
      icon: 'info-circle',
      title: t('about'),
      description: t('aboutDescription'),
      type: 'link',
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

    const renderLanguageModal = () => (
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('language')}
            </Text>
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
                {t('english')}
              </Text>
              {language === 'en' && (
                <FontAwesome name="check" size={16} color={theme.primaryColor} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, { borderBottomWidth: 0 }]}
              onPress={() => {
                setLanguage('zh');
                setShowLanguageModal(false);
              }}
            >
              <Text style={[
                styles.languageText,
                language === 'zh' && styles.languageSelected
              ]}>
                {t('chinese')}
              </Text>
              {language === 'zh' && (
                <FontAwesome name="check" size={16} color={theme.primaryColor} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );

    const renderCategoriesList = () => (
      <View style={styles.listContent}>
        {categories.map((category) => (
          <View 
            key={category.id} 
            style={[styles.listItem, { borderBottomColor: theme.borderColor }]}
          >
            <FontAwesome 
              name={category.icon as IconName || 'circle'} 
              size={20} 
              color={theme.primaryColor} 
            />
            <Text style={[styles.listItemText, { color: theme.textColor }]}>
              {category.name}
            </Text>
            <View style={styles.listItemActions}>
              <TouchableOpacity onPress={() => {
                setEditItem(category);
                setShowCategoryModal(true);
              }}>
                <FontAwesome name="edit" size={20} color={theme.primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCategory(category.id)}>
                <FontAwesome name="trash" size={20} color={theme.dangerColor} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditItem(null);
            setShowCategoryModal(true);
          }}
        >
          <Text style={styles.addButtonText}>{t('addCategory')}</Text>
        </TouchableOpacity>
      </View>
    );

    const renderLocationsList = () => (
      <View style={styles.listContent}>
        {locations.map((location) => (
          <View 
            key={location.id} 
            style={[styles.listItem, { borderBottomColor: theme.borderColor }]}
          >
            <FontAwesome 
              name={location.icon as IconName || 'circle'} 
              size={20} 
              color={theme.primaryColor} 
            />
            <Text style={[styles.listItemText, { color: theme.textColor }]}>
              {location.name}
            </Text>
            <View style={styles.listItemActions}>
              <TouchableOpacity onPress={() => {
                setEditItem(location);
                setShowLocationModal(true);
              }}>
                <FontAwesome name="edit" size={20} color={theme.primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteLocation(location.id)}>
                <FontAwesome name="trash" size={20} color={theme.dangerColor} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditItem(null);
            setShowLocationModal(true);
          }}
        >
          <Text style={styles.addButtonText}>{t('addLocation')}</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <View key={item.id}>
        <TouchableOpacity
          style={[
            styles.settingItem,
            isLast && styles.settingItemLast,
          ]}
          onPress={() => {
            if (item.type === 'language') {
              setShowLanguageModal(true);
            }
          }}
        >
          <View style={styles.settingIcon}>
            <FontAwesome name={item.icon} size={16} color={theme.primaryColor} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
          {item.type === 'switch' ? (
            <Switch
              value={item.value}
              onValueChange={item.onValueChange}
              trackColor={{ false: '#767577', true: `${theme.primaryColor}50` }}
              thumbColor={item.value ? theme.primaryColor : '#f4f3f4'}
            />
          ) : item.type === 'language' && (
            <Text style={[styles.languageText, { color: theme.primaryColor }]}>
              {language === 'en' ? t('english') : t('chinese')}
            </Text>
          )}
        </TouchableOpacity>
        {item.type === 'categories' && renderCategoriesList()}
        {item.type === 'locations' && renderLocationsList()}
        {item.type === 'language' && renderLanguageModal()}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings')}</Text>
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
        />

        <BottomNav />
      </View>
    </>
  );
} 