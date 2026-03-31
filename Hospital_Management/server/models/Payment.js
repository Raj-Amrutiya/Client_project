// server/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_number: { type: String, required: true, unique: true },
  billing_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Billing', required: true },
  patient_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  amount:         { type: Number, required: true },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'insurance', 'online', 'cheque', 'neft'],
    required: true
  },
  transaction_id:   { type: String, default: null },
  reference_number: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  payment_date: { type: Date, default: Date.now },
  notes:        { type: String, default: null },
  received_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: false });

module.exports = mongoose.model('Payment', paymentSchema);
