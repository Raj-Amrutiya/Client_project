# HMS Controller Analysis - Quick Reference

## Summary Statistics
- **Total Controllers:** 11
- **Total Functions:** 67 exported
- **Implementation Rate:** ~70%
- **Production Readiness:** 40%

---

## Implementation by Controller

| Controller | Functions | ✅ Impl | ❌ Missing | Priority |
|-----------|-----------|---------|-----------|----------|
| **appointmentController** | 5 | 4 | 1 | 🔴 High |
| **authController** | 6 | 3 | 3 | 🔴 Critical |
| **bedController** | 6 | 5 | 1 | 🟠 Medium |
| **billingController** | 5 | 3 | 2 | 🔴 High |
| **doctorController** | 7 | 6 | 1 | 🟠 Medium |
| **labController** | 6 | 5 | 1 | 🟠 Medium |
| **medicalRecordController** | 2 | 2 | 0* | 🔴 Critical |
| **patientController** | 7 | 6 | 1 | 🟠 Medium |
| **pharmacyController** | 8 | 7 | 1 | 🟠 Medium |
| **reportController** | 6 | 6 | 0* | 🟡 Low |
| **staffController** | 4 | 4 | 0* | 🟡 Low |

*_Implements features but missing critical sub-features_

---

## Critical Missing Features (🔴 Must-Fix)

### Authentication & Security
- ❌ Logout endpoint
- ❌ Password reset/recovery
- ❌ Two-factor authentication (2FA)
- ❌ Email verification
- ❌ Account lockout after failed attempts
- ❌ API rate limiting

### Appointment Management
- ❌ Reschedule appointment
- ❌ Appointment reminders/notifications
- ❌ Explicit cancellation workflow

### Medical Records
- ❌ Access control (only creation restricted)
- ❌ Update medical records
- ❌ Retrieve all records for patient (getAll)
- ❌ Audit trail/encryption

### Billing & Payments
- ❌ Invoice PDF generation
- ❌ Payment gateway integration (Razorpay/Stripe)
- ❌ Refund/reversal mechanism
- ❌ Multi-payment method validation

### Pharmacy & Prescriptions
- ❌ Prescription-to-dispensing workflow
- ❌ Medicine dispensing tracking
- ❌ Medicine billing integration
- ❌ Drug interaction checker

### Reports & Analytics
- ❌ PDF export for reports
- ❌ Custom report builder
- ❌ Bed utilization analytics
- ❌ Treatment outcome tracking

---

## Input Validation Issues (Across ALL Controllers)

| Issue | Severity | Controllers |
|-------|----------|-------------|
| No email format validation | HIGH | auth, staff, doctor, patient |
| No phone validation | HIGH | all with phone |
| No date format validation | HIGH | appointment, billing, bed, lab |
| No numeric range validation | HIGH | billing, pharmacy, lab |
| No field length validation | MEDIUM | all |
| No XSS protection | CRITICAL | all |
| No SQL injection protection | CRITICAL | all |

---

## Access Control Gaps

| Area | Issue | Controllers |
|------|-------|-------------|
| **Medical Records** | Anyone can read | medicalRecordController |
| **Patient Data** | Limited role checks | patientController |
| **Billing** | No resource-level permissions | billingController |
| **Lab Results** | No access check | labController |
| **Audit Logging** | Missing everywhere | all |

---

## Data Workflow Gaps

### Broken Connection: Prescription → Dispensing
- **Status:** ❌ No link between medication prescription and pharmacy dispensing
- **Impact:** Cannot track if prescriptions were fulfilled
- **Fix:** Add medicine_issued tracking in Prescription model

### Broken Connection: Bed Allocation ↔ Patient Admission
- **Status:** ⚠️ Split implementation (bedController handles beds, patientController handles patient)
- **Impact:** Admission/discharge logic scattered
- **Fix:** Unify to patient-centric flow

### Broken Connection: Lab Results → Billing
- **Status:** ❌ No link between lab tests and charges
- **Impact:** Lab costs not included in patient bills
- **Fix:** Add lab charges to billing engine

### Broken Connection: Appointment → Medical Record
- **Status:** ⚠️ Weak link (appointment_id in medicalRecord but no verification)
- **Impact:** Medical records not properly linked to appointments
- **Fix:** Add proper relationship validation

---

## Validation Checklist

### Missing Per-Controller

**appointmentController**
- [ ] DateTime format validation
- [ ] Doctor availability verification
- [ ] Slot collision validation
- [ ] Patient exists check
- [ ] Duplicate booking prevention

**authController**
- [ ] Email format validation
- [ ] Password strength enforcement
- [ ] Duplicate email check
- [ ] Rate limiting on login

**bedController**
- [ ] Bed number uniqueness
- [ ] Ward exists validation
- [ ] Patient exists check
- [ ] Date range validation

**billingController**
- [ ] Amount > 0 validation
- [ ] Payment method validation
- [ ] Tax/discount percentage validation
- [ ] Patient exists check

**doctorController**
- [ ] Email format validation
- [ ] Time format validation (HH:MM)
- [ ] Department exists check
- [ ] Email uniqueness

**labController**
- [ ] Test name validation
- [ ] Price validation (> 0)
- [ ] Reference range format
- [ ] Sample type validation

**medicalRecordController**
- [ ] Vital signs range validation
- [ ] Date validation
- [ ] Doctor authorization

**patientController**
- [ ] Email format validation
- [ ] Phone format validation
- [ ] Age validation
- [ ] Email uniqueness
- [ ] DOB validation

**pharmacyController**
- [ ] Medicine name uniqueness
- [ ] Expiry date validation
- [ ] Batch number uniqueness
- [ ] Grade validation

**reportController**
- [ ] Date range validation
- [ ] Permission checks

**staffController**
- [ ] Email format validation
- [ ] Role validation
- [ ] Salary > 0
- [ ] Email uniqueness

---

## Error Handling Pattern

### Current (ALL controllers)
```javascript
try {
  // logic
} catch (err) {
  res.status(500).json({ success: false, message: err.message });
}
```

### Should Be
```javascript
try {
  // validation
  if (!data.email || !isValidEmail(data.email)) {
    return res.status(400).json({ 
      success: false, 
      code: 'INVALID_EMAIL',
      message: 'Invalid email format' 
    });
  }
  
  // authorization
  if (!canAccess(user, resource)) {
    return res.status(403).json({ 
      success: false, 
      code: 'FORBIDDEN',
      message: 'Insufficient permissions' 
    });
  }
  
  // logic
  result = await Model.findByIdAndUpdate(...);
  
  // logging
  logger.info('action_performed', { user, resource });
  
  res.json({ success: true, data: result });
  
} catch (err) {
  logger.error('unexpected_error', { error: err });
  res.status(500).json({ 
    success: false, 
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred' 
  });
}
```

---

## Quick Fixes (High Impact)

### 1. Add Validation Middleware (30 min)
Creates centralized validation for all endpoints

### 2. Add Appointment Reschedule (45 min)
- Add `PUT /api/appointments/:id/reschedule` endpoint
- Similar to create() but preserves appointment number

### 3. Add Password Reset (60 min)
- Add `POST /api/auth/forgot-password` endpoint
- Add `PUT /api/auth/reset-password/:token` endpoint
- Generates token, sends email

### 4. Fix Medical Record getAll (15 min)
- Add `GET /api/medical-records?patient_id=X` endpoint
- Returns patient's medical history

### 5. Invoice PDF Generation (90 min)
- Install PDFKit
- Add PDF generation to `getOne()` or new endpoint
- Add download link to response

---

## Estimated Fixes Timeline

| Priority | Issue | Estimate | Impact |
|----------|-------|----------|--------|
| 🔴 | Validation middleware | 4 hours | Block injection/XSS |
| 🔴 | RBAC implementation | 8 hours | Secure multi-user |
| 🔴 | Password reset | 2 hours | Allow locked accounts |
| 🔴 | Appointment reschedule | 1 hour | Complete appointment flow |
| 🟠 | PDF generation | 3 hours | Formalize invoices |
| 🟠 | Prescription → Dispensing | 4 hours | Complete pharmacy flow |
| 🟠 | Error handling standardization | 3 hours | Better debugging |
| 🟡 | Notification system | 6 hours | Improve UX |

**Total Critical Fixes:** ~22 hours
**Total High-Priority:** ~13 hours  
**Estimated to Production Ready:** ~35 hours

---

## Quick Wins (Highest ROI)

1. **Input Validation** - Prevents most security issues (4 hrs)
2. **RBAC Audit** - Ensures data privacy (3 hrs)
3. **Error Logging** - Eases debugging (2 hrs)
4. **Appointment Reschedule** - Core feature (1 hr)
5. **Medical Record Access Control** - Privacy critical (2 hrs)

---

*Last Updated: 31 March 2026*
