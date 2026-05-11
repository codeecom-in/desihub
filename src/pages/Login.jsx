import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, Mail, ShieldAlert, MessageSquare, User, Upload } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', street: '', city: '', state: '', pincode: ''
  });
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
        if (result.isNewUser) {
          setTempUser(result.user);
          setStep('profile');
          setSuccessMessage('Phone verified! Please setup your profile.');
        } else {
          login(result.user);
          navigate('/');
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(import.meta.env.VITE_API_URL + '/api/upload', formData);
      const uploadedUrl = response.data;
      const finalUrl = uploadedUrl.startsWith('http') ? uploadedUrl : import.meta.env.VITE_API_URL + uploadedUrl;
      setProfileImage(finalUrl);
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to upload profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${tempUser._id}/profile`, {
        name: profileForm.name,
        email: profileForm.email,
        profilePicture: profileImage
      });

      let updatedAddresses = [];
      if (profileForm.street && profileForm.city && profileForm.state && profileForm.pincode) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users/${tempUser._id}/addresses`, {
          street: profileForm.street,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode,
          isPrimary: true
        });
        updatedAddresses = [{
          street: profileForm.street,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode,
          isPrimary: true
        }];
      }

      const updatedUser = {
        ...tempUser,
        name: profileForm.name,
        email: profileForm.email,
        profilePicture: profileImage,
        addresses: updatedAddresses
      };

      login(updatedUser);
      navigate('/');
    } catch (err) {
      console.error('Profile setup error:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToPhone = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setConfirmationResult(null);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="page-enter login-container">
      <div className="glass-panel login-panel">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-icon" style={{ background: 'rgba(200, 155, 79, 0.1)', color: 'var(--accent-color)' }}>
            {step === 'otp' ? <MessageSquare size={32} /> : step === 'profile' ? <User size={32} /> : <Lock size={32} />}
          </div>
          <h2 className="login-title">
            {step === 'phone' ? 'Phone Login' : step === 'otp' ? 'Enter OTP' : 'Complete Profile'}
          </h2>
          <p className="login-subtitle">
            {step === 'phone' && 'Enter your phone number to receive OTP'}
            {step === 'otp' && 'Enter the 6-digit OTP sent to your phone'}
            {step === 'profile' && 'Set up your account details and primary delivery address'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {successMessage && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{successMessage}</div>}

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-phone-number">Phone Number</label>
              <div className="login-phone-input">
                <div className="login-country-code">
                  +91
                </div>
                <input
                  id="login-phone-number"
                  name="phoneNumber"
                  type="tel"
                  className="input-field login-phone-field"
                  placeholder="99999 99999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  maxLength={10}
                />
              </div>
            </div>
            {/* reCAPTCHA container for Firebase */}
            <div id="recaptcha-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '1rem' }}></div>
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

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', border: '2px dashed var(--border-color)' }}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} style={{ color: 'var(--text-secondary)', margin: '24px auto' }} />
                )}
                <input type="file" id="profile-upload" accept="image/*" onChange={handleProfileImageUpload} style={{ display: 'none' }} />
                <label htmlFor="profile-upload" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0', cursor: 'pointer', textAlign: 'center' }}>
                  <Upload size={14} style={{ display: 'inline' }} />
                </label>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" name="name" className="input-field" placeholder="John Doe" value={profileForm.name} onChange={handleProfileChange} required />
            </div>

            <div className="input-group">
              <label className="input-label">Email ID</label>
              <input type="email" name="email" className="input-field" placeholder="john@example.com" value={profileForm.email} onChange={handleProfileChange} />
            </div>

            <h3 style={{ fontSize: '1.1rem', margin: '1.5rem 0 1rem 0' }}>Primary Delivery Address</h3>

            <div className="input-group">
              <label className="input-label">Street Address</label>
              <input type="text" name="street" className="input-field" placeholder="123 Main St, Apt 4B" value={profileForm.street} onChange={handleProfileChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">City</label>
                <input type="text" name="city" className="input-field" placeholder="Mumbai" value={profileForm.city} onChange={handleProfileChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">State</label>
                <input type="text" name="state" className="input-field" placeholder="Maharashtra" value={profileForm.state} onChange={handleProfileChange} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Pincode</label>
              <input type="text" name="pincode" className="input-field" placeholder="400001" value={profileForm.pincode} onChange={handleProfileChange} required />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
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
