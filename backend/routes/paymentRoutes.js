const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
});

const createOrderHandler = async (req, res) => {
  console.log('/api/create-order request headers:', req.headers);
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

const verifyPaymentHandler = (req, res) => {
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
};

router.post('/create-order', createOrderHandler);
router.post('/verify-payment', verifyPaymentHandler);

module.exports = router;
