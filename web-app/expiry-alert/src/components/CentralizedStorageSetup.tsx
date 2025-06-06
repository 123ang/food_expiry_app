import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CentralizedStorageSetup: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Listen for storage changes to refresh status
    const handleStorageChange = () => {
      checkStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkStatus = () => {
    // Check if we have owner token stored
    const ownerToken = localStorage.getItem('appOwnerGoogleDriveToken');
    const refreshToken = localStorage.getItem('appOwnerGoogleDriveRefreshToken');
    
    // Debug output
    console.log('🔍 Checking centralized storage status:');
    console.log('Owner Token:', ownerToken ? 'EXISTS' : 'NOT FOUND');
    console.log('Refresh Token:', refreshToken ? 'EXISTS' : 'NOT FOUND');
    
    setIsReady(!!ownerToken);
  };

  const handleSetupClick = () => {
    setIsLoading(true);
    
    // Build OAuth URL manually
    let clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    // TEMPORARY: Hard-code values if env vars don't work
    if (!clientId) {
      clientId = '1059614977887-v6eeiahl6drcr3fp9psq1fuljoa0gl4i.apps.googleusercontent.com';
      console.log('🔧 Using hard-coded Client ID (env vars not working)');
    }
    
    // Debug: Print environment variables
    console.log('🔧 Debug - Environment Variables:');
    console.log('REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('REACT_APP_GOOGLE_CLIENT_SECRET:', process.env.REACT_APP_GOOGLE_CLIENT_SECRET);
    console.log('Using Client ID:', clientId);
    
    if (!clientId) {
      console.error('❌ Google Client ID is missing!');
      toast.error('Google Client ID not configured - Check console for debug info');
      setIsLoading(false);
      return;
    }
    
    console.log('✅ Google Client ID found, proceeding with OAuth...');

    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/owner');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
    
    // Store flag to indicate this is owner authentication
    localStorage.setItem('googleDriveOwnerAuth', 'true');
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  };

  return (
    <div>
      <p><strong>Status:</strong> <span style={{ color: isReady ? '#4caf50' : '#ff9800' }}>
        {isReady ? '✅ Active' : '⚙️ Not Set Up'}
      </span></p>
      <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0' }}>
        {isReady 
          ? 'All user images are being stored in your centralized Google Drive.'
          : 'Set up centralized storage to store all user images in your Google Drive account.'
        }
      </p>
      
      {!isReady && (
        <button 
          onClick={handleSetupClick}
          disabled={isLoading}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          {isLoading ? 'Redirecting to Google...' : '🔧 Set Up Centralized Storage'}
        </button>
      )}
      
      {isReady && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            📁 <strong>Storage Location:</strong> Google Drive → "Expiry Alert - All Users"<br/>
            🔒 <strong>Organization:</strong> Each user gets their own subfolder<br/>
            📊 <strong>Management:</strong> Only you (app owner) can access all images
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('appOwnerGoogleDriveToken');
              localStorage.removeItem('appOwnerGoogleDriveRefreshToken');
              setIsReady(false);
              toast.success('Centralized storage disconnected');
            }}
            className="btn btn-secondary btn-small"
            style={{ marginTop: '0.5rem' }}
          >
            🔌 Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default CentralizedStorageSetup; 