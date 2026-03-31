// server/models/Billing.js
const mongoose = require('mongoose');

const billingItemSchema = new mongoose.Schema({
  item_name:   { type: String, required: true },
  item_type: {
    type: String,
    enum: ['consultation', 'procedure', 'medicine', 'lab_test', 'bed', 'ambulance', 'other'],
    required: true
  },
  quantity:    { type: Number, default: 1 },
  unit_price:  { type: Number, required: true },
  total_price: { type: Number, required: true },
}, { _id: true });

const billingSchema = new mongoose.Schema({
  bill_number:      { type: String, required: true, unique: true },
  patient_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  admission_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'BedAllocation', default: null },
  subtotal:         { type: Number, default: 0 },
  discount_percent: { type: Number, default: 0 },
  discount_amount:  { type: Number, default: 0 },
  tax_percent:      { type: Number, default: 18 },
  tax_amount:       { type: Number, default: 0 },
  total_amount:     { type: Number, default: 0 },
  insurance_amount: { type: Number, default: 0 },
  net_amount:       { type: Number, default: 0 },
  amount_paid:      { type: Number, default: 0 },
  balance_due:      { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'pending', 'partially_paid', 'paid', 'cancelled'],
    default: 'pending'
  },
  due_date:   { type: Date, default: null },
  notes:      { type: String, default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items:      [billingItemSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

billingSchema.index({ patient_id: 1 });

module.exports = mongoose.model('Billing', billingSchema);
