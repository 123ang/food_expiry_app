import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddLocation: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [temperature, setTemperature] = useState<'room' | 'refrigerated' | 'frozen'>('room');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

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
      console.log('Adding location:', {
        name,
        description,
        temperature,
        addedAt: new Date(),
      });
      
      setSuccess('Location added successfully! (Demo mode)');
      
      // Reset form
      setName('');
      setDescription('');
      setTemperature('room');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/locations');
      }, 1500);
      
    } catch (err: any) {
      setError('Failed to add location. Please try again.');
      console.error('Error adding location:', err);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>Add Storage Location</h2>
        <Link to="/locations" className="btn btn-secondary">← Back to Locations</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Location Name *</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Main Refrigerator, Pantry, Freezer"
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
              placeholder="Describe this storage location..."
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature Type *</label>
            <select
              id="temperature"
              className="form-control"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value as 'room' | 'refrigerated' | 'frozen')}
              required
            >
              <option value="room">🌡️ Room Temperature</option>
              <option value="refrigerated">🧊 Refrigerated</option>
              <option value="frozen">❄️ Frozen</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Add Location
            </button>
            <Link to="/locations" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Tips for Storage Locations:</h4>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
            <li><strong>Room Temperature:</strong> Pantry, counter, cupboards</li>
            <li><strong>Refrigerated:</strong> Main fridge, mini fridge, cold storage</li>
            <li><strong>Frozen:</strong> Freezer, deep freeze, ice chest</li>
            <li>Be specific with names to easily identify locations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddLocation; 