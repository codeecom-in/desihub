import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    const res = await loadRazorpayScript();
    
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    // In a real app, call backend to create order
    // const { data: order } = await axios.post(import.meta.env.VITE_API_URL + '/api/orders/create', { amount: total });
    
    // Mock order creation
    const mockOrder = { id: 'order_mock123' + Date.now(), amount: total * 100 };

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_mockkey', // Enter the Key ID generated from the Dashboard
      amount: mockOrder.amount,
      currency: 'INR',
      name: 'DesiThrift Co.',
      description: 'Thrift Store Purchase',
      image: '/vite.svg',
      order_id: mockOrder.id,
      handler: async function (response) {
        const newOrder = {
          id: response.razorpay_order_id || mockOrder.id,
          paymentId: response.razorpay_payment_id,
          total,
          status: 'Paid',
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          },
          createdAt: new Date().toISOString(),
          items: cart.map((item) => ({ id: item._id, name: item.name, quantity: item.quantity, price: item.price }))
        };

        saveOrderToLocalStorage(newOrder);
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        clearCart();
        navigate('/admin#orders');
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: formData.address,
      },
      theme: {
        color: '#C89B4F',
      },
      method: {
        upi: true // Ensure UPI is highlighted
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  if (cart.length === 0) {
    return <div className="text-center mt-8">Your cart is empty.</div>;
  }

  return (
    <div className="page-enter checkout-container">
      <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2rem)', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Checkout</h1>
      
      <div className="glass-panel" style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <form onSubmit={handlePayment}>
          <div className="input-group">
            <label className="input-label" htmlFor="checkout-name">Full Name</label>
            <input id="checkout-name" type="text" name="name" className="input-field" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="checkout-email">Email Address</label>
            <input id="checkout-email" type="email" name="email" className="input-field" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="checkout-phone">Phone Number</label>
            <input id="checkout-phone" type="tel" name="phone" className="input-field" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="checkout-address">Delivery Address</label>
            <textarea id="checkout-address" name="address" className="input-field" rows="3" required onChange={handleChange}></textarea>
          </div>
          <div className="checkout-form-grid">
            <div className="input-group">
              <label className="input-label" htmlFor="checkout-city">City</label>
              <input id="checkout-city" type="text" name="city" className="input-field" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="checkout-pincode">PIN Code</label>
              <input id="checkout-pincode" type="text" name="pincode" className="input-field" required onChange={handleChange} />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: 'var(--glass-border)' }}>
            <div className="checkout-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              <span>Total Amount to Pay:</span>
              <span style={{ color: 'var(--accent-color)' }}>₹{total}</span>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
              Pay via Razorpay (UPI)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
