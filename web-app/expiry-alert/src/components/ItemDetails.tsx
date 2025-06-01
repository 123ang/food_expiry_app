import React from 'react';
import { Link, useParams } from 'react-router-dom';

interface FoodItem {
  id: string;
  name: string;
  expiryDate: string;
  category: string;
  location: string;
  quantity: string;
  notes: string;
  addedDate: string;
  status: 'fresh' | 'expiring-soon' | 'expired';
  daysUntilExpiry: number;
}

const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Demo data - in real app, you'd fetch this based on ID
  const item: FoodItem = {
    id: id || '1',
    name: 'Organic Milk',
    expiryDate: '2024-01-25',
    category: 'Dairy',
    location: 'Main Refrigerator',
    quantity: '1 gallon',
    notes: 'Keep refrigerated at all times. Opened 3 days ago.',
    addedDate: '2024-01-20',
    status: 'expired',
    daysUntilExpiry: -2
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
    if (item.status === 'expired') {
      return `Expired ${Math.abs(item.daysUntilExpiry)} days ago`;
    } else if (item.status === 'expiring-soon') {
      if (item.daysUntilExpiry === 0) {
        return 'Expires today';
      } else {
        return `Expires in ${item.daysUntilExpiry} day${item.daysUntilExpiry > 1 ? 's' : ''}`;
      }
    } else {
      return `${item.daysUntilExpiry} days left`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return '#22c55e';
      case 'expiring-soon': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Dairy': '🥛',
      'Fruits': '🍎',
      'Vegetables': '🥕',
      'Meat': '🥩',
      'Seafood': '🐟',
      'Bakery': '🍞',
      'Pantry': '🥫',
      'Frozen': '🧊'
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
        <h2>Item Details</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to={`/edit-item/${item.id}`} className="btn btn-primary">
            Edit Item
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className={`food-item-card ${item.status}`} style={{ marginBottom: '2rem' }}>
          {/* Header with name and status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1f2937' }}>
                {item.name}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                {getStatusText(item)}
              </p>
            </div>
            <span 
              className={`status ${item.status}`}
              style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
            >
              {item.status.replace('-', ' ')}
            </span>
          </div>

          {/* Expiry Alert */}
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
                📅 <span>Expiry Information</span>
              </h3>
              <div className="detail-item">
                <strong>Expiry Date:</strong>
                <span style={{ color: getStatusColor(item.status) }}>
                  {formatDate(item.expiryDate)}
                </span>
              </div>
              <div className="detail-item">
                <strong>Days Remaining:</strong>
                <span style={{ color: getStatusColor(item.status) }}>
                  {item.daysUntilExpiry >= 0 ? item.daysUntilExpiry : `Expired ${Math.abs(item.daysUntilExpiry)} days ago`}
                </span>
              </div>
              <div className="detail-item">
                <strong>Added Date:</strong>
                <span>{formatDate(item.addedDate)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#374151' }}>
                📦 <span>Storage Information</span>
              </h3>
              <div className="detail-item">
                <strong>Category:</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getCategoryIcon(item.category)} {item.category}
                </span>
              </div>
              <div className="detail-item">
                <strong>Location:</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getLocationIcon(item.location)} {item.location}
                </span>
              </div>
              <div className="detail-item">
                <strong>Quantity:</strong>
                <span>{item.quantity || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {item.notes && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#374151' }}>
                📝 <span>Notes</span>
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
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Link 
              to={`/edit-item/${item.id}`}
              className="btn btn-primary" 
              style={{ flex: 1, textAlign: 'center' }}
            >
              Edit Item
            </Link>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this item?')) {
                  alert('Item deleted! (Demo mode)');
                }
              }}
              className="btn btn-danger" 
              style={{ flex: 1 }}
            >
              Delete Item
            </button>
            <button 
              onClick={() => alert('Item marked as consumed! (Demo mode)')}
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              Mark as Consumed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails; 