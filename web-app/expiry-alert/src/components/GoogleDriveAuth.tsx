import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import GoogleDriveService from '../services/googleDriveService';

const GoogleDriveAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/dashboard');
        return;
      }

      if (!code) {
        toast.error('No authorization code received.');
        navigate('/dashboard');
        return;
      }

      try {
        toast.loading('Setting up Google Drive access...');
        
        const driveService = GoogleDriveService.getInstance();
        await driveService.exchangeCodeForToken(code);
        await driveService.initialize(driveService.loadStoredToken() ? localStorage.getItem('googleDriveToken')! : '');
        
        toast.dismiss();
        toast.success('Google Drive connected successfully!');
        
        // Redirect back to where the user was trying to upload
        const returnTo = localStorage.getItem('googleDriveReturnTo') || '/dashboard';
        localStorage.removeItem('googleDriveReturnTo');
        navigate(returnTo);
        
      } catch (error) {
        console.error('Error during OAuth callback:', error);
        toast.dismiss();
        toast.error('Failed to connect Google Drive. Please try again.');
        navigate('/dashboard');
      }
    };

    handleAuthCallback();
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
          Connecting to Google Drive...
        </p>
      </div>
    </div>
  );
};

export default GoogleDriveAuth; 