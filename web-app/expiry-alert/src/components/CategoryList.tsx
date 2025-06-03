import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CategoriesService, Category } from '../services/firestoreService';

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const categoriesData = await CategoriesService.getUserCategories(user.uid);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`${t('categories.deleteConfirm')} "${categoryName}"?`)) {
      try {
        await CategoriesService.deleteCategory(categoryId);
        await loadCategories(); // Refresh the list
        alert(`${t('alert.success')}: "${categoryName}" ${t('action.delete')}`);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(`${t('alert.deleteFailed')}: ${categoryName}`);
      }
    }
  };

  const handleEditCategory = (categoryId: string) => {
    navigate(`/edit-category/${categoryId}`);
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
      <div className="error-message">
        <h2>{t('status.error')}</h2>
        <p>{error}</p>
        <button onClick={loadCategories} className="btn btn-primary">
          {t('status.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="category-list">
      <div className="page-header">
        <div className="header-content">
          <h1>{t('categories.title')}</h1>
          <p>{categories.length} {t('categories.title').toLowerCase()}</p>
        </div>
        <div className="header-actions">
          <Link to="/add-category" className="btn btn-primary">
            ➕ {t('categories.addNew')}
          </Link>
          <button onClick={loadCategories} className="btn btn-secondary">
            🔄 {t('status.refresh')}
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <h3>{t('categories.noCategories')}</h3>
          <Link to="/add-category" className="btn btn-primary">
            ➕ {t('categories.addNew')}
          </Link>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <div className="category-icon" style={{ backgroundColor: category.color }}>
                  {category.icon}
                </div>
                <div className="category-actions">
                  <button
                    onClick={() => handleEditCategory(category.id!)}
                    className="btn btn-small btn-secondary"
                    title={t('action.edit')}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id!, category.name)}
                    className="btn btn-small btn-danger"
                    title={t('action.delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              
              <div className="category-meta">
                <small>
                  {t('common.created')}: {new Date(category.createdAt).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryList; 