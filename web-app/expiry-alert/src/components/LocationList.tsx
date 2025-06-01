import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Location {
  id: string;
  name: string;
  description: string;
  temperature: 'room' | 'refrigerated' | 'frozen';
  itemCount: number;
}

const LocationList: React.FC = () => {
  // Demo data for locations
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Main Refrigerator',
      description: 'Primary fridge in kitchen',
      temperature: 'refrigerated',
      itemCount: 8
    },
    {
      id: '2',
      name: 'Pantry',
      description: 'Dry goods storage',
      temperature: 'room',
      itemCount: 12
    },
    {
      id: '3',
      name: 'Freezer',
      description: 'Frozen foods storage',
      temperature: 'frozen',
      itemCount: 6
    },
    {
      id: '4',
      name: 'Counter',
      description: 'Kitchen counter for fruits',
      temperature: 'room',
      itemCount: 4
    }
  ]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      setLocations(locations.filter(location => location.id !== id));
    }
  };

  const getTemperatureIcon = (temperature: string) => {
    switch (temperature) {
      case 'refrigerated': return '🧊';
      case 'frozen': return '❄️';
      case 'room': return '🌡️';
      default: return '📍';
    }
  };

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'refrigerated': return '#3b82f6';
      case 'frozen': return '#8b5cf6';
      case 'room': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>Storage Locations</h2>
        <Link to="/add-location" className="btn btn-primary">
          + Add Location
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{locations.length}</h3>
          <p>Total Locations</p>
        </div>
        <div className="stat-card">
          <h3>{locations.reduce((sum, loc) => sum + loc.itemCount, 0)}</h3>
          <p>Items Stored</p>
        </div>
        <div className="stat-card">
          <h3>{locations.filter(loc => loc.temperature === 'refrigerated').length}</h3>
          <p>Refrigerated</p>
        </div>
        <div className="stat-card">
          <h3>{locations.filter(loc => loc.temperature === 'frozen').length}</h3>
          <p>Frozen Storage</p>
        </div>
      </div>

      <div className="food-items-grid">
        {locations.map((location) => (
          <div key={location.id} className="food-item-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>
                {getTemperatureIcon(location.temperature)}
              </span>
              <h4 style={{ margin: 0 }}>{location.name}</h4>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {location.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span 
                className="status"
                style={{ 
                  background: `${getTemperatureColor(location.temperature)}20`,
                  color: getTemperatureColor(location.temperature),
                  textTransform: 'capitalize'
                }}
              >
                {location.temperature}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {location.itemCount} items
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link 
                to={`/edit-location/${location.id}`}
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.5rem', flex: 1, textAlign: 'center' }}
              >
                Edit
              </Link>
              <button 
                onClick={() => handleDelete(location.id)}
                className="btn btn-danger" 
                style={{ fontSize: '0.75rem', padding: '0.5rem', flex: 1 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No storage locations added yet.</p>
          <Link to="/add-location" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add Your First Location
          </Link>
        </div>
      )}
    </div>
  );
};

export default LocationList; 