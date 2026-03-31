// server/models/MedicineStock.js
const mongoose = require('mongoose');

const medicineStockSchema = new mongoose.Schema({
  medicine_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  batch_number:     { type: String, default: null },
  quantity:         { type: Number, required: true, default: 0 },
  min_stock_alert:  { type: Number, default: 10 },
  purchase_price:   { type: Number, default: 0 },
  selling_price:    { type: Number, default: 0 },
  expiry_date:      { type: Date, default: null },
  supplier:         { type: String, default: null },
  supplier_contact: { type: String, default: null },
  added_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'added_date', updatedAt: false } });

module.exports = mongoose.model('MedicineStock', medicineStockSchema);
