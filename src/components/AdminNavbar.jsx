import { Link, useNavigate } from 'react-router-dom';
import { Package, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminNavbar = () => {
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
      <div className="navbar-links">
        <Link to="/admin" className="navbar-link flex items-center gap-2">
          <Package size={20} />
          <span>Inventory</span>
        </Link>
        <Link to="/admin" className="navbar-link flex items-center gap-2">
          <Users size={20} />
          <span>Customers</span>
        </Link>
        <Link to="/admin" className="navbar-link flex items-center gap-2">
          <Settings size={20} />
          <span>Settings</span>
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
    </nav>
  );
};

export default AdminNavbar;
