import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, NotificationSettings } from '../services/notificationService';
import CentralizedStorageSetup from './CentralizedStorageSetup';

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
  
  const { t } = useLanguage();
  const { user } = useAuth();

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

        {/* Centralized Image Storage */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>📸 Image Storage (Admin)</h3>
          </div>
          <div className="card-body">
            <CentralizedStorageSetup />
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
    </div>
  );
};

export default Settings; 