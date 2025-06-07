import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CategoriesService } from '../services/firestoreService';
import { CATEGORY_EMOJIS } from '../constants/emojis';
import EmojiSelector from './EmojiSelector';

const AddCategory: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🍎',
    color: '#FF6B6B'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Emoji constants are now handled by the EmojiSelector component

  const extendedColors = [
    // Transparent option
    { name: 'Transparent', value: 'transparent', preview: 'rgba(0,0,0,0.1)' },
    
    // Primary Colors
    { name: 'Red', value: '#FF6B6B', preview: '#FF6B6B' },
    { name: 'Pink', value: '#FF9FF3', preview: '#FF9FF3' },
    { name: 'Orange', value: '#FF9F43', preview: '#FF9F43' },
    { name: 'Yellow', value: '#FECA57', preview: '#FECA57' },
    { name: 'Green', value: '#1DD1A1', preview: '#1DD1A1' },
    { name: 'Teal', value: '#4ECDC4', preview: '#4ECDC4' },
    { name: 'Blue', value: '#45B7D1', preview: '#45B7D1' },
    { name: 'Purple', value: '#A29BFE', preview: '#A29BFE' },
    
    // Pastel Colors
    { name: 'Light Pink', value: '#FFB3BA', preview: '#FFB3BA' },
    { name: 'Light Orange', value: '#FFDFBA', preview: '#FFDFBA' },
    { name: 'Light Yellow', value: '#FFFFBA', preview: '#FFFFBA' },
    { name: 'Light Green', value: '#BAFFC9', preview: '#BAFFC9' },
    { name: 'Light Blue', value: '#BAE1FF', preview: '#BAE1FF' },
    { name: 'Light Purple', value: '#E1BAFF', preview: '#E1BAFF' },
    
    // Dark Colors
    { name: 'Dark Red', value: '#C0392B', preview: '#C0392B' },
    { name: 'Dark Green', value: '#27AE60', preview: '#27AE60' },
    { name: 'Dark Blue', value: '#2980B9', preview: '#2980B9' },
    { name: 'Dark Purple', value: '#8E44AD', preview: '#8E44AD' },
    
    // Neutral Colors
    { name: 'Gray', value: '#95A5A6', preview: '#95A5A6' },
    { name: 'Dark Gray', value: '#34495E', preview: '#34495E' },
    { name: 'Brown', value: '#8B4513', preview: '#8B4513' },
    { name: 'Black', value: '#2C3E50', preview: '#2C3E50' }
  ];

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    if (!id || !user) return;
    
    setIsLoading(true);
    try {
      const category = await CategoriesService.getCategory(id);
      if (category) {
        setFormData({
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color
        });
      } else {
        setError('Category not found');
      }
    } catch (error) {
      console.error('Error loading category:', error);
      setError('Failed to load category');
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isEditing && id) {
        await CategoriesService.updateCategory(id, formData);
        alert(`${t('alert.success')}: ${t('categories.edit')}`);
      } else {
        const categoryData = {
          ...formData,
          userId: user.uid
        };
        await CategoriesService.addCategory(categoryData, user.uid);
        alert(`${t('alert.success')}: ${t('categories.save')}`);
      }
      navigate('/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      setError(isEditing ? 'Failed to update category' : 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/categories');
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
    <div className="add-category">
      <div className="page-header">
        <div className="header-content">
          <h1>{isEditing ? t('categories.edit') : t('categories.addNew')}</h1>
          <p>{isEditing ? t('categories.edit') : t('categories.addNew')}</p>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="category-form">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t('categories.name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('categories.name')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              {t('categories.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder={t('categories.description')}
              rows={3}
            />
          </div>

          <div className="form-group">
            <EmojiSelector
              selectedEmoji={formData.icon}
              onEmojiSelect={handleIconSelect}
              backgroundColor={formData.color}
            />
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
                value={formData.color}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="color-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              {t('categories.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? t('status.loading') : (isEditing ? t('categories.save') : t('categories.save'))}
            </button>
          </div>
        </form>

        {/* Preview Card */}
        <div className="category-preview">
          <h3>{t('categories.preview')}</h3>
          <div className="category-card preview">
            <div className="category-header">
              <div 
                className="category-icon" 
                style={{ 
                  backgroundColor: formData.color,
                  border: formData.color === 'transparent' ? '2px dashed #ccc' : 'none'
                }}
              >
                {formData.icon}
              </div>
            </div>
            <div className="category-content">
              <h3>{formData.name || t('categories.name')}</h3>
              <p>{formData.description || t('categories.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategory; 