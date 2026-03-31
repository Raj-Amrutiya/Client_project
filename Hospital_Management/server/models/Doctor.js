// server/models/Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user_id:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  doctor_id:            { type: String, required: true, unique: true },
  specialization:       { type: String, default: null },
  qualification:        { type: String, default: null },
  experience_years:     { type: Number, default: 0 },
  consultation_fee:     { type: Number, default: 500 },
  available_days:       { type: String, default: 'Mon,Tue,Wed,Thu,Fri' },
  available_from:       { type: String, default: '09:00:00' },
  available_to:         { type: String, default: '17:00:00' },
  max_patients_per_day: { type: Number, default: 20 },
  bio:                  { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

doctorSchema.index({ user_id: 1 });
doctorSchema.index({ department_id: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
