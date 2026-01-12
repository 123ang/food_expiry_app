import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getGroups,
  getShoppingItems,
  getWishItems,
  ShoppingItem,
  WishItem
} from '../services/postgresApiService';
import { ShoppingList } from './ShoppingList';
import { WishList } from './WishList';

type Tab = 'shopping' | 'wish';

const Lists: React.FC = () => {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shopping');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [wishItems, setWishItems] = useState<WishItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Load group on mount
  useEffect(() => {
    const loadGroup = async () => {
      if (!user) return;
      
      try {
        const groups = await getGroups();
        if (groups.length > 0) {
          setCurrentGroupId(groups[0].id);
        } else {
          setError(t('lists.noGroup') || 'No group found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading group:', error);
        setError(t('lists.loadGroupFailed') || 'Failed to load group');
        setIsLoading(false);
      }
    };
    
    loadGroup();
  }, [user, t]);

  // Load items when group is available
  useEffect(() => {
    if (currentGroupId) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId]);

  const loadItems = useCallback(async () => {
    if (!currentGroupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [shopping, wish] = await Promise.all([
        getShoppingItems(currentGroupId, true), // Include purchased items
        getWishItems(currentGroupId),
      ]);
      
      setShoppingItems(shopping);
      setWishItems(wish);
    } catch (error: any) {
      console.error('Failed to load items:', error);
      setError(error?.message || t('lists.loadFailed') || 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroupId, t]);

  if (isLoading) {
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

  if (error && !currentGroupId) {
    return (
      <div className="lists" style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
        <div className="dashboard-header" style={{ backgroundColor: theme.headerBackground, borderBottomColor: theme.borderColor }}>
          <div className="header-content">
            <h1 style={{ color: theme.textColor }}>📋 {t('lists.title') || 'Lists'}</h1>
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
          <h1 style={{ color: theme.textColor }}>📋 {t('lists.title') || 'Lists'}</h1>
          <p style={{ color: theme.textSecondary }}>{t('lists.description') || 'Manage your shopping list and wish list'}</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary">
            ← {t('nav.dashboard') || 'Back to Dashboard'}
          </Link>
        </div>
      </div>

      {/* Tab Container */}
      <div style={{ 
        display: 'flex', 
        borderBottom: `1px solid ${theme.borderColor}`,
        backgroundColor: theme.cardBackground
      }}>
        <button
          onClick={() => setActiveTab('shopping')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            borderBottom: activeTab === 'shopping' ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'shopping' ? theme.primaryColor : theme.textColor,
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'shopping' ? 600 : 400,
            transition: 'all 0.2s ease',
          }}
        >
          🛒 {t('lists.shoppingList') || 'Shopping List'}
        </button>
        <button
          onClick={() => setActiveTab('wish')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            borderBottom: activeTab === 'wish' ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'wish' ? theme.primaryColor : theme.textColor,
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'wish' ? 600 : 400,
            transition: 'all 0.2s ease',
          }}
        >
          ⭐ {t('lists.wishList') || 'Wish List'}
        </button>
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
        
        {activeTab === 'shopping' ? (
          <ShoppingList 
            items={shoppingItems} 
            groupId={currentGroupId!}
            onItemsChange={loadItems} 
          />
        ) : (
          <WishList 
            items={wishItems} 
            groupId={currentGroupId!}
            onItemsChange={loadItems} 
          />
        )}
      </div>
    </div>
  );
};

export default Lists;
