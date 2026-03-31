// server/controllers/staffController.js
const Staff      = require('../models/Staff');
const User       = require('../models/User');
const Department = require('../models/Department');
const bcrypt     = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const staffList = await Staff.find()
      .populate({ path: 'user_id', match: { is_active: true }, select: 'name email phone role is_active' })
      .populate('department_id', 'name');

    // Filter out staff whose user is inactive
    const rows = staffList.filter(s => s.user_id).map(s => {
      const obj = s.toObject();
      obj.name = s.user_id?.name || '';
      obj.email = s.user_id?.email || '';
      obj.phone = s.user_id?.phone || '';
      obj.role = s.user_id?.role || '';
      obj.is_active = s.user_id?.is_active;
      obj.department_name = s.department_id?.name || '';
      return obj;
    });
    rows.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, role, department_id, designation, salary, join_date } = req.body;
    const roles = ['receptionist', 'lab_technician', 'pharmacist'];
    if (!roles.includes(role)) return res.status(400).json({ success: false, message: `Role must be one of: ${roles.join(', ')}` });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Staff@123', 10);
    const newUser = await User.create({ name, email, password: hashed, role, phone });

    const cnt = await Staff.countDocuments();
    const empId = 'EMP' + String(cnt + 1).padStart(4, '0');

    await Staff.create({
      user_id: newUser._id, department_id: department_id || null,
      employee_id: empId, designation,
      salary: salary || null, join_date: join_date || null
    });

    res.status(201).json({ success: true, message: 'Staff member added', employeeId: empId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, department_id, designation, salary, join_date, is_active } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    if (name || phone || is_active !== undefined) {
      const userUpdate = {};
      if (name)  userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      if (is_active !== undefined) userUpdate.is_active = is_active;
      await User.findByIdAndUpdate(staff.user_id, userUpdate);
    }

    await Staff.findByIdAndUpdate(req.params.id, { department_id, designation, salary, join_date });
    res.json({ success: true, message: 'Staff updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    await User.findByIdAndUpdate(staff.user_id, { is_active: false });
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
