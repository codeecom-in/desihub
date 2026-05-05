import { Link } from 'react-router-dom';
import { Package, Users, Settings, LogOut } from 'lucide-react';

const AdminNavbar = () => {
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
        <Link to="/" className="navbar-link flex items-center gap-2" style={{ color: 'var(--danger-color)' }}>
          <LogOut size={20} />
          <span>Exit Admin</span>
        </Link>
      </div>
    </nav>
  );
};

export default AdminNavbar;
