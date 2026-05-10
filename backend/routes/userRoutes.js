const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const customers = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/profile', async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, profilePicture } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/addresses', async (req, res) => {
  try {
    const { street, city, state, pincode, isPrimary } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isPrimary || user.addresses.length === 0) {
      user.addresses.forEach(addr => addr.isPrimary = false);
    }

    const newAddress = {
      street, city, state, pincode,
      isPrimary: isPrimary || user.addresses.length === 0
    };
    user.addresses.push(newAddress);
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/addresses/:addressId/primary', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    user.addresses.forEach(addr => addr.isPrimary = false);
    address.isPrimary = true;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
