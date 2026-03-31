-- ============================================================
-- Hospital Management System - Complete Database Schema
-- MySQL 8.0+ | Version 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS `hms_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hms_db`;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. USERS (All roles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `email`       VARCHAR(150) NOT NULL,
  `password`    VARCHAR(255) NOT NULL,
  `role`        ENUM('admin','doctor','receptionist','patient','lab_technician','pharmacist') NOT NULL DEFAULT 'patient',
  `phone`       VARCHAR(20) DEFAULT NULL,
  `avatar`      VARCHAR(255) DEFAULT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `last_login`  TIMESTAMP NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. DEPARTMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(100) NOT NULL,
  `code`           VARCHAR(10) NOT NULL,
  `description`    TEXT DEFAULT NULL,
  `head_doctor_id` INT UNSIGNED DEFAULT NULL,
  `is_active`      TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. DOCTORS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `doctors` (
  `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`              INT UNSIGNED NOT NULL,
  `department_id`        INT UNSIGNED DEFAULT NULL,
  `doctor_id`            VARCHAR(20) NOT NULL,
  `specialization`       VARCHAR(100) DEFAULT NULL,
  `qualification`        VARCHAR(255) DEFAULT NULL,
  `experience_years`     INT DEFAULT 0,
  `consultation_fee`     DECIMAL(10,2) DEFAULT 500.00,
  `available_days`       VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  `available_from`       TIME DEFAULT '09:00:00',
  `available_to`         TIME DEFAULT '17:00:00',
  `max_patients_per_day` INT DEFAULT 20,
  `bio`                  TEXT DEFAULT NULL,
  `created_at`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doc_id` (`doctor_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_dept` (`department_id`),
  CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_dept` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. PATIENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patients` (
  `id`                          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`                     INT UNSIGNED NOT NULL,
  `patient_id`                  VARCHAR(20) NOT NULL,
  `dob`                         DATE DEFAULT NULL,
  `gender`                      ENUM('male','female','other') DEFAULT NULL,
  `blood_group`                 ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `address`                     TEXT DEFAULT NULL,
  `city`                        VARCHAR(100) DEFAULT NULL,
  `state`                       VARCHAR(100) DEFAULT NULL,
  `pincode`                     VARCHAR(10) DEFAULT NULL,
  `emergency_contact_name`      VARCHAR(100) DEFAULT NULL,
  `emergency_contact_phone`     VARCHAR(20) DEFAULT NULL,
  `emergency_contact_relation`  VARCHAR(50) DEFAULT NULL,
  `allergies`                   TEXT DEFAULT NULL,
  `chronic_conditions`          TEXT DEFAULT NULL,
  `insurance_provider`          VARCHAR(100) DEFAULT NULL,
  `insurance_id`                VARCHAR(100) DEFAULT NULL,
  `created_at`                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_patient_id` (`patient_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_pat_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. STAFF
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED DEFAULT NULL,
  `employee_id`   VARCHAR(20) NOT NULL,
  `designation`   VARCHAR(100) DEFAULT NULL,
  `salary`        DECIMAL(10,2) DEFAULT NULL,
  `join_date`     DATE DEFAULT NULL,
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_id` (`employee_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_staff_dept` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. APPOINTMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `appointment_number` VARCHAR(20) NOT NULL,
  `patient_id`         INT UNSIGNED NOT NULL,
  `doctor_id`          INT UNSIGNED NOT NULL,
  `appointment_date`   DATE NOT NULL,
  `appointment_time`   TIME NOT NULL,
  `token_number`       INT DEFAULT NULL,
  `status`             ENUM('pending','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  `type`               ENUM('online','walk_in','emergency') NOT NULL DEFAULT 'walk_in',
  `reason`             TEXT DEFAULT NULL,
  `notes`              TEXT DEFAULT NULL,
  `follow_up_date`     DATE DEFAULT NULL,
  `created_by`         INT UNSIGNED DEFAULT NULL,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appt_no` (`appointment_number`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_doctor_date` (`doctor_id`,`appointment_date`),
  CONSTRAINT `fk_appt_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. MEDICAL RECORDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_id`     INT UNSIGNED NOT NULL,
  `doctor_id`      INT UNSIGNED NOT NULL,
  `appointment_id` INT UNSIGNED DEFAULT NULL,
  `visit_date`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chief_complaint` TEXT DEFAULT NULL,
  `symptoms`       TEXT DEFAULT NULL,
  `diagnosis`      TEXT DEFAULT NULL,
  `treatment_plan` TEXT DEFAULT NULL,
  `vital_bp`       VARCHAR(20) DEFAULT NULL,
  `vital_pulse`    VARCHAR(20) DEFAULT NULL,
  `vital_temp`     VARCHAR(20) DEFAULT NULL,
  `vital_weight`   VARCHAR(20) DEFAULT NULL,
  `vital_height`   VARCHAR(20) DEFAULT NULL,
  `vital_spo2`     VARCHAR(20) DEFAULT NULL,
  `follow_up_date` DATE DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient` (`patient_id`),
  CONSTRAINT `fk_mr_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
  CONSTRAINT `fk_mr_doctor`  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`(`id`),
  CONSTRAINT `fk_mr_appt`    FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8. PRESCRIPTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prescription_number` VARCHAR(20) NOT NULL,
  `medical_record_id`   INT UNSIGNED NOT NULL,
  `patient_id`          INT UNSIGNED NOT NULL,
  `doctor_id`           INT UNSIGNED NOT NULL,
  `notes`               TEXT DEFAULT NULL,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_presc_no` (`prescription_number`),
  CONSTRAINT `fk_presc_mr`      FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`),
  CONSTRAINT `fk_presc_patient` FOREIGN KEY (`patient_id`)        REFERENCES `patients`(`id`),
  CONSTRAINT `fk_presc_doctor`  FOREIGN KEY (`doctor_id`)         REFERENCES `doctors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 9. PRESCRIPTION ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prescription_items` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prescription_id` INT UNSIGNED NOT NULL,
  `medicine_name`   VARCHAR(100) NOT NULL,
  `dosage`          VARCHAR(50) DEFAULT NULL,
  `frequency`       VARCHAR(50) DEFAULT NULL,
  `duration`        VARCHAR(50) DEFAULT NULL,
  `instructions`    TEXT DEFAULT NULL,
  `quantity`        INT DEFAULT 1,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pi_presc` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 10. LAB TESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lab_tests` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `test_number`    VARCHAR(20) NOT NULL,
  `patient_id`     INT UNSIGNED NOT NULL,
  `doctor_id`      INT UNSIGNED DEFAULT NULL,
  `test_name`      VARCHAR(100) NOT NULL,
  `test_type`      VARCHAR(100) DEFAULT NULL,
  `test_category`  VARCHAR(50) DEFAULT 'biochemistry',
  `priority`       ENUM('normal','urgent','emergency') NOT NULL DEFAULT 'normal',
  `status`         ENUM('requested','sample_collected','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
  `sample_type`    VARCHAR(50) DEFAULT NULL,
  `requested_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_date` TIMESTAMP NULL DEFAULT NULL,
  `price`          DECIMAL(10,2) DEFAULT 0,
  `notes`          TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_no` (`test_number`),
  KEY `idx_patient` (`patient_id`),
  CONSTRAINT `fk_lt_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
  CONSTRAINT `fk_lt_doctor`  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 11. LAB RESULTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lab_results` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lab_test_id`     INT UNSIGNED NOT NULL,
  `parameter_name`  VARCHAR(100) DEFAULT NULL,
  `result_value`    TEXT DEFAULT NULL,
  `reference_range` VARCHAR(100) DEFAULT NULL,
  `unit`            VARCHAR(50) DEFAULT NULL,
  `result_file`     VARCHAR(255) DEFAULT NULL,
  `interpretation`  TEXT DEFAULT NULL,
  `is_abnormal`     TINYINT(1) DEFAULT 0,
  `created_by`      INT UNSIGNED DEFAULT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_lr_test` FOREIGN KEY (`lab_test_id`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 12. BEDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `beds` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bed_number` VARCHAR(20) NOT NULL,
  `ward_type`  ENUM('general','icu','emergency','pediatric','maternity','surgical','private','semi_private') NOT NULL,
  `floor`      INT DEFAULT 1,
  `ward_name`  VARCHAR(100) DEFAULT NULL,
  `status`     ENUM('available','occupied','maintenance','cleaning') NOT NULL DEFAULT 'available',
  `daily_rate` DECIMAL(10,2) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bed_no` (`bed_number`),
  KEY `idx_status` (`status`),
  KEY `idx_ward` (`ward_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 13. BED ALLOCATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bed_allocations` (
  `id`                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bed_id`                  INT UNSIGNED NOT NULL,
  `patient_id`              INT UNSIGNED NOT NULL,
  `admitted_by`             INT UNSIGNED DEFAULT NULL,
  `admit_date`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expected_discharge_date` DATE DEFAULT NULL,
  `actual_discharge_date`   TIMESTAMP NULL DEFAULT NULL,
  `discharge_notes`         TEXT DEFAULT NULL,
  `diagnosis_at_admission`  TEXT DEFAULT NULL,
  `status`                  ENUM('active','discharged') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_bed` (`bed_id`),
  CONSTRAINT `fk_ba_bed`     FOREIGN KEY (`bed_id`)     REFERENCES `beds`(`id`),
  CONSTRAINT `fk_ba_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 14. MEDICINES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicines` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`                  VARCHAR(100) NOT NULL,
  `generic_name`          VARCHAR(100) DEFAULT NULL,
  `category`              ENUM('tablet','capsule','syrup','injection','cream','drops','inhaler','powder','other') DEFAULT 'tablet',
  `manufacturer`          VARCHAR(100) DEFAULT NULL,
  `unit`                  VARCHAR(20) DEFAULT 'strip',
  `description`           TEXT DEFAULT NULL,
  `requires_prescription` TINYINT(1) DEFAULT 0,
  `is_active`             TINYINT(1) DEFAULT 1,
  `created_at`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 15. MEDICINE STOCK
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicine_stock` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `medicine_id`      INT UNSIGNED NOT NULL,
  `batch_number`     VARCHAR(50) DEFAULT NULL,
  `quantity`         INT NOT NULL DEFAULT 0,
  `min_stock_alert`  INT DEFAULT 10,
  `purchase_price`   DECIMAL(10,2) DEFAULT 0,
  `selling_price`    DECIMAL(10,2) DEFAULT 0,
  `expiry_date`      DATE DEFAULT NULL,
  `supplier`         VARCHAR(100) DEFAULT NULL,
  `supplier_contact` VARCHAR(20) DEFAULT NULL,
  `added_by`         INT UNSIGNED DEFAULT NULL,
  `added_date`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ms_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 16. BILLING
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `billing` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bill_number`      VARCHAR(20) NOT NULL,
  `patient_id`       INT UNSIGNED NOT NULL,
  `appointment_id`   INT UNSIGNED DEFAULT NULL,
  `admission_id`     INT UNSIGNED DEFAULT NULL,
  `subtotal`         DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount_percent` DECIMAL(5,2) DEFAULT 0,
  `discount_amount`  DECIMAL(10,2) DEFAULT 0,
  `tax_percent`      DECIMAL(5,2) DEFAULT 18.00,
  `tax_amount`       DECIMAL(10,2) DEFAULT 0,
  `total_amount`     DECIMAL(10,2) NOT NULL DEFAULT 0,
  `insurance_amount` DECIMAL(10,2) DEFAULT 0,
  `net_amount`       DECIMAL(10,2) NOT NULL DEFAULT 0,
  `amount_paid`      DECIMAL(10,2) DEFAULT 0,
  `balance_due`      DECIMAL(10,2) DEFAULT 0,
  `status`           ENUM('draft','pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
  `due_date`         DATE DEFAULT NULL,
  `notes`            TEXT DEFAULT NULL,
  `created_by`       INT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bill_no` (`bill_number`),
  KEY `idx_patient` (`patient_id`),
  CONSTRAINT `fk_bill_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 17. BILLING ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `billing_items` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `billing_id`  INT UNSIGNED NOT NULL,
  `item_name`   VARCHAR(150) NOT NULL,
  `item_type`   ENUM('consultation','procedure','medicine','lab_test','bed','ambulance','other') NOT NULL,
  `quantity`    INT NOT NULL DEFAULT 1,
  `unit_price`  DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_bi_billing` FOREIGN KEY (`billing_id`) REFERENCES `billing`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 18. PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_number`   VARCHAR(20) NOT NULL,
  `billing_id`       INT UNSIGNED NOT NULL,
  `patient_id`       INT UNSIGNED NOT NULL,
  `amount`           DECIMAL(10,2) NOT NULL,
  `payment_method`   ENUM('cash','card','upi','insurance','online','cheque','neft') NOT NULL,
  `transaction_id`   VARCHAR(100) DEFAULT NULL,
  `reference_number` VARCHAR(100) DEFAULT NULL,
  `status`           ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'completed',
  `payment_date`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes`            TEXT DEFAULT NULL,
  `received_by`      INT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pay_no` (`payment_number`),
  CONSTRAINT `fk_pay_billing` FOREIGN KEY (`billing_id`) REFERENCES `billing`(`id`),
  CONSTRAINT `fk_pay_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 19. NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `title`      VARCHAR(200) NOT NULL,
  `message`    TEXT DEFAULT NULL,
  `type`       ENUM('appointment','billing','lab','pharmacy','system','general') NOT NULL DEFAULT 'general',
  `link`       VARCHAR(255) DEFAULT NULL,
  `is_read`    TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO `departments` (`name`,`code`,`description`) VALUES
('Cardiology',    'CARD', 'Heart & cardiovascular diseases'),
('Neurology',     'NEUR', 'Brain & nervous system disorders'),
('Orthopedics',   'ORTH', 'Bone, joint & muscle conditions'),
('Pediatrics',    'PEDI', 'Medical care for children'),
('Gynecology',    'GYNE', 'Women health & reproductive system'),
('Oncology',      'ONCO', 'Cancer diagnosis & treatment'),
('Radiology',     'RADI', 'Medical imaging & diagnostics'),
('Emergency',     'EMER', '24x7 emergency medical care'),
('Pharmacy',      'PHAR', 'Medicine dispensing & management'),
('Laboratory',    'LAB',  'Diagnostic laboratory services');

-- Medicines
INSERT INTO `medicines` (`name`,`generic_name`,`category`,`manufacturer`,`unit`,`requires_prescription`) VALUES
('Paracetamol 500mg',    'Paracetamol',       'tablet',    'Sun Pharma',  'strip',  0),
('Amoxicillin 250mg',    'Amoxicillin',        'capsule',   'Cipla',       'strip',  1),
('Omeprazole 20mg',      'Omeprazole',         'capsule',   'Dr. Reddy',   'strip',  0),
('Metformin 500mg',      'Metformin',          'tablet',    'Mankind',     'strip',  1),
('Atorvastatin 10mg',    'Atorvastatin',       'tablet',    'Sun Pharma',  'strip',  1),
('Amlodipine 5mg',       'Amlodipine',         'tablet',    'Cipla',       'strip',  1),
('Cetirizine 10mg',      'Cetirizine',         'tablet',    'Mankind',     'strip',  0),
('Ibuprofen 400mg',      'Ibuprofen',          'tablet',    'Abbott',      'strip',  0),
('Azithromycin 500mg',   'Azithromycin',       'tablet',    'Cipla',       'strip',  1),
('Metronidazole 400mg',  'Metronidazole',      'tablet',    'Sun Pharma',  'strip',  1),
('Vitamin C 500mg',      'Ascorbic Acid',      'tablet',    'Mankind',     'strip',  0),
('Dextrose Saline',      'Dextrose+NaCl',      'injection', 'B. Braun',    'bottle', 1),
('Insulin Glargine',     'Insulin Glargine',   'injection', 'Sanofi',      'vial',   1),
('Salbutamol Inhaler',   'Salbutamol',         'inhaler',   'Cipla',       'unit',   1),
('Calcium Carbonate',    'Calcium Carbonate',  'tablet',    'Abbott',      'strip',  0),
('Pantoprazole 40mg',    'Pantoprazole',       'tablet',    'Sun Pharma',  'strip',  0),
('Losartan 50mg',        'Losartan',           'tablet',    'Cipla',       'strip',  1),
('Aspirin 75mg',         'Aspirin',            'tablet',    'Bayer',       'strip',  0),
('Clopidogrel 75mg',     'Clopidogrel',        'tablet',    'Sun Pharma',  'strip',  1),
('Hydroxychloroquine',   'Hydroxychloroquine', 'tablet',    'Ipca Labs',   'strip',  1);

-- Medicine Stock
INSERT INTO `medicine_stock` (`medicine_id`,`batch_number`,`quantity`,`min_stock_alert`,`purchase_price`,`selling_price`,`expiry_date`,`supplier`) VALUES
(1,  'B001', 500, 50, 1.50,  2.50,  '2026-12-31', 'MedSupply Co'),
(2,  'B002', 300, 30, 5.00,  8.00,  '2026-10-31', 'PharmaWholesale'),
(3,  'B003', 400, 40, 3.00,  5.00,  '2026-11-30', 'MedSupply Co'),
(4,  'B004', 250, 25, 2.50,  4.00,  '2026-09-30', 'PharmaWholesale'),
(5,  'B005', 200, 20, 8.00,  12.00, '2026-08-31', 'GenericMeds'),
(6,  'B006', 180, 15, 6.00,  9.00,  '2026-07-31', 'GenericMeds'),
(7,  'B007', 350, 35, 1.00,  2.00,  '2026-12-31', 'MedSupply Co'),
(8,  'B008', 420, 40, 1.80,  3.00,  '2026-11-30', 'PharmaWholesale'),
(9,  'B009',  8,  20, 12.00, 18.00, '2026-10-31', 'Cipla Direct'),
(10, 'B010', 150, 15, 2.00,  3.50,  '2026-09-30', 'MedSupply Co'),
(11, 'B011', 600, 50, 0.50,  1.00,  '2027-06-30', 'GenericMeds'),
(12, 'B012',  50,  5, 25.00, 40.00, '2026-06-30', 'HospitalSupplies'),
(13, 'B013',  15,  5, 350.00,500.00,'2026-05-31', 'Sanofi Direct'),
(14, 'B014',  25, 10, 180.00,250.00,'2027-01-31', 'Cipla Direct'),
(15, 'B015', 280, 25, 1.20,  2.00,  '2026-12-31', 'GenericMeds');

-- Beds
INSERT INTO `beds` (`bed_number`,`ward_type`,`floor`,`ward_name`,`status`,`daily_rate`) VALUES
('G-101','general',    1,'General Ward A','available',  500),
('G-102','general',    1,'General Ward A','occupied',   500),
('G-103','general',    1,'General Ward A','available',  500),
('G-104','general',    1,'General Ward A','maintenance', 500),
('G-201','general',    2,'General Ward B','available',  500),
('G-202','general',    2,'General Ward B','available',  500),
('P-101','private',    1,'Private Suite', 'occupied',  2000),
('P-102','private',    1,'Private Suite', 'available', 2000),
('P-103','private',    2,'Private Suite', 'available', 2000),
('SP-101','semi_private',1,'Semi-Private','available', 1200),
('SP-102','semi_private',1,'Semi-Private','available', 1200),
('ICU-01','icu',       3,'ICU',           'occupied',  8000),
('ICU-02','icu',       3,'ICU',           'available', 8000),
('ICU-03','icu',       3,'ICU',           'available', 8000),
('EMG-01','emergency', 0,'Emergency',     'occupied',  1000),
('EMG-02','emergency', 0,'Emergency',     'available', 1000),
('EMG-03','emergency', 0,'Emergency',     'available', 1000),
('SUR-01','surgical',  2,'Surgical Ward', 'available', 3000),
('SUR-02','surgical',  2,'Surgical Ward', 'available', 3000),
('MAT-01','maternity', 2,'Maternity Ward','available', 2500),
('MAT-02','maternity', 2,'Maternity Ward','available', 2500);

-- NOTE: User & Doctor/Patient data is inserted via `node database/seed.js`
--       which uses bcrypt to properly hash passwords.
