import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGroup } from '../contexts/GroupContext';
import { 
  getWishItems,
  WishItem
} from '../services/postgresApiService';
import { WishList } from './WishList';

const WishListPage: React.FC = () => {
  const [wishItems, setWishItems] = useState<WishItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useGroup();
  const currentGroupId = currentGroup?.id || null;

  // Load items when group is available
  useEffect(() => {
    if (!groupLoading && currentGroupId) {
      loadItems();
    } else if (!groupLoading && !currentGroupId) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId, groupLoading]);

  const loadItems = useCallback(async () => {
    if (!currentGroupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const wish = await getWishItems(currentGroupId);
      setWishItems(wish);
    } catch (error: any) {
      console.error('Failed to load items:', error);
      setError(error?.message || t('lists.loadFailed') || 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroupId, t]);

  if (groupLoading || isLoading) {
    return (
      <div className="lists" style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
        <div className="loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('status.loading') || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="lists" style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
        <div className="dashboard-header" style={{ backgroundColor: theme.headerBackground, borderBottomColor: theme.borderColor }}>
          <div className="header-content">
            <h1 style={{ color: theme.textColor }}>⭐ {t('lists.wishList') || 'Wish List'}</h1>
            <p style={{ color: theme.textSecondary }}>{t('groups.noGroup') || 'No group selected. Please select a group first.'}</p>
          </div>
          <div className="header-actions">
            <Link to="/groups" className="btn btn-primary">
              👥 {t('groups.manageGroups') || 'Manage Groups'}
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              ← {t('nav.dashboard') || 'Back to Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentGroupId) {
    return (
      <div className="lists" style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
        <div className="dashboard-header" style={{ backgroundColor: theme.headerBackground, borderBottomColor: theme.borderColor }}>
          <div className="header-content">
            <h1 style={{ color: theme.textColor }}>⭐ {t('lists.wishList') || 'Wish List'}</h1>
          </div>
          <div className="header-actions">
            <Link to="/dashboard" className="btn btn-secondary">
              ← {t('nav.dashboard') || 'Back to Dashboard'}
            </Link>
          </div>
        </div>
        <div className="error-message">
          <h2>⚠️ {t('status.error') || 'Error'}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            {t('actions.retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lists" style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
      <div className="dashboard-header" style={{ backgroundColor: theme.headerBackground, borderBottomColor: theme.borderColor }}>
        <div className="header-content">
          <h1 style={{ color: theme.textColor }}>⭐ {t('lists.wishList') || 'Wish List'}</h1>
          <p style={{ color: theme.textSecondary }}>{t('lists.description') || 'Manage your wish list'}</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary">
            ← {t('nav.dashboard') || 'Back to Dashboard'}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            <p>{error}</p>
            <button onClick={loadItems} className="btn btn-primary">
              {t('actions.retry') || 'Retry'}
            </button>
          </div>
        )}
        
        {currentGroupId && (
          <WishList 
            items={wishItems} 
            groupId={currentGroupId}
            onItemsChange={loadItems} 
          />
        )}
      </div>
    </div>
  );
};

export default WishListPage;
