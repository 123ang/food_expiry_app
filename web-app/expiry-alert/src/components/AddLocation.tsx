import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LocationsService } from '../services/firestoreService';
import { LOCATION_EMOJIS } from '../constants/emojis';

const AddLocation: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📍',
    color: '#45B7D1'
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Use the centralized location emoji constants
  const storageLocationIcons = LOCATION_EMOJIS.map(item => item.emoji);

  const extendedColors = [
    // Transparent option
    { name: 'Transparent', value: 'transparent', preview: 'rgba(0,0,0,0.1)' },
    
    // Primary Colors  
    { name: 'Blue', value: '#45B7D1', preview: '#45B7D1' },
    { name: 'Teal', value: '#4ECDC4', preview: '#4ECDC4' },
    { name: 'Green', value: '#1DD1A1', preview: '#1DD1A1' },
    { name: 'Purple', value: '#A29BFE', preview: '#A29BFE' },
    { name: 'Red', value: '#FF6B6B', preview: '#FF6B6B' },
    { name: 'Orange', value: '#FF9F43', preview: '#FF9F43' },
    { name: 'Yellow', value: '#FECA57', preview: '#FECA57' },
    { name: 'Pink', value: '#FF9FF3', preview: '#FF9FF3' },
    
    // Cool Colors (for refrigerated)
    { name: 'Ice Blue', value: '#E3F2FD', preview: '#E3F2FD' },
    { name: 'Frost', value: '#F1F8E9', preview: '#F1F8E9' },
    { name: 'Cool Gray', value: '#ECEFF1', preview: '#ECEFF1' },
    { name: 'Arctic', value: '#E8F5E8', preview: '#E8F5E8' },
    
    // Warm Colors (for pantry/room temp)
    { name: 'Warm Beige', value: '#FFF8E1', preview: '#FFF8E1' },
    { name: 'Cream', value: '#FFFDE7', preview: '#FFFDE7' },
    { name: 'Light Brown', value: '#EFEBE9', preview: '#EFEBE9' },
    { name: 'Sand', value: '#FDF4E3', preview: '#FDF4E3' },
    
    // Dark Colors
    { name: 'Dark Blue', value: '#2980B9', preview: '#2980B9' },
    { name: 'Dark Green', value: '#27AE60', preview: '#27AE60' },
    { name: 'Dark Gray', value: '#34495E', preview: '#34495E' },
    { name: 'Brown', value: '#8B4513', preview: '#8B4513' }
  ];

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadLocation();
    }
  }, [id]);

  const loadLocation = async () => {
    if (!id || !user) return;
    
    setIsLoading(true);
    try {
      const location = await LocationsService.getLocation(id);
      if (location) {
        setFormData({
          name: location.name,
          description: location.description,
          icon: location.icon || '📍',
          color: location.color || '#45B7D1'
        });
      } else {
        setError('Location not found');
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setError('Failed to load location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t('validation.nameRequired'));
      return false;
    }
    if (!formData.description.trim()) {
      setError(t('validation.required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isEditing && id) {
        await LocationsService.updateLocation(id, formData);
        alert(`${t('alert.success')}: ${t('locations.edit')}`);
      } else {
        const locationData = {
          ...formData,
          userId: user.uid
        };
        await LocationsService.addLocation(locationData, user.uid);
        alert(`${t('alert.success')}: ${t('locations.save')}`);
      }
      navigate('/locations');
    } catch (error) {
      console.error('Error saving location:', error);
      setError(isEditing ? 'Failed to update location' : 'Failed to create location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/locations');
  };

  if (isEditing && isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>{isEditing ? t('locations.edit') : t('locations.addNew')}</h2>
        <Link to="/locations" className="btn btn-secondary">← {t('common.cancel')}</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('locations.name')} *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder={t('locations.name')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('locations.description')} *</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder={t('locations.description')}
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('categories.icon')}
            </label>
            <div className="icon-selector">
              <div 
                className="selected-icon" 
                style={{ 
                  backgroundColor: formData.color,
                  border: formData.color === 'transparent' ? '2px dashed #ccc' : 'none'
                }}
              >
                {formData.icon}
              </div>
              <div className="icon-grid">
                {storageLocationIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className={`icon-option ${formData.icon === icon ? 'active' : ''}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('categories.color')}
            </label>
            <div className="color-selector">
              <div 
                className="color-preview" 
                style={{ 
                  backgroundColor: formData.color,
                  border: formData.color === 'transparent' ? '2px dashed #ccc' : 'none'
                }}
              >
                <span>{formData.icon}</span>
              </div>
              <div className="color-grid">
                {extendedColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => handleColorSelect(colorOption.value)}
                    className={`color-option ${formData.color === colorOption.value ? 'active' : ''}`}
                    style={{ backgroundColor: colorOption.preview }}
                    title={colorOption.name}
                  >
                    {colorOption.value === 'transparent' && (
                      <span style={{ fontSize: '12px', color: '#666' }}>∅</span>
                    )}
                  </button>
                ))}
              </div>
              <input
                type="color"
                value={formData.color === 'transparent' ? '#ffffff' : formData.color}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="color-input"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? t('status.loading') : (isEditing ? t('locations.save') : t('locations.save'))}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>
              {t('locations.cancel')}
            </button>
          </div>
        </form>

        {/* Preview Card */}
        <div className="location-preview" style={{ marginTop: '2rem' }}>
          <h3>{t('categories.preview')}</h3>
          <div className="location-card preview" style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div 
              className="location-icon" 
              style={{ 
                backgroundColor: formData.color,
                border: formData.color === 'transparent' ? '2px dashed #ccc' : 'none',
                borderRadius: '8px',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}
            >
              {formData.icon}
            </div>
            <div className="location-content">
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                {formData.name || t('locations.name')}
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                {formData.description || t('locations.description')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Tips for Storage Locations:</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li><strong>Refrigerated:</strong> Fridge, refrigerator, cold storage (❄️🧊)</li>
            <li><strong>Frozen:</strong> Freezer, deep freeze, ice chest (🧊❄️)</li>
            <li><strong>Pantry:</strong> Dry storage, cupboard, cabinet (📦🏺)</li>
            <li><strong>Counter:</strong> Room temperature, fruit bowl (🍎🍌)</li>
            <li>Use icons and colors to easily identify storage types</li>
            <li>Choose transparent backgrounds for minimal designs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddLocation; 