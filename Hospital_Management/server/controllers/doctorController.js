// server/controllers/doctorController.js
const { query, single } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/doctors
exports.getAll = async (req, res) => {
  try {
    const { department_id, search } = req.query;
    let sql = `SELECT d.*, u.name, u.email, u.phone, u.avatar, dep.name AS department_name
               FROM doctors d JOIN users u ON u.id=d.user_id
               LEFT JOIN departments dep ON dep.id=d.department_id WHERE u.is_active=1`;
    const params = [];
    if (department_id) { sql += ' AND d.department_id=?'; params.push(department_id); }
    if (search) { sql += ' AND (u.name LIKE ? OR d.specialization LIKE ?)'; const s=`%${search}%`; params.push(s,s); }
    sql += ' ORDER BY u.name ASC';
    const [rows] = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doctors/:id
exports.getOne = async (req, res) => {
  try {
    const doc = await single(
      `SELECT d.*, u.name, u.email, u.phone, u.avatar, dep.name AS department_name
       FROM doctors d JOIN users u ON u.id=d.user_id
       LEFT JOIN departments dep ON dep.id=d.department_id WHERE d.id=?`, [req.params.id]);
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/doctors  (admin)
exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, department_id, specialization,
            qualification, experience_years, consultation_fee, available_days,
            available_from, available_to, bio } = req.body;

    const exists = await single('SELECT id FROM users WHERE email=?', [email]);
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Doctor@123', 10);
    const [uRes] = await query('INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)', [name,email,hashed,'doctor',phone]);
    const [[{ cnt }]] = await query('SELECT COUNT(*)+1 AS cnt FROM doctors');
    const doctorId = 'DOC' + String(cnt).padStart(3,'0');
    await query(
      `INSERT INTO doctors (user_id,department_id,doctor_id,specialization,qualification,
        experience_years,consultation_fee,available_days,available_from,available_to,bio)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uRes.insertId,department_id,doctorId,specialization,qualification,
       experience_years||0,consultation_fee||500,available_days||'Mon,Tue,Wed,Thu,Fri',
       available_from||'09:00',available_to||'17:00',bio]);

    res.status(201).json({ success: true, message: 'Doctor added', doctorId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/doctors/:id
exports.update = async (req, res) => {
  try {
    const { name, phone, department_id, specialization, qualification,
            experience_years, consultation_fee, available_days, available_from, available_to, bio } = req.body;
    const doc = await single('SELECT user_id FROM doctors WHERE id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

    if (name || phone) await query('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone) WHERE id=?', [name||null,phone||null,doc.user_id]);
    await query(
      `UPDATE doctors SET department_id=?,specialization=?,qualification=?,experience_years=?,
        consultation_fee=?,available_days=?,available_from=?,available_to=?,bio=? WHERE id=?`,
      [department_id,specialization,qualification,experience_years,consultation_fee,
       available_days,available_from,available_to,bio,req.params.id]);
    res.json({ success: true, message: 'Doctor updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/doctors/:id (admin)
exports.remove = async (req, res) => {
  try {
    const doc = await single('SELECT user_id FROM doctors WHERE id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    await query('UPDATE users SET is_active=0 WHERE id=?', [doc.user_id]);
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doctors/:id/schedule?date=YYYY-MM-DD
exports.getSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const [slots] = await query(
      `SELECT appointment_time, status, appointment_number FROM appointments
       WHERE doctor_id=? AND appointment_date=? ORDER BY appointment_time`, [req.params.id, date]);
    res.json({ success: true, data: slots });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/departments
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM departments WHERE is_active=1 ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
