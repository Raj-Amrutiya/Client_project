// server/routes/doctors.js
const router = require('express').Router();
const ctrl   = require('../controllers/doctorController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

// Public-ish (patients need to browse doctors)
router.get('/',                   auth,                    ctrl.getAll);
router.get('/departments',        auth,                    ctrl.getDepartments);
router.get('/:id',                auth, validate.validateMongoId, ctrl.getOne);
router.get('/:id/schedule',       auth, validate.validateMongoId, ctrl.getSchedule);
router.post('/',                  auth, role('admin'), validate.validateDoctorCreate, ctrl.create);
router.put('/:id',                auth, role('admin'), validate.validateMongoId, ctrl.update);
router.delete('/:id',             auth, role('admin'), validate.validateMongoId, ctrl.remove);

module.exports = router;
