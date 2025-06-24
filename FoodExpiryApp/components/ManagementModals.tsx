import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORY_EMOJIS, LOCATION_EMOJIS, EMOJI_CATEGORIES } from '../constants/emojis';
import { FontAwesome } from '@expo/vector-icons';
import type { Theme } from '../theme';
import Modal from 'react-native-modal';

type TFunction = (key: string) => string;

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

const createStyles = (theme: Theme) => StyleSheet.create({
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textColor,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: theme.textColor,
    backgroundColor: theme.cardBackground,
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: theme.cardBackground,
  },
  iconSelectorText: {
    color: theme.textColor,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: theme.secondaryColor,
  },
  saveButton: {
    backgroundColor: theme.primaryColor,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.textColor,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  isCategory,
  selectedEmoji,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['emojiCategory.food']));
  
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
      justifyContent: 'center',
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
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="fadeIn"
      animationOut="fadeOut"
      style={{ zIndex: 2000 }}
    >
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
                        onClose();
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
    </Modal>
  );
};

export const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  initialName = '',
  initialIcon = '',
  isCategory = true,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  
  // Check if the initial name is a translation key
  const isTranslationKey = initialName.startsWith('category.') || initialName.startsWith('locations.');
  const translatedInitialName = isTranslationKey ? t(initialName) : initialName;
  
  const [name, setName] = useState(translatedInitialName);
  const [icon, setIcon] = useState(initialIcon);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  
  useEffect(() => {
    if (visible) {
      const newTranslatedName = isTranslationKey ? t(initialName) : initialName;
      setName(newTranslatedName);
      setIcon(initialIcon);
      setHasBeenEdited(false);
    }
  }, [visible, initialName, initialIcon, t]);

  const handleNameChange = (text: string) => {
    setName(text);
    setHasBeenEdited(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(
        t('alert.error'),
        isCategory ? t('categories.nameRequired') : t('locations.nameRequired')
      );
      return;
    }
    
    // If the name has been edited, use the new name directly
    // If not edited and it's a translation key, keep using the key
    const nameToSave = hasBeenEdited ? name.trim() : initialName;
    
    onSave(nameToSave, icon);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setIcon('');
    setShowEmojiSelector(false);
    setHasBeenEdited(false);
    onClose();
  };

  const handleEmojiSelect = (emoji: string) => {
    setIcon(emoji);
    setShowEmojiSelector(false);
  };

  const openEmojiSelector = () => {
    setShowEmojiSelector(true);
  };

  return (
    <>
      <Modal
        isVisible={visible}
        onBackdropPress={handleClose}
        onBackButtonPress={handleClose}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={{ zIndex: 1000 }}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={handleNameChange}
            placeholder={isCategory ? t('categories.nameRequired') : t('locations.nameRequired')}
            placeholderTextColor={theme.textSecondary}
          />
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={openEmojiSelector}
          >
            <Text style={styles.iconSelectorText}>
              {icon ? icon : t('selectIcon')}
            </Text>
            <FontAwesome
              name="chevron-right"
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <EmojiSelector
        visible={showEmojiSelector}
        onClose={() => setShowEmojiSelector(false)}
        onSelect={handleEmojiSelect}
        isCategory={isCategory}
        selectedEmoji={icon}
      />
    </>
  );
}; 