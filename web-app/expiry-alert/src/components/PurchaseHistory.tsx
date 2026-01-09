import React from 'react';
import { Link } from 'react-router-dom';

const PurchaseHistory: React.FC = () => {
  return (
    <div className="purchase-history">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Purchase History</h1>
          <p>Track your purchases and spending</p>
        </div>
      </div>
      
      <div className="empty-state">
        <h3>🚧 Coming Soon</h3>
        <p>Purchase history is being migrated to the new PostgreSQL system.</p>
        <p>This feature will be available soon with better tracking!</p>
        <Link to="/dashboard" className="btn btn-primary btn-large">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PurchaseHistory;
