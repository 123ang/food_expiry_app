import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Image,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingItem, WishItem } from '../database/models';
import {
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  toggleShoppingItemDone,
  clearCompletedShoppingItems,
  addWishItem,
  updateWishItem,
  deleteWishItem,
  getWishItems,
  toggleWishItemDone,
  clearCompletedWishItems,
} from '../database/shoppingRepository';

type Tab = 'shopping' | 'wish';

interface ListItemProps {
  item: ShoppingItem | WishItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onImagePress?: () => void;
}

const ListItem: React.FC<ListItemProps> = ({ item, onToggle, onDelete, onEdit, onImagePress }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        <Ionicons
          name={item.done ? 'checkbox' : 'square-outline'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
          {item.name}
        </Text>
        {item.quantity && (
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
        )}
        {'price' in item && item.price && (
          <Text style={styles.itemPrice}>{item.price}</Text>
        )}
      </View>

      <View style={styles.itemActions}>
        {item.image_uri && (
          <TouchableOpacity onPress={onImagePress}>
            <Image source={{ uri: item.image_uri }} style={styles.itemThumbnail} />
          </TouchableOpacity>
        )}
        {!item.done && (
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ListScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('shopping');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [wishItems, setWishItems] = useState<WishItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | WishItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const [shopping, wish] = await Promise.all([
        getShoppingItems(),
        getWishItems(),
      ]);
      setShoppingItems(shopping);
      setWishItems(wish);
    } catch (error) {
      Alert.alert('Error', 'Failed to load items');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to use the camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      if (activeTab === 'shopping') {
        await addShoppingItem({
          name: newItemName.trim(),
          quantity: newItemQuantity ? parseInt(newItemQuantity, 10) : undefined,
          image_uri: newItemImage,
          done: false,
        });
      } else {
        await addWishItem({
          name: newItemName.trim(),
          quantity: newItemQuantity ? parseInt(newItemQuantity, 10) : undefined,
          price: newItemPrice.trim() || undefined,
          image_uri: newItemImage,
          done: false,
        });
      }

      setNewItemName('');
      setNewItemQuantity('');
      setNewItemPrice('');
      setNewItemImage(null);
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleToggleItem = async (item: ShoppingItem | WishItem) => {
    try {
      if ('price' in item) {
        await toggleWishItemDone(item.id);
      } else {
        await toggleShoppingItemDone(item.id);
      }
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = async (item: ShoppingItem | WishItem) => {
    try {
      if ('price' in item) {
        await deleteWishItem(item.id);
      } else {
        await deleteShoppingItem(item.id);
      }
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const handleEditItem = (item: ShoppingItem | WishItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity?.toString() || '');
    if ('price' in item) {
      setNewItemPrice(item.price || '');
    }
    setNewItemImage(item.image_uri || null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !newItemName.trim()) return;

    try {
      if ('price' in editingItem) {
        await updateWishItem({
          ...editingItem,
          name: newItemName.trim(),
          quantity: newItemQuantity ? parseInt(newItemQuantity, 10) : undefined,
          price: newItemPrice.trim() || undefined,
          image_uri: newItemImage,
        });
      } else {
        await updateShoppingItem({
          ...editingItem,
          name: newItemName.trim(),
          quantity: newItemQuantity ? parseInt(newItemQuantity, 10) : undefined,
          image_uri: newItemImage,
        });
      }

      setShowEditModal(false);
      setEditingItem(null);
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemPrice('');
      setNewItemImage(null);
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleClearCompleted = async () => {
    try {
      if (activeTab === 'shopping') {
        await clearCompletedShoppingItems();
      } else {
        await clearCompletedWishItems();
      }
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear completed items');
    }
  };

  const renderItem = ({ item }: { item: ShoppingItem | WishItem }) => (
    <ListItem
      item={item}
      onToggle={() => handleToggleItem(item)}
      onDelete={() => handleDeleteItem(item)}
      onEdit={() => handleEditItem(item)}
      onImagePress={() => item.image_uri && setSelectedImage(item.image_uri)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'shopping' && styles.activeTabButton]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>
            {t('Shopping List')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'wish' && styles.activeTabButton]}
          onPress={() => setActiveTab('wish')}
        >
          <Text style={[styles.tabText, activeTab === 'wish' && styles.activeTabText]}>
            {t('Wish List')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Form */}
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('Add item')}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          style={styles.quantityInput}
          placeholder={t('Qty')}
          value={newItemQuantity}
          onChangeText={setNewItemQuantity}
          keyboardType="numeric"
        />
        {activeTab === 'wish' && (
          <TextInput
            style={styles.priceInput}
            placeholder={t('Price')}
            value={newItemPrice}
            onChangeText={setNewItemPrice}
            keyboardType="numeric"
          />
        )}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => setShowImagePicker(true)}
        >
          <Ionicons
            name={newItemImage ? 'image' : 'image-outline'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'shopping' ? shoppingItems : wishItems}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        style={styles.list}
      />

      {/* Clear Completed Button */}
      <TouchableOpacity style={styles.clearButton} onPress={handleClearCompleted}>
        <Text style={styles.clearButtonText}>{t('Clear Completed')}</Text>
      </TouchableOpacity>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                const uri = await takePhoto();
                if (uri) setNewItemImage(uri);
                setShowImagePicker(false);
              }}
            >
              <Text style={styles.modalButtonText}>{t('Take Photo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                const uri = await pickImage();
                if (uri) setNewItemImage(uri);
                setShowImagePicker(false);
              }}
            >
              <Text style={styles.modalButtonText}>{t('Choose from Gallery')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                {t('Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.modalInput}
              placeholder={t('Item name')}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder={t('Quantity')}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
            />
            {editingItem && 'price' in editingItem && (
              <TextInput
                style={styles.modalInput}
                placeholder={t('Price')}
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                keyboardType="numeric"
              />
            )}
            <TouchableOpacity
              style={styles.modalImageButton}
              onPress={() => setShowImagePicker(true)}
            >
              <Text style={styles.modalButtonText}>
                {newItemImage ? t('Change Image') : t('Add Image')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveEdit}
            >
              <Text style={[styles.modalButtonText, { color: colors.background }]}>
                {t('Save')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowEditModal(false);
                setEditingItem(null);
                setNewItemName('');
                setNewItemQuantity('');
                setNewItemPrice('');
                setNewItemImage(null);
              }}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
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
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  addItemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    textAlign: 'center',
  },
  priceInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#2196F3',
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
    color: '#212121',
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
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
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#757575',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#212121',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#757575',
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  modalImageButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
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