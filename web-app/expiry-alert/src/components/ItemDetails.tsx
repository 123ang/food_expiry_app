import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FoodItemsService, CategoriesService, LocationsService, FoodItem, Category, Location } from '../services/firestoreService';

const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<FoodItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) {
      loadItemData();
    }
  }, [id, user]);

  const loadItemData = async () => {
    if (!id || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [itemData, categoriesData, locationsData] = await Promise.all([
        FoodItemsService.getItem(id),
        CategoriesService.getUserCategories(user.uid),
        LocationsService.getUserLocations(user.uid)
      ]);
      
      if (!itemData) {
        setError('Item not found');
        return;
      }
      
      setItem(itemData);
      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading item details:', error);
      setError('Failed to load item details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!item || !item.id) return;
    
    if (window.confirm(`${t('alert.deleteMessage')} "${item.name}"?`)) {
      try {
        await FoodItemsService.deleteItem(item.id);
        alert(`${t('alert.success')}: "${item.name}" ${t('action.delete')}`);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`${t('alert.deleteFailed')}: ${item.name}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (item: FoodItem) => {
    const days = item.daysUntilExpiry || 0;
    if (days === 0) return t('item.expirestoday');
    if (days === 1) return `1 ${t('item.dayLeft')}`;
    if (days > 0) return `${days} ${t('item.daysLeft')}`;
    if (days === -1) return `1 ${t('item.dayAgo')}`;
    return `${Math.abs(days)} ${t('item.daysAgo')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return '#22c55e';
      case 'expiring-soon': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.icon) return category.icon;
    return '🍎'; // Default fallback
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getLocationIcon = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      // Simple icon mapping based on location name
      const icons: { [key: string]: string } = {
        'Fridge': '❄️',
        'Freezer': '🧊',
        'Pantry': '🏠',
        'Cabinet': '🗄️',
        'Counter': '🍽️',
        'Kitchen': '🍳',
        'Storage': '📦',
        // Multilingual support
        '冰箱': '❄️',
        '冷冻室': '🧊',
        '食品储藏室': '🏠',
        '台面': '🍽️',
        '橱柜': '🗄️',
        '冷蔵庫': '❄️',
        '冷凍庫': '🧊',
        'パントリー': '🏠',
        'カウンター': '🍽️',
        'キャビネット': '🗄️'
      };
      
      const lowerName = location.name.toLowerCase();
      
      // Direct match
      if (icons[location.name]) return icons[location.name];
      
      // Partial matches
      if (lowerName.includes('fridge') || lowerName.includes('refrigerat')) {
        return '❄️';
      } else if (lowerName.includes('freezer') || lowerName.includes('冷冻') || lowerName.includes('冷凍')) {
        return '🧊';
      } else if (lowerName.includes('pantry') || lowerName.includes('储藏') || lowerName.includes('パントリー')) {
        return '🏠';
      } else if (lowerName.includes('cabinet') || lowerName.includes('橱柜') || lowerName.includes('キャビネット')) {
        return '🗄️';
      } else if (lowerName.includes('counter') || lowerName.includes('台面') || lowerName.includes('カウンター')) {
        return '🍽️';
      }
    }
    
    return '📍'; // Default location icon
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>{t('status.error')}</h2>
          <p>{error || 'Item not found'}</p>
          <Link to="/dashboard" className="btn btn-primary">
            ← {t('nav.dashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>{t('foodItems.title')} - {item.name}</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to={`/edit-item/${item.id}`} className="btn btn-primary">
            ✏️ {t('action.edit')}
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            ← {t('nav.dashboard')}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className={`card item-card ${item.status}`} style={{ marginBottom: '2rem' }}>
          {/* Header with name and status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{getCategoryIcon(item.categoryId)}</span>
                {item.name}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                {getStatusText(item)}
              </p>
            </div>
            <span 
              className="status-badge"
              style={{ 
                fontSize: '0.875rem', 
                padding: '0.5rem 1rem',
                backgroundColor: getStatusColor(item.status!),
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}
            >
              {t(`status.${item.status?.replace('-', '')}`)}
            </span>
          </div>

          {/* Status Alerts */}
          {item.status === 'expired' && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                This item has expired and should be disposed of safely.
              </span>
            </div>
          )}

          {item.status === 'expiring-soon' && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⏰</span>
              <span style={{ color: '#d97706', fontWeight: '600' }}>
                This item is expiring soon. Use it as soon as possible!
              </span>
            </div>
          )}

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="detail-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#374151' }}>
                📅 <span>{t('foodItems.expiryDate')}</span>
              </h3>
              <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('foodItems.expiryDate')}:</strong>
                <span style={{ color: getStatusColor(item.status!) }}>
                  {formatDate(item.expiryDate)}
                </span>
              </div>
              <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                <strong>Days Remaining:</strong>
                <span style={{ color: getStatusColor(item.status!) }}>
                  {getStatusText(item)}
                </span>
              </div>
              <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                <strong>Added Date:</strong>
                <span>{formatDate(item.addedDate)}</span>
              </div>
              {item.reminderDays && (
                <div className="detail-item">
                  <strong>{t('foodItems.reminderDays')}:</strong>
                  <span>{item.reminderDays} days</span>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#374151' }}>
                📦 <span>Storage Information</span>
              </h3>
              <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('foodItems.category')}:</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getCategoryIcon(item.categoryId)} {getCategoryName(item.categoryId)}
                </span>
              </div>
              <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('foodItems.location')}:</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getLocationIcon(item.locationId)} {getLocationName(item.locationId)}
                </span>
              </div>
              <div className="detail-item">
                <strong>{t('foodItems.quantity')}:</strong>
                <span>{item.quantity || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {item.notes && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#374151' }}>
                📝 <span>{t('foodItems.notes')}</span>
              </h3>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                color: '#374151',
                lineHeight: '1.6'
              }}>
                {item.notes}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <Link 
              to={`/edit-item/${item.id}`}
              className="btn btn-primary" 
              style={{ flex: 1, textAlign: 'center', minWidth: '150px' }}
            >
              ✏️ {t('foodItems.edit')}
            </Link>
            <button 
              onClick={handleDeleteItem}
              className="btn btn-danger" 
              style={{ flex: 1, minWidth: '150px' }}
            >
              🗑️ {t('foodItems.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails; 