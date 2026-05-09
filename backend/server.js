require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

const app = express();

console.log('Razorpay env debug:', {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  hasSecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
  envKeys: Object.keys(process.env).filter((key) => key.startsWith('RAZORPAY'))
});
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Basic Route
app.get('/', (req, res) => {
  res.send('Thrift Store API Running');
});

// Create Razorpay order helper
const createOrderHandler = async (req, res) => {
  console.log('/api/create-order request headers:', req.headers);
  console.log('/api/create-order req.user:', req.user || null);
  console.log('/api/create-order key id:', process.env.RAZORPAY_KEY_ID);

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay env missing at request time:', {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        hasSecret: Boolean(process.env.RAZORPAY_KEY_SECRET)
      });
      return res.status(500).json({ success: false, message: 'Razorpay credentials not configured on backend.' });
    }

    const { amount } = req.body;
    if (amount == null || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Amount is required and must be a number.' });
    }

    const amountPaise = Math.round(Number(amount) * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Minimum amount is ₹1 (100 paise).' });
    }

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    const status = error.statusCode || 500;
    const message = error.error?.description || error.error?.message || error.message || 'Error creating Razorpay order.';
    return res.status(status).json({ success: false, message, details: error.error || error });
  }
};

app.post('/api/orders/create', createOrderHandler);
app.post('/api/create-order', createOrderHandler);

app.post('/api/verify-payment', (req, res) => {
  const { order_id, payment_id, razorpay_signature } = req.body;

  if (!order_id || !payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing required payment fields.' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
  }

  return res.json({ success: true, message: 'Payment signature verified successfully.' });
});

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
