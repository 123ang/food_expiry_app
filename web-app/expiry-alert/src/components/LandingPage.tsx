import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Never Let Food Go to Waste Again</h1>
            <p className="hero-subtitle">
              Track expiry dates, get smart alerts, and reduce food waste with Expiry Alert - 
              your personal food inventory manager.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary btn-large">
                Try Web App
              </Link>
              <Link to="#download" className="btn btn-secondary btn-large">
                Download Mobile App
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="app-preview">
              <img src="/food_expiry_logo.png" alt="Expiry Alert" className="hero-logo" />
              <div className="floating-cards">
                <div className="feature-card card-1">
                  <span className="emoji">🍎</span>
                  <span>Fresh</span>
                </div>
                <div className="feature-card card-2">
                  <span className="emoji">⚠️</span>
                  <span>Expiring Soon</span>
                </div>
                <div className="feature-card card-3">
                  <span className="emoji">📱</span>
                  <span>Smart Alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Expiry Alert?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <h3>Smart Tracking</h3>
              <p>Easily track expiry dates for all your food items with our intuitive interface.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <h3>Timely Alerts</h3>
              <p>Get notified before items expire so you can use them in time.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Visual Dashboard</h3>
              <p>See your inventory at a glance with color-coded status indicators.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌱</div>
              <h3>Reduce Waste</h3>
              <p>Help the environment by reducing food waste and saving money.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3>Cross-Platform</h3>
              <p>Available on web, iOS, and Android for seamless synchronization.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <h3>Secure & Private</h3>
              <p>Your data is securely stored and synchronized across all devices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download-section">
        <div className="container">
          <h2 className="section-title">Download Expiry Alert</h2>
          <p className="section-subtitle">
            Get the mobile app for the best experience with notifications and offline access.
          </p>
          <div className="download-buttons">
            <a href="#" className="download-btn app-store">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                   alt="Download on App Store" />
            </a>
            <a href="#" className="download-btn play-store">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                   alt="Get it on Google Play" />
            </a>
          </div>
          <div className="web-app-link">
            <p>Prefer to use it in your browser?</p>
            <Link to="/login" className="btn btn-primary">
              Launch Web App
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
              <p>Active Users</p>
            </div>
            <div className="stat-item">
              <h3>50,000+</h3>
              <p>Items Tracked</p>
            </div>
            <div className="stat-item">
              <h3>30%</h3>
              <p>Food Waste Reduced</p>
            </div>
            <div className="stat-item">
              <h3>4.8★</h3>
              <p>App Store Rating</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 