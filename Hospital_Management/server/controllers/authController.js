// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User         = require('../models/User');
const Patient      = require('../models/Patient');
const Notification = require('../models/Notification');
const PasswordReset = require('../models/PasswordReset');

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

    // Include patient_id for patients
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user_id: user._id });
      if (patient) {
        safeUser.patient_id = patient._id.toString();
      }
    }

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
    
    const userData = user.toObject();
    
    // Include patient_id for patients
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user_id: user._id });
      if (patient) {
        userData.patient_id = patient._id.toString();
      }
    }
    
    res.json({ success: true, user: userData });
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

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await PasswordReset.create({ user_id: user._id, token, expires_at: expiresAt });

    // In production, send email with reset link
    // For now, return token in response (ONLY for development)
    res.json({ 
      success: true, 
      message: 'Password reset link sent to your email',
      // REMOVE THIS IN PRODUCTION - only for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken: token })
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password required' });
    }

    const resetRecord = await PasswordReset.findOne({ token, used: false, expires_at: { $gt: new Date() } });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(resetRecord.user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // JWT is stateless, but we can update last_login_logout for audit
    const user = await User.findById(req.user.id);
    if (user) {
      user.last_login = new Date(); // Could add a separate logout field
      await user.save();
    }
    res.json({ success: true, message: 'Logout successful' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
