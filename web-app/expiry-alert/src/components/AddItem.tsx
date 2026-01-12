import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { 
  getFoodItemById,
  addFoodItem,
  updateFoodItem,
  getCategories,
  getLocations,
  Category,
  Location,
  FoodItem
} from '../services/postgresApiService';
import ImageUpload from './ImageUpload';

const AddItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentGroup, loading: groupLoading } = useGroup();
  const currentGroupId = currentGroup?.id || null;
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    locationId: '',
    expiryDate: '',
    quantity: '',
    notes: '',
    reminderDays: '3'
  });
  const [imageData, setImageData] = useState({
    imageId: '',
    imageUrl: '',
    imageThumbnail: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load categories and locations when group is available
  useEffect(() => {
    if (!groupLoading && currentGroupId && user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId, user, groupLoading]);

  // Load item data when editing
  useEffect(() => {
    if (isEditing && id && currentGroupId) {
      loadItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, id, currentGroupId]);

  const loadData = async () => {
    if (!currentGroupId) return;
    
    setIsLoadingData(true);
    try {
      const [categoriesData, locationsData] = await Promise.all([
        getCategories(currentGroupId),
        getLocations(currentGroupId)
      ]);
      
      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading categories and locations:', error);
      setError(t('foodItems.loadCategoriesFailed'));
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadItem = async () => {
    if (!id || !currentGroupId) return;
    
    setIsLoading(true);
    try {
      const item = await getFoodItemById(id);
      if (item) {
        setFormData({
          name: item.name,
          categoryId: item.category_id || '',
          locationId: item.location_id || '',
          expiryDate: item.expiry_date || '',
          quantity: item.quantity.toString(),
          notes: item.notes || '',
          reminderDays: '3' // PostgreSQL doesn't store reminderDays, use default
        });
        setImageData({
          imageId: '',
          imageUrl: item.image_url || '',
          imageThumbnail: item.image_url || ''
        });
      } else {
        setError(t('foodItems.notFound'));
      }
    } catch (error) {
      console.error('Error loading item:', error);
      setError(t('foodItems.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleImageUploaded = (fileId: string, imageUrl: string) => {
    setImageData({
      imageId: fileId,
      imageUrl: imageUrl,
      imageThumbnail: imageUrl // We can use the same URL for now
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t('validation.nameRequired') || 'Name is required');
      return false;
    }
    if (!formData.categoryId) {
      setError(t('validation.categoryRequired') || 'Category is required');
      return false;
    }
    if (!formData.locationId) {
      setError(t('validation.locationRequired') || 'Location is required');
      return false;
    }
    if (!formData.expiryDate) {
      setError(t('validation.dateRequired') || 'Expiry date is required');
      return false;
    }
    if (!formData.quantity.trim()) {
      setError(t('validation.quantityRequired') || 'Quantity is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentGroupId || !validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const quantity = parseFloat(formData.quantity) || 1;
      
      const itemData: Partial<FoodItem> = {
        name: formData.name.trim(),
        group_id: currentGroupId,
        category_id: formData.categoryId || undefined,
        location_id: formData.locationId || undefined,
        expiry_date: formData.expiryDate || undefined,
        quantity: quantity,
        unit: 'unit', // Default unit
        notes: formData.notes.trim() || undefined,
        image_url: imageData.imageUrl || undefined,
        original_quantity: quantity,
        remaining_quantity: quantity,
        is_consumed: false,
        usage_frequency: 0,
        version: 0,
        sync_status: 'pending'
      };
      
      if (isEditing && id) {
        await updateFoodItem(id, itemData);
        toast.success(`${t('alert.success') || 'Success'}: ${t('foodItems.edit') || 'Item updated'}`);
      } else {
        await addFoodItem(itemData);
        toast.success(`${t('alert.success') || 'Success'}: ${t('foodItems.save') || 'Item saved'}`);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving item:', error);
      const errorMessage = error?.message || (isEditing ? t('foodItems.updateFailed') : t('foodItems.createFailed'));
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (groupLoading || isLoadingData) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('status.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>{isEditing ? t('foodItems.edit') : t('foodItems.addNew')}</h1>
            <p>{t('groups.noGroup') || 'No group selected. Please select a group first.'}</p>
          </div>
          <div className="header-actions">
            <Link to="/groups" className="btn btn-primary">
              👥 {t('groups.manageGroups') || 'Manage Groups'}
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">← {t('common.back') || 'Back'}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>{isEditing ? t('foodItems.edit') || 'Edit Item' : t('foodItems.addNew') || 'Add New Item'}</h2>
        <Link to="/dashboard" className="btn btn-secondary">← {t('common.cancel') || 'Cancel'}</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('foodItems.name') || 'Name'} *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder={t('foodItems.name') || 'Item name'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">{t('foodItems.expiryDate') || 'Expiry Date'} *</label>
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
            <label htmlFor="category">{t('foodItems.category') || 'Category'} *</label>
            <select
              id="category"
              name="categoryId"
              className="form-control"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('foodItems.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {t('foodItems.categoryNotFound')} <Link to="/add-category" style={{ color: '#22c55e' }}>{t('categories.addNew')}</Link>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="location">{t('foodItems.location') || 'Location'} *</label>
            <select
              id="location"
              name="locationId"
              className="form-control"
              value={formData.locationId}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('foodItems.selectLocation')}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.icon} {loc.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {t('foodItems.locationNotFound')} <Link to="/add-location" style={{ color: '#22c55e' }}>{t('locations.addNew')}</Link>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">{t('foodItems.quantity') || 'Quantity'} *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              className="form-control"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="0.1"
              step="0.1"
              placeholder={t('foodItems.quantity') || '1'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reminderDays">{t('foodItems.reminderDays') || 'Reminder Days'}</label>
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
              {t('foodItems.reminderDaysDesc')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">{t('foodItems.notes') || 'Notes'}</label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder={t('foodItems.notes') || 'Additional notes...'}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <ImageUpload
            onImageUploaded={handleImageUploaded}
            itemName={formData.name}
            currentImageId={imageData.imageId}
            currentImageUrl={imageData.imageUrl}
            disabled={isLoading}
          />

          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? t('status.loading') || 'Loading...' : (isEditing ? t('foodItems.save') || 'Save' : t('foodItems.save') || 'Save')}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>
              {t('foodItems.cancel') || 'Cancel'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>{t('foodItems.tips')}</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li>{t('foodItems.tip1')}</li>
            <li>{t('foodItems.tip2')}</li>
            <li>{t('foodItems.tip3')}</li>
            <li>{t('foodItems.tip4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
