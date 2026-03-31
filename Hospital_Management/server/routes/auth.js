// server/routes/auth.js
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const auth   = require('../middleware/auth');

router.post('/login',                 ctrl.login);
router.post('/register',              ctrl.register);
router.get('/me',                auth, ctrl.getMe);
router.put('/change-password',   auth, ctrl.changePassword);
router.get('/notifications',     auth, ctrl.getNotifications);
router.put('/notifications/:id/read', auth, ctrl.markRead);

module.exports = router;
