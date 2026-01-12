import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { 
  addWishItem,
  updateWishItem,
  deleteWishItem,
  WishItem
} from '../services/postgresApiService';

interface WishListProps {
  items: WishItem[];
  groupId: string;
  onItemsChange: () => void;
}

export const WishList: React.FC<WishListProps> = ({ items, groupId, onItemsChange }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemRating, setNewItemRating] = useState(0);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, isEdit: boolean = false): Promise<string | null> => {
    if (!user) {
      toast.error('Please log in to upload images');
      return null;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, WebP, or GIF)');
      return null;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return null;
    }

    setIsUploadingImage(true);
    const uploadToast = toast.loading('📤 Uploading image...');

    try {
      const result = await apiClient.uploadImage(file);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data?.file?.url) {
        throw new Error('Invalid response from server');
      }

      toast.dismiss(uploadToast);
      toast.success('✅ Image uploaded successfully!');
      setIsUploadingImage(false);
      
      return result.data.file.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss(uploadToast);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setIsUploadingImage(false);
      return null;
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) {
      toast.error(t('lists.nameRequired') || 'Item name is required');
      return;
    }

    try {
      await addWishItem({
        group_id: groupId,
        name: newItemName.trim(),
        notes: newItemNotes.trim() || undefined,
        price: newItemPrice ? parseFloat(newItemPrice) : undefined,
        rating: newItemRating || 0,
        image_url: newItemImage || undefined,
      });

      setNewItemName('');
      setNewItemNotes('');
      setNewItemPrice('');
      setNewItemRating(0);
      setNewItemImage(null);
      toast.success(t('lists.itemAdded') || 'Item added successfully');
      onItemsChange();
    } catch (error: any) {
      console.error('Error adding wish item:', error);
      toast.error(error?.message || t('lists.addFailed') || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (item: WishItem) => {
    if (!window.confirm(t('lists.confirmDelete') || 'Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteWishItem(item.id!);
      toast.success(t('lists.itemDeleted') || 'Item deleted');
      onItemsChange();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error?.message || t('lists.deleteFailed') || 'Failed to delete item');
    }
  };

  const handleEditItem = (item: WishItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemNotes(item.notes || '');
    setNewItemPrice(item.price?.toString() || '');
    setNewItemRating(item.rating || 0);
    setNewItemImage(item.image_url || null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem || !newItemName.trim()) {
      return;
    }

    try {
      await updateWishItem(editingItem.id!, {
        name: newItemName.trim(),
        notes: newItemNotes.trim() || undefined,
        price: newItemPrice ? parseFloat(newItemPrice) : undefined,
        rating: newItemRating || 0,
        image_url: newItemImage || undefined,
      });

      setShowEditModal(false);
      setEditingItem(null);
      setNewItemName('');
      setNewItemNotes('');
      setNewItemPrice('');
      setNewItemRating(0);
      setNewItemImage(null);
      toast.success(t('lists.itemUpdated') || 'Item updated');
      onItemsChange();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error?.message || t('lists.updateFailed') || 'Failed to update item');
    }
  };

  const handleAddToFoodItems = (item: WishItem) => {
    navigate('/add-item', { 
      state: { 
        prefilledName: item.name,
      }
    });
  };

  return (
    <div className="wish-list" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Add Item Form - Matching Mobile App Design */}
      <form onSubmit={handleAddItem} style={{ 
        padding: '1rem', 
        backgroundColor: theme.cardBackground, 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        border: `1px solid ${theme.borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* Row 1: Name */}
        <input
          type="text"
          style={{
            padding: '0.75rem',
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '8px',
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
            fontSize: '1rem',
          }}
          placeholder={t('lists.addItem') || 'Add wish item...'}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        
        {/* Row 2: Price and Rating */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="number"
            step="0.01"
            min="0"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '8px',
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              fontSize: '1rem',
            }}
            placeholder={t('lists.price') || 'Price'}
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNewItemRating(idx + 1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  fontSize: '1.25rem',
                  color: idx < newItemRating ? theme.primaryColor : theme.textSecondary,
                }}
                title={`${idx + 1} ${t('lists.rating') || 'stars'}`}
              >
                {idx < newItemRating ? '❤️' : '🤍'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Row 3: Image and Notes */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <textarea
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.borderColor}`,
                borderRadius: '8px',
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
                fontSize: '0.875rem',
                resize: 'vertical',
                minHeight: '60px',
              }}
              placeholder={t('lists.notes') || 'Notes (optional)'}
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
            />
          </div>
          {newItemImage && (
            <img 
              src={newItemImage} 
              alt="Preview" 
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: `1px solid ${theme.borderColor}`,
              }}
            />
          )}
        </div>
        
        {/* Image Upload */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const imageUrl = await handleImageUpload(file);
                if (imageUrl) {
                  setNewItemImage(imageUrl);
                }
              }
            }}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.backgroundColor,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '8px',
              color: theme.textColor,
              cursor: isUploadingImage ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: isUploadingImage ? 0.6 : 1,
            }}
          >
            📷 {isUploadingImage ? 'Uploading...' : (t('lists.itemImage') || 'Add Image')}
          </button>
          {newItemImage && (
            <>
              <img 
                src={newItemImage} 
                alt="Preview" 
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                }}
              />
              <button
                type="button"
                onClick={() => setNewItemImage(null)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.dangerColor,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </>
          )}
        </div>
        
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.primaryColor,
            color: theme.backgroundColor,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            alignSelf: 'flex-start',
          }}
        >
          ➕ {t('common.add') || 'Add'}
        </button>
      </form>

      {/* Wish Items List */}
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '1rem',
                backgroundColor: theme.cardBackground,
                borderRadius: '8px',
                border: `1px solid ${theme.borderColor}`,
                gap: '1rem',
              }}
            >
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  onClick={() => setSelectedImage(item.image_url!)}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: `1px solid ${theme.borderColor}`,
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <div style={{ 
                  fontSize: '1.5rem', 
                  marginTop: '0.25rem',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme.primaryColor}10`,
                  borderRadius: '8px',
                }}>
                  ⭐
                </div>
              )}
              <div style={{ flex: 1 }}>
                {/* Row 1: Name */}
                <div style={{ color: theme.textColor, fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  {item.name}
                </div>
                
                {/* Row 2: Price and Rating */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  {item.price && (
                    <div style={{ color: theme.textColor, fontSize: '0.875rem', fontWeight: 600 }}>
                      ${item.price.toFixed(2)}
                    </div>
                  )}
                  {item.rating !== undefined && item.rating > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} style={{ color: idx < item.rating! ? theme.primaryColor : theme.textSecondary }}>
                          {idx < item.rating! ? '❤️' : '🤍'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Row 3: Notes */}
                {item.notes && (
                  <div style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                    {item.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleAddToFoodItems(item)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.primaryColor,
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                  }}
                  title={t('lists.addToFoodItems') || 'Add to Food Items'}
                >
                  ➕
                </button>
                <button
                  onClick={() => handleEditItem(item)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.textColor,
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                  }}
                  title={t('common.edit') || 'Edit'}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteItem(item)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.dangerColor,
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                  }}
                  title={t('common.delete') || 'Delete'}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          border: `1px solid ${theme.borderColor}`,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <h3 style={{ color: theme.textColor, marginBottom: '0.5rem' }}>
            {t('lists.noWishItems') || 'No wish items yet'}
          </h3>
          <p style={{ color: theme.textSecondary }}>
            {t('lists.addFirstWishItem') || 'Add your first wish item to get started!'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: theme.cardBackground,
            borderRadius: '16px 16px 0 0',
            padding: '1.5rem',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1rem' }}>
              {t('lists.editItem') || 'Edit Item'}
            </h2>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                required
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: '8px',
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '1rem',
                }}
                placeholder={t('lists.itemName') || 'Item name'}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              
              {/* Price and Rating Row */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    backgroundColor: theme.backgroundColor,
                    color: theme.textColor,
                    fontSize: '1rem',
                  }}
                  placeholder={t('lists.price') || 'Price'}
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewItemRating(idx + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        fontSize: '1.25rem',
                        color: idx < newItemRating ? theme.primaryColor : theme.textSecondary,
                      }}
                      title={`${idx + 1} ${t('lists.rating') || 'stars'}`}
                    >
                      {idx < newItemRating ? '❤️' : '🤍'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Image Upload */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  ref={editImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const imageUrl = await handleImageUpload(file, true);
                      if (imageUrl) {
                        setNewItemImage(imageUrl);
                      }
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => editImageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: theme.backgroundColor,
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    color: theme.textColor,
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: isUploadingImage ? 0.6 : 1,
                  }}
                >
                  📷 {isUploadingImage ? 'Uploading...' : (t('lists.itemImage') || 'Change Image')}
                </button>
                {newItemImage && (
                  <>
                    <img 
                      src={newItemImage} 
                      alt="Preview" 
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: `1px solid ${theme.borderColor}`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewItemImage(null)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: theme.dangerColor,
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
              
              <textarea
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: '8px',
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '60px',
                }}
                placeholder={t('lists.notes') || 'Notes (optional)'}
                value={newItemNotes}
                onChange={(e) => setNewItemNotes(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: theme.primaryColor,
                    color: theme.backgroundColor,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {t('common.save') || 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setNewItemName('');
                    setNewItemNotes('');
                    setNewItemPrice('');
                    setNewItemRating(0);
                    setNewItemImage(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    color: theme.textColor,
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem',
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.5rem',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
