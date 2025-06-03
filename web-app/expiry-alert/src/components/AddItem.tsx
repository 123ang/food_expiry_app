import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FoodItemsService, 
  CategoriesService, 
  LocationsService,
  FoodItem,
  Category,
  Location 
} from '../services/firestoreService';

const AddItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    category: '',
    location: '',
    quantity: '',
    notes: '',
    reminderDays: 3
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (isEditing && id && user) {
      loadExistingItem();
    }
  }, [isEditing, id, user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoadingData(true);
    try {
      const [categoriesData, locationsData] = await Promise.all([
        CategoriesService.getUserCategories(user.uid),
        LocationsService.getUserLocations(user.uid)
      ]);
      
      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading categories and locations:', error);
      setError('Failed to load categories and locations');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadExistingItem = async () => {
    if (!id || !user) return;
    
    setIsLoading(true);
    try {
      const item = await FoodItemsService.getItem(id);
      if (item) {
        setFormData({
          name: item.name,
          expiryDate: item.expiryDate,
          category: item.category,
          location: item.location,
          quantity: item.quantity,
          notes: item.notes,
          reminderDays: item.reminderDays || 3
        });
      } else {
        setError(t('foodItems.notFound') || 'Item not found');
      }
    } catch (error) {
      console.error('Error loading item:', error);
      setError('Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t('validation.nameRequired'));
      return false;
    }
    if (!formData.expiryDate) {
      setError(t('validation.dateRequired'));
      return false;
    }
    if (!formData.category) {
      setError(t('validation.categoryRequired'));
      return false;
    }
    if (!formData.location) {
      setError(t('validation.locationRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    const today = new Date();
    const expiry = new Date(formData.expiryDate);
    
    if (expiry < today) {
      const confirmAdd = window.confirm(
        'The expiry date is in the past. This item appears to be expired. Do you still want to add it?'
      );
      if (!confirmAdd) {
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isEditing && id) {
        await FoodItemsService.updateItem(id, formData);
        alert(`${t('alert.success')}: ${t('foodItems.edit')}`);
      } else {
        const itemData = {
          ...formData,
          userId: user.uid
        };
        await FoodItemsService.addItem(itemData, user.uid);
        alert(`${t('alert.success')}: ${t('foodItems.save')}`);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving item:', error);
      setError(isEditing ? 'Failed to update item' : 'Failed to create item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (isLoadingData) {
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
        <h2>{isEditing ? t('foodItems.edit') : t('foodItems.addNew')}</h2>
        <Link to="/dashboard" className="btn btn-secondary">← {t('common.cancel')}</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('foodItems.name')} *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder={t('foodItems.name')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">{t('foodItems.expiryDate')} *</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              className="form-control"
              value={formData.expiryDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">{t('foodItems.category')} *</label>
            <select
              id="category"
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('foodItems.category')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Don't see your category? <Link to="/add-category" style={{ color: '#22c55e' }}>{t('categories.addNew')}</Link>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="location">{t('foodItems.location')} *</label>
            <select
              id="location"
              name="location"
              className="form-control"
              value={formData.location}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('foodItems.location')}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.temperature === 'frozen' ? '❄️' : loc.temperature === 'refrigerated' ? '🧊' : '🏠'} {loc.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Need a new location? <Link to="/add-location" style={{ color: '#22c55e' }}>{t('locations.addNew')}</Link>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">{t('foodItems.quantity')}</label>
            <input
              type="text"
              id="quantity"
              name="quantity"
              className="form-control"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder={t('foodItems.quantity')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reminderDays">{t('foodItems.reminderDays')}</label>
            <input
              type="number"
              id="reminderDays"
              name="reminderDays"
              className="form-control"
              value={formData.reminderDays}
              onChange={handleInputChange}
              min="1"
              max="30"
              placeholder="3"
            />
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Number of days before expiry to remind you (default: 3 days)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">{t('foodItems.notes')}</label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder={t('foodItems.notes')}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? t('status.loading') : (isEditing ? t('foodItems.save') : t('foodItems.save'))}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>
              {t('foodItems.cancel')}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Tips:</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li>Be specific with item names for easy identification</li>
            <li>Double-check expiry dates to avoid mistakes</li>
            <li>Use the notes field for special storage instructions</li>
            <li>Set reminder days based on how quickly you use the item</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddItem; 