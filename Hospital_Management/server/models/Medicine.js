// server/models/Medicine.js
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  generic_name: { type: String, default: null },
  category: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'powder', 'other'],
    default: 'tablet'
  },
  manufacturer:          { type: String, default: null },
  unit:                  { type: String, default: 'strip' },
  description:           { type: String, default: null },
  requires_prescription: { type: Boolean, default: false },
  is_active:             { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

medicineSchema.index({ name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
