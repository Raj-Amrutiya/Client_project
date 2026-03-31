// server/models/BedAllocation.js
const mongoose = require('mongoose');

const bedAllocationSchema = new mongoose.Schema({
  bed_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  patient_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  admitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  admit_date:  { type: Date, default: Date.now },
  expected_discharge_date: { type: Date, default: null },
  actual_discharge_date:   { type: Date, default: null },
  discharge_notes:         { type: String, default: null },
  diagnosis_at_admission:  { type: String, default: null },
  status: {
    type: String,
    enum: ['active', 'discharged'],
    default: 'active'
  },
}, { timestamps: false });

bedAllocationSchema.index({ patient_id: 1 });
bedAllocationSchema.index({ bed_id: 1 });

module.exports = mongoose.model('BedAllocation', bedAllocationSchema);
