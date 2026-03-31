// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User         = require('../models/User');
const Patient      = require('../models/Patient');
const Notification = require('../models/Notification');

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email, is_active: true });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.last_login = new Date();
    await user.save();

    const token = signToken(user);
    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ success: true, message: 'Login successful', token, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/auth/register  (patient self-registration)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, blood_group } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed, role: 'patient', phone: phone || null });

    // Generate patient_id
    const count = await Patient.countDocuments();
    const patientId = 'PAT' + String(count + 1).padStart(4, '0');
    await Patient.create({ user_id: newUser._id, patient_id: patientId, dob: dob || null, gender: gender || null, blood_group: blood_group || null });

    const token = signToken(newUser);
    const user = { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone };
    res.status(201).json({ success: true, message: 'Registration successful', token, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/notifications
exports.getNotifications = async (req, res) => {
  try {
    const rows = await Notification.find({ user_id: req.user.id }).sort({ created_at: -1 }).limit(20);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/auth/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user_id: req.user.id }, { is_read: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
