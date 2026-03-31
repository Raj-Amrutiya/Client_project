// server/routes/medicalRecords.js
const router = require('express').Router();
const ctrl   = require('../controllers/medicalRecordController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/',      auth,                                              ctrl.getAll);
router.post('/',     auth, role('doctor'), validate.validatePrescriptionCreate, ctrl.create);
router.get('/:id',   auth, role('admin','doctor','patient'), validate.validateMongoId, ctrl.getOne);

module.exports = router;
