// server/routes/lab.js
const router = require('express').Router();
const ctrl   = require('../controllers/labController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/stats',              auth, role('admin','lab_technician','doctor'), ctrl.getStats);
router.get('/tests',              auth,                                           ctrl.getTests);
router.get('/tests/:id',          auth, validate.validateMongoId,                ctrl.getTestById);
router.post('/tests',             auth, role('admin','doctor','receptionist'), validate.validateLabTestCreate, ctrl.createTest);
router.put('/tests/:id/status',   auth, role('admin','lab_technician'), validate.validateMongoId, ctrl.updateTestStatus);
router.post('/tests/:id/results', auth, role('admin','lab_technician'), validate.validateMongoId, ctrl.addResult);

module.exports = router;
