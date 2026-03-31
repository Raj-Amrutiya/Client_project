// server/middleware/validation.js - Input validation middleware
const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
  }
  next();
};

// Auth validations
exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

exports.validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('blood_group').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
  handleValidationErrors,
];

exports.validateChangePassword = [
  body('currentPassword').isLength({ min: 6 }).withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors,
];

exports.validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  handleValidationErrors,
];

exports.validateResetToken = [
  body('token').trim().notEmpty().withMessage('Reset token required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors,
];

// Patient validations
exports.validatePatientCreate = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone required'),
  body('dob').optional().isISO8601().withMessage('Invalid date'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('blood_group').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
  body('address').optional().trim().isLength({ min: 5 }).withMessage('Invalid address'),
  handleValidationErrors,
];

exports.validatePatientUpdate = [
  body('dob').optional().isISO8601().withMessage('Invalid date'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('blood_group').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().matches(/^[0-9]{6}$/).withMessage('Invalid pincode'),
  body('emergency_contact_phone').optional().matches(/^[0-9]{10}$/).withMessage('Invalid phone'),
  handleValidationErrors,
];

// Doctor validations
exports.validateDoctorCreate = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('department_id').trim().notEmpty().withMessage('Department required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid phone required'),
  body('specialization').optional().trim(),
  body('consultation_fee').optional().isInt({ min: 0 }).withMessage('Invalid fee'),
  handleValidationErrors,
];

// Appointment validations
exports.validateAppointmentCreate = [
  body('patient_id').trim().notEmpty().withMessage('Patient required'),
  body('doctor_id').trim().notEmpty().withMessage('Doctor required'),
  body('appointment_date').trim().isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
  body('appointment_time').trim().matches(/^[0-9]{2}:[0-9]{2}$/).withMessage('Invalid time format (HH:MM)'),
  body('type').optional().isIn(['online', 'walk_in', 'emergency']).withMessage('Invalid type'),
  body('reason').optional().trim(),
  handleValidationErrors,
];

exports.validateAppointmentUpdate = [
  body('appointment_date').optional().isISO8601().withMessage('Invalid date'),
  body('appointment_time').optional().matches(/^[0-9]{2}:[0-9]{2}$/).withMessage('Invalid time format'),
  body('reason').optional().trim(),
  handleValidationErrors,
];

// Lab validations
exports.validateLabTestCreate = [
  body('patient_id').trim().notEmpty().withMessage('Patient required'),
  body('test_name').trim().isLength({ min: 2 }).withMessage('Test name required'),
  body('priority').optional().isIn(['normal', 'urgent', 'emergency']).withMessage('Invalid priority'),
  handleValidationErrors,
];

// Medicine validations
exports.validateMedicineCreate = [
  body('medicine_name').trim().isLength({ min: 2 }).withMessage('Medicine name required'),
  body('dosage').trim().notEmpty().withMessage('Dosage required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('category').optional().trim(),
  handleValidationErrors,
];

// Billing validations
exports.validateBillingCreate = [
  body('patient_id').trim().notEmpty().withMessage('Patient required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.description').trim().notEmpty().withMessage('Item description required'),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  handleValidationErrors,
];

exports.validatePaymentCreate = [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('payment_method').isIn(['cash', 'card', 'upi', 'insurance', 'neft', 'bank_transfer']).withMessage('Invalid payment method'),
  body('transaction_id').optional().trim(),
  body('notes').optional().trim(),
  handleValidationErrors,
];

// Prescription validations
exports.validatePrescriptionCreate = [
  body('medical_record_id').trim().notEmpty().withMessage('Medical record required'),
  body('patient_id').trim().notEmpty().withMessage('Patient required'),
  body('doctor_id').trim().notEmpty().withMessage('Doctor required'),
  body('items').isArray({ min: 1 }).withMessage('At least one medicine required'),
  body('items.*.medicine_name').trim().notEmpty().withMessage('Medicine name required'),
  body('items.*.dosage').trim().notEmpty().withMessage('Dosage required'),
  body('items.*.frequency').trim().notEmpty().withMessage('Frequency required'),
  body('items.*.duration').trim().notEmpty().withMessage('Duration required'),
  handleValidationErrors,
];

// Common ID validation
exports.validateMongoId = [
  param('id').matches(/^[0-9a-fA-F]{24}$/).withMessage('Invalid ID format'),
  handleValidationErrors,
];
