import { sendPhoneOTP, setupRecaptcha } from './firebase.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const buildHeaders = () => ({
  'Content-Type': 'application/json'
});

export const sendOTP = async (phoneNumber) => {
  try {
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      throw new Error('reCAPTCHA container not found');
    }

    const appVerifier = setupRecaptcha(container);
    const confirmationResult = await sendPhoneOTP(phoneNumber, appVerifier);
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: error.message };
  }
};

export const verifyOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    return { success: true, user: { phone: user.phoneNumber, uid: user.uid } };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: error.message };
  }
};

export const requestMagicLink = async (email) => {
  const response = await fetch(`${API_URL}/api/auth/request-magic-link`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email })
  });
  return response.json();
};

export const verifyMagicLink = async (email, token) => {
  const response = await fetch(`${API_URL}/api/auth/verify-magic-link`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, token })
  });
  return response.json();
};

export const createAdmin = async (masterEmail, newAdminEmail) => {
  const response = await fetch(`${API_URL}/api/auth/create-admin`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ masterEmail, newAdminEmail })
  });
  return response.json();
};
