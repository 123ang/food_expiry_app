import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGroup } from '../contexts/GroupContext';
import { 
  getComprehensiveAnalytics,
  ComprehensiveAnalytics
} from '../services/postgresApiService';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(3);
  
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useGroup();
  const currentGroupId = currentGroup?.id || null;

  // Load analytics when group is available
  useEffect(() => {
    if (!groupLoading && currentGroupId) {
      loadAnalytics();
    } else if (!groupLoading && !currentGroupId) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId, months, groupLoading]);

  const loadAnalytics = async () => {
    if (!currentGroupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getComprehensiveAnalytics(currentGroupId, months);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error?.message || t('analytics.loadFailed') || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="analytics">
        <div className="loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('status.loading') || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>📊 {t('nav.analytics') || 'Analytics'}</h1>
            <p>{t('analytics.description') || 'Track your food waste and savings'}</p>
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
          <button onClick={loadAnalytics} className="btn btn-primary">
            {t('actions.retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>📊 {t('nav.analytics') || 'Analytics'}</h1>
            <p>{t('analytics.description') || 'Track your food waste and savings'}</p>
          </div>
          <div className="header-actions">
            <Link to="/dashboard" className="btn btn-secondary">
              ← {t('nav.dashboard') || 'Back to Dashboard'}
            </Link>
          </div>
        </div>
        <div className="empty-state">
          <h3>📊 {t('analytics.noData') || 'No Analytics Data'}</h3>
          <p>{t('analytics.noDataDescription') || 'Start tracking food items to see analytics here.'}</p>
          <Link to="/add-item" className="btn btn-primary btn-large">
            ➕ {t('nav.addItem') || 'Add Item'}
          </Link>
        </div>
      </div>
    );
  }

  const { summary, category_breakdown, location_breakdown, monthly_trends, most_wasted_items, disposal_reasons, expiry_patterns } = analytics;

  return (
    <div className="analytics" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, minHeight: '100vh' }}>
      <div className="dashboard-header" style={{ backgroundColor: theme.headerBackground, borderBottomColor: theme.borderColor }}>
        <div className="header-content">
          <h1 style={{ color: theme.textColor }}>📊 {t('nav.analytics') || 'Analytics'}</h1>
          <p style={{ color: theme.textSecondary }}>{t('analytics.description') || 'Track your food waste and savings'}</p>
        </div>
        <div className="header-actions">
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="form-control"
            style={{ marginRight: '1rem', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${theme.borderColor}`, backgroundColor: theme.cardBackground, color: theme.textColor }}
          >
            <option value={1}>{t('analytics.lastMonth') || 'Last Month'}</option>
            <option value={3}>{t('analytics.last3Months') || 'Last 3 Months'}</option>
            <option value={6}>{t('analytics.last6Months') || 'Last 6 Months'}</option>
            <option value={12}>{t('analytics.lastYear') || 'Last Year'}</option>
          </select>
          <Link to="/dashboard" className="btn btn-secondary">
            ← {t('nav.dashboard') || 'Back to Dashboard'}
          </Link>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Summary Cards */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('analytics.totalItems') || 'Total Items'}</h3>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
            </div>
            <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.primaryColor, marginBottom: '0.5rem' }}>
              {summary.total_items}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {t('analytics.itemsTracked') || 'Items tracked in period'}
            </div>
          </div>

          <div className="stat-card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('analytics.itemsUsed') || 'Items Used'}</h3>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
            </div>
            <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.successColor, marginBottom: '0.5rem' }}>
              {summary.items_used}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {t('analytics.itemsUsedDescription') || 'Successfully consumed'}
            </div>
          </div>

          <div className="stat-card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('analytics.itemsWasted') || 'Items Wasted'}</h3>
              <span style={{ fontSize: '1.5rem' }}>🗑️</span>
            </div>
            <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.dangerColor, marginBottom: '0.5rem' }}>
              {summary.items_wasted}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {t('analytics.itemsWastedDescription') || 'Thrown away or expired'}
            </div>
          </div>

          <div className="stat-card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('analytics.wastePercentage') || 'Waste %'}</h3>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: summary.waste_percentage > 50 ? theme.dangerColor : theme.warningColor, marginBottom: '0.5rem' }}>
              {summary.waste_percentage.toFixed(1)}%
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {t('analytics.wastePercentageDescription') || 'Percentage of items wasted'}
            </div>
          </div>

          <div className="stat-card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('analytics.totalWasteValue') || 'Waste Value'}</h3>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
            </div>
            <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.dangerColor, marginBottom: '0.5rem' }}>
              {formatCurrency(summary.total_waste_value)}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {t('analytics.totalWasteValueDescription') || 'Estimated value of wasted items'}
            </div>
          </div>

          <div className="stat-card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('analytics.avgDaysBeforeExpiry') || 'Avg Days'}</h3>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
            </div>
            <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.primaryColor, marginBottom: '0.5rem' }}>
              {summary.avg_days_before_expiry > 0 ? `+${summary.avg_days_before_expiry.toFixed(0)}` : summary.avg_days_before_expiry.toFixed(0)}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {t('analytics.avgDaysDescription') || 'Average days before expiry when discarded'}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {category_breakdown.length > 0 && (
          <div className="card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              📊 {t('analytics.categoryBreakdown') || 'Category Breakdown'}
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {category_breakdown.map((cat) => (
                <div key={cat.category_id} style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1.1rem' }}>{cat.category_name}</h3>
                    <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                      {cat.waste_percentage.toFixed(1)}% {t('analytics.wasted') || 'wasted'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: theme.textSecondary }}>
                    <span>✅ {cat.used_count} {t('analytics.used') || 'used'}</span>
                    <span>🗑️ {cat.wasted_count} {t('analytics.wasted') || 'wasted'}</span>
                    <span>💰 {formatCurrency(cat.total_waste_value)}</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', height: '8px', backgroundColor: `${theme.borderColor}40`, borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${cat.waste_percentage}%`,
                        backgroundColor: cat.waste_percentage > 50 ? theme.dangerColor : theme.warningColor,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Breakdown */}
        {location_breakdown.length > 0 && (
          <div className="card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              📍 {t('analytics.locationBreakdown') || 'Location Breakdown'}
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {location_breakdown.map((loc) => (
                <div key={loc.location_id} style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1.1rem' }}>{loc.location_name}</h3>
                    <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                      {loc.waste_percentage.toFixed(1)}% {t('analytics.wasted') || 'wasted'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: theme.textSecondary }}>
                    <span>✅ {loc.used_count} {t('analytics.used') || 'used'}</span>
                    <span>🗑️ {loc.wasted_count} {t('analytics.wasted') || 'wasted'}</span>
                    <span>💰 {formatCurrency(loc.total_waste_value)}</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', height: '8px', backgroundColor: `${theme.borderColor}40`, borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${loc.waste_percentage}%`,
                        backgroundColor: loc.waste_percentage > 50 ? theme.dangerColor : theme.warningColor,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Trends */}
        {monthly_trends.length > 0 && (
          <div className="card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              📈 {t('analytics.monthlyTrends') || 'Monthly Trends'}
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.borderColor}` }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: theme.textColor, fontWeight: 600 }}>{t('analytics.month') || 'Month'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor, fontWeight: 600 }}>{t('analytics.added') || 'Added'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor, fontWeight: 600 }}>{t('analytics.used') || 'Used'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor, fontWeight: 600 }}>{t('analytics.wasted') || 'Wasted'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor, fontWeight: 600 }}>{t('analytics.wastePercent') || 'Waste %'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor, fontWeight: 600 }}>{t('analytics.value') || 'Value'}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly_trends.map((trend, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${theme.borderColor}`, backgroundColor: index % 2 === 0 ? theme.backgroundColor : 'transparent' }}>
                      <td style={{ padding: '0.75rem', color: theme.textColor }}>{formatMonth(trend.month)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor }}>{trend.items_added}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: theme.successColor }}>{trend.items_used}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: theme.dangerColor }}>{trend.items_wasted}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: trend.waste_percentage > 50 ? theme.dangerColor : theme.warningColor }}>
                        {trend.waste_percentage.toFixed(1)}%
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: theme.textColor }}>{formatCurrency(trend.total_waste_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Most Wasted Items */}
        {most_wasted_items.length > 0 && (
          <div className="card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              ⚠️ {t('analytics.mostWastedItems') || 'Most Wasted Items'}
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {most_wasted_items.map((item, index) => (
                <div key={index} style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1.1rem' }}>{item.item_name}</h3>
                      <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{item.category_name}</p>
                    </div>
                    <span style={{ color: theme.dangerColor, fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {item.waste_count}x
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: theme.textSecondary }}>
                    <span>💰 {formatCurrency(item.total_waste_value)}</span>
                    <span>📅 {item.avg_days_before_expiry > 0 ? `+${item.avg_days_before_expiry.toFixed(0)}` : item.avg_days_before_expiry.toFixed(0)} {t('analytics.days') || 'days'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disposal Reasons */}
        {disposal_reasons.length > 0 && (
          <div className="card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              🗑️ {t('analytics.disposalReasons') || 'Disposal Reasons'}
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {disposal_reasons.map((reason, index) => (
                <div key={index} style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ color: theme.textColor, margin: 0, fontSize: '1rem', textTransform: 'capitalize' }}>
                      {reason.reason.replace('_', ' ')}
                    </h3>
                    <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                      {reason.count} ({reason.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                    💰 {formatCurrency(reason.total_value)}
                  </div>
                  <div style={{ marginTop: '0.5rem', height: '8px', backgroundColor: `${theme.borderColor}40`, borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${reason.percentage}%`,
                        backgroundColor: theme.dangerColor,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiry Patterns */}
        {expiry_patterns && (
          <div className="card" style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadowColor }}>
            <h2 style={{ color: theme.textColor, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              📅 {t('analytics.expiryPatterns') || 'Expiry Patterns'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>
                  {t('analytics.discardedVeryLate') || 'Discarded Very Late (>7 days after)'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.dangerColor }}>
                  {expiry_patterns.discarded_very_late}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>
                  {t('analytics.discardedAfterExpiry') || 'Discarded After Expiry'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.dangerColor }}>
                  {expiry_patterns.discarded_after_expiry}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>
                  {t('analytics.discardedOnExpiry') || 'Discarded On Expiry Day'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.warningColor }}>
                  {expiry_patterns.discarded_on_expiry}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>
                  {t('analytics.discardedNearExpiry') || 'Discarded Near Expiry (1-3 days)'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.warningColor }}>
                  {expiry_patterns.discarded_near_expiry}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>
                  {t('analytics.discardedWellBefore') || 'Discarded Well Before (>3 days)'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.successColor }}>
                  {expiry_patterns.discarded_well_before_expiry}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: theme.textSecondary, marginBottom: '0.25rem' }}>{t('analytics.avgDaysBeforeExpiry') || 'Avg Days Before Expiry'}</div>
                  <div style={{ color: theme.textColor, fontWeight: 600, fontSize: '1.1rem' }}>
                    {expiry_patterns.avg_days_before_expiry > 0 ? `+${expiry_patterns.avg_days_before_expiry.toFixed(1)}` : expiry_patterns.avg_days_before_expiry.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div style={{ color: theme.textSecondary, marginBottom: '0.25rem' }}>{t('analytics.avgDaysSincePurchase') || 'Avg Days Since Purchase'}</div>
                  <div style={{ color: theme.textColor, fontWeight: 600, fontSize: '1.1rem' }}>
                    {expiry_patterns.avg_days_since_purchase.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period Info */}
        <div style={{ textAlign: 'center', padding: '1rem', color: theme.textSecondary, fontSize: '0.875rem' }}>
          {t('analytics.period') || 'Period'}: {formatDate(summary.period.start)} - {formatDate(summary.period.end)}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
