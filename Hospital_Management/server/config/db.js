// server/config/db.js — Mongoose connection
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hms_db';

// Enable `id` virtual for all schemas globally to match old MySQL 'id' fields
mongoose.plugin(schema => {
  schema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret._id; delete ret.__v; } });
  schema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret._id; delete ret.__v; } });
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

module.exports = mongoose;
