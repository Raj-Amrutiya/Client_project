// server/routes/lab.js
const router = require('express').Router();
const ctrl   = require('../controllers/labController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/stats',              auth, role('admin','lab_technician','doctor'), ctrl.getStats);
router.get('/tests',              auth,                                           ctrl.getTests);
router.get('/tests/:id',          auth,                                           ctrl.getTestById);
router.post('/tests',             auth, role('admin','doctor','receptionist'),   ctrl.createTest);
router.put('/tests/:id/status',   auth, role('admin','lab_technician'),          ctrl.updateTestStatus);
router.post('/tests/:id/results', auth, role('admin','lab_technician'),          ctrl.addResult);

module.exports = router;
