const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');

const router = express.Router();

// Generate TOTP secret and QR code
router.post('/setup-totp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Thrift Store (${phone})`,
      issuer: 'Thrift Store'
    });

    user.totpSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      message: 'TOTP setup initiated.',
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('TOTP setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup TOTP.' });
  }
});

// Verify TOTP and enable for user
router.post('/verify-totp-setup', async (req, res) => {
  const { phone, token } = req.body;
  if (!phone || !token) {
    return res.status(400).json({ success: false, message: 'Phone and TOTP token are required.' });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user || !user.totpSecret) {
      return res.status(400).json({ success: false, message: 'TOTP setup not initiated.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time windows (30 seconds each)
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid TOTP token.' });
    }

    user.totpEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'TOTP enabled successfully.',
      user: { phone: user.phone, totpEnabled: user.totpEnabled }
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify TOTP.' });
  }
});

// Login with TOTP
router.post('/login-totp', async (req, res) => {
  const { phone, token } = req.body;
  if (!phone || !token) {
    return res.status(400).json({ success: false, message: 'Phone and TOTP token are required.' });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found. Please setup TOTP first.' });
    }

    if (!user.totpEnabled || !user.totpSecret) {
      return res.status(400).json({ success: false, message: 'TOTP not enabled for this user.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid TOTP token.' });
    }

    res.json({
      success: true,
      message: 'Login successful.',
      user: { phone: user.phone, totpEnabled: user.totpEnabled }
    });
  } catch (error) {
    console.error('TOTP login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

module.exports = router;
