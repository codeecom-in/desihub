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
