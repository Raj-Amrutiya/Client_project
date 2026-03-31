// server/routes/staff.js
const router = require('express').Router();
const ctrl   = require('../controllers/staffController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/',        auth, role('admin'),  ctrl.getAll);
router.post('/',       auth, role('admin'), validate.validatePatientCreate, ctrl.create);
router.put('/:id',     auth, role('admin'), validate.validateMongoId, validate.validatePatientUpdate, ctrl.update);
router.delete('/:id',  auth, role('admin'), validate.validateMongoId, ctrl.remove);

module.exports = router;
