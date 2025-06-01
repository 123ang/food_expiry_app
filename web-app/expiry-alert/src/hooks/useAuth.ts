import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const useAuth = () => {
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [demoUser, setDemoUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUserData = localStorage.getItem('demoUser');
    if (demoUserData) {
      try {
        setDemoUser(JSON.parse(demoUserData));
      } catch (err) {
        console.error('Error parsing demo user data:', err);
        localStorage.removeItem('demoUser');
      }
    }
  }, []);

  const signOut = () => {
    // Sign out from Firebase
    auth.signOut();
    // Clear demo user
    localStorage.removeItem('demoUser');
    setDemoUser(null);
  };

  // Return demo user if available, otherwise Firebase user
  const user = demoUser || firebaseUser;

  return {
    user,
    loading: loading && !demoUser,
    error,
    signOut
  };
}; 