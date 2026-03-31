// server/controllers/patientController.js
const { query, single } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/patients  (admin, doctor, receptionist)
exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT p.*, u.name, u.email, u.phone, u.avatar
               FROM patients p JOIN users u ON u.id=p.user_id WHERE u.is_active=1`;
    const params = [];
    if (search) { sql += ' AND (u.name LIKE ? OR p.patient_id LIKE ? OR u.phone LIKE ?)'; const s=`%${search}%`; params.push(s,s,s); }
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await query(sql, params);
    const [[{ total }]] = await query('SELECT COUNT(*) AS total FROM patients p JOIN users u ON u.id=p.user_id WHERE u.is_active=1');
    res.json({ success: true, data: rows, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total/limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/patients/:id
exports.getOne = async (req, res) => {
  try {
    const pat = await single(
      `SELECT p.*, u.name, u.email, u.phone, u.avatar, u.created_at AS registered_at
       FROM patients p JOIN users u ON u.id=p.user_id WHERE p.id=?`, [req.params.id]);
    if (!pat) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (req.user.role === 'patient') {
      const me = await single('SELECT id FROM patients WHERE user_id=?', [req.user.id]);
      if (!me || me.id != req.params.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: pat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/patients  (admin/receptionist create patient + user)
exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, dob, gender, blood_group, address, city, state, pincode,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
            allergies, chronic_conditions, insurance_provider, insurance_id } = req.body;

    const exists = await single('SELECT id FROM users WHERE email=?', [email]);
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Patient@123', 10);
    const [uRes] = await query('INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)', [name,email,hashed,'patient',phone]);
    const patientId = 'PAT' + String(uRes.insertId).padStart(4,'0');
    await query(
      `INSERT INTO patients (user_id,patient_id,dob,gender,blood_group,address,city,state,pincode,
        emergency_contact_name,emergency_contact_phone,emergency_contact_relation,
        allergies,chronic_conditions,insurance_provider,insurance_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uRes.insertId,patientId,dob,gender,blood_group,address,city,state,pincode,
       emergency_contact_name,emergency_contact_phone,emergency_contact_relation,
       allergies,chronic_conditions,insurance_provider,insurance_id]);

    res.status(201).json({ success: true, message: 'Patient registered', patientId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/patients/:id
exports.update = async (req, res) => {
  try {
    const { dob, gender, blood_group, address, city, state, pincode,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
            allergies, chronic_conditions, insurance_provider, insurance_id } = req.body;
    await query(
      `UPDATE patients SET dob=?,gender=?,blood_group=?,address=?,city=?,state=?,pincode=?,
        emergency_contact_name=?,emergency_contact_phone=?,emergency_contact_relation=?,
        allergies=?,chronic_conditions=?,insurance_provider=?,insurance_id=? WHERE id=?`,
      [dob,gender,blood_group,address,city,state,pincode,
       emergency_contact_name,emergency_contact_phone,emergency_contact_relation,
       allergies,chronic_conditions,insurance_provider,insurance_id,req.params.id]);
    if (req.body.name || req.body.phone) {
      const pat = await single('SELECT user_id FROM patients WHERE id=?', [req.params.id]);
      if (pat) await query('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone) WHERE id=?', [req.body.name||null, req.body.phone||null, pat.user_id]);
    }
    res.json({ success: true, message: 'Patient updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/patients/:id  (admin only)
exports.remove = async (req, res) => {
  try {
    const pat = await single('SELECT user_id FROM patients WHERE id=?', [req.params.id]);
    if (!pat) return res.status(404).json({ success: false, message: 'Not found' });
    await query('UPDATE users SET is_active=0 WHERE id=?', [pat.user_id]);
    res.json({ success: true, message: 'Patient deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/patients/:id/medical-records
exports.getMedicalRecords = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT mr.*, u.name AS doctor_name, d.specialization FROM medical_records mr
       JOIN doctors doc ON doc.id=mr.doctor_id JOIN users u ON u.id=doc.user_id
       LEFT JOIN departments d ON d.id=doc.department_id
       WHERE mr.patient_id=? ORDER BY mr.visit_date DESC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/patients/:id/prescriptions
exports.getPrescriptions = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT pr.*, u.name AS doctor_name,
              JSON_ARRAYAGG(JSON_OBJECT('medicine',pi.medicine_name,'dosage',pi.dosage,'frequency',pi.frequency,'duration',pi.duration)) AS medicines
       FROM prescriptions pr
       JOIN doctors d ON d.id=pr.doctor_id JOIN users u ON u.id=d.user_id
       LEFT JOIN prescription_items pi ON pi.prescription_id=pr.id
       WHERE pr.patient_id=? GROUP BY pr.id ORDER BY pr.created_at DESC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
