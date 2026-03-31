// server/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_number: { type: String, required: true, unique: true },
  patient_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment_date:   { type: Date, required: true },
  appointment_time:   { type: String, required: true },
  token_number:       { type: Number, default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['online', 'walk_in', 'emergency'],
    default: 'walk_in'
  },
  reason:         { type: String, default: null },
  notes:          { type: String, default: null },
  follow_up_date: { type: Date, default: null },
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

appointmentSchema.index({ patient_id: 1 });
appointmentSchema.index({ doctor_id: 1, appointment_date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
