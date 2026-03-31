// server/controllers/departmentController.js
const Department = require('../models/Department');
const Doctor     = require('../models/Doctor');

// GET /api/departments
exports.getAll = async (req, res) => {
  try {
    const depts = await Department.find({ is_active: true })
      .populate('head_doctor_id', 'doctor_id')
      .sort({ name: 1 });

    // Enrich with doctor count
    const rows = await Promise.all(depts.map(async d => {
      const obj = d.toObject();
      obj.doctor_count = await Doctor.countDocuments({ department_id: d._id });
      return obj;
    }));

    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/departments/:id
exports.getOne = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/departments
exports.create = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code required' });

    const exists = await Department.findOne({ code: code.toUpperCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Department code already exists' });

    const dept = await Department.create({ name, code: code.toUpperCase(), description: description || null });
    res.status(201).json({ success: true, message: 'Department created', id: dept._id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/departments/:id
exports.update = async (req, res) => {
  try {
    const { name, description, head_doctor_id, is_active } = req.body;
    await Department.findByIdAndUpdate(req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(head_doctor_id !== undefined && { head_doctor_id }),
      ...(is_active !== undefined && { is_active }),
    });
    res.json({ success: true, message: 'Department updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/departments/:id
exports.remove = async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: 'Department deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
