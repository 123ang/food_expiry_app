import React, { useState } from 'react';
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
  addWishItem,
  updateWishItem,
  deleteWishItem,
  toggleWishItemDone,
  clearCompletedWishItems,
} from '../database/shoppingRepository';
import { WishItem } from '../database/models';

interface WishListProps {
  items: WishItem[];
  onItemsChange: () => void;
}

interface WishItemProps {
  item: WishItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onImagePress?: () => void;
  onAddToFoodItems?: () => void;
}

const WishItemComponent: React.FC<WishItemProps> = ({ 
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
    <View style={[styles.itemContainer, { paddingVertical: 20, minHeight: 100 }]}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        <Ionicons
          name={item.done ? 'checkbox' : 'square-outline'}
          size={24}
          color={colors.primaryColor}
        />
      </TouchableOpacity>
      
      <View style={{ flex: 1 }}>
        {/* Row 1: Name - Make height equal to input fields */}
        <View style={[styles.nameContainer, { height: 40, justifyContent: 'center' }]}>
          <Text style={[styles.itemText, item.done && styles.itemTextDone, { fontSize: 17, color: colors.textColor }]}> 
            {item.name}
          </Text>
        </View>
        
        {/* Row 2: Price and Hearts - Make height equal to input fields */}
        <View style={[styles.priceRatingContainer, { height: 40, alignItems: 'center' }]}>
          {item.price && (
            <View style={[styles.priceContainer, { height: 40, justifyContent: 'center' }]}>
              <Text style={[styles.itemPrice, { fontSize: 15, color: colors.textSecondary }]}>${item.price}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Ionicons
                key={idx}
                name={idx < (item.rating || 0) ? 'heart' : 'heart-outline'}
                size={18}
                color={colors.primaryColor}
                style={{ marginHorizontal: 0.5 }}
              />
            ))}
          </View>
        </View>
        
        {/* Row 3: Quantity - Make height equal to input fields */}
        
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
        {!item.done && (
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={colors.textColor} />
          </TouchableOpacity>
        )}
        {item.done && (
          <TouchableOpacity onPress={onAddToFoodItems} style={styles.actionButton}>
            <Ionicons name="add-circle" size={20} color={colors.primaryColor} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color={colors.dangerColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const WishList: React.FC<WishListProps> = ({ items, onItemsChange }) => {
  const { theme } = useTheme();
  const colors = theme;
  const { t } = useLanguage();
  const router = useRouter();
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [newItemRating, setNewItemRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    try {
      await addWishItem({
        name: newItemName.trim(),
        price: newItemPrice.trim() || undefined,
        image_uri: newItemImage,
        done: false,
        rating: newItemRating,
      });

      setNewItemName('');
      setNewItemPrice('');
      setNewItemImage(null);
      setNewItemRating(0);
      onItemsChange();
    } catch (error) {
      console.error('Error adding wish item:', error);
      Alert.alert('Error', `Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleItem = async (item: WishItem) => {
    try {
      await toggleWishItemDone(item.id);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = async (item: WishItem) => {
    try {
      await deleteWishItem(item.id);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const handleEditItem = (item: WishItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemPrice(item.price || '');
    setNewItemImage(item.image_uri || null);
    setNewItemRating(item.rating || 0);
    setShowEditModal(true);
  };

  const handleAddToFoodItems = (item: WishItem) => {
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
      await updateWishItem({
        ...editingItem,
        name: newItemName.trim(),
        price: newItemPrice.trim() || undefined,
        image_uri: newItemImage,
        rating: newItemRating,
      });

      setShowEditModal(false);
      setEditingItem(null);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemImage(null);
      setNewItemRating(0);
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompletedWishItems();
      onItemsChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear completed items');
    }
  };

  const renderItem = ({ item }: { item: WishItem }) => {
    console.log('Wish item:', item);
    return (
      <WishItemComponent
        item={item}
        onToggle={() => handleToggleItem(item)}
        onDelete={() => handleDeleteItem(item)}
        onEdit={() => handleEditItem(item)}
        onImagePress={item.image_uri ? () => setSelectedImage(item.image_uri!) : undefined}
        onAddToFoodItems={item.done ? () => handleAddToFoodItems(item) : undefined}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Add Item Form - Multi-row layout */}
      <View style={[styles.addItemContainer, { borderBottomColor: colors.borderColor }]}>
        <View style={{ width: '100%' }}>
          {/* Row 1: Name input */}
          <TextInput
            style={[styles.input, { borderColor: colors.borderColor, color: colors.textColor, backgroundColor: colors.cardBackground, marginBottom: 8, marginRight: 0 }]}
            placeholder={t('Add item')}
            placeholderTextColor={colors.textSecondary}
            value={newItemName}
            onChangeText={setNewItemName}
          />
          
          {/* Row 2: Price and Hearts */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              style={[styles.priceInput, { borderColor: colors.borderColor, color: colors.textColor, backgroundColor: colors.cardBackground, flex: 1, marginRight: 8 }]}
              placeholder={t('Price')}
              placeholderTextColor={colors.textSecondary}
              value={newItemPrice}
              onChangeText={setNewItemPrice}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <TouchableOpacity key={idx} onPress={() => setNewItemRating(idx + 1)}>
                  <Ionicons
                    name={idx < newItemRating ? 'heart' : 'heart-outline'}
                    size={24}
                    color={colors.primaryColor}
                    style={{ marginHorizontal: 1 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Row 3: Quantity, Image, and Add button */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        </View>
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
            {/* Row 1: Name */}
            <TextInput
              style={[styles.modalInput, { borderColor: colors.borderColor, color: colors.textColor }]}
              placeholder={t('Item name')}
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            
            {/* Row 2: Price and Hearts */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.borderColor, color: colors.textColor, flex: 1 }]}
                placeholder={t('Price')}
                placeholderTextColor={colors.textSecondary}
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                keyboardType="numeric"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setNewItemRating(idx + 1)}>
                    <Ionicons
                      name={idx < newItemRating ? 'heart' : 'heart-outline'}
                      size={24}
                      color={colors.primaryColor}
                      style={{ marginHorizontal: 1 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Row 3: Quantity */}
            <TextInput
              style={[styles.modalInput, { borderColor: colors.borderColor, color: colors.textColor }]}
              placeholder={t('Quantity')}
              placeholderTextColor={colors.textSecondary}
              value={''} // Removed quantity input
              onChangeText={() => {}} // Removed quantity input
              keyboardType="numeric"
            />
            
            {/* Image picker */}
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
                setNewItemPrice('');
                setNewItemImage(null);
                setNewItemRating(0);
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
    padding: 16,
    borderBottomWidth: 1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    textAlign: 'center',
  },
  priceInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
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
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 8,
  },
  nameContainer: {
    marginBottom: 4,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  priceContainer: {
    marginRight: 12,
  },
  quantityContainer: {
    // No margin bottom since it's the last element
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  itemPrice: {
    fontSize: 14,
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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