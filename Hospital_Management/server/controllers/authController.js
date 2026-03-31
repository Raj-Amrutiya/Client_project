// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { single, query } = require('../config/db');

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await single('SELECT * FROM users WHERE email=? AND is_active=1', [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await query('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);
    const token = signToken(user);
    const { password: _pw, ...safeUser } = user;

    res.json({ success: true, message: 'Login successful', token, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/auth/register  (patient self-registration)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, blood_group } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });

    const exists = await single('SELECT id FROM users WHERE email=?', [email]);
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [uRes] = await query(
      'INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)',
      [name, email, hashed, 'patient', phone || null]);

    // Generate patient_id
    const patientId = 'PAT' + String(uRes.insertId).padStart(4, '0');
    await query(
      'INSERT INTO patients (user_id,patient_id,dob,gender,blood_group) VALUES (?,?,?,?,?)',
      [uRes.insertId, patientId, dob || null, gender || null, blood_group || null]);

    const user = await single('SELECT id,name,email,role,phone FROM users WHERE id=?', [uRes.insertId]);
    const token = signToken(user);
    res.status(201).json({ success: true, message: 'Registration successful', token, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await single(
      'SELECT id,name,email,role,phone,avatar,is_active,last_login,created_at FROM users WHERE id=?',
      [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await single('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/notifications
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/auth/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
