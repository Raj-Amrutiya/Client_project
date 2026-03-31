// server/controllers/labController.js
const { query, single } = require('../config/db');

const genTestNo = () => 'LAB' + Date.now().toString().slice(-8);

// GET /api/lab/tests
exports.getTests = async (req, res) => {
  try {
    const { patient_id, status, priority, page=1, limit=20 } = req.query;
    const offset = (page-1)*limit;
    let sql = `SELECT lt.*, u.name AS patient_name, p.patient_id AS patient_code,
                      ud.name AS doctor_name
               FROM lab_tests lt
               JOIN patients p ON p.id=lt.patient_id JOIN users u ON u.id=p.user_id
               LEFT JOIN doctors d ON d.id=lt.doctor_id LEFT JOIN users ud ON ud.id=d.user_id WHERE 1=1`;
    const params = [];
    if (patient_id) { sql+=' AND lt.patient_id=?'; params.push(patient_id); }
    if (status)     { sql+=' AND lt.status=?';     params.push(status); }
    if (priority)   { sql+=' AND lt.priority=?';   params.push(priority); }
    sql += ' ORDER BY lt.requested_date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/lab/tests/:id
exports.getTestById = async (req, res) => {
  try {
    const test = await single(
      `SELECT lt.*, u.name AS patient_name, ud.name AS doctor_name
       FROM lab_tests lt JOIN patients p ON p.id=lt.patient_id JOIN users u ON u.id=p.user_id
       LEFT JOIN doctors d ON d.id=lt.doctor_id LEFT JOIN users ud ON ud.id=d.user_id WHERE lt.id=?`, [req.params.id]);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const [results] = await query('SELECT * FROM lab_results WHERE lab_test_id=?', [req.params.id]);
    res.json({ success: true, data: { ...test, results } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/lab/tests
exports.createTest = async (req, res) => {
  try {
    const { patient_id, doctor_id, test_name, test_type, test_category, priority, sample_type, price, notes } = req.body;
    const testNo = genTestNo();
    await query(
      'INSERT INTO lab_tests (test_number,patient_id,doctor_id,test_name,test_type,test_category,priority,sample_type,price,notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [testNo,patient_id,doctor_id||null,test_name,test_type,test_category||'biochemistry',priority||'normal',sample_type,price||0,notes||null]);
    res.status(201).json({ success: true, message: 'Lab test created', testNumber: testNo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/lab/tests/:id/status
exports.updateTestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = status === 'completed'
      ? await query('UPDATE lab_tests SET status=?, completed_date=NOW() WHERE id=?', [status, req.params.id])
      : await query('UPDATE lab_tests SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/lab/tests/:id/results
exports.addResult = async (req, res) => {
  try {
    const { parameter_name, result_value, reference_range, unit, interpretation, is_abnormal } = req.body;
    await query(
      'INSERT INTO lab_results (lab_test_id,parameter_name,result_value,reference_range,unit,interpretation,is_abnormal,created_by) VALUES (?,?,?,?,?,?,?,?)',
      [req.params.id,parameter_name,result_value,reference_range,unit,interpretation,is_abnormal?1:0,req.user.id]);
    await query('UPDATE lab_tests SET status="completed", completed_date=NOW() WHERE id=?', [req.params.id]);
    res.status(201).json({ success: true, message: 'Result added' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/lab/stats
exports.getStats = async (req, res) => {
  try {
    const [[stats]] = await query(`
      SELECT COUNT(*) AS total,
             SUM(status='requested') AS requested,
             SUM(status='in_progress') AS in_progress,
             SUM(status='completed') AS completed,
             SUM(priority='urgent' AND status NOT IN ('completed','cancelled')) AS urgent_pending
      FROM lab_tests WHERE DATE(requested_date)=CURDATE()`);
    res.json({ success: true, data: stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
