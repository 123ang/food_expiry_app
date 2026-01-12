import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { 
  getCategories,
  deleteCategory,
  Category
} from '../services/postgresApiService';

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentGroup, loading: groupLoading } = useGroup();
  const currentGroupId = currentGroup?.id || null;

  // Load categories when group is available
  useEffect(() => {
    if (!groupLoading && currentGroupId && user) {
      loadCategories();
    } else if (!groupLoading && !currentGroupId) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId, user, groupLoading]);

  const loadCategories = async () => {
    if (!currentGroupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const categoriesData = await getCategories(currentGroupId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`${t('categories.deleteConfirm') || 'Delete'} "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryId);
        toast.success(`${t('alert.success') || 'Success'}: "${categoryName}" ${t('action.delete') || 'deleted'}`);
        await loadCategories(); // Refresh the list
      } catch (error: any) {
        console.error('Error deleting category:', error);
        toast.error(`${t('alert.deleteFailed') || 'Failed to delete'}: ${categoryName}`);
      }
    }
  };

  // Edit category handler - kept for potential future use
  // const handleEditCategory = (categoryId: string) => {
  //   navigate(`/edit-category/${categoryId}`);
  // };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('status.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>{t('status.error') || 'Error'}</h2>
        <p>{error}</p>
        <button onClick={loadCategories} className="btn btn-primary">
          {t('status.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  if (!currentGroupId) {
    return (
      <div className="error-message">
        <h2>{t('status.error') || 'Error'}</h2>
        <p>Unable to load your group. Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          {t('status.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>{t('categories.title') || 'Categories'}</h2>
          <p>{categories.length} {t('categories.title')?.toLowerCase() || 'categories'}</p>
        </div>
        <div className="header-actions">
          <Link to="/add-category" className="btn btn-primary">
            ➕ {t('categories.addNew') || 'Add New'}
          </Link>
          <button onClick={loadCategories} className="btn btn-secondary">
            🔄 {t('status.refresh') || 'Refresh'}
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            ← {t('nav.dashboard') || 'Dashboard'}
          </Link>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <h3>{t('categories.noCategories') || 'No Categories'}</h3>
          <Link to="/add-category" className="btn btn-primary">
            ➕ {t('categories.addNew') || 'Add New Category'}
          </Link>
        </div>
      ) : (
        <div className="items-grid">
          {categories.map((category) => (
            <div key={category.id} className="item-card category-card" style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <div className="item-header" style={{ marginBottom: '1rem' }}>
                <div className="item-title">
                  <div className="category-icon" style={{ 
                    backgroundColor: category.color || '#6366f1',
                    color: 'white',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    fontSize: '1.5rem',
                    marginRight: '1rem',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {category.icon || '📦'}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                      {category.name}
                    </h3>
                    {category.is_default && (
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        Default category
                      </p>
                    )}
                  </div>
                </div>
                <div className="category-actions" style={{ display: 'flex', gap: '0.25rem' }}>
                  <Link
                    to={`/edit-category/${category.id}`}
                    className="btn btn-small btn-secondary"
                    onClick={(e) => e.stopPropagation()}
                    title={t('action.edit') || 'Edit'}
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
                      handleDeleteCategory(category.id!, category.name);
                    }}
                    className="delete-btn"
                    title={t('action.delete') || 'Delete'}
                    disabled={category.is_default}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="item-details" style={{ marginBottom: '1rem' }}>
                <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    🎨 Color:
                  </span>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: category.color || '#6366f1', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}></div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                    {category.color || '#6366f1'}
                  </span>
                </div>
                <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {category.icon || '📦'} Icon used
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
                  {t('common.created') || 'Created'}: {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
                </small>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: category.color || '#6366f1',
                  fontWeight: '600'
                }}>
                  {category.icon || '📦'} {category.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryList;
