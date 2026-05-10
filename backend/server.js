require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
console.log('Razorpay env debug:', {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET_CONFIGURED: Boolean(process.env.RAZORPAY_KEY_SECRET),
  envKeys: Object.keys(process.env).filter((key) => key.startsWith('RAZORPAY'))
});
if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('WARNING: Razorpay credentials are missing or incomplete in environment configuration.');
}

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:3000', 
  'http://192.168.1.73:5173',
  'https://desihub-five.vercel.app'
];
if (process.env.FRONTEND_URL) {
  // Strip trailing slash if the user accidentally added one in Render
  const cleanUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
  allowedOrigins.push(cleanUrl);
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow if it's in our specific list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow ANY vercel.app deployment URL
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use('/api', paymentRoutes);

// Database Connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL: MONGO_URI is not configured. Set MONGO_URI in your environment for production.');
  process.exit(1);
}
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB Connected');
  // Seed master admin
  const User = require('./models/User');
  try {
    const masterAdmin = await User.findOne({ email: 'muhammadroshan902@gmail.com' });
    if (!masterAdmin) {
      await User.create({ email: 'muhammadroshan902@gmail.com', role: 'master_admin' });
      console.log('Master admin account created automatically.');
    }
  } catch (err) {
    console.error('Error seeding master admin:', err);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Thrift Store API Running');
});

// Create Razorpay order helper
const createOrderHandler = async (req, res) => {
  console.log('/api/create-order request headers:', req.headers);
  console.log('/api/create-order req.user:', req.user || null);
  console.log('/api/create-order body:', req.body);
  console.log('/api/create-order key id used:', razorpayKeyId ? 'configured' : 'missing');

  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials missing at request time:', {
        keyId: razorpayKeyId,
        hasSecret: Boolean(razorpayKeySecret)
      });
      return res.status(500).json({ success: false, message: 'Razorpay credentials not configured on backend.' });
    }

    const { amount } = req.body;
    console.log('/api/create-order amount raw:', amount);

    if (amount == null || amount === '' || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Amount is required and must be a number.' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    const amountPaise = Math.round(parsedAmount * 100);
    console.log('/api/create-order amountPaise:', amountPaise);

    if (amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Minimum amount is ₹1 (100 paise).' });
    }

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1
    };
    console.log('/api/create-order options:', options);

    const order = await razorpay.orders.create(options);
    console.log('/api/create-order razorpay order:', order);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    console.error('Razorpay create order stack:', error.stack);
    const status = error.statusCode || 500;
    const message = error.error?.description || error.error?.message || error.message || 'Order creation failed';
    return res.status(status).json({ success: false, message, error: error.error || error });
  }
};

// Public payment routes: create-order and verify-payment are intentionally not protected by auth middleware
// Additional routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
