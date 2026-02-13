import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LanguageSwitcher from './components/LanguageSwitcher';
import GroupSelector from './components/GroupSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GroupProvider } from './contexts/GroupContext';
import { notificationService } from './services/notificationService';
import './App.css';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AddItem = lazy(() => import('./components/AddItem'));
const LocationList = lazy(() => import('./components/LocationList'));
const AddLocation = lazy(() => import('./components/AddLocation'));
const CategoryList = lazy(() => import('./components/CategoryList'));
const AddCategory = lazy(() => import('./components/AddCategory'));
const ItemDetails = lazy(() => import('./components/ItemDetails'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const Settings = lazy(() => import('./components/Settings'));
const GoogleDriveAuth = lazy(() => import('./components/GoogleDriveAuth'));
const GoogleDriveOwnerAuth = lazy(() => import('./components/GoogleDriveOwnerAuth'));
const Analytics = lazy(() => import('./components/Analytics'));
const ShoppingListPage = lazy(() => import('./components/ShoppingListPage'));
const WishListPage = lazy(() => import('./components/WishListPage'));
const Groups = lazy(() => import('./components/Groups'));

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();

  // Initialize notifications when user signs in
  useEffect(() => {
    if (user) {
      // Initialize notification service
      notificationService.initialize().catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [user]);

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
            <GroupSelector />
            <Link to="/dashboard" className="btn btn-secondary">🏠 {t('nav.dashboard')}</Link>
            <Link to="/add-item" className="btn btn-secondary">➕ {t('nav.addItem')}</Link>
            <Link to="/shopping-list" className="btn btn-secondary">🛒 {t('lists.shoppingList') || 'Shopping List'}</Link>
            <Link to="/wish-list" className="btn btn-secondary">⭐ {t('lists.wishList') || 'Wish List'}</Link>
            <Link to="/analytics" className="btn btn-secondary">📈 {t('nav.analytics') || 'Analytics'}</Link>
            <Link to="/groups" className="btn btn-secondary">👥 Groups</Link>
            <Link to="/locations" className="btn btn-secondary">📍 {t('nav.locations')}</Link>
            <Link to="/categories" className="btn btn-secondary">🏷️ {t('nav.categories')}</Link>
            <Link to="/settings" className="btn btn-secondary">⚙️ Settings</Link>
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
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
        <Suspense fallback={
          <div className="loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        }>
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

            <Route path="/settings" element={
              <div>
                {renderAppHeader()}
                <main>
                  <div className="container">
                    {user ? <Settings /> : <Navigate to="/login" />}
                  </div>
                </main>
              </div>
            } />

          <Route path="/shopping-list" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <ShoppingListPage /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          <Route path="/wish-list" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <WishListPage /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />
          <Route path="/groups" element={
            <div>
              {renderAppHeader()}
              <main>
                <div className="container">
                  {user ? <Groups /> : <Navigate to="/login" />}
                </div>
              </main>
            </div>
          } />

            <Route path="/analytics" element={
              <div>
                {renderAppHeader()}
                <main>
                  <div className="container">
                    {user ? <Analytics /> : <Navigate to="/login" />}
                  </div>
                </main>
              </div>
            } />

          {/* Status pages for viewing items by status */}
          <Route path="/items/in-date" element={
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

          {/* Public pages */}
          <Route path="/privacy" element={
            <div>
              {renderAppHeader(false)}
              <main>
                <div className="container">
                  <PrivacyPolicy />
                </div>
              </main>
            </div>
          } />
          <Route path="/terms" element={
            <div>
              {renderAppHeader(false)}
              <main>
                <div className="container">
                  <TermsAndConditions />
                </div>
              </main>
            </div>
          } />

          {/* OAuth callbacks */}
          <Route path="/auth/google" element={<GoogleDriveAuth />} />
          <Route path="/auth/google/owner" element={<GoogleDriveOwnerAuth />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <GroupProvider>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </GroupProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
