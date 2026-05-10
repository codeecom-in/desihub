const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  profilePicture: { type: String },
  addresses: [addressSchema],
  role: { type: String, enum: ['user', 'admin', 'master_admin'], default: 'user' },
  totpSecret: { type: String },
  totpEnabled: { type: Boolean, default: false },
  magicLinkToken: { type: String },
  magicLinkExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

