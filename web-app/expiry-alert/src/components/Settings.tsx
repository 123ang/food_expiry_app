import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../theme';
import { notificationService, NotificationSettings } from '../services/notificationService';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    expiringSoonAlerts: true,
    expiringTodayAlerts: true,
    expiredAlerts: false,
    reminderDays: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme, currentThemeType, setTheme } = useTheme();

  useEffect(() => {
    loadSettings();
    checkPermissionStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const status = await notificationService.getPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await notificationService.updateSettings({ [key]: value });
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Error updating settings:', error);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setPermissionStatus('granted');
        toast.success('Notification permissions granted!');
        await notificationService.initialize();
      } else {
        toast.error('Notification permissions denied');
        setPermissionStatus('denied');
      }
    } catch (error) {
      toast.error('Failed to request notification permissions');
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.testNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      toast.error('Failed to send test notification');
      console.error('Error sending test notification:', error);
    }
  };

  const getPermissionText = () => {
    switch (permissionStatus) {
      case 'granted':
        return { text: 'Enabled', color: '#4caf50' };
      case 'denied':
        return { text: 'Denied', color: '#f44336' };
      default:
        return { text: 'Not requested', color: '#ff9800' };
    }
  };

  const permissionInfo = getPermissionText();

  const getThemeDisplayName = (themeType: ThemeType) => {
    switch (themeType) {
      case 'original':
        return t('settings.themeOriginal') || 'Original (White & Green)';
      case 'recycled':
        return t('settings.themeRecycled') || 'Recycled (Warm & Eco)';
      case 'darkBrown':
        return t('settings.themeDarkBrown') || 'Dark Brown Theme';
      case 'black':
        return t('settings.themeBlack') || 'Black Theme';
      case 'blue':
        return t('settings.themeBlue') || 'Blue Theme';
      case 'green':
        return t('settings.themeGreen') || 'Green Theme';
      case 'softPink':
        return t('settings.themeSoftPink') || 'Soft Pink Theme';
      case 'brightPink':
        return t('settings.themeBrightPink') || 'Bright Pink Theme';
      case 'naturalGreen':
        return t('settings.themeYellow') || 'Yellow Theme';
      case 'mintRed':
        return t('settings.themeMintRed') || 'Mint-Red Theme';
      case 'darkGold':
        return t('settings.themeDarkGold') || 'Dark Gold Theme';
      default:
        return themeType;
    }
  };

  const getThemeDescription = (themeType: ThemeType) => {
    switch (themeType) {
      case 'original':
        return t('settings.themeOriginalDesc') || 'Improved contrast white theme with better visibility';
      case 'recycled':
        return t('settings.themeRecycledDesc') || 'Warm eco-friendly peach and cream tones';
      case 'darkBrown':
        return t('settings.themeDarkBrownDesc') || 'Dark warm brown with green accents';
      case 'black':
        return t('settings.themeBlackDesc') || 'Pure black background with high contrast';
      case 'blue':
        return t('settings.themeBlueDesc') || 'Cool blue tones with light backgrounds';
      case 'green':
        return t('settings.themeGreenDesc') || 'Natural earth tones with green accents';
      case 'softPink':
        return t('settings.themeSoftPinkDesc') || 'Warm and cozy pink tones';
      case 'brightPink':
        return t('settings.themeBrightPinkDesc') || 'Vibrant and energetic pink theme';
      case 'naturalGreen':
        return t('settings.themeYellowDesc') || 'Warm and bright yellow tones';
      case 'mintRed':
        return t('settings.themeMintRedDesc') || 'Fresh mint with vibrant red accents';
      case 'darkGold':
        return t('settings.themeDarkGoldDesc') || 'Elegant dark theme with gold accents';
      default:
        return '';
    }
  };

  const getThemePreviewColors = (themeType: ThemeType): string[] => {
    const themeColors: Record<ThemeType, string[]> = {
      original: ['#F8F9FA', '#2E7D32', '#FFFFFF'],
      recycled: ['#F3C88B', '#4CAF50', '#FDF0C0'],
      darkBrown: ['#2C2417', '#4CAF50', '#3D3426'],
      black: ['#000000', '#4CAF50', '#1A1A1A'],
      blue: ['#c1d9e3', '#5b88a8', '#edf4f7'],
      green: ['#dbe1c0', '#3d6a28', '#fafaf0'],
      softPink: ['#fce7dd', '#a37d6c', '#f5d3d3'],
      brightPink: ['#fdd0d4', '#ad5b62', '#ffe5e5'],
      naturalGreen: ['#fbfcee', '#3971b8', '#f6e6a5'],
      mintRed: ['#d8f2c9', '#ef5f5f', '#8cd1b8'],
      darkGold: ['#2c2c2c', '#b6862e', '#494949'],
    };
    return themeColors[themeType] || ['#F8F9FA', '#2E7D32', '#FFFFFF'];
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>⚙️ Settings</h2>
          <p>Manage your notification preferences and app settings</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Theme Selection */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>🎨 Theme</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p><strong>Current Theme:</strong> {getThemeDisplayName(currentThemeType)}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0' }}>
                  {getThemeDescription(currentThemeType)}
                </p>
              </div>
              <button 
                onClick={() => setShowThemeModal(true)}
                className="btn btn-primary"
              >
                Change Theme
              </button>
            </div>
          </div>
        </div>

        {/* Notification Permissions */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>🔔 Notification Permissions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p><strong>Status:</strong> <span style={{ color: permissionInfo.color }}>{permissionInfo.text}</span></p>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0' }}>
                  {permissionStatus === 'granted' 
                    ? 'You will receive notifications when food items are about to expire.'
                    : permissionStatus === 'denied'
                    ? 'Notifications are blocked. You can enable them in your browser settings.'
                    : 'Click the button to enable push notifications for expiry alerts.'
                  }
                </p>
              </div>
              {permissionStatus !== 'granted' && (
                <button 
                  onClick={handleRequestPermission}
                  disabled={isLoading || permissionStatus === 'denied'}
                  className="btn btn-primary"
                >
                  {isLoading ? 'Requesting...' : 'Enable Notifications'}
                </button>
              )}
            </div>

            {permissionStatus === 'granted' && (
              <div style={{ textAlign: 'center', padding: '1rem 0', borderTop: '1px solid #eee' }}>
                <button onClick={handleTestNotification} className="btn btn-secondary">
                  🧪 Send Test Notification
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>📱 Notification Settings</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="setting-row">
                <div>
                  <strong>Enable Notifications</strong>
                  <p>Master switch for all notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                  className="setting-toggle"
                />
              </label>
            </div>

            <div className="form-group" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
              <label className="setting-row">
                <div>
                  <strong>Expiring Today Alerts</strong>
                  <p>Get notified when items expire today</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.expiringTodayAlerts}
                  onChange={(e) => handleSettingChange('expiringTodayAlerts', e.target.checked)}
                  disabled={!settings.enabled}
                  className="setting-toggle"
                />
              </label>
            </div>

            <div className="form-group" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
              <label className="setting-row">
                <div>
                  <strong>Expiring Soon Alerts</strong>
                  <p>Get notified when items are expiring soon</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.expiringSoonAlerts}
                  onChange={(e) => handleSettingChange('expiringSoonAlerts', e.target.checked)}
                  disabled={!settings.enabled}
                  className="setting-toggle"
                />
              </label>
            </div>

            <div className="form-group" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
              <label className="setting-row">
                <div>
                  <strong>Expired Item Alerts</strong>
                  <p>Get notified about items that have already expired</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.expiredAlerts}
                  onChange={(e) => handleSettingChange('expiredAlerts', e.target.checked)}
                  disabled={!settings.enabled}
                  className="setting-toggle"
                />
              </label>
            </div>

            <div className="form-group" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
              <label htmlFor="reminderDays">
                <strong>Reminder Days</strong>
                <p>How many days before expiry to show alerts</p>
              </label>
              <select
                id="reminderDays"
                value={settings.reminderDays}
                onChange={(e) => handleSettingChange('reminderDays', parseInt(e.target.value))}
                disabled={!settings.enabled}
                className="form-control"
                style={{ maxWidth: '150px' }}
              >
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="card">
          <div className="card-header">
            <h3>ℹ️ App Information</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>Version:</strong> 1.0.0
              </div>
              <div>
                <strong>Browser Support:</strong> {notificationService.isSupported() ? '✅ Supported' : '❌ Not Supported'}
              </div>
              <div>
                <strong>User ID:</strong> {user?.uid || 'Not logged in'}
              </div>
              <div>
                <strong>User Email:</strong> {user?.email || 'Not available'}
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4>Privacy Note</h4>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                This app stores all your data securely in the cloud and uses local notifications 
                to alert you about expiring items. We never share your personal information with third parties.
              </p>
              <Link to="/privacy" className="btn btn-secondary btn-small">
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowThemeModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: theme.textColor, margin: 0 }}>{t('settings.theme') || 'Choose Theme'}</h3>
              <button
                onClick={() => setShowThemeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  padding: '0.5rem',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(['original', 'recycled', 'darkBrown', 'black', 'blue', 'green', 'softPink', 'brightPink', 'naturalGreen', 'mintRed', 'darkGold'] as ThemeType[]).map((themeType) => {
                const previewColors = getThemePreviewColors(themeType);
                const isSelected = currentThemeType === themeType;
                
                return (
                  <button
                    key={themeType}
                    onClick={() => {
                      setTheme(themeType);
                      setShowThemeModal(false);
                      toast.success(`Theme changed to ${getThemeDisplayName(themeType)}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? theme.primaryColor : theme.borderColor}`,
                      backgroundColor: isSelected ? `${theme.primaryColor}10` : theme.backgroundColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = theme.cardBackground;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = theme.backgroundColor;
                      }
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      gap: '2px', 
                      marginRight: '1rem',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      width: '60px',
                      height: '20px',
                    }}>
                      {previewColors.map((color, idx) => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            backgroundColor: color,
                            border: idx < previewColors.length - 1 ? `1px solid ${theme.borderColor}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? theme.primaryColor : theme.textColor,
                        marginBottom: '0.25rem',
                      }}>
                        {getThemeDisplayName(themeType)}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem',
                        color: theme.textSecondary,
                      }}>
                        {getThemeDescription(themeType)}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ 
                        color: theme.primaryColor,
                        fontSize: '1.25rem',
                        marginLeft: '0.5rem',
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 