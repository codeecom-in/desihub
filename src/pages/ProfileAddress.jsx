import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Plus, Check, Star } from 'lucide-react';

const ProfileAddress = () => {
  const { user, login } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', pincode: ''
  });

  const handleInputChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/${user._id}/addresses`, {
        ...addressForm,
        isPrimary: !user.addresses || user.addresses.length === 0
      });
      login(res.data.user); // Update auth context with new user data including address
      setShowAddForm(false);
      setAddressForm({ street: '', city: '', state: '', pincode: '' });
    } catch (err) {
      console.error('Add address error:', err);
      alert('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const setPrimary = async (addressId) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user._id}/addresses/${addressId}/primary`);
      login(res.data.user);
    } catch (err) {
      console.error('Set primary address error:', err);
      alert('Failed to set primary address');
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MapPin size={32} style={{ color: 'var(--accent-color)' }} /> My Addresses
        </h1>
        <button 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} /> {showAddForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add New Address</h2>
          <form onSubmit={handleAddAddress}>
            <div className="input-group">
              <label className="input-label">Street Address (including flat, building)</label>
              <input type="text" name="street" className="input-field" value={addressForm.street} onChange={handleInputChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">City</label>
                <input type="text" name="city" className="input-field" value={addressForm.city} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">State</label>
                <input type="text" name="state" className="input-field" value={addressForm.state} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Pincode</label>
              <input type="text" name="pincode" className="input-field" value={addressForm.pincode} onChange={handleInputChange} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem' }}>
              {loading ? 'Saving...' : 'Save Address'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {user?.addresses && user.addresses.length > 0 ? (
          user.addresses.map((address) => (
            <div key={address._id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', border: address.isPrimary ? '2px solid var(--accent-color)' : '1px solid var(--border-color)' }}>
              {address.isPrimary && (
                <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--accent-color)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={12} /> Primary Delivery Address
                </div>
              )}
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} style={{ color: 'var(--text-secondary)' }} /> {address.city}, {address.state}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                {address.street}<br />
                {address.city}, {address.state} {address.pincode}
              </p>
              
              {!address.isPrimary && (
                <button 
                  onClick={() => setPrimary(address._id)}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Check size={16} /> Set as Primary
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <MapPin size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>You haven't added any delivery addresses yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileAddress;