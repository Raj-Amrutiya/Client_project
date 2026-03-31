// server/routes/staff.js
const router = require('express').Router();
const ctrl   = require('../controllers/staffController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/',        auth, role('admin'),  ctrl.getAll);
router.post('/',       auth, role('admin'),  ctrl.create);
router.put('/:id',     auth, role('admin'),  ctrl.update);
router.delete('/:id',  auth, role('admin'),  ctrl.remove);

module.exports = router;
