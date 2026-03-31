// server/routes/beds.js
const router = require('express').Router();
const ctrl   = require('../controllers/bedController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/availability',          auth,                                     ctrl.getAvailability);
router.get('/admissions',            auth, role('admin','receptionist','doctor'), ctrl.getAdmissions);
router.get('/',                      auth,                                     ctrl.getAll);
router.post('/allocate',             auth, role('admin','receptionist'),       ctrl.allocate);
router.put('/discharge/:allocation_id', auth, role('admin','receptionist','doctor'), ctrl.discharge);
router.put('/:id/status',            auth, role('admin','receptionist'),       ctrl.updateBedStatus);

module.exports = router;
