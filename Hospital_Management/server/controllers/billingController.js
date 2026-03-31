// server/controllers/billingController.js
const { query, single } = require('../config/db');

const genBillNo = () => 'BILL' + Date.now().toString().slice(-8);
const genPayNo  = () => 'PAY'  + Date.now().toString().slice(-8);

// GET /api/billing
exports.getAll = async (req, res) => {
  try {
    const { patient_id, status, page=1, limit=20 } = req.query;
    const offset = (page-1)*limit;
    let sql = `SELECT b.*, u.name AS patient_name, p.patient_id AS patient_code
               FROM billing b JOIN patients p ON p.id=b.patient_id JOIN users u ON u.id=p.user_id WHERE 1=1`;
    const params = [];
    if (req.user.role==='patient') { const pat=await single('SELECT id FROM patients WHERE user_id=?',[req.user.id]); if(pat){sql+=' AND b.patient_id=?';params.push(pat.id);} }
    if (patient_id){ sql+=' AND b.patient_id=?'; params.push(patient_id); }
    if (status)    { sql+=' AND b.status=?';     params.push(status); }
    sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/billing/:id
exports.getOne = async (req, res) => {
  try {
    const bill = await single(
      `SELECT b.*, u.name AS patient_name, u.phone AS patient_phone, p.patient_id AS patient_code
       FROM billing b JOIN patients p ON p.id=b.patient_id JOIN users u ON u.id=p.user_id WHERE b.id=?`, [req.params.id]);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    const [items] = await query('SELECT * FROM billing_items WHERE billing_id=?', [req.params.id]);
    const [payments] = await query('SELECT * FROM payments WHERE billing_id=? ORDER BY payment_date DESC', [req.params.id]);
    res.json({ success: true, data: { ...bill, items, payments } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/billing
exports.create = async (req, res) => {
  try {
    const { patient_id, appointment_id, items, discount_percent=0, tax_percent=18, insurance_amount=0, notes, due_date } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'Items required' });

    const subtotal = items.reduce((s,i)=>s+(i.unit_price*i.quantity),0);
    const discount_amount = subtotal*(discount_percent/100);
    const taxable = subtotal-discount_amount;
    const tax_amount = taxable*(tax_percent/100);
    const total_amount = taxable+tax_amount;
    const net_amount = total_amount-Number(insurance_amount);
    const billNo = genBillNo();

    const [bRes] = await query(
      `INSERT INTO billing (bill_number,patient_id,appointment_id,subtotal,discount_percent,discount_amount,
        tax_percent,tax_amount,total_amount,insurance_amount,net_amount,balance_due,status,due_date,notes,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [billNo,patient_id,appointment_id||null,subtotal,discount_percent,discount_amount,
       tax_percent,tax_amount,total_amount,insurance_amount,net_amount,net_amount,'pending',due_date||null,notes||null,req.user.id]);

    for (const item of items) {
      await query('INSERT INTO billing_items (billing_id,item_name,item_type,quantity,unit_price,total_price) VALUES (?,?,?,?,?,?)',
        [bRes.insertId, item.item_name, item.item_type, item.quantity, item.unit_price, item.unit_price*item.quantity]);
    }
    res.status(201).json({ success: true, message: 'Bill created', billNumber: billNo, billId: bRes.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/billing/:id/payment
exports.addPayment = async (req, res) => {
  try {
    const { amount, payment_method, transaction_id, notes } = req.body;
    const bill = await single('SELECT * FROM billing WHERE id=?', [req.params.id]);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const payNo = genPayNo();
    await query(
      'INSERT INTO payments (payment_number,billing_id,patient_id,amount,payment_method,transaction_id,notes,received_by) VALUES (?,?,?,?,?,?,?,?)',
      [payNo,bill.id,bill.patient_id,amount,payment_method,transaction_id||null,notes||null,req.user.id]);

    const newPaid = Number(bill.amount_paid)+Number(amount);
    const newBalance = Number(bill.net_amount)-newPaid;
    const newStatus = newBalance<=0 ? 'paid' : newPaid>0 ? 'partially_paid' : 'pending';
    await query('UPDATE billing SET amount_paid=?, balance_due=?, status=? WHERE id=?', [newPaid, Math.max(0,newBalance), newStatus, bill.id]);

    res.status(201).json({ success: true, message: 'Payment recorded', paymentNumber: payNo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/billing/stats
exports.getStats = async (req, res) => {
  try {
    const [[today]] = await query(`SELECT COALESCE(SUM(amount_paid),0) AS today_revenue, COUNT(*) AS today_bills FROM billing WHERE DATE(created_at)=CURDATE()`);
    const [[month]] = await query(`SELECT COALESCE(SUM(amount_paid),0) AS month_revenue FROM billing WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())`);
    const [[pending]] = await query(`SELECT COUNT(*) AS pending_bills, COALESCE(SUM(balance_due),0) AS pending_amount FROM billing WHERE status IN ('pending','partially_paid')`);
    res.json({ success: true, data: { ...today, ...month, ...pending } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
