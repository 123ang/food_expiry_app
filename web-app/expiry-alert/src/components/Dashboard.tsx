import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { 
  getFoodItems,
  getCategories,
  getLocations,
  deleteFoodItem,
  getDashboardStats,
  calculateItemStatus,
  FoodItem,
  Category,
  Location,
  DashboardStats
} from '../services/postgresApiService';
import { notificationService } from '../services/notificationService';

interface DashboardProps {
  filter?: 'fresh' | 'expiring-soon' | 'expired';
}

type SortOption = 'name' | 'expiry_date' | 'category' | 'location' | 'created_at';
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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Enhanced functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('expiry_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentGroup, loading: groupLoading } = useGroup();
  const currentGroupId = currentGroup?.id || null;

  // Load data when group is available (wait for group loading to complete)
  useEffect(() => {
    if (!groupLoading && currentGroupId) {
      loadData();
    } else if (!groupLoading && !currentGroupId) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId, filter, groupLoading]);

  // Check for notifications when items are loaded
  useEffect(() => {
    if (foodItems.length > 0) {
      // Convert to format expected by notification service
      const notificationItems = foodItems.map(item => ({
        ...item,
        expiryDate: item.expiry_date || '',
        categoryId: item.category_id || '',
        locationId: item.location_id || '',
        addedDate: item.created_at || '',
        userId: item.created_by
      }));
      notificationService.checkItemsForNotifications(notificationItems as any);
    }
  }, [foodItems]);

  const loadData = async () => {
    if (!currentGroupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let itemsData: FoodItem[] = [];
      let categoriesData: Category[] = [];
      let locationsData: Location[] = [];

      try {
        itemsData = await getFoodItems(currentGroupId);
        
        // Filter out consumed items
        itemsData = itemsData.filter(item => !item.is_consumed);
        
        // Log for debugging
        console.log(`Dashboard: Loaded ${itemsData.length} items for group ${currentGroupId}`);
        console.log('Dashboard: Items:', itemsData.map(i => ({ id: i.id, name: i.name, expiry_date: i.expiry_date, is_consumed: i.is_consumed })));
        
        // Calculate status for each item
        itemsData = itemsData.map(item => {
          if (item.expiry_date) {
            const { status, daysUntilExpiry } = calculateItemStatus(item.expiry_date);
            return { ...item, status, daysUntilExpiry };
          }
          return { ...item, status: 'fresh' as const, daysUntilExpiry: 999 };
        });
        
        // Filter by status if needed
        if (filter) {
          itemsData = itemsData.filter(item => item.status === filter);
        }
      } catch (err) {
        console.error('Error loading food items:', err);
      }

      try {
        categoriesData = await getCategories(currentGroupId);
      } catch (err: any) {
        console.error('Error loading categories:', err);
        setError(err.message || t('dashboard.loadCategoriesFailed'));
      }

      try {
        locationsData = await getLocations(currentGroupId);
      } catch (err: any) {
        console.error('Error loading locations:', err);
        setError(err.message || t('dashboard.loadLocationsFailed'));
      }

      setFoodItems(itemsData);
      setCategories(categoriesData);
      setLocations(locationsData);
      
      // Calculate stats
      const statsData = getDashboardStats(itemsData);
      setStats(statsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : t('dashboard.unknownError');
      setError(`${t('dashboard.loadDataFailed')}: ${errorMessage}. ${t('dashboard.checkConnection')}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = foodItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || item.category_id === selectedCategory;
      const matchesLocation = selectedLocation === '' || item.location_id === selectedLocation;
      
      return matchesSearch && matchesCategory && matchesLocation;
    });

    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'expiry_date':
          valueA = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
          valueB = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
          break;
        case 'category':
          const catA = categories.find(c => c.id === a.category_id);
          const catB = categories.find(c => c.id === b.category_id);
          valueA = catA?.name.toLowerCase() || '';
          valueB = catB?.name.toLowerCase() || '';
          break;
        case 'location':
          const locA = locations.find(l => l.id === a.location_id);
          const locB = locations.find(l => l.id === b.location_id);
          valueA = locA?.name.toLowerCase() || '';
          valueB = locB?.name.toLowerCase() || '';
          break;
        case 'created_at':
          valueA = new Date(a.created_at || 0);
          valueB = new Date(b.created_at || 0);
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [foodItems, searchQuery, selectedCategory, selectedLocation, sortBy, sortDirection, categories, locations]);

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm(t('dashboard.confirmDelete'))) return;
    
    try {
      await deleteFoodItem(id);
      toast.success(t('dashboard.itemDeleted'));
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('dashboard.deleteFailed'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmMessage = t('dashboard.deleteMultiple', { count: selectedItems.size });
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await Promise.all(Array.from(selectedItems).map(id => deleteFoodItem(id)));
      const successMessage = t('dashboard.itemsDeleted', { count: selectedItems.size });
      toast.success(successMessage);
      setSelectedItems(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error(t('dashboard.deleteFailedMultiple'));
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return t('dashboard.uncategorized');
    const category = categories.find(c => c.id === categoryId);
    return category?.name || t('dashboard.unknown');
  };

  const getLocationName = (locationId: string | undefined) => {
    if (!locationId) return t('dashboard.noLocation');
    const location = locations.find(l => l.id === locationId);
    return location?.name || t('dashboard.unknown');
  };

  const getCategoryIcon = (categoryId: string | undefined) => {
    if (!categoryId) return '📦';
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📦';
  };

  const getLocationIcon = (locationId: string | undefined) => {
    if (!locationId) return '📍';
    const location = locations.find(l => l.id === locationId);
    return location?.icon || '📍';
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'fresh': return 'status-badge in-date';
      case 'expiring-soon': return 'status-badge expiring';
      case 'expired': return 'status-badge expired';
      default: return 'status-badge';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'fresh': return '#4CAF50';
      case 'expiring-soon': return '#FF9800';
      case 'expired': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (groupLoading || isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>{t('nav.dashboard')}</h1>
            <p>{t('groups.noGroup') || 'No group selected. Please create or join a group.'}</p>
          </div>
          <div className="header-actions">
            <Link to="/groups" className="btn btn-primary">
              👥 {t('groups.createGroup') || 'Create Group'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>⚠️ {t('status.error')}</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn btn-primary">
          {t('actions.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            {filter === 'fresh' ? t('dashboard.freshItems') :
             filter === 'expiring-soon' ? t('dashboard.expiringItems') :
             filter === 'expired' ? t('dashboard.expiredItems') :
             t('nav.dashboard')}
          </h1>
          <p>{t('dashboard.welcome')}</p>
        </div>
        <div className="header-actions">
          <Link to="/add-item" className="btn btn-primary">
            ➕ {t('nav.addItem')}
          </Link>
          <button onClick={loadData} className="btn btn-secondary">
            🔄 {t('actions.refresh')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {!filter && (
        <div className="stats-grid">
          <Link to="/items/in-date" className="stat-card total">
            <div className="stat-header">
              <h3>{t('dashboard.fresh')}</h3>
              <span className="stat-icon">✅</span>
            </div>
            <div className="stat-number">{stats.fresh}</div>
            <div className="stat-label">{t('dashboard.items')}</div>
          </Link>

          <Link to="/items/expiring" className="stat-card expiring">
            <div className="stat-header">
              <h3>{t('dashboard.expiringSoon')}</h3>
              <span className="stat-icon">⚠️</span>
            </div>
            <div className="stat-number">{stats.expiringSoon}</div>
            <div className="stat-label">{t('dashboard.items')}</div>
          </Link>

          <Link to="/items/expired" className="stat-card expired">
            <div className="stat-header">
              <h3>{t('dashboard.expired')}</h3>
              <span className="stat-icon">❌</span>
            </div>
            <div className="stat-number">{stats.expired}</div>
            <div className="stat-label">{t('dashboard.items')}</div>
          </Link>

          <div className="stat-card total">
            <div className="stat-header">
              <h3>{t('dashboard.total')}</h3>
              <span className="stat-icon">📊</span>
            </div>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">{t('dashboard.items')}</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-filter-bar">
          <div className="search-control">
            <input
              type="text"
              className="search-input"
              placeholder={t('dashboard.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t('dashboard.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">{t('dashboard.allLocations')}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.icon} {loc.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="expiry_date">{t('dashboard.sortByExpiry')}</option>
              <option value="name">{t('dashboard.sortByName')}</option>
              <option value="category">{t('dashboard.sortByCategory')}</option>
              <option value="location">{t('dashboard.sortByLocation')}</option>
              <option value="created_at">{t('dashboard.sortByDateAdded')}</option>
            </select>

            <button
              className="sort-direction-btn"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              title={sortDirection === 'asc' ? t('dashboard.ascending') : t('dashboard.descending')}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>

            <button
              className="view-mode-btn"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={viewMode === 'grid' ? t('dashboard.gridView') : t('dashboard.listView')}
            >
              {viewMode === 'grid' ? '⊞' : '☰'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">
              {t('dashboard.itemsSelected', { count: selectedItems.size })}
            </span>
            <button onClick={handleBulkDelete} className="btn btn-danger btn-small">
              🗑️ {t('dashboard.deleteSelected')}
            </button>
            <button onClick={() => setSelectedItems(new Set())} className="btn btn-secondary btn-small">
              {t('dashboard.clearSelection')}
            </button>
          </div>
        )}
      </div>

      {/* Items Grid/List */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="empty-state">
          <h3>📦 {t('dashboard.noItems')}</h3>
          <p>{t('dashboard.addFirstItem')}</p>
          <Link to="/add-item" className="btn btn-primary btn-large">
            ➕ {t('nav.addItem')}
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'items-grid' : 'items-list'}>
          {filteredAndSortedItems.map(item => (
            <div
              key={item.id}
              className={`item-card ${item.status || 'fresh'} ${viewMode}`}
              onClick={() => navigate(`/item/${item.id}`)}
            >
              {/* Selection Checkbox */}
              <div className="item-select" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id!)}
                  onChange={() => toggleItemSelection(item.id!)}
                />
              </div>

              <div className="item-header">
                <div className="item-title">
                  {/* Item Image Thumbnail or Category Icon Placeholder */}
                  {item.image_url && !imageErrors.has(item.id || '') ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="item-thumbnail"
                      onError={() => {
                        // Mark this image as failed to load
                        if (item.id) {
                          setImageErrors(prev => new Set(prev).add(item.id!));
                        }
                      }}
                    />
                  ) : (
                    <span className="category-icon">
                      {getCategoryIcon(item.category_id)}
                    </span>
                  )}
                  <h3>{item.name}</h3>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id!);
                  }}
                >
                  🗑️
                </button>
              </div>

              <div className="item-details">
                <div className="detail-row">
                  <span className="location-icon">{getLocationIcon(item.location_id)}</span>
                  <span>{getLocationName(item.location_id)}</span>
                </div>
                <div className="detail-row">
                  <span className="category-icon-small">{getCategoryIcon(item.category_id)}</span>
                  <span>{getCategoryName(item.category_id)}</span>
                </div>
                {item.expiry_date && (
                  <div className="detail-row">
                    <span>📅</span>
                    <span>{new Date(item.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
                {item.quantity && (
                  <div className="detail-row">
                    <span>🔢</span>
                    <span>{item.quantity} {item.unit || ''}</span>
                  </div>
                )}
              </div>

              <div className="item-status">
                <span
                  className={getStatusBadgeClass(item.status)}
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  {item.status === 'fresh' ? t('dashboard.statusFresh') : 
                   item.status === 'expiring-soon' ? t('dashboard.statusExpiringSoon') : 
                   t('dashboard.statusExpired')}
                </span>
                {item.daysUntilExpiry !== undefined && (
                  <span className="days-text">
                    {item.daysUntilExpiry < 0 
                      ? t('dashboard.daysAgo', { count: Math.abs(item.daysUntilExpiry) })
                      : t('dashboard.daysLeft', { count: item.daysUntilExpiry })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
