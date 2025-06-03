import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LocationsService, FoodItemsService, Location } from '../services/firestoreService';

const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [itemCounts, setItemCounts] = useState<{ [locationId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadLocations();
  }, [user]);

  const loadLocations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [locationsData, itemsData] = await Promise.all([
        LocationsService.getUserLocations(user.uid),
        FoodItemsService.getUserItems(user.uid)
      ]);
      
      setLocations(locationsData);
      
      // Calculate item counts per location using IDs
      const counts: { [locationId: string]: number } = {};
      
      itemsData.forEach(item => {
        const locationId = item.locationId;
        if (locationId) {
          counts[locationId] = (counts[locationId] || 0) + 1;
        }
      });
      
      setItemCounts(counts);
      
    } catch (error) {
      console.error('Error loading locations:', error);
      setError('Failed to load locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (window.confirm(`${t('locations.deleteConfirm')} "${locationName}"?`)) {
      try {
        await LocationsService.deleteLocation(locationId);
        await loadLocations(); // Refresh the list
        alert(`${t('alert.success')}: "${locationName}" ${t('action.delete')}`);
      } catch (error) {
        console.error('Error deleting location:', error);
        alert(`${t('alert.deleteFailed')}: ${locationName}`);
      }
    }
  };

  const handleEditLocation = (locationId: string) => {
    navigate(`/edit-location/${locationId}`);
  };

  const getLocationIcon = (locationName: string) => {
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
    
    const lowerName = locationName.toLowerCase();
    
    // Direct match
    if (icons[locationName]) return icons[locationName];
    
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
    
    return '📍'; // Default location icon
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
      <div className="container">
        <div className="error-message">
          <h2>{t('status.error')}</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={loadLocations} className="btn btn-primary">
              {t('status.retry')}
            </button>
            <Link to="/dashboard" className="btn btn-secondary">
              ← {t('nav.dashboard')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalItems = Object.values(itemCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>{t('locations.title')}</h2>
          <p>{locations.length} {t('locations.title').toLowerCase()}</p>
        </div>
        <div className="header-actions">
          <Link to="/add-location" className="btn btn-primary">
            ➕ {t('locations.addNew')}
          </Link>
          <button onClick={loadLocations} className="btn btn-secondary">
            🔄 {t('status.refresh')}
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            ← {t('nav.dashboard')}
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <h3>{t('status.total')}</h3>
            <span className="stat-icon">📍</span>
          </div>
          <div className="stat-number">{locations.length}</div>
          <div className="stat-label">{t('locations.title')}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <h3>{t('status.items')}</h3>
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-number">{totalItems}</div>
          <div className="stat-label">{t('status.itemsStored')}</div>
        </div>
        
        
      </div>

      {locations.length === 0 ? (
        <div className="empty-state">
          <h3>{t('locations.noLocations')}</h3>
          <Link to="/add-location" className="btn btn-primary">
            ➕ {t('locations.addNew')}
          </Link>
        </div>
      ) : (
        <div className="items-grid">
          {locations.map((location) => (
            <div key={location.id} className="item-card location-card" style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <div className="item-header" style={{ marginBottom: '1rem' }}>
                <div className="item-title">
                  <div className="category-icon" style={{ 
                    backgroundColor: '#6366f1',
                    color: 'white',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    fontSize: '1.5rem',
                    marginRight: '1rem'
                  }}>
                    {getLocationIcon(location.name)}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                      {location.name}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {location.description}
                    </p>
                  </div>
                </div>
                <div className="location-actions" style={{ display: 'flex', gap: '0.25rem' }}>
                  <Link
                    to={`/edit-location/${location.id}`}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocation(location.id!, location.name);
                    }}
                    className="delete-btn"
                    title={t('action.delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="item-details" style={{ marginBottom: '1rem' }}>
                <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    📦 Items stored:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    {itemCounts[location.id!] || 0} {t('status.items').toLowerCase()}
                  </span>
                </div>
              </div>
              
              <div className="item-status" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6'
              }}>
                <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  {t('common.created')}: {new Date(location.createdAt).toLocaleDateString()}
                </small>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#6366f1',
                  fontWeight: '600'
                }}>
                  {getLocationIcon(location.name)} {location.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationList; 