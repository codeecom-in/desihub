import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, Mail, ShieldAlert, MessageSquare } from 'lucide-react';
import { requestMagicLink } from '../services/auth';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'admin_email', 'admin_sent'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const normalizePhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    return `+91${digits}`;
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const formattedPhone = normalizePhoneNumber(phoneNumber);
    if (!/^[+][0-9]{10,15}$/.test(formattedPhone)) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    try {
      const result = await sendOTP(formattedPhone);
      if (!result.success) {
        setError(result.message || 'Unable to send OTP. Please try again.');
      } else {
        setConfirmationResult(result.confirmationResult);
        setStep('otp');
        setSuccessMessage('OTP sent to your phone. Please enter the 6-digit code.');
      }
    } catch (err) {
      console.error('OTP send error:', err);
      setError(err?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!confirmationResult) {
      setError('Please request OTP first.');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyOTP(confirmationResult, otp);
      if (!result.success) {
        setError(result.message || 'Invalid OTP. Please try again.');
      } else {
        // Set user in auth context
        login(result.user);
        navigate('/');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const result = await requestMagicLink(email);
      if (!result.success) {
        setError(result.error ? `Server Error: ${result.error}` : (result.message || 'Failed to request magic link.'));
      } else {
        setStep('admin_sent');
        setSuccessMessage('Magic link sent! Check your email (or server console for local testing).');
      }
    } catch (err) {
      console.error('Magic link error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToPhone = () => {
    setStep(loginMode === 'user' ? 'phone' : 'admin_email');
    setPhoneNumber('');
    setOtp('');
    setConfirmationResult(null);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => { setLoginMode('user'); setStep('phone'); setError(''); setSuccessMessage(''); }}
            style={{ flex: 1, padding: '0.5rem', background: loginMode === 'user' ? 'var(--accent-color)' : 'transparent', color: loginMode === 'user' ? 'white' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            User Login
          </button>
          <button
            onClick={() => { setLoginMode('admin'); setStep('admin_email'); setError(''); setSuccessMessage(''); }}
            style={{ flex: 1, padding: '0.5rem', background: loginMode === 'admin' ? 'var(--danger-color)' : 'transparent', color: loginMode === 'admin' ? 'white' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Admin Login
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: loginMode === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: loginMode === 'admin' ? 'var(--danger-color)' : 'var(--accent-color)', marginBottom: '1rem' }}>
            {loginMode === 'admin' ? <ShieldAlert size={32} /> : step === 'otp' ? <MessageSquare size={32} /> : <Lock size={32} />}
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>
            {loginMode === 'admin' ? 'Admin Access' : step === 'phone' ? 'Phone Login' : 'Enter OTP'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {loginMode === 'admin' && step === 'admin_email' && 'Enter your admin email to receive a magic link'}
            {loginMode === 'admin' && step === 'admin_sent' && 'Check your email for the login link'}
            {loginMode === 'user' && step === 'phone' && 'Enter your phone number to receive OTP'}
            {loginMode === 'user' && step === 'otp' && 'Enter the 6-digit OTP sent to your phone'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {successMessage && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{successMessage}</div>}

        {loginMode === 'user' && step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-phone-number">Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '8px 0 0 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  +91
                </div>
                <input
                  id="login-phone-number"
                  name="phoneNumber"
                  type="tel"
                  className="input-field"
                  style={{ borderRadius: '0 8px 8px 0' }}
                  placeholder="99999 99999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  maxLength={10}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="otp-code">6-digit OTP</label>
              <input
                id="otp-code"
                name="otp"
                type="text"
                className="input-field"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}

        {loginMode === 'admin' && step === 'admin_email' && (
          <form onSubmit={handleAdminEmailSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                className="input-field"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem', background: 'var(--danger-color)' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {loginMode === 'admin' && step === 'admin_sent' && (
          <div style={{ textAlign: 'center' }}>
            <Mail size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }} />
            <p>We've sent a magic link to your email. Click it to log in automatically.</p>
          </div>
        )}

        {((loginMode === 'user' && step !== 'phone') || (loginMode === 'admin' && step !== 'admin_email')) && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={resetToPhone}
              style={{ background: 'transparent', color: loginMode === 'admin' ? 'var(--danger-color)' : 'var(--accent-color)', textDecoration: 'underline' }}
            >
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* reCAPTCHA container for Firebase */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
