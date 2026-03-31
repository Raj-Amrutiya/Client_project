// server/controllers/doctorController.js
const Doctor     = require('../models/Doctor');
const User       = require('../models/User');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const bcrypt     = require('bcryptjs');

// GET /api/doctors
exports.getAll = async (req, res) => {
  try {
    const { department_id, search } = req.query;
    const filter = {};
    if (department_id) filter.department_id = department_id;

    let doctors = await Doctor.find(filter)
      .populate({ path: 'user_id', match: { is_active: true }, select: 'name email phone avatar' })
      .populate('department_id', 'name');

    // Filter out doctors whose user is inactive (populate returns null)
    doctors = doctors.filter(d => d.user_id);

    if (search) {
      const s = search.toLowerCase();
      doctors = doctors.filter(d =>
        d.user_id.name.toLowerCase().includes(s) ||
        (d.specialization && d.specialization.toLowerCase().includes(s))
      );
    }

    // Sort by name
    doctors.sort((a, b) => a.user_id.name.localeCompare(b.user_id.name));

    const rows = doctors.map(d => {
      const obj = d.toObject();
      obj.id = d._id;
      obj.name = d.user_id?.name || '';
      obj.email = d.user_id?.email || '';
      obj.phone = d.user_id?.phone || '';
      obj.avatar = d.user_id?.avatar || null;
      obj.department_name = d.department_id?.name || '';
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doctors/:id
exports.getOne = async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id)
      .populate('user_id', 'name email phone avatar')
      .populate('department_id', 'name');
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const obj = doc.toObject();
    obj.id = doc._id;
    obj.name = doc.user_id?.name || '';
    obj.email = doc.user_id?.email || '';
    obj.phone = doc.user_id?.phone || '';
    obj.avatar = doc.user_id?.avatar || null;
    obj.department_name = doc.department_id?.name || '';
    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/doctors  (admin)
exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, department_id, specialization,
            qualification, experience_years, consultation_fee, available_days,
            available_from, available_to, bio } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Doctor@123', 10);
    const newUser = await User.create({ name, email, password: hashed, role: 'doctor', phone });

    const cnt = await Doctor.countDocuments();
    const doctorId = 'DOC' + String(cnt + 1).padStart(3, '0');

    await Doctor.create({
      user_id: newUser._id, department_id, doctor_id: doctorId,
      specialization, qualification,
      experience_years: experience_years || 0,
      consultation_fee: consultation_fee || 500,
      available_days: available_days || 'Mon,Tue,Wed,Thu,Fri',
      available_from: available_from || '09:00',
      available_to: available_to || '17:00', bio
    });

    res.status(201).json({ success: true, message: 'Doctor added', doctorId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/doctors/:id
exports.update = async (req, res) => {
  try {
    const { name, phone, department_id, specialization, qualification,
            experience_years, consultation_fee, available_days, available_from, available_to, bio } = req.body;
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

    if (name || phone) {
      const userUpdate = {};
      if (name)  userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      await User.findByIdAndUpdate(doc.user_id, userUpdate);
    }

    await Doctor.findByIdAndUpdate(req.params.id, {
      department_id, specialization, qualification, experience_years,
      consultation_fee, available_days, available_from, available_to, bio
    });
    res.json({ success: true, message: 'Doctor updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/doctors/:id (admin)
exports.remove = async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    await User.findByIdAndUpdate(doc.user_id, { is_active: false });
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doctors/:id/schedule?date=YYYY-MM-DD
exports.getSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const d = new Date(date);
    const slots = await Appointment.find({
      doctor_id: req.params.id,
      appointment_date: { $gte: d, $lt: new Date(d.getTime() + 86400000) }
    }).select('appointment_time status appointment_number').sort({ appointment_time: 1 });
    res.json({ success: true, data: slots });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/departments
exports.getDepartments = async (req, res) => {
  try {
    const rows = await Department.find({ is_active: true }).sort({ name: 1 });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
