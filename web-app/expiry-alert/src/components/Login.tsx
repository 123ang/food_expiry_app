import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validation for signup
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        
        await signUp(email, password, fullName.trim());
        console.log('User signed up successfully!');
      } else {
        await signIn(email, password);
        console.log('User logged in successfully!');
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('already') || errorMessage.includes('exists')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (errorMessage.includes('invalid') || errorMessage.includes('incorrect')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Logo and Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/food_expiry_logo.png" alt="Expiry Alert" />
          </div>
          <h1 className="auth-title">Expiry Alert</h1>
          <p className="auth-subtitle">
            {isSignUp 
              ? 'Create an account to sync your food items and share with family' 
              : 'Sign in to manage your food expiry dates'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                autoCapitalize="words"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="button-loading">
                <span className="spinner"></span>
                Loading...
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="auth-toggle">
          <button 
            type="button" 
            className="toggle-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setFullName('');
              setConfirmPassword('');
            }}
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"
            }
          </button>
        </div>

        {/* Features */}
        <div className="auth-features">
          <div className="feature-item">
            <span className="feature-icon">🍎</span>
            <span>Track expiry dates</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔔</span>
            <span>Get reminders</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👨‍👩‍👧‍👦</span>
            <span>Share with family</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
