import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupTotp, verifyTotpSetup, loginWithTotp } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, QrCode } from 'lucide-react';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'setup', 'login'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
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

  const resetToPhone = () => {
    setStep('phone');
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--accent-color)', marginBottom: '1rem' }}>
            {step === 'setup' ? <QrCode size={32} /> : <Lock size={32} />}
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>
            {step === 'phone' ? 'Setup Google Authenticator' : step === 'setup' ? 'Scan QR Code' : 'Login with TOTP'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {step === 'phone' && 'Enter your phone number to setup Google Authenticator'}
            {step === 'setup' && 'Scan this QR code with Google Authenticator app'}
            {step === 'login' && 'Enter the 6-digit code from Google Authenticator'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {successMessage && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{successMessage}</div>}

        {step === 'phone' && (
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

        {step === 'login' && (
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

        {step !== 'phone' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={resetToPhone}
              style={{ background: 'transparent', color: 'var(--accent-color)', textDecoration: 'underline' }}
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
