// server/routes/reports.js
const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/dashboard',                auth, role('admin'),  ctrl.getDashboardStats);
router.get('/revenue',                  auth, role('admin'),  ctrl.getRevenueChart);
router.get('/appointments-by-department', auth, role('admin'), ctrl.getApptsByDept);
router.get('/patient-growth',           auth, role('admin'),  ctrl.getPatientGrowth);
router.get('/doctor-performance',       auth, role('admin'),  ctrl.getDoctorPerformance);
router.get('/recent-activity',          auth, role('admin'),  ctrl.getRecentActivity);

module.exports = router;
