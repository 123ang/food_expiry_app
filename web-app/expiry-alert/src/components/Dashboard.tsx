import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface FoodItem {
  id: string;
  name: string;
  expiryDate: string;
  category: string;
  location: string;
  quantity: string;
  notes: string;
  status: 'fresh' | 'expiring-soon' | 'expired';
  daysUntilExpiry: number;
}

const Dashboard: React.FC = () => {
  // Demo data with locations
  const [foodItems] = useState<FoodItem[]>([
    {
      id: '1',
      name: 'Organic Milk',
      expiryDate: '2024-01-25',
      category: 'Dairy',
      location: 'Main Refrigerator',
      quantity: '1 gallon',
      notes: 'Opened 3 days ago',
      status: 'expired',
      daysUntilExpiry: -2
    },
    {
      id: '2',
      name: 'Whole Wheat Bread',
      expiryDate: '2024-01-27',
      category: 'Bakery',
      location: 'Pantry',
      quantity: '1 loaf',
      notes: 'Store in cool, dry place',
      status: 'expiring-soon',
      daysUntilExpiry: 2
    },
    {
      id: '3',
      name: 'Fresh Bananas',
      expiryDate: '2024-01-26',
      category: 'Fruits',
      location: 'Counter',
      quantity: '6 pieces',
      notes: 'Perfect for smoothies',
      status: 'expiring-soon',
      daysUntilExpiry: 1
    },
    {
      id: '4',
      name: 'Greek Yogurt',
      expiryDate: '2024-02-05',
      category: 'Dairy',
      location: 'Main Refrigerator',
      quantity: '32 oz',
      notes: 'High protein, low fat',
      status: 'fresh',
      daysUntilExpiry: 10
    },
    {
      id: '5',
      name: 'Chicken Breast',
      expiryDate: '2024-01-30',
      category: 'Meat',
      location: 'Main Refrigerator',
      quantity: '2 lbs',
      notes: 'Use for dinner tonight',
      status: 'fresh',
      daysUntilExpiry: 5
    },
    {
      id: '6',
      name: 'Frozen Peas',
      expiryDate: '2024-06-15',
      category: 'Frozen',
      location: 'Freezer',
      quantity: '1 bag',
      notes: 'Great for quick sides',
      status: 'fresh',
      daysUntilExpiry: 140
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const freshItems = foodItems.filter(item => item.status === 'fresh');
  const expiringSoonItems = foodItems.filter(item => item.status === 'expiring-soon');
  const expiredItems = foodItems.filter(item => item.status === 'expired');

  const handleCardClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleDeleteItem = (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.stopPropagation(); // Prevent card click when delete button is clicked
    if (window.confirm(`${t('confirm.delete')} "${itemName}"?`)) {
      alert(`${t('confirm.deleted')} "${itemName}" ${t('confirm.demoMode')}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      // Match mobile app exactly from CategoryIcon.tsx
      'Apple': '🍎',
      'Dairy': '🥛', 
      'Fruits': '🍇',
      'Vegetables': '🥕',
      'Meat': '🥩',
      'Bread': '🍞',
      'Beverages': '🥤',
      'Snacks': '🍿',
      'Frozen': '🧊',
      'Canned': '🥫',
      'Seafood': '🐟',
      'Spices': '🌶️',
      'Dessert': '🍰',
      'Grains': '🌾',
      'Bakery': '🍞', // Map Bakery to Bread
      'Pantry': '🥫', // Map Pantry items to Canned
      // Lowercase mappings for flexibility
      'apple': '🍎',
      'dairy': '🥛',
      'fruits': '🍇',
      'vegetables': '🥕',
      'meat': '🥩',
      'bread': '🍞',
      'beverages': '🥤',
      'snacks': '🍿',
      'frozen': '🧊',
      'canned': '🥫',
      'seafood': '🐟',
      'spices': '🌶️',
      'dessert': '🍰',
      'grains': '🌾',
      'bakery': '🍞',
      'pantry': '🥫'
    };
    return icons[category] || icons[category.toLowerCase()] || '🍎';
  };

  const getLocationIcon = (location: string) => {
    const icons: { [key: string]: string } = {
      // Match mobile app exactly from LocationIcon.tsx
      'Fridge': '❄️',
      'Freezer': '🧊',
      'Pantry': '🏠',
      'Cabinet': '🗄️',
      'Counter': '🍽️',
      'Basement': '⬇️',
      'Garage': '🏢',
      'Kitchen': '🍳',
      'Cupboard': '🗃️',
      'Shelf': '📚',
      'Storage': '📦',
      'Refrigerator': '❄️',
      'Main Refrigerator': '❄️',
      // Lowercase mappings for flexibility
      'fridge': '❄️',
      'freezer': '🧊',
      'pantry': '🏠',
      'cabinet': '🗄️',
      'counter': '🍽️',
      'basement': '⬇️',
      'garage': '🏢',
      'kitchen': '🍳',
      'cupboard': '🗃️',
      'shelf': '📚',
      'storage': '📦',
      'refrigerator': '❄️'
    };
    
    // Try exact match first, then check for partial matches
    if (icons[location]) {
      return icons[location];
    }
    
    const lowerLocation = location.toLowerCase();
    if (icons[lowerLocation]) {
      return icons[lowerLocation];
    }
    
    // Partial match patterns (same as mobile app logic)
    if (lowerLocation.includes('fridge') || lowerLocation.includes('refrigerator')) {
      return '❄️';
    } else if (lowerLocation.includes('freezer')) {
      return '🧊';
    } else if (lowerLocation.includes('pantry') || lowerLocation.includes('kitchen')) {
      return '🍳';
    } else if (lowerLocation.includes('cabinet') || lowerLocation.includes('cupboard')) {
      return '🗄️';
    } else if (lowerLocation.includes('counter')) {
      return '🍽️';
    } else if (lowerLocation.includes('storage') || lowerLocation.includes('room')) {
      return '📦';
    }
    
    return '📍'; // Default from mobile app
  };

  const getDaysText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} ${t('time.overdue')}`;
    if (days === 0) return t('time.expirestoday');
    if (days === 1) return t('time.expirestomorrow');
    return `${days} ${t('time.expiresIn')}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'fresh': return t('status.fresh');
      case 'expiring-soon': return t('status.expiringSoon');
      case 'expired': return t('status.expired');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'var(--success-color)';
      case 'expiring-soon': return 'var(--warning-color)';
      case 'expired': return 'var(--danger-color)';
      default: return 'var(--text-secondary)';
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <div>{t('loading.inventory')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h2>{t('dashboard.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
          <Link to="/add-item" className="btn btn-primary">
            ➕ {t('nav.addItem')}
          </Link>
          <Link to="/locations" className="btn btn-secondary">
            📍 {t('nav.locations')}
          </Link>
          <Link to="/categories" className="btn btn-secondary">
            🏷️ {t('nav.categories')}
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <h3>{foodItems.length}</h3>
          <p>{t('dashboard.totalItems')}</p>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <h3>{freshItems.length}</h3>
          <p>{t('dashboard.freshItems')}</p>
        </div>
        <div className="stat-card warning">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
          <h3>{expiringSoonItems.length}</h3>
          <p>{t('dashboard.expiringSoon')}</p>
        </div>
        <div className="stat-card danger">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3>{expiredItems.length}</h3>
          <p>{t('dashboard.expiredItems')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t('quickActions.title')}</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <Link to="/add-item" className="btn btn-primary" style={{ textAlign: 'center' }}>
              ➕ {t('action.addFood')}
            </Link>
            <Link to="/add-location" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              📍 {t('action.addLocation')}
            </Link>
            <Link to="/add-category" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              🏷️ {t('action.addCategory')}
            </Link>
            <button 
              onClick={() => alert(`${t('action.cleanup')}! ${t('confirm.demoMode')}`)}
              className="btn btn-danger" 
              style={{ textAlign: 'center' }}
            >
              🗑️ {t('action.cleanup')}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="d-flex align-center" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{t('recent.title')}</h3>
          <Link to="/items" className="btn btn-secondary btn-small">{t('recent.viewAll')}</Link>
        </div>

        <div className="food-items-grid">
          {foodItems.slice(0, 6).map((item) => (
            <div 
              key={item.id} 
              className={`food-item-card ${item.status}`}
              onClick={() => handleCardClick(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, flex: 1 }}>{item.name}</h4>
                <div className="d-flex align-center gap-2">
                  <span className={`status ${item.status}`}>
                    {getStatusText(item.status)}
                  </span>
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id, item.name)}
                    className="btn btn-danger btn-small"
                    style={{ 
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      minWidth: 'auto'
                    }}
                    title={t('action.delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="expiry-date" style={{ 
                fontWeight: 600,
                color: getStatusColor(item.status),
                marginBottom: '1rem' 
              }}>
                {getDaysText(item.daysUntilExpiry)} • {t('time.expiresAt')}: {new Date(item.expiryDate).toLocaleDateString()}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div className="d-flex align-center gap-2" style={{ marginBottom: '0.5rem' }}>
                  <span>{getCategoryIcon(item.category)}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.category}</span>
                </div>
                <div className="d-flex align-center gap-2" style={{ marginBottom: '0.5rem' }}>
                  <span>{getLocationIcon(item.location)}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.location}</span>
                </div>
                <div className="d-flex align-center gap-2">
                  <span>📦</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.quantity}</span>
                </div>
              </div>

              <div className="d-flex gap-2" style={{ marginTop: 'auto' }}>
                <Link 
                  to={`/edit-item/${item.id}`} 
                  className="btn btn-primary btn-small" 
                  style={{ flex: 1 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  ✏️ {t('action.edit')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Alerts */}
      {(expiredItems.length > 0 || expiringSoonItems.length > 0) && (
        <div className="card" style={{ 
          borderLeft: `4px solid ${expiredItems.length > 0 ? 'var(--danger-color)' : 'var(--warning-color)'}`,
          marginBottom: '2rem' 
        }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              🚨 {t('alerts.title')}
            </h3>
            
            {expiredItems.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  ⚠️ {expiredItems.length} {t('alerts.itemsExpired')}
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {expiredItems.slice(0, 3).map(item => (
                    <li key={item.id} style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {item.name} - {Math.abs(item.daysUntilExpiry)} {t('time.overdue')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {expiringSoonItems.length > 0 && (
              <div>
                <p style={{ color: 'var(--warning-color)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  ⏰ {expiringSoonItems.length} {t('alerts.itemsExpiring')}
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {expiringSoonItems.slice(0, 3).map(item => (
                    <li key={item.id} style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {item.name} - {item.daysUntilExpiry} {t('time.expiresIn')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;