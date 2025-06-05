import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const LandingPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="App-header">
        <div className="container">
          <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
            <img src="/food_expiry_logo.png" alt="Expiry Alert" className="logo" />
            <h1>Expiry Alert</h1>
          </Link>
          <nav>
            <LanguageSwitcher />
            <Link to="/login" className="btn btn-primary">{t('landing.getStarted')}</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">{t('landing.title')}</h1>
            <p className="hero-subtitle">
              {t('landing.subtitle')}
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary btn-large">
                {t('landing.getStarted')}
              </Link>
              <Link to="#download" className="btn btn-secondary btn-large">
                {t('landing.learnMore')}
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="app-preview">
              <img src="/food_expiry_logo.png" alt="Expiry Alert" className="hero-logo" />
              <div className="floating-cards">
                <div className="feature-card card-1">
                  <span className="emoji">🍎</span>
                  <span>{t('status.fresh')}</span>
                </div>
                <div className="feature-card card-2">
                  <span className="emoji">⚠️</span>
                  <span>{t('status.expiring')}</span>
                </div>
                <div className="feature-card card-3">
                  <span className="emoji">📱</span>
                  <span>{t('landing.smartAlerts')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">{t('landing.whyChoose')}</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <h3>{t('landing.smartTracking')}</h3>
              <p>{t('landing.smartTrackingDesc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <h3>{t('landing.timelyAlerts')}</h3>
              <p>{t('landing.timelyAlertsDesc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>{t('landing.visualDashboard')}</h3>
              <p>{t('landing.visualDashboardDesc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌱</div>
              <h3>{t('landing.reduceWaste')}</h3>
              <p>{t('landing.reduceWasteDesc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3>{t('landing.crossPlatform')}</h3>
              <p>{t('landing.crossPlatformDesc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <h3>{t('landing.securePrivate')}</h3>
              <p>{t('landing.securePrivateDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download-section">
        <div className="container">
          <h2 className="section-title">{t('landing.downloadTitle')}</h2>
          <p className="section-subtitle">
            {t('landing.downloadDesc')}
          </p>
          <div className="download-buttons">
            <a href="#" className="download-btn app-store">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                   alt="Download on App Store" 
                   style={{ height: '60px' }} />
            </a>
            <a href="#" className="download-btn play-store">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                   alt="Get it on Google Play" 
                   style={{ height: '60px' }} />
            </a>
          </div>
          <div className="web-app-link">
            <p>{t('landing.preferBrowser')}</p>
            <Link to="/login" className="btn btn-primary">
              {t('landing.launchWebApp')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>10,000+</h3>
              <p>{t('landing.activeUsers')}</p>
            </div>
            <div className="stat-item">
              <h3>50,000+</h3>
              <p>{t('landing.itemsTracked')}</p>
            </div>
            <div className="stat-item">
              <h3>30%</h3>
              <p>{t('landing.wasteReduced')}</p>
            </div>
            <div className="stat-item">
              <h3>4.8★</h3>
              <p>{t('landing.appStoreRating')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        padding: '40px 0', 
        marginTop: '50px' 
      }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#bdc3c7' }}>
                © 2024 Expiry Alert. All rights reserved.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link 
                to="/privacy" 
                style={{ 
                  color: '#ecf0f1', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.color = '#3498db'}
                onMouseOut={(e) => (e.target as HTMLElement).style.color = '#ecf0f1'}
              >
                Privacy Policy
              </Link>
              <span style={{ color: '#7f8c8d' }}>|</span>
              <a 
                href="mailto:support@expiryalert.com" 
                style={{ 
                  color: '#ecf0f1', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.color = '#3498db'}
                onMouseOut={(e) => (e.target as HTMLElement).style.color = '#ecf0f1'}
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 