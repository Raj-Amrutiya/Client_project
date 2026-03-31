// server/models/LabTest.js
const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  parameter_name:  { type: String, default: null },
  result_value:    { type: String, default: null },
  reference_range: { type: String, default: null },
  unit:            { type: String, default: null },
  result_file:     { type: String, default: null },
  interpretation:  { type: String, default: null },
  is_abnormal:     { type: Boolean, default: false },
  created_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at:      { type: Date, default: Date.now },
}, { _id: true });

const labTestSchema = new mongoose.Schema({
  test_number:    { type: String, required: true, unique: true },
  patient_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  test_name:      { type: String, required: true },
  test_type:      { type: String, default: null },
  test_category:  { type: String, default: 'biochemistry' },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['requested', 'sample_collected', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  sample_type:     { type: String, default: null },
  requested_date:  { type: Date, default: Date.now },
  completed_date:  { type: Date, default: null },
  price:           { type: Number, default: 0 },
  notes:           { type: String, default: null },
  results:         [labResultSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

labTestSchema.index({ patient_id: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);
