// server/models/Staff.js
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  employee_id:   { type: String, required: true, unique: true },
  designation:   { type: String, default: null },
  salary:        { type: Number, default: null },
  join_date:     { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

staffSchema.index({ user_id: 1 });

module.exports = mongoose.model('Staff', staffSchema);
