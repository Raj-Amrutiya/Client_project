// server/routes/pharmacy.js
const router = require('express').Router();
const ctrl   = require('../controllers/pharmacyController');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');
const validate = require('../middleware/validation');

// Medicines
router.get('/medicines',            auth,                                 ctrl.getMedicines);
router.get('/medicines/:id',        auth, validate.validateMongoId,      ctrl.getMedicineById);
router.post('/medicines',           auth, role('admin','pharmacist'), validate.validateMedicineCreate, ctrl.createMedicine);
router.put('/medicines/:id',        auth, role('admin','pharmacist'), validate.validateMongoId, ctrl.updateMedicine);

// Stock
router.post('/stock',               auth, role('admin','pharmacist'),    ctrl.addStock);
router.put('/stock/:id',            auth, role('admin','pharmacist'), validate.validateMongoId, ctrl.updateStock);

// Alerts & Stats
router.get('/alerts',               auth, role('admin','pharmacist'),    ctrl.getLowStockAlerts);
router.get('/stats',                auth, role('admin','pharmacist'),    ctrl.getStats);

// Prescriptions (Fulfillment)
router.get('/prescriptions',        auth, role('admin','pharmacist'),    ctrl.getPrescriptions);
router.get('/prescriptions/:id',    auth, role('admin','pharmacist'), validate.validateMongoId, ctrl.getPrescription);
router.post('/prescriptions/:id/dispense', auth, role('admin','pharmacist'), validate.validateMongoId, ctrl.dispenseMedicines);
router.put('/prescriptions/:id/cancel',    auth, role('admin','pharmacist','doctor'), validate.validateMongoId, ctrl.cancelPrescription);

module.exports = router;
