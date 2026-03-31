// server/controllers/pharmacyController.js
const Medicine      = require('../models/Medicine');
const MedicineStock = require('../models/MedicineStock');

// ── MEDICINES ─────────────────────────────────────────────────────────────────

// GET /api/pharmacy/medicines
exports.getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { is_active: true };
    if (search) {
      const s = new RegExp(search, 'i');
      filter.$or = [{ name: s }, { generic_name: s }];
    }
    if (category) filter.category = category;

    const medicines = await Medicine.find(filter).sort({ name: 1 });

    // Aggregate stock info per medicine
    const medIds = medicines.map(m => m._id);
    const stockAgg = await MedicineStock.aggregate([
      { $match: { medicine_id: { $in: medIds } } },
      { $group: {
        _id: '$medicine_id',
        total_stock: { $sum: '$quantity' },
        min_price: { $min: '$selling_price' },
        latest_expiry: { $max: '$expiry_date' }
      }}
    ]);
    const stockMap = {};
    stockAgg.forEach(s => { stockMap[String(s._id)] = s; });

    const rows = medicines.map(m => {
      const obj = m.toObject();
      const stock = stockMap[String(m._id)] || {};
      obj.total_stock   = stock.total_stock || 0;
      obj.min_price     = stock.min_price || 0;
      obj.latest_expiry = stock.latest_expiry || null;
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/medicines/:id
exports.getMedicineById = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    const stocks = await MedicineStock.find({ medicine_id: req.params.id }).sort({ expiry_date: 1 });
    res.json({ success: true, data: { ...med.toObject(), stocks } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/pharmacy/medicines
exports.createMedicine = async (req, res) => {
  try {
    const { name, generic_name, category, manufacturer, unit, description, requires_prescription } = req.body;
    const med = await Medicine.create({ name, generic_name, category, manufacturer, unit, description, requires_prescription: !!requires_prescription });
    res.status(201).json({ success: true, message: 'Medicine added', id: med._id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/pharmacy/medicines/:id
exports.updateMedicine = async (req, res) => {
  try {
    const { name, generic_name, category, manufacturer, unit, description, requires_prescription, is_active } = req.body;
    await Medicine.findByIdAndUpdate(req.params.id, {
      name, generic_name, category, manufacturer, unit, description,
      requires_prescription: !!requires_prescription, is_active: is_active !== false
    });
    res.json({ success: true, message: 'Medicine updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── STOCK ─────────────────────────────────────────────────────────────────────

// POST /api/pharmacy/stock
exports.addStock = async (req, res) => {
  try {
    const { medicine_id, batch_number, quantity, min_stock_alert, purchase_price, selling_price, expiry_date, supplier, supplier_contact } = req.body;
    await MedicineStock.create({
      medicine_id, batch_number, quantity,
      min_stock_alert: min_stock_alert || 10,
      purchase_price, selling_price, expiry_date,
      supplier, supplier_contact, added_by: req.user.id
    });
    res.status(201).json({ success: true, message: 'Stock added' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/pharmacy/stock/:id
exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    await MedicineStock.findByIdAndUpdate(req.params.id, { quantity });
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/alerts  (low stock)
exports.getLowStockAlerts = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000);
    const stocks = await MedicineStock.find({
      $or: [
        { $expr: { $lte: ['$quantity', '$min_stock_alert'] } },
        { expiry_date: { $lte: thirtyDaysFromNow } }
      ]
    }).populate('medicine_id', 'name category').sort({ quantity: 1 });

    const rows = stocks.map(s => ({
      name: s.medicine_id?.name || '',
      category: s.medicine_id?.category || '',
      quantity: s.quantity,
      min_stock_alert: s.min_stock_alert,
      expiry_date: s.expiry_date,
      supplier: s.supplier
    }));
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/stats
exports.getStats = async (req, res) => {
  try {
    const total_medicines = await Medicine.countDocuments({ is_active: true });

    const [stockAgg] = await MedicineStock.aggregate([
      { $group: { _id: null, total_stock: { $sum: '$quantity' } } }
    ]) || [{}];

    const low_stock = await MedicineStock.countDocuments({
      $expr: { $lte: ['$quantity', '$min_stock_alert'] }
    });

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000);
    const expiring_soon = await MedicineStock.countDocuments({
      expiry_date: { $lte: thirtyDaysFromNow }, quantity: { $gt: 0 }
    });

    res.json({ success: true, data: {
      total_medicines,
      total_stock: stockAgg?.total_stock || 0,
      low_stock,
      expiring_soon,
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
