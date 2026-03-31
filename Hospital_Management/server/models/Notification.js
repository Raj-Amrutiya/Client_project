// server/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  message: { type: String, default: null },
  type: {
    type: String,
    enum: ['appointment', 'billing', 'lab', 'pharmacy', 'system', 'general'],
    default: 'general'
  },
  link:    { type: String, default: null },
  is_read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

notificationSchema.index({ user_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
