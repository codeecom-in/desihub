import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyLogin = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid magic link. Token or email missing.');
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyMagicLink(email, token);
        if (result.success) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          login(result.user);
          setTimeout(() => {
            if (result.user.role === 'master_admin' || result.user.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          }, 1500);
        } else {
          setStatus('error');
          setMessage(result.message || 'Invalid or expired magic link.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred while verifying your link.');
      }
    };

    verify();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '400px', width: '100%' }}>
        {status === 'verifying' && (
          <>
            <Loader size={48} className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-color)' }} />
            <h2 style={{ marginTop: '1.5rem', fontSize: '1.5rem' }}>Verifying Link...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we log you in safely.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ margin: '0 auto', color: 'var(--success-color)' }} />
            <h2 style={{ marginTop: '1.5rem', fontSize: '1.5rem' }}>Success!</h2>
            <p style={{ color: 'var(--success-color)' }}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} style={{ margin: '0 auto', color: 'var(--danger-color)' }} />
            <h2 style={{ marginTop: '1.5rem', fontSize: '1.5rem' }}>Link Failed</h2>
            <p style={{ color: 'var(--danger-color)', marginBottom: '1.5rem' }}>{message}</p>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', padding: '0.75rem' }}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyLogin;
