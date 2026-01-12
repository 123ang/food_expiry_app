import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ImagePicker } from './ImagePicker';
import {
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  toggleShoppingItemDone,
  clearCompletedShoppingItems,
} from '../database/shoppingRepository';
import { ShoppingItem } from '../database/models';
import { FoodItemRepository } from '../database/repository';
import { getCurrentDate } from '../database/database';

interface ShoppingListProps {
  items: ShoppingItem[];
  onItemsChange: () => void;
}

interface ShoppingItemProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onImagePress?: () => void;
  onAddToFoodItems?: () => void;
}

const ShoppingItemComponent: React.FC<ShoppingItemProps> = ({ 
  item, 
  onToggle, 
  onDelete, 
  onEdit, 
  onImagePress, 
  onAddToFoodItems 
}) => {
  const { theme } = useTheme();
  const colors = theme;

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        <Ionicons
          name={item.done ? 'checkbox' : 'square-outline'}
          size={24}
          color={colors.primaryColor}
        />
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text style={[styles.itemText, item.done && styles.itemTextDone, { color: colors.textColor }]}>
          {item.name}
        </Text>
      </View>

      <View style={styles.itemActions}>
        {item.image_uri && (
          <TouchableOpacity onPress={onImagePress} style={{ marginRight: 8 }}>
            {item.image_uri.startsWith('emoji:') ? (
              <View style={[styles.itemThumbnail, { justifyContent: 'center', alignItems: 'center', backgroundColor: `${colors.primaryColor}10` }]}>
                <Text style={{ fontSize: 24 }}>{item.image_uri.replace('emoji:', '')}</Text>
              </View>
            ) : (
              <Image source={{ uri: item.image_uri }} style={styles.itemThumbnail} />
            )}
          </TouchableOpacity>
        )}
        {item.done && (
          <TouchableOpacity onPress={onAddToFoodItems} style={styles.actionButton}>
            <Ionicons name="add-circle" size={20} color={colors.primaryColor} />
          </TouchableOpacity>
        )}
        {!item.done && (
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={colors.textColor} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color={colors.dangerColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onItemsChange }) => {
  const { theme } = useTheme();
  const colors = theme;
  const { t } = useLanguage();
  const router = useRouter();
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    try {
      await addShoppingItem({
        name: newItemName.trim(),
        image_uri: newItemImage,
        done: false,
      });

      setNewItemName('');
      setNewItemImage(null);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', `Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    try {
      await toggleShoppingItemDone(item.id);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    try {
      await deleteShoppingItem(item.id);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemImage(item.image_uri || null);
    setShowEditModal(true);
  };

  const handleAddToFoodItems = (item: ShoppingItem) => {
    router.push({
      pathname: '/add',
      params: {
        prefilledName: item.name,
        prefilledImage: item.image_uri || '',
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !newItemName.trim()) return;

    try {
      await updateShoppingItem({
        ...editingItem,
        name: newItemName.trim(),
        image_uri: newItemImage,
      });

      setShowEditModal(false);
      setEditingItem(null);
      setNewItemName('');
      setNewItemImage(null);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompletedShoppingItems();
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear completed items');
    }
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <ShoppingItemComponent
      item={item}
      onToggle={() => handleToggleItem(item)}
      onDelete={() => handleDeleteItem(item)}
      onEdit={() => handleEditItem(item)}
      onImagePress={item.image_uri ? () => setSelectedImage(item.image_uri!) : undefined}
      onAddToFoodItems={item.done ? () => handleAddToFoodItems(item) : undefined}
    />
  );

  return (
    <View style={styles.container}>
      {/* Add Item Form */}
      <View style={[styles.addItemContainer, { borderBottomColor: colors.borderColor }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.borderColor, color: colors.textColor, backgroundColor: colors.cardBackground }]}
          placeholder={t('Add item')}
          placeholderTextColor={colors.textSecondary}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        
        <View style={{ marginHorizontal: 12 }}>
          <ImagePicker 
            imageUri={newItemImage} 
            onImageSelected={setNewItemImage} 
            theme={theme}
            showThumbnail={true}
            thumbnailSize={40}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primaryColor }]} 
          onPress={handleAddItem}
        >
          <Ionicons name="add" size={24} color={colors.backgroundColor} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        style={styles.list}
      />

      {/* Clear Completed Button */}
      <TouchableOpacity 
        style={[styles.clearButton, { backgroundColor: colors.cardBackground }]} 
        onPress={handleClearCompleted}
      >
        <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>{t('Clear Completed')}</Text>
      </TouchableOpacity>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.borderColor, color: colors.textColor }]}
              placeholder={t('Item name')}
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            
            <View style={{ marginVertical: 10 }}>
              <ImagePicker 
                imageUri={newItemImage} 
                onImageSelected={setNewItemImage} 
                theme={theme}
                showThumbnail={true}
                thumbnailSize={60}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primaryColor }]}
              onPress={handleSaveEdit}
            >
              <Text style={[styles.modalButtonText, { color: colors.backgroundColor }]}>
                {t('Save')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: colors.borderColor }]}
              onPress={() => {
                setShowEditModal(false);
                setEditingItem(null);
                setNewItemName('');
                setNewItemImage(null);
              }}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText, { color: colors.textSecondary }]}>
                {t('Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.imagePreviewContainer}
          onPress={() => setSelectedImage(null)}
        >
          {selectedImage && (
            selectedImage.startsWith('emoji:') ? (
              <View style={[styles.imagePreview, { justifyContent: 'center', alignItems: 'center', backgroundColor: `${colors.primaryColor}10` }]}>
                <Text style={{ fontSize: 120 }}>{selectedImage.replace('emoji:', '')}</Text>
              </View>
            ) : (
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            )
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addItemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkbox: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  itemThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  clearButton: {
    padding: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#757575',
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
}); 