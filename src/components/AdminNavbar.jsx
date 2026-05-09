import { Link, useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const AdminNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--accent-color)' }}>
      <Link to="/admin" className="navbar-brand" style={{ color: 'var(--accent-color)', background: 'none', WebkitTextFillColor: 'initial' }}>
        DesiThrift Admin
      </Link>
      <div className="navbar-links desktop-nav">
        <Link to="/admin#inventory" className="navbar-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <Package size={20} />
          <span>Inventory</span>
        </Link>
        <Link to="/admin#orders" className="navbar-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <ShoppingCart size={20} />
          <span>Orders</span>
        </Link>
        <Link to="/admin#customers" className="navbar-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <Users size={20} />
          <span>Customers</span>
        </Link>
        <button
          onClick={handleLogout}
          className="navbar-link flex items-center gap-2"
          style={{ color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <button
        className="hamburger-btn"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        aria-label="Toggle admin menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <Link to="/admin#inventory" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            <Package size={20} />
            <span>Inventory</span>
          </Link>
          <Link to="/admin#orders" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            <ShoppingCart size={20} />
            <span>Orders</span>
          </Link>
          <Link to="/admin#customers" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            <Users size={20} />
            <span>Customers</span>
          </Link>
          <button
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className="logout-btn"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
