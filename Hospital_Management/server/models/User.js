// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, maxlength: 100 },
  email:     { type: String, required: true, unique: true, maxlength: 150 },
  password:  { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'receptionist', 'patient', 'lab_technician', 'pharmacist'],
    default: 'patient'
  },
  phone:     { type: String, default: null },
  avatar:    { type: String, default: null },
  is_active: { type: Boolean, default: true },
  last_login:{ type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
