// server/controllers/billingController.js
const Billing  = require('../models/Billing');
const Patient  = require('../models/Patient');
const Payment  = require('../models/Payment');

const genBillNo = () => 'BILL' + Date.now().toString().slice(-8);
const genPayNo  = () => 'PAY'  + Date.now().toString().slice(-8);

// GET /api/billing
exports.getAll = async (req, res) => {
  try {
    const { patient_id, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.user.role === 'patient') {
      const pat = await Patient.findOne({ user_id: req.user.id });
      if (pat) filter.patient_id = pat._id;
    }
    if (patient_id) filter.patient_id = patient_id;
    if (status)     filter.status = status;

    const bills = await Billing.find(filter)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ created_at: -1 }).skip(Number(skip)).limit(Number(limit));

    const rows = bills.map(b => {
      const obj = b.toObject();
      obj.patient_name = b.patient_id?.user_id?.name || '';
      obj.patient_code = b.patient_id?.patient_id || '';
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/billing/:id
exports.getOne = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name phone' } });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const payments = await Payment.find({ billing_id: bill._id }).sort({ payment_date: -1 });

    const obj = bill.toObject();
    obj.patient_name  = bill.patient_id?.user_id?.name || '';
    obj.patient_phone = bill.patient_id?.user_id?.phone || '';
    obj.patient_code  = bill.patient_id?.patient_id || '';
    obj.payments = payments;

    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/billing
exports.create = async (req, res) => {
  try {
    const { patient_id, appointment_id, items, discount_percent = 0, tax_percent = 18, insurance_amount = 0, notes, due_date } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'Items required' });

    const subtotal = items.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
    const discount_amount = subtotal * (discount_percent / 100);
    const taxable = subtotal - discount_amount;
    const tax_amount = taxable * (tax_percent / 100);
    const total_amount = taxable + tax_amount;
    const net_amount = total_amount - Number(insurance_amount);
    const billNo = genBillNo();

    const billingItems = items.map(i => ({
      item_name: i.item_name, item_type: i.item_type,
      quantity: i.quantity, unit_price: i.unit_price,
      total_price: i.unit_price * i.quantity
    }));

    const bill = await Billing.create({
      bill_number: billNo, patient_id, appointment_id: appointment_id || null,
      subtotal, discount_percent, discount_amount, tax_percent, tax_amount,
      total_amount, insurance_amount, net_amount, balance_due: net_amount,
      status: 'pending', due_date: due_date || null, notes: notes || null,
      created_by: req.user.id, items: billingItems
    });

    res.status(201).json({ success: true, message: 'Bill created', billNumber: billNo, billId: bill._id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/billing/:id/payment
exports.addPayment = async (req, res) => {
  try {
    const { amount, payment_method, transaction_id, notes } = req.body;
    const bill = await Billing.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const payNo = genPayNo();
    await Payment.create({
      payment_number: payNo, billing_id: bill._id, patient_id: bill.patient_id,
      amount, payment_method, transaction_id: transaction_id || null,
      notes: notes || null, received_by: req.user.id
    });

    const newPaid = Number(bill.amount_paid) + Number(amount);
    const newBalance = Number(bill.net_amount) - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : 'pending';

    bill.amount_paid = newPaid;
    bill.balance_due = Math.max(0, newBalance);
    bill.status = newStatus;
    await bill.save();

    res.status(201).json({ success: true, message: 'Payment recorded', paymentNumber: payNo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/billing/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [todayStats] = await Billing.aggregate([
      { $match: { created_at: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, today_revenue: { $sum: '$amount_paid' }, today_bills: { $sum: 1 } } },
    ]) || [{}];

    const [monthStats] = await Billing.aggregate([
      { $match: { created_at: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, month_revenue: { $sum: '$amount_paid' } } },
    ]) || [{}];

    const [pendingStats] = await Billing.aggregate([
      { $match: { status: { $in: ['pending', 'partially_paid'] } } },
      { $group: { _id: null, pending_bills: { $sum: 1 }, pending_amount: { $sum: '$balance_due' } } },
    ]) || [{}];

    res.json({ success: true, data: {
      today_revenue:  todayStats?.today_revenue || 0,
      today_bills:    todayStats?.today_bills || 0,
      month_revenue:  monthStats?.month_revenue || 0,
      pending_bills:  pendingStats?.pending_bills || 0,
      pending_amount: pendingStats?.pending_amount || 0,
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
