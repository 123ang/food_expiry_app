import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CentralizedGoogleDriveService from '../services/centralizedGoogleDriveService';

const GoogleDriveOwnerAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOwnerAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Owner OAuth error:', error);
        toast.error('Owner authentication failed. Please try again.');
        navigate('/settings');
        return;
      }

      if (!code) {
        toast.error('No authorization code received.');
        navigate('/settings');
        return;
      }

      try {
        toast.loading('Setting up centralized Google Drive...');
        
        console.log('🔧 Processing OAuth callback with code:', code);
        
        const centralizedService = CentralizedGoogleDriveService.getInstance();
        console.log('🔧 Calling exchangeOwnerCodeForToken...');
        
        const token = await centralizedService.exchangeOwnerCodeForToken(code);
        console.log('🔧 Token received:', token ? 'SUCCESS' : 'FAILED');
        
        // Verify token was stored
        const storedToken = localStorage.getItem('appOwnerGoogleDriveToken');
        console.log('🔧 Token stored in localStorage:', storedToken ? 'YES' : 'NO');
        
        toast.dismiss();
        toast.success('🎉 Centralized Google Drive setup complete! All user images will now be stored in your Drive.');
        
        // Clear the owner auth flag
        localStorage.removeItem('googleDriveOwnerAuth');
        
        // Trigger a storage event to refresh the CentralizedStorageSetup component
        window.dispatchEvent(new Event('storage'));
        
        navigate('/settings');
        
      } catch (error) {
        console.error('Error during owner OAuth callback:', error);
        toast.dismiss();
        toast.error('Failed to set up centralized Google Drive. Please try again.');
        navigate('/settings');
      }
    };

    handleOwnerAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh',
      flexDirection: 'column' 
    }}>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          Setting up centralized image storage...
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
          All user images will be stored in your Google Drive
        </p>
      </div>
    </div>
  );
};

export default GoogleDriveOwnerAuth; 