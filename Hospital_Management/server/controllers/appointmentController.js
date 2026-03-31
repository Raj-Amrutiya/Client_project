// server/controllers/appointmentController.js
const Appointment   = require('../models/Appointment');
const Patient       = require('../models/Patient');
const Doctor        = require('../models/Doctor');
const User          = require('../models/User');
const Notification  = require('../models/Notification');

const genApptNo = () => 'APT' + Date.now().toString().slice(-8);

// GET /api/appointments
exports.getAll = async (req, res) => {
  try {
    const { doctor_id, patient_id, date, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ user_id: req.user.id });
      if (doc) filter.doctor_id = doc._id;
    }
    if (req.user.role === 'patient') {
      const pat = await Patient.findOne({ user_id: req.user.id });
      if (pat) filter.patient_id = pat._id;
    }
    if (doctor_id)  filter.doctor_id  = doctor_id;
    if (patient_id) filter.patient_id = patient_id;
    if (date) {
      const d = new Date(date);
      filter.appointment_date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name phone' } })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ appointment_date: -1, appointment_time: -1 })
      .skip(Number(skip)).limit(Number(limit));

    const rows = appointments.map(a => {
      const obj = a.toObject();
      obj.patient_name = a.patient_id?.user_id?.name || '';
      obj.patient_code = a.patient_id?.patient_id || '';
      obj.doctor_name  = a.doctor_id?.user_id?.name || '';
      obj.specialization = a.doctor_id?.specialization || '';
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/appointments/:id
exports.getOne = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name phone' } })
      .populate({ path: 'doctor_id', populate: [{ path: 'user_id', select: 'name' }, { path: 'department_id', select: 'name' }] });
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const obj = appt.toObject();
    obj.patient_name  = appt.patient_id?.user_id?.name || '';
    obj.patient_phone = appt.patient_id?.user_id?.phone || '';
    obj.patient_code  = appt.patient_id?.patient_id || '';
    obj.doctor_name   = appt.doctor_id?.user_id?.name || '';
    obj.specialization = appt.doctor_id?.specialization || '';
    obj.department     = appt.doctor_id?.department_id?.name || '';

    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/appointments
exports.create = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, type, reason } = req.body;

    // Check slot availability
    const dateObj = new Date(appointment_date);
    const conflict = await Appointment.findOne({
      doctor_id, appointment_time,
      appointment_date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) },
      status: { $nin: ['cancelled', 'no_show'] }
    });
    if (conflict) return res.status(409).json({ success: false, message: 'Time slot already booked' });

    // Token number for the day
    const cnt = await Appointment.countDocuments({
      doctor_id,
      appointment_date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) }
    });

    const apptNo = genApptNo();
    await Appointment.create({
      appointment_number: apptNo, patient_id, doctor_id,
      appointment_date: dateObj, appointment_time,
      token_number: cnt + 1, status: 'pending',
      type: type || 'walk_in', reason: reason || null,
      created_by: req.user.id
    });

    // Notification
    const pat = await Patient.findById(patient_id);
    if (pat) {
      await Notification.create({
        user_id: pat.user_id, title: 'Appointment Booked',
        message: `Appointment ${apptNo} on ${appointment_date} at ${appointment_time}`,
        type: 'appointment'
      });
    }

    res.status(201).json({ success: true, message: 'Appointment created', appointmentNumber: apptNo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/appointments/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, follow_up_date } = req.body;
    const allowed = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const update = { status };
    if (notes) update.notes = notes;
    if (follow_up_date) update.follow_up_date = follow_up_date;
    await Appointment.findByIdAndUpdate(req.params.id, update);

    res.json({ success: true, message: `Appointment ${status}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/appointments/today/summary
exports.todaySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const stats = await Appointment.aggregate([
      { $match: { appointment_date: { $gte: today, $lt: tomorrow } } },
      { $group: {
        _id: null,
        total:     { $sum: 1 },
        pending:   { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      }},
    ]);
    res.json({ success: true, data: stats[0] || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
