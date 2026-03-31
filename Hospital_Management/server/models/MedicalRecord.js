// server/models/MedicalRecord.js
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  visit_date:      { type: Date, default: Date.now },
  chief_complaint: { type: String, default: null },
  symptoms:        { type: String, default: null },
  diagnosis:       { type: String, default: null },
  treatment_plan:  { type: String, default: null },
  vital_bp:        { type: String, default: null },
  vital_pulse:     { type: String, default: null },
  vital_temp:      { type: String, default: null },
  vital_weight:    { type: String, default: null },
  vital_height:    { type: String, default: null },
  vital_spo2:      { type: String, default: null },
  follow_up_date:  { type: Date, default: null },
  notes:           { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

medicalRecordSchema.index({ patient_id: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
