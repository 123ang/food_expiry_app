import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getFoodItemById,
  addFoodItem,
  updateFoodItem,
  getCategories,
  getLocations,
  getGroups,
  Category,
  Location,
  FoodItem
} from '../services/postgresApiService';
import FirebaseImageUpload from './FirebaseImageUpload';

const AddItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
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

  // Load group on mount
  useEffect(() => {
    const loadGroup = async () => {
      if (!user) return;
      
      try {
        const groups = await getGroups();
        if (groups.length > 0) {
          setCurrentGroupId(groups[0].id);
        }
      } catch (error) {
        console.error('Error loading group:', error);
      }
    };
    
    loadGroup();
  }, [user]);

  // Load categories and locations when group is available
  useEffect(() => {
    if (currentGroupId && user) {
      loadData();
    }
  }, [currentGroupId, user]);

  // Load item data when editing
  useEffect(() => {
    if (isEditing && id && currentGroupId) {
      loadItem();
    }
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
      setError('Failed to load categories and locations');
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
        setError('Item not found');
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
      const errorMessage = error?.message || (isEditing ? 'Failed to update item' : 'Failed to create item');
      setError(errorMessage);
      toast.error(errorMessage);
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
          <p>{t('status.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!currentGroupId) {
    return (
      <div className="error-message">
        <h2>⚠️ {t('status.error') || 'Error'}</h2>
        <p>Unable to load your group. Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          {t('actions.retry') || 'Retry'}
        </button>
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
              <option value="">{t('foodItems.selectCategory') || 'Select category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Don't see your category? <Link to="/add-category" style={{ color: '#22c55e' }}>{t('categories.addNew') || 'Add New'}</Link>
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
              <option value="">{t('foodItems.selectLocation') || 'Select location'}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.icon} {loc.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Need a new location? <Link to="/add-location" style={{ color: '#22c55e' }}>{t('locations.addNew') || 'Add New'}</Link>
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
              Number of days before expiry to remind you (default: 3 days)
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

          <FirebaseImageUpload
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
