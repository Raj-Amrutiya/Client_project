// server/models/Bed.js
const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bed_number: { type: String, required: true, unique: true },
  ward_type: {
    type: String,
    enum: ['general', 'icu', 'emergency', 'pediatric', 'maternity', 'surgical', 'private', 'semi_private'],
    required: true
  },
  floor:      { type: Number, default: 1 },
  ward_name:  { type: String, default: null },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'cleaning'],
    default: 'available'
  },
  daily_rate: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

bedSchema.index({ status: 1 });
bedSchema.index({ ward_type: 1 });

module.exports = mongoose.model('Bed', bedSchema);
