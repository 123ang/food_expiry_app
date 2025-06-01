import React from 'react';
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
import { useAuth } from './hooks/useAuth';
import './App.css';

const App: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const renderAppHeader = (showNav: boolean = true) => (
    <header className="App-header">
      <div className="logo-container">
        <img src="/food_expiry_logo.png" alt="Expiry Alert" className="logo" />
        <h1>Expiry Alert</h1>
      </div>
      {showNav && user && (
        <nav>
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
          <Link to="/add-item" className="btn btn-secondary">Add Item</Link>
          <Link to="/locations" className="btn btn-secondary">Locations</Link>
          <Link to="/categories" className="btn btn-secondary">Categories</Link>
          <button onClick={signOut} className="btn btn-danger">Logout</button>
        </nav>
      )}
      {showNav && !user && (
        <nav>
          <Link to="/" className="btn btn-secondary">← Back to Home</Link>
        </nav>
      )}
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
                {!user ? <Login /> : <Navigate to="/dashboard" />}
              </main>
            </div>
          } />
          
          <Route path="/dashboard" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <Dashboard /> : <Navigate to="/login" />}
              </main>
            </div>
          } />
          
          <Route path="/add-item" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <AddItem /> : <Navigate to="/login" />}
              </main>
            </div>
          } />

          <Route path="/item/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <ItemDetails /> : <Navigate to="/login" />}
              </main>
            </div>
          } />

          <Route path="/edit-item/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <AddItem /> : <Navigate to="/login" />}
              </main>
            </div>
          } />
          
          <Route path="/locations" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <LocationList /> : <Navigate to="/login" />}
              </main>
            </div>
          } />
          
          <Route path="/add-location" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <AddLocation /> : <Navigate to="/login" />}
              </main>
            </div>
          } />

          <Route path="/edit-location/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <AddLocation /> : <Navigate to="/login" />}
              </main>
            </div>
          } />
          
          <Route path="/categories" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <CategoryList /> : <Navigate to="/login" />}
              </main>
            </div>
          } />
          
          <Route path="/add-category" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <AddCategory /> : <Navigate to="/login" />}
              </main>
            </div>
          } />

          <Route path="/edit-category/:id" element={
            <div>
              {renderAppHeader()}
              <main>
                {user ? <AddCategory /> : <Navigate to="/login" />}
              </main>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
