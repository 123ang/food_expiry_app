import React, { useState, useEffect } from 'react';
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
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn, signUp, user, error: authError, loading: authLoading, clearError } = useAuth();
  
  // Navigate to dashboard when user is set (successful login/signup)
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any form propagation
    
    // Don't submit if already loading
    if (authLoading) {
      return;
    }

    setLocalError(null);
    clearError(); // Clear any previous auth errors

    // Client-side validation
    if (isSignUp) {
      if (!fullName.trim()) {
        setLocalError('Please enter your full name');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long');
        return;
      }
    }

    // Basic email validation
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }

    // Basic password validation
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    // Call signIn or signUp (they will set error in AuthContext if failed)
    // Navigation will happen automatically via useEffect when user is set
    try {
      if (isSignUp) {
        await signUp(email, password, fullName.trim());
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      // Errors are already handled in AuthContext, just ensure we don't throw
      console.error('Login/Signup error:', err);
    }
  };

  // Clear errors when user types
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setLocalError(null);
    clearError(); // Clear auth errors when user types
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLocalError(null);
    clearError(); // Clear auth errors when user types
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setLocalError(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setLocalError(null);
  };

  // Display error from local validation or AuthContext
  const displayError = localError || authError;

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
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="form-input"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder="Enter your full name"
                autoComplete="name"
                autoCapitalize="words"
                disabled={authLoading}
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
              onChange={handleEmailChange}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={handlePasswordChange}
              placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={authLoading}
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
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={authLoading}
              />
            </div>
          )}

          {/* Loading indicator */}
          {authLoading && (
            <div className="auth-loading">
              <span className="spinner"></span>
              <span>Please wait...</span>
            </div>
          )}

          {/* Error message */}
          {displayError && !authLoading && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {displayError}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={authLoading}
          >
            {authLoading ? (
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
              setLocalError(null);
              setFullName('');
              setConfirmPassword('');
              clearError(); // Clear auth errors when switching modes
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
