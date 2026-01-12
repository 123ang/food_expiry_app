import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  toggleShoppingItemPurchase,
  clearPurchasedShoppingItems,
  ShoppingItem
} from '../services/postgresApiService';

interface ShoppingListProps {
  items: ShoppingItem[];
  groupId: string;
  onItemsChange: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, groupId, onItemsChange }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) {
      toast.error(t('lists.nameRequired') || 'Item name is required');
      return;
    }

    try {
      await addShoppingItem({
        group_id: groupId,
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        notes: newItemNotes.trim() || undefined,
        is_purchased: false,
      });

      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemNotes('');
      toast.success(t('lists.itemAdded') || 'Item added successfully');
      onItemsChange();
    } catch (error: any) {
      console.error('Error adding shopping item:', error);
      toast.error(error?.message || t('lists.addFailed') || 'Failed to add item');
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    try {
      await toggleShoppingItemPurchase(item.id!);
      toast.success(t('lists.itemUpdated') || 'Item updated');
      onItemsChange();
    } catch (error: any) {
      console.error('Error toggling item:', error);
      toast.error(error?.message || t('lists.updateFailed') || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    if (!window.confirm(t('lists.confirmDelete') || 'Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteShoppingItem(item.id!);
      toast.success(t('lists.itemDeleted') || 'Item deleted');
      onItemsChange();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error?.message || t('lists.deleteFailed') || 'Failed to delete item');
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity?.toString() || '1');
    setNewItemNotes(item.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem || !newItemName.trim()) {
      return;
    }

    try {
      await updateShoppingItem(editingItem.id!, {
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        notes: newItemNotes.trim() || undefined,
      });

      setShowEditModal(false);
      setEditingItem(null);
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemNotes('');
      toast.success(t('lists.itemUpdated') || 'Item updated');
      onItemsChange();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error?.message || t('lists.updateFailed') || 'Failed to update item');
    }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm(t('lists.confirmClearCompleted') || 'Are you sure you want to clear all purchased items?')) {
      return;
    }

    try {
      const deletedCount = await clearPurchasedShoppingItems(groupId);
      toast.success(t('lists.itemsCleared', { count: deletedCount }) || `${deletedCount} items cleared`);
      onItemsChange();
    } catch (error: any) {
      console.error('Error clearing completed items:', error);
      toast.error(error?.message || t('lists.clearFailed') || 'Failed to clear items');
    }
  };

  const handleAddToFoodItems = (item: ShoppingItem) => {
    navigate('/add-item', { 
      state: { 
        prefilledName: item.name,
      }
    });
  };

  const purchasedItems = items.filter(item => item.is_purchased);
  const unpurchasedItems = items.filter(item => !item.is_purchased);

  return (
    <div className="shopping-list" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Add Item Form */}
      <form onSubmit={handleAddItem} style={{ 
        padding: '1rem', 
        backgroundColor: theme.cardBackground, 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        border: `1px solid ${theme.borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '8px',
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              fontSize: '1rem',
            }}
            placeholder={t('lists.addItem') || 'Add item...'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            type="number"
            min="1"
            style={{
              width: '80px',
              padding: '0.75rem',
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '8px',
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              fontSize: '1rem',
            }}
            placeholder={t('lists.quantity') || 'Qty'}
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
          />
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
            }}
          >
            ➕ {t('common.add') || 'Add'}
          </button>
        </div>
        {newItemNotes && (
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
        )}
      </form>

      {/* Unpurchased Items */}
      {unpurchasedItems.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: theme.textColor, marginBottom: '1rem', fontSize: '1.25rem' }}>
            {t('lists.unpurchased') || 'To Buy'} ({unpurchasedItems.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {unpurchasedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: theme.cardBackground,
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  gap: '1rem',
                }}
              >
                <button
                  onClick={() => handleToggleItem(item)}
                  style={{
                    width: '24px',
                    height: '24px',
                    border: `2px solid ${theme.primaryColor}`,
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.is_purchased && <span style={{ color: theme.primaryColor }}>✓</span>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.textColor, fontSize: '1rem', fontWeight: 500 }}>
                    {item.name} {item.quantity && item.quantity > 1 ? `x${item.quantity}` : ''}
                  </div>
                  {item.notes && (
                    <div style={{ color: theme.textSecondary, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {item.notes}
                    </div>
                  )}
                </div>
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
            ))}
          </div>
        </div>
      )}

      {/* Purchased Items */}
      {purchasedItems.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: theme.textColor, fontSize: '1.25rem' }}>
              {t('lists.purchased') || 'Purchased'} ({purchasedItems.length})
            </h3>
            <button
              onClick={handleClearCompleted}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: theme.dangerColor,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {t('lists.clearCompleted') || 'Clear Completed'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: theme.cardBackground,
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  gap: '1rem',
                  opacity: 0.7,
                }}
              >
                <button
                  onClick={() => handleToggleItem(item)}
                  style={{
                    width: '24px',
                    height: '24px',
                    border: `2px solid ${theme.primaryColor}`,
                    borderRadius: '4px',
                    backgroundColor: theme.primaryColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: '#fff' }}>✓</span>
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: theme.textColor, 
                    fontSize: '1rem', 
                    textDecoration: 'line-through',
                    opacity: 0.7,
                  }}>
                    {item.name}
                  </div>
                  {item.quantity && item.quantity > 1 && (
                    <div style={{ color: theme.textSecondary, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {t('lists.quantity')}: {item.quantity}
                    </div>
                  )}
                </div>
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
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          border: `1px solid ${theme.borderColor}`,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h3 style={{ color: theme.textColor, marginBottom: '0.5rem' }}>
            {t('lists.noItems') || 'No shopping items yet'}
          </h3>
          <p style={{ color: theme.textSecondary }}>
            {t('lists.addFirstItem') || 'Add your first item to get started!'}
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
                required
              />
              <input
                type="number"
                min="1"
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: '8px',
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '1rem',
                }}
                placeholder={t('lists.quantity') || 'Quantity'}
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
              />
              <textarea
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: '8px',
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '80px',
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
                    setNewItemQuantity('1');
                    setNewItemNotes('');
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
    </div>
  );
};
