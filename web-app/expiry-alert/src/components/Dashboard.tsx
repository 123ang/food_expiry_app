import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FoodItemsService, 
  CategoriesService, 
  LocationsService, 
  DashboardStats,
  FoodItem,
  Category,
  Location,
  cleanupUserData
} from '../services/firestoreService';

interface DashboardProps {
  filter?: 'fresh' | 'expiring-soon' | 'expired';
}

const Dashboard: React.FC<DashboardProps> = ({ filter }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    fresh: 0,
    expiringSoon: 0,
    expired: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user, filter]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load data with individual error handling
      let itemsData: FoodItem[] = [];
      let categoriesData: Category[] = [];
      let locationsData: Location[] = [];
      let statsData: DashboardStats = { total: 0, fresh: 0, expiringSoon: 0, expired: 0 };

      try {
        itemsData = filter ? 
          await FoodItemsService.getItemsByStatus(user.uid, filter) : 
          await FoodItemsService.getUserItems(user.uid);
      } catch (err) {
        console.error('Error loading food items:', err);
        // Continue with empty array
      }

      try {
        categoriesData = await CategoriesService.getUserCategories(user.uid);
      } catch (err) {
        console.error('Error loading categories:', err);
        // Continue with empty array
      }

      try {
        locationsData = await LocationsService.getUserLocations(user.uid);
      } catch (err) {
        console.error('Error loading locations:', err);
        // Continue with empty array
      }

      try {
        statsData = await FoodItemsService.getDashboardStats(user.uid);
      } catch (err) {
        console.error('Error loading stats:', err);
        // Continue with default stats
      }

      setFoodItems(itemsData);
      setCategories(categoriesData);
      setLocations(locationsData);
      setStats(statsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleDeleteItem = async (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.stopPropagation();
    
    if (window.confirm(`${t('alert.deleteMessage')} "${itemName}"?`)) {
      try {
        await FoodItemsService.deleteItem(itemId);
        // Reload data to refresh the list
        await loadData();
        alert(`${t('alert.success')}: "${itemName}" ${t('action.delete')}`);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`${t('alert.deleteFailed')}: ${itemName}`);
      }
    }
  };

  const handleCleanupExpired = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(t('cleanup.confirmMessage'));
    if (!confirmed) return;
    
    setIsCleaningUp(true);
    try {
      const deletedCount = await FoodItemsService.cleanupExpiredItems(user.uid);
      alert(`${t('cleanup.success')}: ${deletedCount} ${t('cleanup.itemsDeleted')}`);
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      alert(t('cleanup.failed'));
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDataCleanup = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Clean up duplicate items and fix data inconsistencies? This will also migrate any legacy data to the new ID-based system. This cannot be undone.');
    if (!confirmed) return;
    
    setIsCleaningUp(true);
    try {
      const result = await cleanupUserData(user.uid);
      alert(`Data cleanup completed! Duplicates removed: ${result.duplicatesRemoved}, Orphaned references fixed: ${result.orphansFixed}, Locations migrated: ${result.locationsMigrated}, Categories migrated: ${result.categoriesMigrated}`);
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Error cleaning up data:', error);
      alert('Failed to clean up data');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.icon) return category.icon;
    
    // Fallback icons for unknown categories
    return '🍎';
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

  const getDaysText = (days: number) => {
    if (days === 0) return t('item.expirestoday');
    if (days === 1) return `1 ${t('item.dayLeft')}`;
    if (days > 0) return `${days} ${t('item.daysLeft')}`;
    if (days === -1) return `1 ${t('item.dayAgo')}`;
    return `${Math.abs(days)} ${t('item.daysAgo')}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'fresh': return t('status.fresh');
      case 'expiring-soon': return t('status.expiring');
      case 'expired': return t('status.expired');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return '#4CAF50';
      case 'expiring-soon': return '#FF9800';
      case 'expired': return '#F44336';
      default: return '#757575';
    }
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

  if (error) {
    return (
      <div className="error-message">
        <h2>{t('status.error')}</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn btn-primary">
          {t('status.retry')}
        </button>
      </div>
    );
  }

  // Filter view
  if (filter) {
    const filteredItems = foodItems.filter(item => item.status === filter);
    const pageTitle = filter === 'fresh' ? t('status.fresh') : 
                     filter === 'expiring-soon' ? t('status.expiring') :
                     t('status.expired');

    return (
      <div className="dashboard filtered-view">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>{pageTitle} {t('status.items')}</h1>
            <p>{filteredItems.length} {t('status.items').toLowerCase()}</p>
          </div>
          <div className="header-actions">
            <Link to="/dashboard" className="btn btn-secondary">
              ← {t('status.viewAll')}
            </Link>
            <button onClick={loadData} className="btn btn-secondary">
              🔄 {t('status.refresh')}
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>{t('status.noItems').replace('{status}', pageTitle.toLowerCase())}</h3>
            <Link to="/add-item" className="btn btn-primary">
              ➕ {t('action.add')} {t('form.itemName')}
            </Link>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className={`item-card ${item.status}`}
                onClick={() => handleCardClick(item.id!)}
              >
                <div className="item-header">
                  <div className="item-title">
                    <span className="category-icon">{getCategoryIcon(item.categoryId)}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Link 
                      to={`/edit-item/${item.id}`}
                      className="btn btn-small btn-secondary"
                      onClick={(e) => e.stopPropagation()}
                      title={t('action.edit')}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        textDecoration: 'none'
                      }}
                    >
                      ✏️
                    </Link>
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDeleteItem(e, item.id!, item.name)}
                      title={t('action.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="item-details">
                  <div className="detail-row">
                    <span>{t('item.quantity')}: {item.quantity}</span>
                  </div>
                  <div className="detail-row">
                    <span className="category-icon">{getCategoryIcon(item.categoryId)}</span>
                    <span>{getCategoryName(item.categoryId)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="location-icon">{getLocationIcon(item.locationId)}</span>
                    <span>{getLocationName(item.locationId)}</span>
                  </div>
                </div>
                
                <div className="item-status">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(item.status!) }}
                  >
                    {getStatusText(item.status!)}
                  </span>
                  <span className="days-text">
                    {getDaysText(item.daysUntilExpiry!)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>{t('home.welcome')}</h1>
          <p>{t('nav.dashboard')}</p>
        </div>
        <div className="header-actions">
          <Link to="/add-item" className="btn btn-primary">
            ➕ {t('nav.addItem')}
          </Link>
          <button onClick={loadData} className="btn btn-secondary">
            🔄 {t('status.refresh')}
          </button>
          {stats.expired > 0 && (
            <button 
              onClick={handleCleanupExpired} 
              className="btn btn-danger"
              disabled={isCleaningUp}
            >
              🧹 {isCleaningUp ? t('cleanup.inProgress') : t('cleanup.cleanupExpired')}
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <Link to="/items/fresh" className="stat-card fresh">
          <div className="stat-header">
            <h3>{t('status.fresh')}</h3>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-number">{stats.fresh}</div>
          <div className="stat-label">{t('status.items')}</div>
        </Link>

        <Link to="/items/expiring" className="stat-card expiring">
          <div className="stat-header">
            <h3>{t('status.expiring')}</h3>
            <span className="stat-icon">⚠️</span>
          </div>
          <div className="stat-number">{stats.expiringSoon}</div>
          <div className="stat-label">{t('status.items')}</div>
        </Link>

        <Link to="/items/expired" className="stat-card expired">
          <div className="stat-header">
            <h3>{t('status.expired')}</h3>
            <span className="stat-icon">❌</span>
          </div>
          <div className="stat-number">{stats.expired}</div>
          <div className="stat-label">{t('status.items')}</div>
        </Link>

        <div className="stat-card total">
          <div className="stat-header">
            <h3>{t('nav.dashboard')}</h3>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">{t('status.items')}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>{t('home.categories')}</h2>
        <div className="actions-grid">
          <Link to="/categories" className="action-card">
            <span className="action-icon">🏷️</span>
            <h3>{t('nav.categories')}</h3>
            <p>{categories.length} {t('home.categories').toLowerCase()}</p>
          </Link>
          
          <Link to="/locations" className="action-card">
            <span className="action-icon">📍</span>
            <h3>{t('nav.locations')}</h3>
            <p>{locations.length} {t('nav.locations').toLowerCase()}</p>
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      {foodItems.length > 0 && (
        <div className="recent-items">
          <h2>{t('dashboard.recentItems')}</h2>
          <div className="items-grid">
            {foodItems.slice(0, 6).map((item) => (
              <div 
                key={item.id} 
                className={`item-card ${item.status}`}
                onClick={() => handleCardClick(item.id!)}
              >
                <div className="item-header">
                  <div className="item-title">
                    <span className="category-icon">{getCategoryIcon(item.categoryId)}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Link 
                      to={`/edit-item/${item.id}`}
                      className="btn btn-small btn-secondary"
                      onClick={(e) => e.stopPropagation()}
                      title={t('action.edit')}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        textDecoration: 'none'
                      }}
                    >
                      ✏️
                    </Link>
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDeleteItem(e, item.id!, item.name)}
                      title={t('action.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="item-details">
                  <div className="detail-row">
                    <span>{t('item.quantity')}: {item.quantity}</span>
                  </div>
                  <div className="detail-row">
                    <span className="category-icon">{getCategoryIcon(item.categoryId)}</span>
                    <span>{getCategoryName(item.categoryId)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="location-icon">{getLocationIcon(item.locationId)}</span>
                    <span>{getLocationName(item.locationId)}</span>
                  </div>
                </div>
                
                <div className="item-status">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(item.status!) }}
                  >
                    {getStatusText(item.status!)}
                  </span>
                  <span className="days-text">
                    {getDaysText(item.daysUntilExpiry!)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {foodItems.length > 6 && (
            <div className="view-all">
              <Link to="/items/all" className="btn btn-secondary">
                {t('status.viewAll')} ({foodItems.length} {t('status.items')})
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {foodItems.length === 0 && (
        <div className="empty-state">
          <h3>{t('list.noItems')}</h3>
          <p>{t('dashboard.getStarted')}</p>
          <Link to="/add-item" className="btn btn-primary">
            ➕ {t('nav.addItem')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;