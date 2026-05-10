const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

// Magic Link Login: Request Link
router.post('/request-magic-link', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. You must be added as an admin first.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.magicLinkToken = token;
    user.magicLinkExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    await user.save();

    // The frontend URL they should click
    // Note: FRONTEND_URL environment variable needs to be set in production
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLink = `${frontendUrl}/verify-login?token=${token}&email=${email}`;

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"DesiHub Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Magic Login Link - DesiHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login to DesiHub Admin</h2>
          <p>Click the secure link below to log into your account. This link will expire in 15 minutes.</p>
          <a href="${magicLink}" style="padding: 12px 24px; background-color: #C89B4F; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">Log In Now</a>
          <br><br>
          <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="font-size: 12px; color: #0066cc; word-break: break-all;">${magicLink}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Magic link officially emailed to ${email}`);

    res.json({
      success: true,
      message: 'Magic link sent! Check your email inbox.'
    });
  } catch (error) {
    console.error('Error requesting magic link:', error);
    res.status(500).json({ success: false, message: 'Failed to request magic link.', error: error.message, stack: error.stack });
  }
});

// Magic Link Login: Verify Link
router.post('/verify-magic-link', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ success: false, message: 'Email and token are required.' });

  try {
    const user = await User.findOne({ 
      email, 
      magicLinkToken: token,
      magicLinkExpires: { $gt: Date.now() } // Ensure token is not expired
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired magic link.' });
    }

    // Clear the token
    user.magicLinkToken = undefined;
    user.magicLinkExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful.',
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ success: false, message: 'Failed to verify magic link.' });
  }
});

// Master Admin: Create Admin
router.post('/create-admin', async (req, res) => {
  // In a real app you'd verify JWT session here. 
  // For now we'll require the master admin email to be passed in to verify intent.
  const { masterEmail, newAdminEmail } = req.body;
  
  if (!masterEmail || !newAdminEmail) {
    return res.status(400).json({ success: false, message: 'Both masterEmail and newAdminEmail are required.' });
  }

  try {
    const master = await User.findOne({ email: masterEmail, role: 'master_admin' });
    if (!master) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only master admin can perform this action.' });
    }

    const existingUser = await User.findOne({ email: newAdminEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }

    const newAdmin = new User({ email: newAdminEmail, role: 'admin' });
    await newAdmin.save();

    res.json({
      success: true,
      message: 'Admin created successfully. They can now login using a magic link.'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin.' });
  }
});

// Sync Firebase User
router.post('/sync-user', async (req, res) => {
  const { phone, uid } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    let user = await User.findOne({ phone });
    
    if (!user) {
      // First time user!
      user = new User({ phone });
      await user.save();
      return res.json({ success: true, isNewUser: true, user });
    }

    // Existing user
    // We check if name is empty to determine if they need to setup profile
    const needsSetup = !user.name;
    res.json({ success: true, isNewUser: needsSetup, user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ success: false, message: 'Failed to sync user.' });
  }
});

module.exports = router;
