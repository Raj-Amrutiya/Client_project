// server/routes/doctors.js
const router = require('express').Router();
const ctrl   = require('../controllers/doctorController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

// Public-ish (patients need to browse doctors)
router.get('/',                   auth,                    ctrl.getAll);
router.get('/departments',        auth,                    ctrl.getDepartments);
router.get('/:id',                auth,                    ctrl.getOne);
router.get('/:id/schedule',       auth,                    ctrl.getSchedule);
router.post('/',                  auth, role('admin'),     ctrl.create);
router.put('/:id',                auth, role('admin'),     ctrl.update);
router.delete('/:id',             auth, role('admin'),     ctrl.remove);

module.exports = router;
