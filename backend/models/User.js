const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'admin', 'master_admin'], default: 'user' },
  totpSecret: { type: String },
  totpEnabled: { type: Boolean, default: false },
  magicLinkToken: { type: String },
  magicLinkExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

