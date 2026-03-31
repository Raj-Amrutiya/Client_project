// server/routes/billing.js
const router = require('express').Router();
const ctrl   = require('../controllers/billingController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

router.get('/stats',          auth, role('admin','receptionist'),      ctrl.getStats);
router.get('/',               auth,                                     ctrl.getAll);
router.get('/:id',            auth, validate.validateMongoId,          ctrl.getOne);
router.post('/',              auth, role('admin','receptionist'), validate.validateBillingCreate, ctrl.create);
router.post('/:id/payment',   auth, role('admin','receptionist','patient'), validate.validateMongoId, validate.validatePaymentCreate, ctrl.addPayment);

module.exports = router;
