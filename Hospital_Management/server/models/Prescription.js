// server/models/Prescription.js
const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  medicine_name: { type: String, required: true },
  dosage:        { type: String, default: null },
  frequency:     { type: String, default: null },
  duration:      { type: String, default: null },
  instructions:  { type: String, default: null },
  quantity:      { type: Number, default: 1 },
  medicine_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', default: null },
  price:         { type: Number, default: 0 },
  dispensed:     { type: Boolean, default: false },
  dispensed_date:{ type: Date, default: null },
}, { _id: true });

const prescriptionSchema = new mongoose.Schema({
  prescription_number: { type: String, required: true, unique: true },
  medical_record_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  patient_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  notes:               { type: String, default: null },
  items:               [prescriptionItemSchema],
  status:              { type: String, enum: ['pending', 'dispensed', 'cancelled'], default: 'pending' },
  dispensed_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dispensed_at:        { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

prescriptionSchema.index({ patient_id: 1 });
prescriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
