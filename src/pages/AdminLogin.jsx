import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendOTP, verifyOTP } from '../services/auth';

const AdminLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Allowed admin phone numbers
  const allowedAdmins = ['+919778256046', '+919633783512'];

  useEffect(() => {
    // If already logged in as admin, redirect to admin dashboard
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // If it starts with 9 and has 10 digits, assume Indian number
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      return `+91${cleaned}`;
    }
    // If it already has country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return phone;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Check if phone number is in allowed list
    if (!allowedAdmins.includes(formattedPhone)) {
      setError('This phone number is not authorized for admin access.');
      setLoading(false);
      return;
    }

    try {
      const result = await sendOTP(formattedPhone);
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setStep('otp');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(confirmationResult, otp);
      if (result.success) {
        // Login as admin
        login({
          phone: result.user.phone,
          uid: result.user.uid,
          role: 'admin'
        });
        navigate('/admin');
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  return (
    <div className="page-enter" style={{ maxWidth: '400px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <Shield size={48} style={{ color: 'var(--danger-color)', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Access</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Enter your authorized phone number to access the admin panel
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger-color)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP}>
            <div className="input-group">
              <label className="input-label" htmlFor="admin-phone">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="admin-phone"
                  type="tel"
                  className="input-field"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '1rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : (
                <>
                  Send OTP
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                We've sent an OTP to <strong>{formatPhoneNumber(phoneNumber)}</strong>
              </p>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="admin-otp">Enter OTP</label>
              <input
                id="admin-otp"
                type="text"
                className="input-field"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handleBack}
                className="btn-primary"
                style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" style={{ marginTop: '2rem' }}></div>
      </div>
    </div>
  );
};

export default AdminLogin;