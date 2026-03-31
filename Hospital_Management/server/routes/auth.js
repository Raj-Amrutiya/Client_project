// server/routes/auth.js
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const auth   = require('../middleware/auth');
const validate = require('../middleware/validation');

router.post('/login',                 validate.validateLogin, ctrl.login);
router.post('/register',              validate.validateRegister, ctrl.register);
router.post('/forgot-password',       validate.validatePasswordReset, ctrl.forgotPassword);
router.post('/reset-password',        validate.validateResetToken, ctrl.resetPassword);
router.get('/me',                     auth, ctrl.getMe);
router.put('/change-password',        auth, validate.validateChangePassword, ctrl.changePassword);
router.get('/logout',                 auth, ctrl.logout);
router.get('/notifications',          auth, ctrl.getNotifications);
router.put('/notifications/:id/read', auth, ctrl.markRead);

module.exports = router;
