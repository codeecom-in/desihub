import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ChevronDown, Edit, MapPin, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

const Navbar = () => {
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleEditName = () => {
    setEditingName(true);
    setTempName(user?.name || '');
  };

  const handleSaveName = () => {
    updateUser({ name: tempName });
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setTempName(user?.name || '');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setEditingName(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        DesiThrift
      </Link>
      <div className="navbar-links">
        <Link to="/" className="navbar-link">Shop</Link>
        <Link to="/cart" className="navbar-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={20} />
          <span>Cart</span>
        </Link>
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="navbar-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <User size={20} />
              <span>My Profile</span>
              <ChevronDown size={16} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
            </button>
            {dropdownOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, width: '256px', zIndex: 50, marginTop: '0.5rem' }}>
                <div style={{ padding: '1rem' }}>
                  {/* Profile Image */}
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <User size={32} style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Name</label>
                    {editingName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                          placeholder="Enter your name"
                        />
                        <button onClick={handleSaveName} style={{ color: 'var(--success-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          ✓
                        </button>
                        <button onClick={handleCancelEdit} style={{ color: 'var(--danger-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem' }}>{user?.name || 'No name set'}</span>
                        <button onClick={handleEditName} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <Link to="/profile/address" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', color: 'var(--text-primary)', textDecoration: 'none' }} className="hover-bg" onClick={() => setDropdownOpen(false)}>
                    <MapPin size={16} />
                    <span style={{ fontSize: '0.875rem' }}>Address</span>
                  </Link>

                  {/* My Orders */}
                  <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', color: 'var(--text-primary)', textDecoration: 'none' }} className="hover-bg" onClick={() => setDropdownOpen(false)}>
                    <Package size={16} />
                    <span style={{ fontSize: '0.875rem' }}>My Orders</span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', width: '100%', textAlign: 'left', color: 'var(--danger-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    className="hover-bg"
                  >
                    <LogOut size={16} />
                    <span style={{ fontSize: '0.875rem' }}>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="navbar-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
