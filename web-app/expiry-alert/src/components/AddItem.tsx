import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const AddItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Demo data for categories and locations
  const categories = [
    { id: '1', name: 'Fruits', icon: '🍎' },
    { id: '2', name: 'Vegetables', icon: '🥕' },
    { id: '3', name: 'Dairy', icon: '🥛' },
    { id: '4', name: 'Meat', icon: '🥩' },
    { id: '5', name: 'Seafood', icon: '🐟' },
    { id: '6', name: 'Bakery', icon: '🍞' },
    { id: '7', name: 'Pantry', icon: '🥫' },
    { id: '8', name: 'Frozen', icon: '🧊' }
  ];

  const locations = [
    { id: '1', name: 'Main Refrigerator', icon: '🧊' },
    { id: '2', name: 'Pantry', icon: '🏠' },
    { id: '3', name: 'Freezer', icon: '❄️' },
    { id: '4', name: 'Counter', icon: '🌡️' }
  ];

  // Load existing item data when editing
  useEffect(() => {
    if (isEditing && id) {
      // Demo data for editing - in real app, fetch from backend
      const existingItem = {
        id,
        name: 'Organic Milk',
        expiryDate: '2024-01-25',
        category: 'Dairy',
        location: 'Main Refrigerator',
        quantity: '1 gallon',
        notes: 'Keep refrigerated at all times. Opened 3 days ago.'
      };
      
      setName(existingItem.name);
      setExpiryDate(existingItem.expiryDate);
      setCategory(existingItem.category);
      setLocation(existingItem.location);
      setQuantity(existingItem.quantity);
      setNotes(existingItem.notes);
    }
  }, [isEditing, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !expiryDate || !category || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry < today) {
      const confirmAdd = window.confirm(
        'The expiry date is in the past. This item appears to be expired. Do you still want to add it?'
      );
      if (!confirmAdd) return;
    }

    try {
      // Demo mode - just show success message
      console.log(`${isEditing ? 'Updating' : 'Adding'} food item:`, {
        name,
        expiryDate,
        category,
        location,
        quantity,
        notes,
        addedAt: new Date(),
      });
      
      setSuccess(`Food item ${isEditing ? 'updated' : 'added'} successfully! (Demo mode)`);
      
      if (!isEditing) {
        // Reset form only when adding new item
        setName('');
        setExpiryDate('');
        setCategory('');
        setLocation('');
        setQuantity('');
        setNotes('');
      }
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      setError(`Failed to ${isEditing ? 'update' : 'add'} food item. Please try again.`);
      console.error('Error saving food item:', err);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>{isEditing ? 'Edit Food Item' : 'Add New Food Item'}</h2>
        <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Food Item Name *</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Organic Milk, Fresh Apples, Chicken Breast"
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date *</label>
            <input
              type="date"
              id="expiryDate"
              className="form-control"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Don't see your category? <Link to="/add-category" style={{ color: '#22c55e' }}>Add a new one</Link>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="location">Storage Location *</label>
            <select
              id="location"
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              <option value="">Select a location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.icon} {loc.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Need a new location? <Link to="/add-location" style={{ color: '#22c55e' }}>Add one here</Link>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              type="text"
              id="quantity"
              className="form-control"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 1 gallon, 2 lbs, 500g, 6 pieces"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this item..."
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEditing ? 'Update Item' : 'Add Item'}
            </button>
            <Link to="/dashboard" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>💡 Tips for Better Tracking:</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li>Use specific names (e.g., "Greek Yogurt" instead of just "Yogurt")</li>
            <li>Include brand names for better identification</li>
            <li>Set expiry dates based on "Use By" or "Best Before" labels</li>
            <li>Add notes about opened dates or storage instructions</li>
            <li>Include quantity to track how much you have</li>
          </ul>
        </div>

        {/* Quick Category/Location Creation */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link to="/add-category" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
            ➕ Add New Category
          </Link>
          <Link to="/add-location" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
            📍 Add New Location
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddItem; 