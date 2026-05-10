import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="page-enter text-center mt-8">
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>Your Cart</h1>
      
      <div className="cart-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cart.map((item) => (
            <div key={item._id} className="glass-panel" style={{ display: 'flex', padding: '1.5rem', gap: '1.5rem', alignItems: 'center' }}>
              <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=500'} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px' }} />
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{item.name}</h3>
                <p style={{ color: 'var(--accent-color)', fontWeight: 700 }}>₹{item.price}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem', borderRadius: '50px' }}>
                <button onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} style={{ background: 'transparent', color: 'var(--text-primary)', padding: '0.2rem' }}>
                  <Minus size={16} />
                </button>
                <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'transparent', color: 'var(--text-primary)', padding: '0.2rem' }}>
                  <Plus size={16} />
                </button>
              </div>

              <button 
                onClick={() => removeFromCart(item._id)}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '50%', display: 'flex' }}
                title="Remove"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            <span>Shipping</span>
            <span>Free</span>
          </div>
          
          <div style={{ borderTop: 'var(--glass-border)', margin: '1.5rem 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <button 
            onClick={() => navigate('/checkout')}
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
          >
            Proceed to Checkout <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
