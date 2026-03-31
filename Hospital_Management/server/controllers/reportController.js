// server/controllers/reportController.js
const Patient      = require('../models/Patient');
const Doctor       = require('../models/Doctor');
const User         = require('../models/User');
const Appointment  = require('../models/Appointment');
const Billing      = require('../models/Billing');
const Bed          = require('../models/Bed');
const LabTest      = require('../models/LabTest');
const MedicineStock = require('../models/MedicineStock');

// GET /api/reports/dashboard  — Main admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Patients
    const totalPatients = await Patient.countDocuments();
    const thisMonthPatients = await Patient.countDocuments({ created_at: { $gte: monthStart, $lt: monthEnd } });

    // Doctors (active)
    const activeDocUsers = await User.find({ role: 'doctor', is_active: true }).select('_id');
    const totalDoctors = await Doctor.countDocuments({ user_id: { $in: activeDocUsers.map(u => u._id) } });

    // Appointments today
    const apptToday = await Appointment.countDocuments({ appointment_date: { $gte: today, $lt: tomorrow } });

    // Revenue
    const [todayRev] = await Billing.aggregate([
      { $match: { updated_at: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, today: { $sum: '$amount_paid' } } },
    ]) || [{}];
    const [monthRev] = await Billing.aggregate([
      { $match: { created_at: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, month: { $sum: '$amount_paid' } } },
    ]) || [{}];

    // Beds
    const bedStats = await Bed.aggregate([
      { $group: {
        _id: null,
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        occupied:  { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
      }},
    ]);

    // Lab pending
    const labPending = await LabTest.countDocuments({ status: { $nin: ['completed', 'cancelled'] } });

    // Low stock
    const lowStock = await MedicineStock.countDocuments({ $expr: { $lte: ['$quantity', '$min_stock_alert'] } });

    res.json({ success: true, data: {
      patients:     { total: totalPatients, this_month: thisMonthPatients },
      doctors:      { total: totalDoctors },
      appointments: { today: apptToday },
      revenue:      { today: todayRev?.today || 0, month: monthRev?.month || 0 },
      beds:         { total: bedStats[0]?.total || 0, available: bedStats[0]?.available || 0, occupied: bedStats[0]?.occupied || 0 },
      lab:          { pending: labPending },
      pharmacy:     { low_stock: lowStock }
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/revenue?range=7|30|90
exports.getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.range) || 30;
    const since = new Date(Date.now() - days * 86400000);

    const rows = await Billing.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        revenue: { $sum: '$amount_paid' },
        bills:   { $sum: 1 },
      }},
      { $project: { date: '$_id', revenue: 1, bills: 1, _id: 0 } },
      { $sort: { date: 1 } },
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/appointments-by-department
exports.getApptsByDept = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000);

    const rows = await Appointment.aggregate([
      { $match: { appointment_date: { $gte: since } } },
      { $lookup: { from: 'doctors', localField: 'doctor_id', foreignField: '_id', as: 'doc' } },
      { $unwind: '$doc' },
      { $lookup: { from: 'departments', localField: 'doc.department_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$dept.name', count: { $sum: 1 } } },
      { $project: { department: { $ifNull: ['$_id', 'Unassigned'] }, count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/patient-growth?range=12
exports.getPatientGrowth = async (req, res) => {
  try {
    const months = parseInt(req.query.range) || 12;
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const rows = await Patient.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        new_patients: { $sum: 1 },
      }},
      { $project: { month: '$_id', new_patients: 1, _id: 0 } },
      { $sort: { month: 1 } },
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/doctor-performance
exports.getDoctorPerformance = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000);

    const rows = await Appointment.aggregate([
      { $match: { appointment_date: { $gte: since } } },
      { $group: {
        _id: '$doctor_id',
        total_appointments: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      }},
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doc' } },
      { $unwind: '$doc' },
      { $lookup: { from: 'users', localField: 'doc.user_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'departments', localField: 'doc.department_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: {
        name: '$user.name', specialization: '$doc.specialization',
        department: '$dept.name', total_appointments: 1, completed: 1, cancelled: 1, _id: 0,
      }},
      { $sort: { completed: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/recent-activity
exports.getRecentActivity = async (req, res) => {
  try {
    const appts = await Appointment.find()
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ created_at: -1 }).limit(5);

    const bills = await Billing.find()
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ created_at: -1 }).limit(5);

    const activity = [
      ...appts.map(a => ({
        type: 'appointment', ref: a.appointment_number,
        name: a.patient_id?.user_id?.name || '',
        time: a.created_at,
        detail: `Appointment with ${a.doctor_id?.user_id?.name || ''}`
      })),
      ...bills.map(b => ({
        type: 'billing', ref: b.bill_number,
        name: b.patient_id?.user_id?.name || '',
        time: b.created_at,
        detail: `Bill ₹${b.net_amount}`
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({ success: true, data: activity });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
