// server/controllers/appointmentController.js
const { query, single } = require('../config/db');

const genApptNo = () => 'APT' + Date.now().toString().slice(-8);

// GET /api/appointments
exports.getAll = async (req, res) => {
  try {
    const { doctor_id, patient_id, date, status, page=1, limit=20 } = req.query;
    const offset = (page-1)*limit;
    let sql = `SELECT a.*, up.name AS patient_name, p.patient_id AS patient_code,
                      ud.name AS doctor_name, d.specialization
               FROM appointments a
               JOIN patients p ON p.id=a.patient_id JOIN users up ON up.id=p.user_id
               JOIN doctors d ON d.id=a.doctor_id   JOIN users ud ON ud.id=d.user_id WHERE 1=1`;
    const params = [];
    if (req.user.role === 'doctor')    { const doc = await single('SELECT id FROM doctors WHERE user_id=?',[req.user.id]); if(doc){ sql+=' AND a.doctor_id=?'; params.push(doc.id); } }
    if (req.user.role === 'patient')   { const pat = await single('SELECT id FROM patients WHERE user_id=?',[req.user.id]); if(pat){ sql+=' AND a.patient_id=?'; params.push(pat.id); } }
    if (doctor_id)  { sql+=' AND a.doctor_id=?';   params.push(doctor_id); }
    if (patient_id) { sql+=' AND a.patient_id=?'; params.push(patient_id); }
    if (date)       { sql+=' AND a.appointment_date=?'; params.push(date); }
    if (status)     { sql+=' AND a.status=?';      params.push(status); }
    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/appointments/:id
exports.getOne = async (req, res) => {
  try {
    const appt = await single(
      `SELECT a.*, up.name AS patient_name, up.phone AS patient_phone, p.patient_id AS patient_code,
              ud.name AS doctor_name, d.specialization, dep.name AS department
       FROM appointments a
       JOIN patients p ON p.id=a.patient_id JOIN users up ON up.id=p.user_id
       JOIN doctors d ON d.id=a.doctor_id   JOIN users ud ON ud.id=d.user_id
       LEFT JOIN departments dep ON dep.id=d.department_id
       WHERE a.id=?`, [req.params.id]);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appt });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/appointments
exports.create = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, type, reason } = req.body;

    // Check slot availability
    const conflict = await single(
      'SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status NOT IN ("cancelled","no_show")',
      [doctor_id, appointment_date, appointment_time]);
    if (conflict) return res.status(409).json({ success: false, message: 'Time slot already booked' });

    // Token number for the day
    const [[{ cnt }]] = await query(
      'SELECT COUNT(*)+1 AS cnt FROM appointments WHERE doctor_id=? AND appointment_date=?',
      [doctor_id, appointment_date]);

    const apptNo = genApptNo();
    const [res2] = await query(
      `INSERT INTO appointments (appointment_number,patient_id,doctor_id,appointment_date,appointment_time,
        token_number,status,type,reason,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [apptNo, patient_id, doctor_id, appointment_date, appointment_time, cnt,
       'pending', type||'walk_in', reason||null, req.user.id]);

    // Notification
    const pat = await single('SELECT user_id FROM patients WHERE id=?',[patient_id]);
    if (pat) await query(
      'INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)',
      [pat.user_id, 'Appointment Booked', `Appointment ${apptNo} on ${appointment_date} at ${appointment_time}`, 'appointment']);

    res.status(201).json({ success: true, message: 'Appointment created', appointmentNumber: apptNo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/appointments/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, follow_up_date } = req.body;
    const allowed = ['pending','confirmed','in_progress','completed','cancelled','no_show'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    await query('UPDATE appointments SET status=?, notes=COALESCE(?,notes), follow_up_date=COALESCE(?,follow_up_date) WHERE id=?',
      [status, notes||null, follow_up_date||null, req.params.id]);
    res.json({ success: true, message: `Appointment ${status}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/appointments/today/summary
exports.todaySummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[stats]] = await query(
      `SELECT COUNT(*) AS total,
              SUM(status='pending') AS pending,
              SUM(status='confirmed') AS confirmed,
              SUM(status='completed') AS completed,
              SUM(status='cancelled') AS cancelled
       FROM appointments WHERE appointment_date=?`, [today]);
    res.json({ success: true, data: stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
