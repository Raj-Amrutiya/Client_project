// server/routes/pharmacy.js
const router = require('express').Router();
const ctrl   = require('../controllers/pharmacyController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/stats',                auth, role('admin','pharmacist'),    ctrl.getStats);
router.get('/alerts',               auth, role('admin','pharmacist'),    ctrl.getLowStockAlerts);
router.get('/medicines',            auth,                                 ctrl.getMedicines);
router.get('/medicines/:id',        auth,                                 ctrl.getMedicineById);
router.post('/medicines',           auth, role('admin','pharmacist'),    ctrl.createMedicine);
router.put('/medicines/:id',        auth, role('admin','pharmacist'),    ctrl.updateMedicine);
router.post('/stock',               auth, role('admin','pharmacist'),    ctrl.addStock);
router.put('/stock/:id',            auth, role('admin','pharmacist'),    ctrl.updateStock);

module.exports = router;
