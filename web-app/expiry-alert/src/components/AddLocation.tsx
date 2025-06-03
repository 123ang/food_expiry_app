import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LocationsService, Location } from '../services/firestoreService';

const AddLocation: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();

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
          description: location.description
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

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Tips for Storage Locations:</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li><strong>Refrigerated:</strong> Fridge, refrigerator, cold storage</li>
            <li><strong>Frozen:</strong> Freezer, deep freeze, ice chest</li>
            <li><strong>Room Temperature:</strong> Pantry, counter, cupboards, cabinet</li>
            <li>Be specific with names to easily identify locations</li>
            <li>Use descriptive names like "Kitchen Pantry" or "Main Fridge"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddLocation; 