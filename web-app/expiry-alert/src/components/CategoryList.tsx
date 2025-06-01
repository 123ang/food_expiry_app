import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  itemCount: number;
}

const CategoryList: React.FC = () => {
  // Demo data for categories
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Fruits',
      description: 'Fresh fruits and berries',
      icon: '🍎',
      color: '#ef4444',
      itemCount: 5
    },
    {
      id: '2',
      name: 'Vegetables',
      description: 'Fresh vegetables and herbs',
      icon: '🥕',
      color: '#22c55e',
      itemCount: 8
    },
    {
      id: '3',
      name: 'Dairy',
      description: 'Milk, cheese, yogurt products',
      icon: '🥛',
      color: '#3b82f6',
      itemCount: 6
    },
    {
      id: '4',
      name: 'Meat',
      description: 'Fresh and processed meats',
      icon: '🥩',
      color: '#dc2626',
      itemCount: 4
    },
    {
      id: '5',
      name: 'Seafood',
      description: 'Fish and seafood products',
      icon: '🐟',
      color: '#0ea5e9',
      itemCount: 2
    },
    {
      id: '6',
      name: 'Bakery',
      description: 'Bread, pastries, baked goods',
      icon: '🍞',
      color: '#d97706',
      itemCount: 3
    },
    {
      id: '7',
      name: 'Pantry',
      description: 'Dry goods and canned items',
      icon: '🥫',
      color: '#7c3aed',
      itemCount: 12
    },
    {
      id: '8',
      name: 'Frozen',
      description: 'Frozen food items',
      icon: '🧊',
      color: '#06b6d4',
      itemCount: 7
    }
  ]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(category => category.id !== id));
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>Food Categories</h2>
        <Link to="/add-category" className="btn btn-primary">
          + Add Category
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{categories.length}</h3>
          <p>Total Categories</p>
        </div>
        <div className="stat-card">
          <h3>{categories.reduce((sum, cat) => sum + cat.itemCount, 0)}</h3>
          <p>Items Categorized</p>
        </div>
        <div className="stat-card">
          <h3>{Math.round(categories.reduce((sum, cat) => sum + cat.itemCount, 0) / categories.length)}</h3>
          <p>Avg Items/Category</p>
        </div>
        <div className="stat-card">
          <h3>{categories.filter(cat => cat.itemCount > 5).length}</h3>
          <p>Popular Categories</p>
        </div>
      </div>

      <div className="food-items-grid">
        {categories.map((category) => (
          <div key={category.id} className="food-item-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>
                {category.icon}
              </span>
              <h4 style={{ margin: 0 }}>{category.name}</h4>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {category.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span 
                className="status"
                style={{ 
                  background: `${category.color}20`,
                  color: category.color,
                  border: `1px solid ${category.color}30`
                }}
              >
                {category.name}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {category.itemCount} items
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link 
                to={`/edit-category/${category.id}`}
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.5rem', flex: 1, textAlign: 'center' }}
              >
                Edit
              </Link>
              <button 
                onClick={() => handleDelete(category.id)}
                className="btn btn-danger" 
                style={{ fontSize: '0.75rem', padding: '0.5rem', flex: 1 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No categories created yet.</p>
          <Link to="/add-category" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Category
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryList; 