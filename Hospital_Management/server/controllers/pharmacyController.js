// server/controllers/pharmacyController.js
const { query, single } = require('../config/db');

// ── MEDICINES ─────────────────────────────────────────────────────────────────

// GET /api/pharmacy/medicines
exports.getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    let sql = `SELECT m.*, COALESCE(SUM(ms.quantity),0) AS total_stock,
                      MIN(ms.selling_price) AS min_price, MAX(ms.expiry_date) AS latest_expiry
               FROM medicines m LEFT JOIN medicine_stock ms ON ms.medicine_id=m.id WHERE m.is_active=1`;
    const params = [];
    if (search)   { sql+=' AND (m.name LIKE ? OR m.generic_name LIKE ?)'; const s=`%${search}%`; params.push(s,s); }
    if (category) { sql+=' AND m.category=?'; params.push(category); }
    sql += ' GROUP BY m.id ORDER BY m.name';
    const [rows] = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/medicines/:id
exports.getMedicineById = async (req, res) => {
  try {
    const med = await single('SELECT * FROM medicines WHERE id=?', [req.params.id]);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    const [stocks] = await query('SELECT * FROM medicine_stock WHERE medicine_id=? ORDER BY expiry_date', [req.params.id]);
    res.json({ success: true, data: { ...med, stocks } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/pharmacy/medicines
exports.createMedicine = async (req, res) => {
  try {
    const { name, generic_name, category, manufacturer, unit, description, requires_prescription } = req.body;
    const [res2] = await query(
      'INSERT INTO medicines (name,generic_name,category,manufacturer,unit,description,requires_prescription) VALUES (?,?,?,?,?,?,?)',
      [name,generic_name,category,manufacturer,unit,description,requires_prescription?1:0]);
    res.status(201).json({ success: true, message: 'Medicine added', id: res2.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/pharmacy/medicines/:id
exports.updateMedicine = async (req, res) => {
  try {
    const { name, generic_name, category, manufacturer, unit, description, requires_prescription, is_active } = req.body;
    await query(
      'UPDATE medicines SET name=?,generic_name=?,category=?,manufacturer=?,unit=?,description=?,requires_prescription=?,is_active=? WHERE id=?',
      [name,generic_name,category,manufacturer,unit,description,requires_prescription?1:0,is_active?1:0,req.params.id]);
    res.json({ success: true, message: 'Medicine updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── STOCK ─────────────────────────────────────────────────────────────────────

// POST /api/pharmacy/stock
exports.addStock = async (req, res) => {
  try {
    const { medicine_id, batch_number, quantity, min_stock_alert, purchase_price, selling_price, expiry_date, supplier, supplier_contact } = req.body;
    await query(
      'INSERT INTO medicine_stock (medicine_id,batch_number,quantity,min_stock_alert,purchase_price,selling_price,expiry_date,supplier,supplier_contact,added_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [medicine_id,batch_number,quantity,min_stock_alert||10,purchase_price,selling_price,expiry_date,supplier,supplier_contact,req.user.id]);
    res.status(201).json({ success: true, message: 'Stock added' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/pharmacy/stock/:id
exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    await query('UPDATE medicine_stock SET quantity=? WHERE id=?', [quantity, req.params.id]);
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/alerts  (low stock)
exports.getLowStockAlerts = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT m.name, m.category, ms.quantity, ms.min_stock_alert, ms.expiry_date, ms.supplier
       FROM medicine_stock ms JOIN medicines m ON m.id=ms.medicine_id
       WHERE ms.quantity <= ms.min_stock_alert OR ms.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY ms.quantity ASC`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/pharmacy/stats
exports.getStats = async (req, res) => {
  try {
    const [[totals]] = await query(`SELECT COUNT(DISTINCT m.id) AS total_medicines, COALESCE(SUM(ms.quantity),0) AS total_stock FROM medicines m LEFT JOIN medicine_stock ms ON ms.medicine_id=m.id WHERE m.is_active=1`);
    const [[low]]   = await query(`SELECT COUNT(*) AS low_stock FROM medicine_stock WHERE quantity<=min_stock_alert`);
    const [[exp]]   = await query(`SELECT COUNT(*) AS expiring_soon FROM medicine_stock WHERE expiry_date<=DATE_ADD(CURDATE(),INTERVAL 30 DAY) AND quantity>0`);
    res.json({ success: true, data: { ...totals, ...low, ...exp } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
