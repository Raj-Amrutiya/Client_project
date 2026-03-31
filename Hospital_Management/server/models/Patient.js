// server/models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient_id: { type: String, required: true, unique: true },
  dob:        { type: Date, default: null },
  gender:     { type: String, enum: ['male', 'female', 'other'], default: null },
  blood_group:{ type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], default: null },
  address:    { type: String, default: null },
  city:       { type: String, default: null },
  state:      { type: String, default: null },
  pincode:    { type: String, default: null },
  emergency_contact_name:     { type: String, default: null },
  emergency_contact_phone:    { type: String, default: null },
  emergency_contact_relation: { type: String, default: null },
  allergies:          { type: String, default: null },
  chronic_conditions: { type: String, default: null },
  insurance_provider: { type: String, default: null },
  insurance_id:       { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

patientSchema.index({ user_id: 1 });

module.exports = mongoose.model('Patient', patientSchema);
