// server/routes/patients.js
const router = require('express').Router();
const ctrl   = require('../controllers/patientController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/',              auth, role('admin','doctor','receptionist'),           ctrl.getAll);
router.get('/:id',           auth,                                                  ctrl.getOne);
router.post('/',             auth, role('admin','receptionist'),                    ctrl.create);
router.put('/:id',           auth, role('admin','receptionist','patient'),          ctrl.update);
router.delete('/:id',        auth, role('admin'),                                   ctrl.remove);
router.get('/:id/medical-records',  auth, role('admin','doctor','patient'),        ctrl.getMedicalRecords);
router.get('/:id/prescriptions',    auth, role('admin','doctor','patient','pharmacist'), ctrl.getPrescriptions);

module.exports = router;
