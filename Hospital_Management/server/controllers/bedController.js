// server/controllers/bedController.js
const Bed           = require('../models/Bed');
const BedAllocation = require('../models/BedAllocation');
const Patient       = require('../models/Patient');
const User          = require('../models/User');

// GET /api/beds
exports.getAll = async (req, res) => {
  try {
    const { ward_type, status } = req.query;
    const filter = {};
    if (ward_type) filter.ward_type = ward_type;
    if (status)    filter.status = status;

    const beds = await Bed.find(filter).sort({ ward_type: 1, floor: 1, bed_number: 1 });
    const rows = [];
    for (const bed of beds) {
      const obj = bed.toObject();
      if (bed.status === 'occupied') {
        const alloc = await BedAllocation.findOne({ bed_id: bed._id, status: 'active' }).populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } });
        obj.current_patient = alloc?.patient_id?.user_id?.name || null;
      }
      rows.push(obj);
    }
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/beds/availability
exports.getAvailability = async (req, res) => {
  try {
    const rows = await Bed.aggregate([
      { $group: {
        _id: '$ward_type',
        total:       { $sum: 1 },
        available:   { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        occupied:    { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
      }},
      { $project: { ward_type: '$_id', total: 1, available: 1, occupied: 1, maintenance: 1, _id: 0 } },
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/beds/allocate
exports.allocate = async (req, res) => {
  try {
    const { bed_id, patient_id, expected_discharge_date, diagnosis_at_admission } = req.body;
    const bed = await Bed.findOne({ _id: bed_id, status: 'available' });
    if (!bed) return res.status(409).json({ success: false, message: 'Bed is not available' });

    await BedAllocation.create({
      bed_id, patient_id, admitted_by: req.user.id,
      expected_discharge_date: expected_discharge_date || null,
      diagnosis_at_admission: diagnosis_at_admission || null
    });
    bed.status = 'occupied';
    await bed.save();
    res.status(201).json({ success: true, message: 'Bed allocated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/beds/discharge/:allocation_id
exports.discharge = async (req, res) => {
  try {
    const { discharge_notes } = req.body;
    const alloc = await BedAllocation.findOne({ _id: req.params.allocation_id, status: 'active' });
    if (!alloc) return res.status(404).json({ success: false, message: 'Active allocation not found' });

    alloc.status = 'discharged';
    alloc.actual_discharge_date = new Date();
    alloc.discharge_notes = discharge_notes || null;
    await alloc.save();

    await Bed.findByIdAndUpdate(alloc.bed_id, { status: 'cleaning' });
    res.json({ success: true, message: 'Patient discharged' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/beds/:id/status
exports.updateBedStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Bed.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true, message: 'Bed status updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/beds/admissions
exports.getAdmissions = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const allocs = await BedAllocation.find({ status })
      .populate('bed_id')
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ admit_date: -1 });

    const rows = allocs.map(a => {
      const obj = a.toObject();
      obj.bed_number    = a.bed_id?.bed_number || '';
      obj.ward_type     = a.bed_id?.ward_type || '';
      obj.ward_name     = a.bed_id?.ward_name || '';
      obj.floor         = a.bed_id?.floor || '';
      obj.patient_name  = a.patient_id?.user_id?.name || '';
      obj.patient_code  = a.patient_id?.patient_id || '';
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
