// server/controllers/labController.js
const LabTest = require('../models/LabTest');

const genTestNo = () => 'LAB' + Date.now().toString().slice(-8);

// GET /api/lab/tests
exports.getTests = async (req, res) => {
  try {
    const { patient_id, status, priority, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (patient_id) filter.patient_id = patient_id;
    if (status)     filter.status = status;
    if (priority)   filter.priority = priority;

    const tests = await LabTest.find(filter)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ requested_date: -1 }).skip(Number(skip)).limit(Number(limit));

    const rows = tests.map(t => {
      const obj = t.toObject();
      obj.patient_name = t.patient_id?.user_id?.name || '';
      obj.patient_code = t.patient_id?.patient_id || '';
      obj.doctor_name  = t.doctor_id?.user_id?.name || '';
      return obj;
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/lab/tests/:id
exports.getTestById = async (req, res) => {
  try {
    const test = await LabTest.findById(req.params.id)
      .populate({ path: 'patient_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const obj = test.toObject();
    obj.patient_name = test.patient_id?.user_id?.name || '';
    obj.doctor_name  = test.doctor_id?.user_id?.name || '';
    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/lab/tests
exports.createTest = async (req, res) => {
  try {
    const { patient_id, doctor_id, test_name, test_type, test_category, priority, sample_type, price, notes } = req.body;
    const testNo = genTestNo();
    await LabTest.create({
      test_number: testNo, patient_id, doctor_id: doctor_id || null,
      test_name, test_type, test_category: test_category || 'biochemistry',
      priority: priority || 'normal', sample_type, price: price || 0, notes: notes || null
    });
    res.status(201).json({ success: true, message: 'Lab test created', testNumber: testNo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/lab/tests/:id/status
exports.updateTestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'completed') update.completed_date = new Date();
    await LabTest.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/lab/tests/:id/results
exports.addResult = async (req, res) => {
  try {
    const { parameter_name, result_value, reference_range, unit, interpretation, is_abnormal } = req.body;
    await LabTest.findByIdAndUpdate(req.params.id, {
      $push: { results: { parameter_name, result_value, reference_range, unit, interpretation, is_abnormal: !!is_abnormal, created_by: req.user.id } },
      status: 'completed', completed_date: new Date()
    });
    res.status(201).json({ success: true, message: 'Result added' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/lab/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const [stats] = await LabTest.aggregate([
      { $match: { requested_date: { $gte: today, $lt: tomorrow } } },
      { $group: {
        _id: null,
        total:      { $sum: 1 },
        requested:  { $sum: { $cond: [{ $eq: ['$status', 'requested'] }, 1, 0] } },
        in_progress:{ $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed:  { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        urgent_pending: { $sum: { $cond: [{ $and: [{ $eq: ['$priority', 'urgent'] }, { $not: { $in: ['$status', ['completed', 'cancelled']] } }] }, 1, 0] } },
      }},
    ]);
    res.json({ success: true, data: stats || { total: 0, requested: 0, in_progress: 0, completed: 0, urgent_pending: 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
