import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupTotp, verifyTotpSetup, loginWithTotp } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, QrCode, Mail, ShieldAlert } from 'lucide-react';
import { requestMagicLink } from '../services/auth';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'setup', 'login', 'admin_email', 'admin_sent'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [email, setEmail] = useState('');
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const navigate = useNavigate();
  const { login } = useAuth();

  const normalizePhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (value.trim().startsWith('+')) {
      return `+${digits}`;
    }
    if (digits.startsWith('91')) {
      return `+${digits}`;
    }
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
      const result = await setupTotp(formattedPhone);
      if (!result.success) {
        setError(result.message || 'Unable to setup TOTP. Please try again.');
      } else {
        setQrCode(result.qrCode);
        setSecret(result.secret);
        setStep('setup');
        setSuccessMessage('Scan the QR code with Google Authenticator app.');
      }
    } catch (err) {
      console.error('TOTP setup error:', err);
      setError(err?.message || 'Unable to setup TOTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSetup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = normalizePhoneNumber(phoneNumber);

    try {
      const result = await verifyTotpSetup(formattedPhone, totpToken);
      if (!result.success) {
        setError(result.message || 'Invalid TOTP token. Please try again.');
      } else {
        setStep('login');
        setSuccessMessage('TOTP setup complete! You can now login.');
        setTotpToken('');
      }
    } catch (err) {
      console.error('TOTP setup verification error:', err);
      setError('Invalid TOTP token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = normalizePhoneNumber(phoneNumber);

    try {
      const result = await loginWithTotp(formattedPhone, totpToken);
      if (!result.success) {
        setError(result.message || 'Invalid TOTP token. Please try again.');
      } else {
        // Set user in auth context
        login(result.user);
        navigate('/');
      }
    } catch (err) {
      console.error('TOTP login error:', err);
      setError('Invalid TOTP token. Please try again.');
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
        setError(result.message || 'Failed to request magic link.');
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
    setTotpToken('');
    setQrCode('');
    setSecret('');
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
            {loginMode === 'admin' ? <ShieldAlert size={32} /> : step === 'setup' ? <QrCode size={32} /> : <Lock size={32} />}
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>
            {loginMode === 'admin' ? 'Admin Access' : step === 'phone' ? 'Setup Google Authenticator' : step === 'setup' ? 'Scan QR Code' : 'Login with TOTP'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {loginMode === 'admin' && step === 'admin_email' && 'Enter your admin email to receive a magic link'}
            {loginMode === 'admin' && step === 'admin_sent' && 'Check your email for the login link'}
            {loginMode === 'user' && step === 'phone' && 'Enter your phone number to setup Google Authenticator'}
            {loginMode === 'user' && step === 'setup' && 'Scan this QR code with Google Authenticator app'}
            {loginMode === 'user' && step === 'login' && 'Enter the 6-digit code from Google Authenticator'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {successMessage && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{successMessage}</div>}

        {loginMode === 'user' && step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-phone-number">Phone Number</label>
              <input
                id="login-phone-number"
                name="phoneNumber"
                type="tel"
                className="input-field"
                placeholder="+91 99999 99999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Setting up...' : 'Setup Google Authenticator'}
            </button>
          </form>
        )}

        {step === 'setup' && (
          <>
            {qrCode && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img src={qrCode} alt="QR Code" style={{ maxWidth: '200px', width: '100%' }} />
              </div>
            )}
            <form onSubmit={handleTotpSetup}>
              <div className="input-group">
                <label className="input-label" htmlFor="totp-token">Enter TOTP Code</label>
                <input
                  id="totp-token"
                  name="totpToken"
                  type="text"
                  className="input-field"
                  placeholder="000000"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  required
                  maxLength={6}
                  style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Enable TOTP'}
              </button>
            </form>
          </>
        )}

        {loginMode === 'user' && step === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-totp">6-digit TOTP Code</label>
              <input
                id="login-totp"
                name="totpToken"
                type="text"
                className="input-field"
                placeholder="000000"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                required
                maxLength={6}
                style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login with TOTP'}
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
    </div>
  );
};

export default Login;
