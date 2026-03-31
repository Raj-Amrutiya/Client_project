// server/controllers/bedController.js
const { query, single } = require('../config/db');

// GET /api/beds
exports.getAll = async (req, res) => {
  try {
    const { ward_type, status } = req.query;
    let sql = `SELECT b.*,
               CASE WHEN b.status='occupied' THEN (SELECT u.name FROM bed_allocations ba JOIN patients p ON p.id=ba.patient_id JOIN users u ON u.id=p.user_id WHERE ba.bed_id=b.id AND ba.status='active' LIMIT 1) END AS current_patient
               FROM beds b WHERE 1=1`;
    const params = [];
    if (ward_type) { sql+=' AND b.ward_type=?'; params.push(ward_type); }
    if (status)    { sql+=' AND b.status=?';    params.push(status); }
    sql += ' ORDER BY b.ward_type, b.floor, b.bed_number';
    const [rows] = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/beds/availability
exports.getAvailability = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT ward_type, COUNT(*) AS total,
              SUM(status='available') AS available,
              SUM(status='occupied') AS occupied,
              SUM(status='maintenance') AS maintenance
       FROM beds GROUP BY ward_type`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/beds/allocate
exports.allocate = async (req, res) => {
  try {
    const { bed_id, patient_id, expected_discharge_date, diagnosis_at_admission } = req.body;
    const bed = await single('SELECT * FROM beds WHERE id=? AND status="available"', [bed_id]);
    if (!bed) return res.status(409).json({ success: false, message: 'Bed is not available' });

    await query(
      'INSERT INTO bed_allocations (bed_id,patient_id,admitted_by,expected_discharge_date,diagnosis_at_admission) VALUES (?,?,?,?,?)',
      [bed_id, patient_id, req.user.id, expected_discharge_date||null, diagnosis_at_admission||null]);
    await query('UPDATE beds SET status="occupied" WHERE id=?', [bed_id]);
    res.status(201).json({ success: true, message: 'Bed allocated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/beds/discharge/:allocation_id
exports.discharge = async (req, res) => {
  try {
    const { discharge_notes } = req.body;
    const alloc = await single('SELECT * FROM bed_allocations WHERE id=? AND status="active"', [req.params.allocation_id]);
    if (!alloc) return res.status(404).json({ success: false, message: 'Active allocation not found' });

    await query('UPDATE bed_allocations SET status="discharged", actual_discharge_date=NOW(), discharge_notes=? WHERE id=?',
      [discharge_notes||null, alloc.id]);
    await query('UPDATE beds SET status="cleaning" WHERE id=?', [alloc.bed_id]);
    res.json({ success: true, message: 'Patient discharged' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/beds/:id/status
exports.updateBedStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE beds SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true, message: 'Bed status updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/beds/admissions
exports.getAdmissions = async (req, res) => {
  try {
    const { status='active' } = req.query;
    const [rows] = await query(
      `SELECT ba.*, b.bed_number, b.ward_type, b.ward_name, b.floor, u.name AS patient_name, p.patient_id AS patient_code
       FROM bed_allocations ba JOIN beds b ON b.id=ba.bed_id
       JOIN patients p ON p.id=ba.patient_id JOIN users u ON u.id=p.user_id
       WHERE ba.status=? ORDER BY ba.admit_date DESC`, [status]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
