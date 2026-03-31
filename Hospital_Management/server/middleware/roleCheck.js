// server/middleware/roleCheck.js — Role-based access control
const roleCheck = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
  }
  next();
};

module.exports = roleCheck;
