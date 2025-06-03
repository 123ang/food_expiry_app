import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CategoriesService, Category } from '../services/firestoreService';

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

  const commonIcons = [
    '🍎', '🍇', '🥕', '🥛', '🥩', '🍞', '🥤', '🍿', 
    '🧊', '🐟', '🌶️', '🍰', '🌾', '🥫', '🍋', '🍌',
    '🥔', '🧄', '🧅', '🥬', '🍅', '🥒', '🌽', '🥑'
  ];

  const commonColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#1DD1A1', '#FD79A8', '#A29BFE', '#6C5CE7', '#E17055'
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
        await CategoriesService.addCategory(formData, user.uid);
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
            <label className="form-label">
              {t('categories.icon')}
            </label>
            <div className="icon-selector">
              <div className="selected-icon" style={{ backgroundColor: formData.color }}>
                {formData.icon}
              </div>
              <div className="icon-grid">
                {commonIcons.map((icon) => (
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
              <div className="color-preview" style={{ backgroundColor: formData.color }}>
                <span>{formData.icon}</span>
              </div>
              <div className="color-grid">
                {commonColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`color-option ${formData.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
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
              <div className="category-icon" style={{ backgroundColor: formData.color }}>
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