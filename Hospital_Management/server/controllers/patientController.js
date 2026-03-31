// server/controllers/patientController.js
const Patient       = require('../models/Patient');
const User          = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription  = require('../models/Prescription');
const Doctor        = require('../models/Doctor');
const Department    = require('../models/Department');
const bcrypt        = require('bcryptjs');

// GET /api/patients  (admin, doctor, receptionist)
exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter: find active users first if searching
    let userFilter = { is_active: true, role: 'patient' };
    if (search) {
      const s = new RegExp(search, 'i');
      userFilter.$or = [{ name: s }, { phone: s }];
    }

    // Get matching user IDs
    const activeUsers = await User.find(userFilter).select('_id');
    const userIds = activeUsers.map(u => u._id);

    const patFilter = { user_id: { $in: userIds } };
    if (search) {
      // Also search by patient_id
      const patByCode = await Patient.find({ patient_id: new RegExp(search, 'i') }).select('user_id');
      const extraIds = patByCode.map(p => p.user_id);
      const allActiveUsers = await User.find({ _id: { $in: extraIds }, is_active: true }).select('_id');
      const combinedIds = [...new Set([...userIds.map(String), ...allActiveUsers.map(u => String(u._id))])];
      patFilter.user_id = { $in: combinedIds };
    }

    if (req.user.role === 'patient') {
      patFilter.user_id = req.user.id;
    }

    const total = await Patient.countDocuments(patFilter);
    const patients = await Patient.find(patFilter)
      .populate('user_id', 'name email phone avatar')
      .sort({ created_at: -1 }).skip(Number(skip)).limit(Number(limit));

    const rows = patients.map(p => {
      const obj = p.toObject();
      obj.id     = p._id;
      obj.name   = p.user_id?.name || '';
      obj.email  = p.user_id?.email || '';
      obj.phone  = p.user_id?.phone || '';
      obj.avatar = p.user_id?.avatar || null;
      return obj;
    });

    res.json({ success: true, data: rows, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/patients/:id
exports.getOne = async (req, res) => {
  try {
    const pat = await Patient.findById(req.params.id).populate('user_id', 'name email phone avatar created_at');
    if (!pat) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (req.user.role === 'patient') {
      const me = await Patient.findOne({ user_id: req.user.id });
      if (!me || String(me._id) !== req.params.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const obj = pat.toObject();
    obj.name = pat.user_id?.name || '';
    obj.email = pat.user_id?.email || '';
    obj.phone = pat.user_id?.phone || '';
    obj.avatar = pat.user_id?.avatar || null;
    obj.registered_at = pat.user_id?.created_at || '';
    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/patients  (admin/receptionist create patient + user)
exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, dob, gender, blood_group, address, city, state, pincode,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
            allergies, chronic_conditions, insurance_provider, insurance_id } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Patient@123', 10);
    const newUser = await User.create({ name, email, password: hashed, role: 'patient', phone });

    const count = await Patient.countDocuments();
    const patientId = 'PAT' + String(count + 1).padStart(4, '0');

    await Patient.create({
      user_id: newUser._id, patient_id: patientId, dob, gender, blood_group,
      address, city, state, pincode,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      allergies, chronic_conditions, insurance_provider, insurance_id
    });

    res.status(201).json({ success: true, message: 'Patient registered', patientId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/patients/:id
exports.update = async (req, res) => {
  try {
    const { dob, gender, blood_group, address, city, state, pincode,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
            allergies, chronic_conditions, insurance_provider, insurance_id } = req.body;

    const patToUpdate = await Patient.findById(req.params.id);
    if (!patToUpdate) return res.status(404).json({ success: false, message: 'Patient not found' });
    
    if (req.user.role === 'patient' && String(patToUpdate.user_id) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Patient.findByIdAndUpdate(req.params.id, {
      dob, gender, blood_group, address, city, state, pincode,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      allergies, chronic_conditions, insurance_provider, insurance_id
    });

    if (req.body.name || req.body.phone) {
      const pat = await Patient.findById(req.params.id);
      if (pat) {
        const userUpdate = {};
        if (req.body.name)  userUpdate.name = req.body.name;
        if (req.body.phone) userUpdate.phone = req.body.phone;
        await User.findByIdAndUpdate(pat.user_id, userUpdate);
      }
    }
    res.json({ success: true, message: 'Patient updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/patients/:id  (admin only)
exports.remove = async (req, res) => {
  try {
    const pat = await Patient.findById(req.params.id);
    if (!pat) return res.status(404).json({ success: false, message: 'Not found' });
    await User.findByIdAndUpdate(pat.user_id, { is_active: false });
    res.json({ success: true, message: 'Patient deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/patients/:id/medical-records
exports.getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient_id: req.params.id })
      .populate({ path: 'doctor_id', populate: [{ path: 'user_id', select: 'name' }, { path: 'department_id', select: 'name' }] })
      .sort({ visit_date: -1 });

    const rows = records.map(mr => {
      const obj = mr.toObject();
      obj.doctor_name    = mr.doctor_id?.user_id?.name || '';
      obj.specialization = mr.doctor_id?.department_id?.name || '';
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/patients/:id/prescriptions
exports.getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient_id: req.params.id })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ created_at: -1 });

    const rows = prescriptions.map(pr => {
      const obj = pr.toObject();
      obj.doctor_name = pr.doctor_id?.user_id?.name || '';
      obj.medicines = pr.items.map(i => ({
        medicine: i.medicine_name, dosage: i.dosage,
        frequency: i.frequency, duration: i.duration
      }));
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
