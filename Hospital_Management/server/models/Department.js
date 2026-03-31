// server/models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:           { type: String, required: true, maxlength: 100 },
  code:           { type: String, required: true, unique: true, maxlength: 10 },
  description:    { type: String, default: null },
  head_doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  is_active:      { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Department', departmentSchema);
