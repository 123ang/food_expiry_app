import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  PurchaseService, 
  ItemActionService, 
  CategoriesService, 
  LocationsService,
  PurchaseRecord,
  ItemAction,
  Category,
  Location
} from '../services/firestoreService';

const PurchaseHistory: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [actions, setActions] = useState<ItemAction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'purchases' | 'actions'>('purchases');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user, dateRange]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date('2020-01-01'); // Far back date
          break;
      }

      const [purchasesData, actionsData, categoriesData, locationsData] = await Promise.all([
        dateRange === 'all' 
          ? PurchaseService.getUserPurchases(user.uid)
          : PurchaseService.getPurchasesByDateRange(user.uid, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
        dateRange === 'all'
          ? ItemActionService.getUserActions(user.uid)
          : ItemActionService.getActionsByDateRange(user.uid, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
        CategoriesService.getUserCategories(user.uid),
        LocationsService.getUserLocations(user.uid)
      ]);

      setPurchases(purchasesData);
      setActions(actionsData);
      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading purchase history:', error);
      setError('Failed to load purchase history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || '🍎';
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'used': return '✅';
      case 'thrown-away': return '🗑️';
      case 'expired': return '❌';
      default: return '❓';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'used': return '#4CAF50';
      case 'thrown-away': return '#FF9800';
      case 'expired': return '#F44336';
      default: return '#757575';
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading purchase history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="purchase-history">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Purchase History</h1>
          <p>Track your food purchases and usage patterns</p>
        </div>
        <div className="header-actions">
          <Link to="/analytics" className="btn btn-primary">
            📈 View Analytics
          </Link>
          <button onClick={loadData} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="controls-section">
        <div className="filter-controls">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="filter-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          🛒 Purchases ({purchases.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          📝 Actions ({actions.length})
        </button>
      </div>

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="purchases-section">
          {purchases.length === 0 ? (
            <div className="empty-state">
              <h3>No purchases found</h3>
              <p>Start adding items to track your purchase history</p>
              <Link to="/add-item" className="btn btn-primary">
                ➕ Add Item
              </Link>
            </div>
          ) : (
            <div className="purchases-list">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="purchase-card">
                  <div className="purchase-header">
                    <div className="purchase-title">
                      <span className="category-icon">{getCategoryIcon(purchase.categoryId)}</span>
                      <h3>{purchase.itemName}</h3>
                    </div>
                    <div className="purchase-date">
                      {formatDate(purchase.purchaseDate)}
                    </div>
                  </div>
                  
                  <div className="purchase-details">
                    <div className="detail-row">
                      <span>📦 Quantity: {purchase.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span>🏷️ Category: {getCategoryName(purchase.categoryId)}</span>
                    </div>
                    <div className="detail-row">
                      <span>📍 Location: {getLocationName(purchase.locationId)}</span>
                    </div>
                    <div className="detail-row">
                      <span>📅 Expiry: {formatDate(purchase.expiryDate)}</span>
                    </div>
                    {purchase.price && (
                      <div className="detail-row">
                        <span>💰 Price: ${purchase.price.toFixed(2)}</span>
                      </div>
                    )}
                    {purchase.store && (
                      <div className="detail-row">
                        <span>🏪 Store: {purchase.store}</span>
                      </div>
                    )}
                    {purchase.notes && (
                      <div className="detail-row">
                        <span>📝 Notes: {purchase.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="actions-section">
          {actions.length === 0 ? (
            <div className="empty-state">
              <h3>No actions recorded</h3>
              <p>Actions will appear here when you use or dispose of items</p>
            </div>
          ) : (
            <div className="actions-list">
              {actions.map((action) => (
                <div key={action.id} className="action-card">
                  <div className="action-header">
                    <div className="action-title">
                      <span className="action-icon" style={{ color: getActionColor(action.action) }}>
                        {getActionIcon(action.action)}
                      </span>
                      <h3>{action.itemName}</h3>
                    </div>
                    <div className="action-date">
                      {formatDate(action.actionDate)}
                    </div>
                  </div>
                  
                  <div className="action-details">
                    <div className="detail-row">
                      <span>🎯 Action: {action.action.replace('-', ' ').toUpperCase()}</span>
                    </div>
                    <div className="detail-row">
                      <span>📦 Quantity: {action.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span>🏷️ Category: {getCategoryName(action.categoryId)}</span>
                    </div>
                    <div className="detail-row">
                      <span>📍 Location: {getLocationName(action.locationId)}</span>
                    </div>
                    {action.reason && (
                      <div className="detail-row">
                        <span>💭 Reason: {action.reason}</span>
                      </div>
                    )}
                    {action.notes && (
                      <div className="detail-row">
                        <span>📝 Notes: {action.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory; 