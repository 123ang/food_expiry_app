import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      // Check if it's a Firebase configuration error
      if (err.message.includes('api-key-not-valid') || err.message.includes('Firebase')) {
        setError('Demo Mode: Firebase not configured. Click "Demo Login" below to continue.');
      } else {
        setError(err.message);
      }
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    console.log('Demo login - bypassing Firebase auth');
    // Create a mock user session
    localStorage.setItem('demoUser', JSON.stringify({
      uid: 'demo-user',
      email: 'demo@expiryalert.com',
      displayName: 'Demo User'
    }));
    navigate('/dashboard');
    // Refresh the page to trigger auth state update
    window.location.reload();
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/food_expiry_logo.png" alt="Expiry Alert" style={{ width: '80px', height: '80px', borderRadius: '16px' }} />
      </div>
      <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginBottom: '1rem' }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'transparent', color: '#22c55e', marginBottom: '1rem' }}
        >
          {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          onClick={handleDemoLogin}
          className="btn btn-primary"
          style={{ width: '100%', background: '#16a34a', marginBottom: '1rem' }}
        >
          🚀 Demo Login (Try Without Firebase)
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <small style={{ color: '#6b7280' }}>
          <strong>Demo Mode:</strong> Experience the app without setting up Firebase.<br/>
          Your data won't be saved in demo mode.
        </small>
      </div>
    </div>
  );
};

export default Login; 