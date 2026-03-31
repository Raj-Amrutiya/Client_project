// server/controllers/reportController.js
const { query } = require('../config/db');

// GET /api/reports/dashboard  — Main admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [[patients]]   = await query(`SELECT COUNT(*) AS total, SUM(MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())) AS this_month FROM patients`);
    const [[doctors]]    = await query(`SELECT COUNT(*) AS total FROM doctors d JOIN users u ON u.id=d.user_id WHERE u.is_active=1`);
    const [[appts]]      = await query(`SELECT COUNT(*) AS today FROM appointments WHERE appointment_date=CURDATE()`);
    const [[revenue]]    = await query(`SELECT COALESCE(SUM(amount_paid),0) AS today FROM billing WHERE DATE(updated_at)=CURDATE()`);
    const [[monthRev]]   = await query(`SELECT COALESCE(SUM(amount_paid),0) AS month FROM billing WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())`);
    const [[beds]]       = await query(`SELECT COUNT(*) AS total, SUM(status='available') AS available, SUM(status='occupied') AS occupied FROM beds`);
    const [[labPending]] = await query(`SELECT COUNT(*) AS pending FROM lab_tests WHERE status NOT IN ('completed','cancelled')`);
    const [[lowStock]]   = await query(`SELECT COUNT(*) AS count FROM medicine_stock WHERE quantity<=min_stock_alert`);

    res.json({ success: true, data: {
      patients: { total: patients.total, this_month: patients.this_month },
      doctors:  { total: doctors.total },
      appointments: { today: appts.today },
      revenue: { today: revenue.today, month: monthRev.month },
      beds: { total: beds.total, available: beds.available, occupied: beds.occupied },
      lab: { pending: labPending.pending },
      pharmacy: { low_stock: lowStock.count }
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/revenue?range=7|30|90
exports.getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.range) || 30;
    const [rows] = await query(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(amount_paid),0) AS revenue, COUNT(*) AS bills
       FROM billing WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY date`, [days]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/appointments-by-department
exports.getApptsByDept = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT dep.name AS department, COUNT(a.id) AS count
       FROM appointments a JOIN doctors d ON d.id=a.doctor_id
       LEFT JOIN departments dep ON dep.id=d.department_id
       WHERE a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY dep.name ORDER BY count DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/patient-growth?range=12
exports.getPatientGrowth = async (req, res) => {
  try {
    const months = parseInt(req.query.range) || 12;
    const [rows] = await query(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS new_patients
       FROM patients WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY month ORDER BY month`, [months]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/doctor-performance
exports.getDoctorPerformance = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT u.name, d.specialization, dep.name AS department,
              COUNT(a.id) AS total_appointments,
              SUM(a.status='completed') AS completed,
              SUM(a.status='cancelled') AS cancelled
       FROM doctors d JOIN users u ON u.id=d.user_id
       LEFT JOIN departments dep ON dep.id=d.department_id
       LEFT JOIN appointments a ON a.doctor_id=d.id AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       WHERE u.is_active=1 GROUP BY d.id ORDER BY completed DESC LIMIT 10`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/reports/recent-activity
exports.getRecentActivity = async (req, res) => {
  try {
    const [appts] = await query(
      `SELECT 'appointment' AS type, a.appointment_number AS ref, up.name AS name,
              a.created_at AS time, CONCAT('Appointment with ',ud.name) AS detail
       FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users up ON up.id=p.user_id
       JOIN doctors d ON d.id=a.doctor_id JOIN users ud ON ud.id=d.user_id
       ORDER BY a.created_at DESC LIMIT 5`);
    const [bills] = await query(
      `SELECT 'billing' AS type, b.bill_number AS ref, u.name AS name,
              b.created_at AS time, CONCAT('Bill ₹',b.net_amount) AS detail
       FROM billing b JOIN patients p ON p.id=b.patient_id JOIN users u ON u.id=p.user_id
       ORDER BY b.created_at DESC LIMIT 5`);
    const combined = [...appts, ...bills].sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,10);
    res.json({ success: true, data: combined });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
