// server/routes/beds.js
const router = require('express').Router();
const ctrl   = require('../controllers/bedController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/availability',          auth,                                     ctrl.getAvailability);
router.get('/admissions',            auth, role('admin','receptionist','doctor'), ctrl.getAdmissions);
router.get('/',                      auth,                                     ctrl.getAll);
router.post('/',                     auth, role('admin'),                      ctrl.create);
router.post('/allocate',             auth, role('admin','receptionist'),       ctrl.allocate);
router.put('/discharge/:allocation_id', auth, role('admin','receptionist','doctor'), validate.validateMongoId, ctrl.discharge);
router.put('/:id/status',            auth, role('admin','receptionist'), validate.validateMongoId, ctrl.updateBedStatus);
router.delete('/:id',                auth, role('admin'), validate.validateMongoId, ctrl.remove);

module.exports = router;
