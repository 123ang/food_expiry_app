import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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

  const freshItems = foodItems.filter(item => item.status === 'fresh');
  const expiringSoonItems = foodItems.filter(item => item.status === 'expiring-soon');
  const expiredItems = foodItems.filter(item => item.status === 'expired');

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Dairy': '🥛',
      'Bakery': '🍞',
      'Fruits': '🍎',
      'Meat': '🥩',
      'Frozen': '🧊',
      'Vegetables': '🥕',
      'Seafood': '🐟',
      'Pantry': '🥫'
    };
    return icons[category] || '🍽️';
  };

  const getLocationIcon = (location: string) => {
    if (location.toLowerCase().includes('fridge') || location.toLowerCase().includes('refrigerator')) {
      return '🧊';
    } else if (location.toLowerCase().includes('freezer')) {
      return '❄️';
    } else if (location.toLowerCase().includes('pantry')) {
      return '🏠';
    } else if (location.toLowerCase().includes('counter')) {
      return '🌡️';
    }
    return '📍';
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/add-item" className="btn btn-primary">+ Add Item</Link>
          <Link to="/locations" className="btn btn-secondary">📍 Locations</Link>
          <Link to="/categories" className="btn btn-secondary">🏷️ Categories</Link>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{foodItems.length}</h3>
          <p>Total Items</p>
        </div>
        <div className="stat-card">
          <h3>{freshItems.length}</h3>
          <p>Fresh Items</p>
        </div>
        <div className="stat-card warning">
          <h3>{expiringSoonItems.length}</h3>
          <p>Expiring Soon</p>
        </div>
        <div className="stat-card danger">
          <h3>{expiredItems.length}</h3>
          <p>Expired Items</p>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div style={{ 
        background: '#f9fafb', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        marginBottom: '2rem',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/add-item" className="btn btn-primary" style={{ textAlign: 'center' }}>
            🍽️ Add Food Item
          </Link>
          <Link to="/add-location" className="btn btn-secondary" style={{ textAlign: 'center' }}>
            📍 Add Location
          </Link>
          <Link to="/add-category" className="btn btn-secondary" style={{ textAlign: 'center' }}>
            🏷️ Add Category
          </Link>
          <button 
            onClick={() => alert('Cleanup expired items! (Demo mode)')}
            className="btn btn-danger" 
            style={{ textAlign: 'center' }}
          >
            🗑️ Cleanup Expired
          </button>
        </div>
      </div>

      <div className="food-items-grid">
        {foodItems.map((item) => (
          <div key={item.id} className={`food-item-card ${item.status}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h4>{item.name}</h4>
              <span className={`status ${item.status}`}>
                {item.status === 'expiring-soon' ? 'Expiring Soon' : item.status}
              </span>
            </div>
            
            <div className="expiry-date">
              <strong>Expires:</strong> {new Date(item.expiryDate).toLocaleDateString()}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span>{getCategoryIcon(item.category)}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{item.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span>{getLocationIcon(item.location)}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{item.location}</span>
              </div>
              {item.quantity && (
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  <strong>Qty:</strong> {item.quantity}
                </div>
              )}
            </div>

            <div style={{ 
              color: item.status === 'expired' ? '#dc2626' : item.status === 'expiring-soon' ? '#d97706' : '#22c55e',
              fontWeight: '600',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {item.status === 'expired' 
                ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago`
                : item.status === 'expiring-soon'
                ? `${item.daysUntilExpiry} day${item.daysUntilExpiry !== 1 ? 's' : ''} left`
                : `${item.daysUntilExpiry} days remaining`
              }
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link 
                to={`/item/${item.id}`}
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.5rem', flex: 1, textAlign: 'center' }}
              >
                View Details
              </Link>
              <Link 
                to={`/edit-item/${item.id}`}
                className="btn btn-primary" 
                style={{ fontSize: '0.75rem', padding: '0.5rem', flex: 1, textAlign: 'center' }}
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>

      {foodItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No food items tracked yet.</p>
          <Link to="/add-item" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add Your First Item
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;