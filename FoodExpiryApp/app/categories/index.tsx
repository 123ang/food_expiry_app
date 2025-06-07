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
import { CATEGORY_EMOJIS, EmojiItem } from '../../constants/emojis';

// Emoji Selector Component
interface EmojiSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({ visible, onClose, onSelect, selectedEmoji }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

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
          <Text style={styles.title}>{t('selectIcon')}</Text>
          <ScrollView showsVerticalScrollIndicator={true}>
            <View style={styles.emojiGrid}>
              {CATEGORY_EMOJIS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === item.emoji && styles.selectedEmoji,
                  ]}
                  onPress={() => onSelect(item.emoji)}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { categories, createCategory, updateCategory, deleteCategory, refreshCategories } = useDatabase();
  const router = useRouter();
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('🍎');
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
        Alert.alert(t('alert.error'), t('alert.nameRequired'));
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
      setSelectedIcon('🍎');
      setEditingCategory(null);
      await refreshCategories();
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.saveFailed'));
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
      t('categories.deleteCategory'),
      `${t('categories.deleteConfirm')} "${category.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteCategory(category.id!);
              await refreshCategories();
            } catch (error) {
              Alert.alert(t('alert.error'), t('categories.errorDelete'));
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
        <Text style={styles.headerTitle}>{t('categories.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('categoryName')}
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
            <Text style={styles.iconText}>{t('selectIcon')}</Text>
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
                {editingCategory ? t('categories.updateCategory') : t('categories.addCategory')}
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