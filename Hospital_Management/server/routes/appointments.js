// server/routes/appointments.js
const router = require('express').Router();
const ctrl   = require('../controllers/appointmentController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/today/summary',  auth, role('admin','receptionist','doctor'), ctrl.todaySummary);
router.get('/',               auth,                                         ctrl.getAll);
router.get('/:id',            auth,                                         ctrl.getOne);
router.post('/',              auth, role('admin','receptionist','patient'), ctrl.create);
router.put('/:id/status',     auth,                                         ctrl.updateStatus);

module.exports = router;
