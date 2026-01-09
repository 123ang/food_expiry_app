import React from 'react';
import { Link } from 'react-router-dom';

const Analytics: React.FC = () => {
  return (
    <div className="analytics">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Analytics</h1>
          <p>Track your food waste and savings</p>
        </div>
      </div>
      
      <div className="empty-state">
        <h3>🚧 Coming Soon</h3>
        <p>Analytics features are being migrated to the new PostgreSQL system.</p>
        <p>This feature will be available soon with enhanced insights!</p>
        <Link to="/dashboard" className="btn btn-primary btn-large">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Analytics;
