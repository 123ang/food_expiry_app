import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddItem from './components/AddItem';
import LocationList from './components/LocationList';
import AddLocation from './components/AddLocation';
import CategoryList from './components/CategoryList';
import AddCategory from './components/AddCategory';
import ItemDetails from './components/ItemDetails';
import LanguageSwitcher from './components/LanguageSwitcher';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { initializeUserData } from './services/firestoreService';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { t, language } = useLanguage();

  // Initialize user data when user first signs in
  useEffect(() => {
    if (user) {
      initializeUserData(user.uid, language).catch(error => {
        console.error('Failed to initialize user data:', error);
      });
    }
  }, [user, language]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const renderAppHeader = (showNav: boolean = true) => (
    <header className="App-header">
      <div className="container">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <img src="/food_expiry_logo.png" alt="Expiry Alert" className="logo" />
          <h1>Expiry Alert</h1>
        </Link>
        {showNav && user && (
          <nav>
            <Link to="/dashboard" className="btn btn-secondary">🏠 {t('nav.dashboard')}</Link>
            <Link to="/add-item" className="btn btn-secondary">➕ {t('nav.addItem')}</Link>
            <Link to="/locations" className="btn btn-secondary">📍 {t('nav.locations')}</Link>
            <Link to="/categories" className="btn btn-secondary">🏷️ {t('nav.categories')}</Link>
            <LanguageSwitcher />
            <button onClick={signOut} className="btn btn-danger">🚪 {t('nav.logout')}</button>
          </nav>
        )}
        {showNav && !user && (
          <nav>
            <LanguageSwitcher />
            <Link to="/" className="btn btn-secondary">← Back to Home</Link>
          </nav>
        )}
      </div>
    </header>
  );

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={
            <div>
              {renderAppHeader(false)}
              <main>
                <div className="container">
                  {!user ? <Login /> : <Navigate to="/dashboard" />}
                </div>
              </main>
            </div>
          } />
          
          <Route path="/dashboard" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <Dashboard /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          
          <Route path="/add-item" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <AddItem /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          <Route path="/item/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <ItemDetails /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          <Route path="/edit-item/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <AddItem /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          
          <Route path="/locations" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <LocationList /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          
          <Route path="/add-location" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <AddLocation /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          <Route path="/edit-location/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <AddLocation /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          
          <Route path="/categories" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <CategoryList /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          
          <Route path="/add-category" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <AddCategory /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          <Route path="/edit-category/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <AddCategory /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          {/* Status pages for viewing items by status */}
          <Route path="/items/fresh" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <Dashboard filter="fresh" /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          <Route path="/items/expiring" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <Dashboard filter="expiring-soon" /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          <Route path="/items/expired" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <Dashboard filter="expired" /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
