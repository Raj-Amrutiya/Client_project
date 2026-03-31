// server/routes/appointments.js
const router = require('express').Router();
const ctrl   = require('../controllers/appointmentController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/today/summary',  auth, role('admin','receptionist','doctor'), ctrl.todaySummary);
router.get('/',               auth,                                         ctrl.getAll);
router.get('/:id',            auth, validate.validateMongoId,               ctrl.getOne);
router.post('/',              auth, role('admin','receptionist','patient'), validate.validateAppointmentCreate, ctrl.create);
router.put('/:id/status',     auth, validate.validateMongoId, validate.validateAppointmentUpdate, ctrl.updateStatus);
router.put('/:id/reschedule', auth, validate.validateMongoId, validate.validateAppointmentUpdate, ctrl.reschedule);
router.put('/:id/cancel',     auth, validate.validateMongoId,               ctrl.cancel);
router.delete('/:id',         auth, validate.validateMongoId,               ctrl.cancel);

module.exports = router;
