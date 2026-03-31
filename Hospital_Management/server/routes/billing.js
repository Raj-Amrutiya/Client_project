// server/routes/billing.js
const router = require('express').Router();
const ctrl   = require('../controllers/billingController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/stats',          auth, role('admin','receptionist'),      ctrl.getStats);
router.get('/',               auth,                                     ctrl.getAll);
router.get('/:id',            auth,                                     ctrl.getOne);
router.post('/',              auth, role('admin','receptionist'),       ctrl.create);
router.post('/:id/payment',   auth, role('admin','receptionist'),       ctrl.addPayment);

module.exports = router;
