import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddCategory: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🍽️');
  const [color, setColor] = useState('#22c55e');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const predefinedIcons = [
    '🍎', '🥕', '🥛', '🥩', '🐟', '🍞', '🥫', '🧊',
    '🥗', '🍇', '🧄', '🥚', '🍗', '🥦', '🌽', '🍌',
    '🥔', '🍅', '🥒', '🫐', '🥝', '🍑', '🥬', '🍽️'
  ];

  const predefinedColors = [
    '#ef4444', '#22c55e', '#3b82f6', '#dc2626', '#0ea5e9',
    '#d97706', '#7c3aed', '#06b6d4', '#f59e0b', '#8b5cf6',
    '#ec4899', '#10b981', '#6366f1', '#84cc16', '#f97316'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      // Demo mode - just show success message
      console.log('Adding category:', {
        name,
        description,
        icon,
        color,
        addedAt: new Date(),
      });
      
      setSuccess('Category added successfully! (Demo mode)');
      
      // Reset form
      setName('');
      setDescription('');
      setIcon('🍽️');
      setColor('#22c55e');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/categories');
      }, 1500);
      
    } catch (err: any) {
      setError('Failed to add category. Please try again.');
      console.error('Error adding category:', err);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>Add Food Category</h2>
        <Link to="/categories" className="btn btn-secondary">← Back to Categories</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Category Name *</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Fruits, Vegetables, Dairy"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe what items belong to this category..."
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="icon">Category Icon</label>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                id="icon"
                className="form-control"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Choose an emoji or enter custom"
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {predefinedIcons.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    style={{
                      background: icon === emoji ? '#22c55e' : '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="color">Category Color</label>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="color"
                id="color"
                className="form-control"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ height: '50px', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {predefinedColors.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    style={{
                      background: colorOption,
                      border: color === colorOption ? '3px solid #000' : '1px solid #e5e7eb',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Preview:</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>{icon}</span>
              <span style={{ fontWeight: '600', color: color }}>{name || 'Category Name'}</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Add Category
            </button>
            <Link to="/categories" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Category Tips:</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li>Choose descriptive names that clearly identify the food type</li>
            <li>Pick icons that visually represent the category</li>
            <li>Use different colors to make categories easily distinguishable</li>
            <li>Keep descriptions concise but informative</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddCategory; 