import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  signInAsGuest: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for demo user in localStorage first
    const demoUserData = localStorage.getItem('demoUser');
    if (demoUserData) {
      try {
        const demoUser = JSON.parse(demoUserData);
        setUser({ ...demoUser, isDemo: true });
        setLoading(false);
        return;
      } catch (err) {
        console.error('Error parsing demo user data:', err);
        localStorage.removeItem('demoUser');
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          isDemo: false
        });
      } else {
        // Only set user to null if no demo user exists
        const demoUserData = localStorage.getItem('demoUser');
        if (!demoUserData) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // Clear any demo user data
      localStorage.removeItem('demoUser');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Clear any demo user data
      localStorage.removeItem('demoUser');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      localStorage.removeItem('demoUser');
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const signInDemo = (): void => {
    const demoUser: User = {
      uid: 'demo-user-123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null,
      isAnonymous: false,
      isDemo: true
    };
    
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const signInAsGuest = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await signInAnonymously(auth);
      // Clear any demo user data since we're using real anonymous auth
      localStorage.removeItem('demoUser');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as guest');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInDemo,
    signInAsGuest,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 