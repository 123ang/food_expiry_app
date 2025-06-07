import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import { notificationService } from '../services/notificationService';

interface DashboardProps {
  filter?: 'fresh' | 'expiring-soon' | 'expired';
}

type SortOption = 'name' | 'expiryDate' | 'category' | 'location' | 'addedDate';
type SortDirection = 'asc' | 'desc';

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
  
  // New state for enhanced functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('expiryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user, filter]);

  // Check for notifications when items are loaded
  useEffect(() => {
    if (foodItems.length > 0) {
      notificationService.checkItemsForNotifications(foodItems);
    }
  }, [foodItems]);

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

  // Filtered and sorted items using useMemo for performance
  const filteredAndSortedItems = useMemo(() => {
    let filtered = foodItems.filter(item => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === '' || item.categoryId === selectedCategory;
      
      // Location filter
      const matchesLocation = selectedLocation === '' || item.locationId === selectedLocation;
      
      return matchesSearch && matchesCategory && matchesLocation;
    });

    // Sort items
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'expiryDate':
          valueA = new Date(a.expiryDate);
          valueB = new Date(b.expiryDate);
          break;
        case 'category':
          valueA = getCategoryName(a.categoryId).toLowerCase();
          valueB = getCategoryName(b.categoryId).toLowerCase();
          break;
        case 'location':
          valueA = getLocationName(a.locationId).toLowerCase();
          valueB = getLocationName(b.locationId).toLowerCase();
          break;
        case 'addedDate':
          valueA = new Date(a.addedDate);
          valueB = new Date(b.addedDate);
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [foodItems, searchQuery, selectedCategory, selectedLocation, sortBy, sortDirection, categories, locations]);

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
        toast.success(`"${itemName}" ${t('action.delete')}`);
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error(`${t('alert.deleteFailed')}: ${itemName}`);
      }
    }
  };

  // Bulk operations
  const handleSelectItem = (itemId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (isSelected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id!)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Delete ${selectedItems.size} selected items?`)) {
      const loadingToast = toast.loading('Deleting items...');
      try {
        await Promise.all(
          Array.from(selectedItems).map(itemId => FoodItemsService.deleteItem(itemId))
        );
        setSelectedItems(new Set());
        await loadData();
        toast.success(`Successfully deleted ${selectedItems.size} items`, { id: loadingToast });
      } catch (error) {
        console.error('Error deleting items:', error);
        toast.error('Failed to delete some items', { id: loadingToast });
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.testNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  const handleCleanupExpired = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(t('cleanup.confirmMessage'));
    if (!confirmed) return;
    
    setIsCleaningUp(true);
    const loadingToast = toast.loading('Cleaning up expired items...');
    try {
      const deletedCount = await FoodItemsService.cleanupExpiredItems(user.uid);
      toast.success(`${t('cleanup.success')}: ${deletedCount} ${t('cleanup.itemsDeleted')}`, { id: loadingToast });
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      toast.error(t('cleanup.failed'), { id: loadingToast });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDataCleanup = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Clean up duplicate items and fix data inconsistencies? This will also migrate any legacy data to the new ID-based system. This cannot be undone.');
    if (!confirmed) return;
    
    setIsCleaningUp(true);
    const loadingToast = toast.loading('Cleaning up data...');
    try {
      const result = await cleanupUserData(user.uid);
      toast.success(`Data cleanup completed! Duplicates removed: ${result.duplicatesRemoved}, Orphaned references fixed: ${result.orphansFixed}, Locations migrated: ${result.locationsMigrated}, Categories migrated: ${result.categoriesMigrated}`, { id: loadingToast });
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast.error('Failed to clean up data', { id: loadingToast });
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
      case 'fresh': return t('status.indate');
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
    const pageTitle = filter === 'fresh' ? t('status.indate') : 
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
            <h3>{t('status.indate')}</h3>
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

      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-filter-bar">
          <div className="search-control">
            <input
              type="text"
              placeholder="🔍 Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  📍 {location.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="filter-select"
            >
              <option value="expiryDate">Sort by Expiry Date</option>
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="location">Sort by Location</option>
              <option value="addedDate">Sort by Date Added</option>
            </select>

            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="sort-direction-btn"
              title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="view-mode-btn"
              title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} View`}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <button onClick={handleBulkDelete} className="btn btn-danger btn-small">
              🗑️ Delete Selected
            </button>
            <button onClick={() => setSelectedItems(new Set())} className="btn btn-secondary btn-small">
              Clear Selection
            </button>
          </div>
        )}

        {/* Notification Actions */}
        <div className="notification-actions">
          <button onClick={handleTestNotification} className="btn btn-secondary btn-small">
            🔔 Test Notification
          </button>
        </div>
      </div>

      {/* Items Display */}
      {filteredAndSortedItems.length > 0 && (
        <div className="items-section">
          <div className="section-header">
            <h2>Your Items ({filteredAndSortedItems.length})</h2>
            <div className="bulk-select">
              <label>
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
            </div>
          </div>
          
          <div className={`items-${viewMode}`}>
            {filteredAndSortedItems.map((item) => (
              <div 
                key={item.id} 
                className={`item-card ${item.status} ${viewMode}`}
                onClick={() => handleCardClick(item.id!)}
              >
                <div className="item-select" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id!)}
                    onChange={(e) => handleSelectItem(item.id!, e.target.checked)}
                  />
                </div>
                
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
        </div>
      )}

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