// server/controllers/staffController.js
const { query, single } = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT s.*, u.name, u.email, u.phone, u.role, u.is_active, dep.name AS department_name
       FROM staff s JOIN users u ON u.id=s.user_id LEFT JOIN departments dep ON dep.id=s.department_id
       WHERE u.is_active=1 ORDER BY u.name`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, role, department_id, designation, salary, join_date } = req.body;
    const roles = ['receptionist','lab_technician','pharmacist'];
    if (!roles.includes(role)) return res.status(400).json({ success: false, message: `Role must be one of: ${roles.join(', ')}` });

    const exists = await single('SELECT id FROM users WHERE email=?', [email]);
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Staff@123', 10);
    const [uRes] = await query('INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)', [name,email,hashed,role,phone]);
    const [[{ cnt }]] = await query('SELECT COUNT(*)+1 AS cnt FROM staff');
    const empId = 'EMP' + String(cnt).padStart(4,'0');
    await query('INSERT INTO staff (user_id,department_id,employee_id,designation,salary,join_date) VALUES (?,?,?,?,?,?)',
      [uRes.insertId, department_id||null, empId, designation, salary||null, join_date||null]);

    res.status(201).json({ success: true, message: 'Staff member added', employeeId: empId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, department_id, designation, salary, join_date, is_active } = req.body;
    const staff = await single('SELECT user_id FROM staff WHERE id=?', [req.params.id]);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (name||phone||is_active!==undefined) await query('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), is_active=COALESCE(?,is_active) WHERE id=?', [name||null,phone||null,is_active!=null?is_active:null,staff.user_id]);
    await query('UPDATE staff SET department_id=?,designation=?,salary=?,join_date=? WHERE id=?', [department_id,designation,salary,join_date,req.params.id]);
    res.json({ success: true, message: 'Staff updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const staff = await single('SELECT user_id FROM staff WHERE id=?', [req.params.id]);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    await query('UPDATE users SET is_active=0 WHERE id=?', [staff.user_id]);
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
