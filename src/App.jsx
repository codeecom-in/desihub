import { createBrowserRouter, RouterProvider, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import VerifyLogin from './pages/VerifyLogin';
import Orders from './pages/Orders';
import ProfileAddress from './pages/ProfileAddress';
import AdminDashboard from './admin/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import './index.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {isAdmin ? <AdminNavbar /> : <Navbar />}
      <main className="main-content" style={{ padding: isAdmin ? '2rem 1rem' : '2rem' }}>
        {children}
      </main>
    </div>
  );
};

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout><Home /></Layout>
    },
    {
      path: '/product/:id',
      element: <Layout><ProductDetails /></Layout>
    },
    {
      path: '/cart',
      element: <Layout><Cart /></Layout>
    },
    {
      path: '/checkout',
      element: <Layout><Checkout /></Layout>
    },
    {
      path: '/login',
      element: <Layout><Login /></Layout>
    },
    {
      path: '/verify-login',
      element: <Layout><VerifyLogin /></Layout>
    },
    {
      path: '/orders',
      element: <Layout><Orders /></Layout>
    },
    {
      path: '/profile/address',
      element: <Layout><ProfileAddress /></Layout>
    },
    {
      path: '/admin/login',
      element: <Layout><AdminLogin /></Layout>
    },
    {
      path: '/admin/*',
      element: (
        <ProtectedAdminRoute>
          <Layout><AdminDashboard /></Layout>
        </ProtectedAdminRoute>
      )
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <CartProvider>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      />
    </CartProvider>
  );
}

export default App;
