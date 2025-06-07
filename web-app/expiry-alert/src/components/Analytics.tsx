import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  AnalyticsService,
  AnalyticsData
} from '../services/firestoreService';

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(12); // months

  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadAnalytics();
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await AnalyticsService.getAnalyticsData(user.uid, timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadAnalytics} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="empty-state">
        <h3>No analytics data available</h3>
        <p>Start adding and using items to see your analytics</p>
        <Link to="/add-item" className="btn btn-primary">
          ➕ Add Item
        </Link>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📈 Analytics Dashboard</h1>
          <p>Insights into your food consumption and waste patterns</p>
        </div>
        <div className="header-actions">
          <Link to="/purchase-history" className="btn btn-secondary">
            📊 Purchase History
          </Link>
          <button onClick={loadAnalytics} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="controls-section">
        <div className="filter-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="filter-select"
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
            <option value={24}>Last 2 Years</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-header">
            <h3>Total Purchases</h3>
            <span className="stat-icon">🛒</span>
          </div>
          <div className="stat-number">{analyticsData.totalPurchases}</div>
          <div className="stat-label">items purchased</div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <h3>Total Spent</h3>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-number">{formatCurrency(analyticsData.totalSpent)}</div>
          <div className="stat-label">on food items</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <h3>Items Wasted</h3>
            <span className="stat-icon">🗑️</span>
          </div>
          <div className="stat-number">{analyticsData.totalWasted}</div>
          <div className="stat-label">thrown away</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-header">
            <h3>Waste Rate</h3>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-number">{formatPercentage(analyticsData.wastePercentage)}</div>
          <div className="stat-label">of purchases</div>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h2>📋 Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>🏆 Most Used Category</h3>
            <p>{analyticsData.mostUsedCategory}</p>
          </div>
          <div className="insight-card">
            <h3>⚠️ Most Wasted Category</h3>
            <p>{analyticsData.mostWastedCategory}</p>
          </div>
          <div className="insight-card">
            <h3>⏱️ Average Item Lifespan</h3>
            <p>{analyticsData.averageItemLifespan.toFixed(1)} days</p>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="trends-section">
        <h2>📈 Monthly Trends</h2>
        <div className="trends-chart">
          {analyticsData.monthlyStats.map((month, index) => (
            <div key={index} className="month-bar">
              <div className="month-label">{month.month}</div>
              <div className="bar-container">
                <div 
                  className="bar purchases" 
                  style={{ 
                    height: `${Math.max(month.purchases * 10, 5)}px`,
                    backgroundColor: '#2196F3'
                  }}
                  title={`${month.purchases} purchases`}
                />
                <div 
                  className="bar used" 
                  style={{ 
                    height: `${Math.max(month.used * 10, 5)}px`,
                    backgroundColor: '#4CAF50'
                  }}
                  title={`${month.used} used`}
                />
                <div 
                  className="bar wasted" 
                  style={{ 
                    height: `${Math.max(month.wasted * 10, 5)}px`,
                    backgroundColor: '#F44336'
                  }}
                  title={`${month.wasted} wasted`}
                />
              </div>
              <div className="month-stats">
                <div className="stat-item">
                  <span className="stat-color purchases"></span>
                  <span>{month.purchases}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-color used"></span>
                  <span>{month.used}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-color wasted"></span>
                  <span>{month.wasted}</span>
                </div>
                {month.spent > 0 && (
                  <div className="spent-amount">
                    {formatCurrency(month.spent)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color purchases"></span>
            <span>Purchases</span>
          </div>
          <div className="legend-item">
            <span className="legend-color used"></span>
            <span>Used</span>
          </div>
          <div className="legend-item">
            <span className="legend-color wasted"></span>
            <span>Wasted</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="category-breakdown">
        <h2>🏷️ Category Breakdown</h2>
        <div className="category-stats">
          {analyticsData.categoryStats
            .filter(cat => cat.purchases > 0)
            .sort((a, b) => b.purchases - a.purchases)
            .map((category, index) => (
            <div key={index} className="category-stat-card">
              <div className="category-header">
                <h3>{category.categoryName}</h3>
                <span className="waste-rate" style={{
                  color: category.wasteRate > 50 ? '#F44336' : 
                         category.wasteRate > 25 ? '#FF9800' : '#4CAF50'
                }}>
                  {formatPercentage(category.wasteRate)} waste
                </span>
              </div>
              <div className="category-metrics">
                <div className="metric">
                  <span className="metric-label">Purchases:</span>
                  <span className="metric-value">{category.purchases}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Used:</span>
                  <span className="metric-value">{category.used}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Wasted:</span>
                  <span className="metric-value">{category.wasted}</span>
                </div>
              </div>
              <div className="category-progress">
                <div 
                  className="progress-bar used"
                  style={{ 
                    width: `${category.purchases > 0 ? (category.used / category.purchases) * 100 : 0}%`,
                    backgroundColor: '#4CAF50'
                  }}
                />
                <div 
                  className="progress-bar wasted"
                  style={{ 
                    width: `${category.purchases > 0 ? (category.wasted / category.purchases) * 100 : 0}%`,
                    backgroundColor: '#F44336'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>💡 Recommendations</h2>
        <div className="recommendations">
          {analyticsData.wastePercentage > 30 && (
            <div className="recommendation warning">
              <span className="rec-icon">⚠️</span>
              <div>
                <h4>High Waste Rate</h4>
                <p>Your waste rate is {formatPercentage(analyticsData.wastePercentage)}. Consider buying smaller quantities or planning meals better.</p>
              </div>
            </div>
          )}
          
          {analyticsData.averageItemLifespan < 3 && (
            <div className="recommendation danger">
              <span className="rec-icon">⏰</span>
              <div>
                <h4>Short Item Lifespan</h4>
                <p>Items are being used/discarded quickly (avg {analyticsData.averageItemLifespan.toFixed(1)} days). Check expiry dates when purchasing.</p>
              </div>
            </div>
          )}

          {analyticsData.wastePercentage < 10 && (
            <div className="recommendation success">
              <span className="rec-icon">🎉</span>
              <div>
                <h4>Great Job!</h4>
                <p>You have a low waste rate of {formatPercentage(analyticsData.wastePercentage)}. Keep up the excellent food management!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 