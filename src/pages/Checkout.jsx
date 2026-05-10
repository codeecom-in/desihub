import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find((a) => a.isPrimary)?._id || user?.addresses?.[0]?._id
  );
  const [submitting, setSubmitting] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const saveOrderToLocalStorage = (order) => {
    try {
      const existing = JSON.parse(localStorage.getItem('desihub_orders') || '[]');
      const updated = [order, ...(Array.isArray(existing) ? existing : [])];
      localStorage.setItem('desihub_orders', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!selectedAddressId) {
      alert('Please select a delivery address to proceed.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const createOrderResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/create-order`,
        { amount: total },
        { headers: authHeaders }
      ).then((response) => response.data);

      if (!createOrderResponse || !createOrderResponse.success) {
        throw new Error(createOrderResponse?.message || 'Unable to create payment order.');
      }

      const razorpayOrderId = createOrderResponse.order.id;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const selectedAddress = user?.addresses?.find((a) => a._id === selectedAddressId);
      
      const fullAddressString = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;

      const options = {
        key: razorpayKey,
        amount: createOrderResponse.order.amount,
        currency: createOrderResponse.order.currency,
        name: 'DesiThrift Co.',
        description: 'Thrift Store Purchase',
        image: '/vite.svg',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            const { data: verifyResponse } = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/verify-payment`,
              {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: authHeaders }
            );

            if (!verifyResponse?.success) {
              throw new Error(verifyResponse?.message || 'Payment verification failed.');
            }

            const newOrder = {
              id: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              total,
              status: 'Paid',
              customer: {
                name: user?.name || 'Customer',
                email: user?.email || '',
                phone: user?.phone || '',
                address: fullAddressString
              },
              createdAt: new Date().toISOString(),
              items: cart.map((item) => ({ id: item._id, name: item.name, quantity: item.quantity, price: item.price }))
            };

            saveOrderToLocalStorage(newOrder);
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
            clearCart();
            navigate('/orders');
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            alert('Payment was completed but verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        notes: {
          address: fullAddressString,
        },
        theme: {
          color: '#C89B4F',
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed, please try again.');
        setSubmitting(false);
      });
      paymentObject.open();
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error?.response?.data?.message || error.message || 'Unable to initialize payment.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return <div className="text-center mt-8">Your cart is empty.</div>;
  }

  return (
    <div className="page-enter checkout-container">
      <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2rem)', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Checkout</h1>
      
      <div className="cart-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Delivery Details</h2>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Contact Information</h3>
            <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{user?.name || 'No Name Set'}</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{user?.phone}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'No Email Set'}</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Select Delivery Address</h3>
              <Link to="/profile/address" style={{ color: 'var(--accent-color)', fontSize: '0.875rem', textDecoration: 'underline' }}>
                Add/Edit Address
              </Link>
            </div>
            
            {user?.addresses && user.addresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {user.addresses.map((address) => (
                  <label 
                    key={address._id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '1rem', 
                      padding: '1rem', 
                      border: selectedAddressId === address._id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      background: selectedAddressId === address._id ? 'rgba(200, 155, 79, 0.05)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ marginTop: '0.25rem' }}>
                      <input 
                        type="radio" 
                        name="delivery_address" 
                        value={address._id} 
                        checked={selectedAddressId === address._id} 
                        onChange={() => setSelectedAddressId(address._id)} 
                        style={{ display: 'none' }} 
                      />
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selectedAddressId === address._id ? '6px solid var(--accent-color)' : '2px solid var(--border-color)' }}></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{address.city}, {address.state}</span>
                        {address.isPrimary && <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px' }}>Primary</span>}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {address.street}<br/>
                        {address.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <MapPin size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
                <p style={{ marginBottom: '1rem' }}>You don't have any delivery addresses saved.</p>
                <Link to="/profile/address" className="btn-primary" style={{ display: 'inline-block' }}>
                  Set Up Address
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal ({cart.length} items)</span>
            <span>₹{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            <span>Shipping</span>
            <span>Free</span>
          </div>
          
          <div style={{ borderTop: 'var(--glass-border)', margin: '1.5rem 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total to Pay</span>
            <span style={{ color: 'var(--accent-color)' }}>₹{total}</span>
          </div>

          <button 
            onClick={handlePayment}
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
            disabled={submitting || !user?.addresses?.length}
          >
            {submitting ? 'Processing payment...' : 'Pay via Razorpay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
