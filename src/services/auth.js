const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const buildHeaders = () => ({
  'Content-Type': 'application/json'
});

export const setupTotp = async (phone) => {
  const response = await fetch(`${API_URL}/api/auth/setup-totp`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ phone })
  });
  return response.json();
};

export const verifyTotpSetup = async (phone, token) => {
  const response = await fetch(`${API_URL}/api/auth/verify-totp-setup`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ phone, token })
  });
  return response.json();
};

export const loginWithTotp = async (phone, token) => {
  const response = await fetch(`${API_URL}/api/auth/login-totp`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ phone, token })
  });
  return response.json();
};

