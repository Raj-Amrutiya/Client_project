// server/routes/medicalRecords.js
const router = require('express').Router();
const ctrl   = require('../controllers/medicalRecordController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.post('/',     auth, role('doctor'),                        ctrl.create);
router.get('/:id',   auth, role('admin','doctor','patient'),      ctrl.getOne);

module.exports = router;
