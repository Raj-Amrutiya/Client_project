// server/routes/patients.js
const router = require('express').Router();
const ctrl   = require('../controllers/patientController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/',              auth, role('admin','doctor','receptionist','patient'), ctrl.getAll);
router.get('/:id',           auth, validate.validateMongoId, ctrl.getOne);
router.post('/',             auth, role('admin','receptionist'), validate.validatePatientCreate, ctrl.create);
router.put('/:id',           auth, role('admin','receptionist','patient'), validate.validateMongoId, validate.validatePatientUpdate, ctrl.update);
router.delete('/:id',        auth, role('admin'), validate.validateMongoId, ctrl.remove);
router.get('/:id/medical-records',  auth, role('admin','doctor','patient'), validate.validateMongoId, ctrl.getMedicalRecords);
router.get('/:id/prescriptions',    auth, role('admin','doctor','patient','pharmacist'), validate.validateMongoId, ctrl.getPrescriptions);

module.exports = router;
