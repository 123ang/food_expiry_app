import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully!');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/food_expiry_logo.png" alt="Expiry Alert" style={{ width: '80px', height: '80px', borderRadius: '16px' }} />
        <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Expiry Alert</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
        </p>
      </div>
      <h2>{isSignUp ? t('auth.signUp') : t('auth.login')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">{t('auth.email')}:</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('auth.email')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('auth.password')}:</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('auth.password')}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginBottom: '1rem' }}
          disabled={isLoading}
        >
          {isLoading ? t('status.loading') : (isSignUp ? t('auth.signUp') : t('auth.login'))}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'transparent', color: '#22c55e', border: 'none' }}
        >
          {isSignUp ? t('auth.alreadyHaveAccount') + ' ' + t('auth.login') : t('auth.dontHaveAccount') + ' ' + t('auth.signUp')}
        </button>
      </div>
    </div>
  );
};

export default Login; 