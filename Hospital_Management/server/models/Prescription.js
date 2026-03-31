// server/models/Prescription.js
const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  medicine_name: { type: String, required: true },
  dosage:        { type: String, default: null },
  frequency:     { type: String, default: null },
  duration:      { type: String, default: null },
  instructions:  { type: String, default: null },
  quantity:      { type: Number, default: 1 },
}, { _id: true });

const prescriptionSchema = new mongoose.Schema({
  prescription_number: { type: String, required: true, unique: true },
  medical_record_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  patient_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  notes:               { type: String, default: null },
  items:               [prescriptionItemSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Prescription', prescriptionSchema);
