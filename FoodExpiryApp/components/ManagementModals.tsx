import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORY_EMOJIS, LOCATION_EMOJIS, EMOJI_CATEGORIES } from '../constants/emojis';

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
                        onPress={() => onSelect(item.emoji)}
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
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon || (isCategory ? '🍎' : '❄️'));
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const iconWasManuallySet = React.useRef(false);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '80%',
      padding: 20,
      backgroundColor: theme.cardBackground,
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
      color: theme.textColor,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      color: theme.textColor,
      borderColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
    },
    iconSelector: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
    },
    iconPreview: {
      width: 20,
      height: 20,
      borderRadius: 4,
      marginRight: 8,
    },
    iconText: {
      fontSize: 16,
      color: theme.textColor,
      flex: 1,
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
  });

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      if (initialIcon) {
        setIcon(initialIcon);
        iconWasManuallySet.current = false;
      } else if (!initialName && !iconWasManuallySet.current) {
        setIcon(isCategory ? '🍎' : '❄️');
      }
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
    iconWasManuallySet.current = false;
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('categoryName')}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
            
            <TouchableOpacity
              style={styles.iconSelector}
              onPress={() => setShowEmojiSelector(true)}
            >
              <View style={styles.iconPreview}>
                <Text style={{ fontSize: 24 }}>{icon}</Text>
              </View>
              <Text style={styles.iconText}>
                {t('selectIcon')} ({icon})
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>▶</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.dangerColor }]}
                onPress={handleClose}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>{t('save')}</Text>
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
          iconWasManuallySet.current = true;
          setShowEmojiSelector(false);
        }}
        isCategory={isCategory}
        selectedEmoji={icon}
      />
    </>
  );
}; 