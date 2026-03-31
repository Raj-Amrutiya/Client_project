// server/controllers/pharmacyController.js
const Medicine      = require('../models/Medicine');
const MedicineStock = require('../models/MedicineStock');
const Prescription  = require('../models/Prescription');
const Patient       = require('../models/Patient');
const Billing       = require('../models/Billing');
const Notification  = require('../models/Notification');

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

// ── PRESCRIPTIONS (Pharmacy Fulfillment) ───────────────────────────────────

// GET /api/pharmacy/prescriptions (get pending prescriptions)
exports.getPrescriptions = async (req, res) => {
  try {
    const { status = 'pending', patient_id, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { status };

    if (patient_id) filter.patient_id = patient_id;

    const prescriptions = await Prescription.find(filter)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name phone' } })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ created_at: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Prescription.countDocuments(filter);

    const rows = prescriptions.map(p => {
      const obj = p.toObject();
      obj.patient_name = p.patient_id?.user_id?.name || '';
      obj.patient_code = p.patient_id?.patient_id || '';
      obj.doctor_name = p.doctor_id?.user_id?.name || '';
      return obj;
    });

    res.json({ success: true, data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/prescriptions/:id
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name phone' } })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } });

    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

    const obj = prescription.toObject();
    obj.patient_name = prescription.patient_id?.user_id?.name || '';
    obj.doctor_name = prescription.doctor_id?.user_id?.name || '';

    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/pharmacy/prescriptions/:id/dispense (dispense medicines)
exports.dispenseMedicines = async (req, res) => {
  try {
    const { items } = req.body; // items: [{ index, quantity, price }, ...]

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

    if (prescription.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot dispense ${prescription.status} prescription` });
    }

    let totalCost = 0;
    const dispensedItems = [];

    // Update prescription items with dispensed info
    prescription.items.forEach((item, idx) => {
      const dispenseInfo = items.find(i => i.index === idx);
      if (dispenseInfo) {
        item.dispensed = true;
        item.dispensed_date = new Date();
        item.price = dispenseInfo.price || 0;
        totalCost += item.price;
        dispensedItems.push(item);
      }
    });

    prescription.status = 'dispensed';
    prescription.dispensed_by = req.user.id;
    prescription.dispensed_at = new Date();
    await prescription.save();

    // Create billing entry for medicine cost
    if (totalCost > 0) {
      const billingItems = dispensedItems.map(item => ({
        description: `Medicine: ${item.medicine_name} (${item.dosage}, ${item.quantity}*)`,
        quantity: item.quantity,
        unit_price: item.price / item.quantity,
        amount: item.price,
        type: 'pharmacy'
      }));

      await Billing.create({
        patient_id: prescription.patient_id,
        billing_date: new Date(),
        items: billingItems,
        total_amount: totalCost,
        status: 'pending'
      });
    }

    // Notify patient
    const patient = await Patient.findById(prescription.patient_id);
    if (patient) {
      await Notification.create({
        user_id: patient.user_id,
        title: 'Medicines Dispensed',
        message: `Prescription ${prescription.prescription_number} medicines have been dispensed`,
        type: 'pharmacy'
      });
    }

    res.json({ success: true, message: 'Medicines dispensed successfully', totalCost });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/pharmacy/prescriptions/:id/cancel
exports.cancelPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

    if (['dispensed', 'cancelled'].includes(prescription.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel ${prescription.status} prescription` });
    }

    prescription.status = 'cancelled';
    await prescription.save();

    res.json({ success: true, message: 'Prescription cancelled' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
