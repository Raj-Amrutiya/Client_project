# 🏥 Hospital Management System — Complete Project Walkthrough

## Project Summary

A **full-stack Hospital Management System** (HMS) built with **Node.js + Express** backend, **MongoDB** database (via Mongoose), and **HTML/CSS/JS** frontend with a premium dark glassmorphism design.

---

## 📁 Complete Project Structure (47 files)

```
Hospital_Management/
├── database/
│   ├── hms_schema.sql          ← 19 tables + seed data (departments, beds, medicines)
│   └── seed.js                 ← Bcrypt-hashed user seeder (10 demo users)
│
├── server/                     ← NODE.JS BACKEND
│   ├── .env / .env.example     ← Environment configuration
│   ├── package.json            ← Dependencies (express, mongoose, bcryptjs, jsonwebtoken)
│   ├── server.js               ← Express app entry point (port 5000)
│   ├── config/
│   │   └── db.js               ← Mongoose connection to MongoDB
│   ├── middleware/
│   │   ├── auth.js             ← JWT verification middleware
│   │   └── roleCheck.js        ← Role-based access control factory
│   ├── controllers/            ← 10 controllers
│   │   ├── authController.js         (login, register, getMe, changePassword, notifications)
│   │   ├── patientController.js      (CRUD, medical records, prescriptions)
│   │   ├── doctorController.js       (CRUD, schedule, departments)
│   │   ├── appointmentController.js  (CRUD, status, conflict check, today summary)
│   │   ├── billingController.js      (invoices, payments, revenue stats)
│   │   ├── pharmacyController.js     (medicines, stock, low-stock alerts)
│   │   ├── labController.js          (tests, results, stats)
│   │   ├── bedController.js          (availability, allocate, discharge, admissions)
│   │   ├── staffController.js        (CRUD for non-doctor staff)
│   │   ├── medicalRecordController.js (records + prescriptions with auto-appt-complete)
│   │   └── reportController.js       (dashboard stats, revenue chart, doc perf, growth)
│   └── routes/                 ← 11 route files (role-protected endpoints)
│       ├── auth.js, patients.js, doctors.js, appointments.js, billing.js
│       ├── pharmacy.js, lab.js, beds.js, staff.js, medicalRecords.js, reports.js
│
├── frontend/                   ← HTML/CSS/JS FRONTEND
│   ├── index.html              ← Landing page (hero, features, pricing, CTA)
│   ├── login.html              ← Auth page (6-role selector, login/register tabs)
│   ├── css/
│   │   ├── main.css            ← Full design system (cards, forms, tables, badges, toasts)
│   │   ├── dashboard.css       ← Sidebar + topbar + stats layout
│   │   └── auth.css            ← Login page with animated gradient orbs
│   ├── js/
│   │   ├── config.js           ← API wrapper, Auth helpers, Fmt utils, Status badges
│   │   ├── utils.js            ← Toast, Modal, Sidebar, Table builder, Counter animation
│   │   ├── auth.js             ← Login/register form logic
│   │   └── admin.js            ← Admin dashboard logic (all modules)
│   └── pages/
│       ├── admin/dashboard.html       ← Admin: 11 pages in SPA (stats, charts, all modules)
│       ├── doctor/dashboard.html      ← Doctor: appointments, patients, prescription writer
│       ├── receptionist/dashboard.html ← Reception: register, book, beds, queue
│       ├── patient/dashboard.html      ← Patient: book appt, find doctors, bills, records
│       ├── lab/dashboard.html          ← Lab: pending tests, add results, urgent queue
│       └── pharmacy/dashboard.html     ← Pharmacy: inventory, stock, alerts, add medicine
```

---

## 🛠️ Technology Stack

| Layer | Technology | Usage |
|-------|-----------|-------|
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MongoDB + Mongoose | ODM, schema validation, queries |
| **Auth** | JWT + bcryptjs | Secure login, role-based access |
| **Frontend** | HTML5 + CSS3 + Vanilla JS (ES6+) | All pages |
| **Charts** | Chart.js 4.x | Revenue, department, growth charts |
| **Icons** | Font Awesome 6.5 | UI icons |
| **Fonts** | Google Fonts (Inter + Poppins) | Typography |
| **Design** | Custom CSS (glassmorphism) | Dark theme with teal/purple accents |

---

## 🗄️ Database — 19 Tables

| Table | Purpose |
|-------|---------|
| `users` | All system users (6 roles) |
| `departments` | Hospital departments (10 seeded) |
| `doctors` | Doctor profiles linked to users |
| `patients` | Patient profiles with medical info |
| `staff` | Non-doctor staff profiles |
| `appointments` | Booking with token system |
| `medical_records` | Visit records with vitals |
| `prescriptions` + `prescription_items` | E-prescriptions |
| `lab_tests` + `lab_results` | Laboratory management |
| `beds` + `bed_allocations` | Ward/bed management (21 beds seeded) |
| `medicines` + `medicine_stock` | Pharmacy inventory (20 medicines seeded) |
| `billing` + `billing_items` | Invoice system |
| `payments` | Payment tracking (multi-method) |
| `notifications` | In-app notifications |

---

## 🔐 Security Features

- **JWT Authentication** — Token-based auth with 24h expiry
- **Password Hashing** — bcrypt with 10 salt rounds
- **Role-Based Access** — Middleware blocks unauthorized access per endpoint
- **Prepared Statements** — PDO-style parameterized queries (SQL injection prevention)
- **CORS** — Configurable cross-origin policy
- **Input Validation** — Server-side checks on all endpoints

---

## 🚀 Setup & Run Instructions

### 1. MongoDB Setup
```bash
# Ensure MongoDB is running (default: mongodb://localhost:27017/hms_db)
mongod --dbpath /your/data/path
```

### 2. Configure Environment
```bash
# Edit server/.env — set your MongoDB URI
MONGO_URI=mongodb://localhost:27017/hms_db
```

### 3. Seed Demo Data
```bash
cd /path/to/Hospital_Management
node database/seed.js
```

### 4. Start Server
```bash
cd server
npm start        # Production
# or
npm run dev      # Development (auto-reload with nodemon)
```

### 5. Open Browser
- **Landing Page**: http://localhost:5000
- **Login Page**: http://localhost:5000/login.html

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@hms.com | Admin@123 |
| **Doctor 1** | doctor1@hms.com | Doctor@123 |
| **Doctor 2** | doctor2@hms.com | Doctor@123 |
| **Receptionist** | recept@hms.com | Recept@123 |
| **Patient 1** | patient1@hms.com | Patient@123 |
| **Patient 2** | patient2@hms.com | Patient@123 |
| **Lab Tech** | lab@hms.com | Lab@123 |
| **Pharmacist** | pharma@hms.com | Pharma@123 |

---

## 📊 API Endpoints Summary (60+ endpoints)

| Module | Endpoints | Methods |
|--------|-----------|---------|
| Auth | `/api/auth/login`, `/register`, `/me`, `/change-password`, `/notifications` | POST/GET/PUT |
| Patients | `/api/patients` CRUD + `/medical-records` + `/prescriptions` | GET/POST/PUT/DELETE |
| Doctors | `/api/doctors` CRUD + `/schedule` + `/departments` | GET/POST/PUT/DELETE |
| Appointments | `/api/appointments` CRUD + `/status` + `/today/summary` | GET/POST/PUT |
| Billing | `/api/billing` CRUD + `/payment` + `/stats` | GET/POST |
| Pharmacy | `/api/pharmacy/medicines` + `/stock` + `/alerts` + `/stats` | GET/POST/PUT |
| Lab | `/api/lab/tests` + `/results` + `/stats` | GET/POST/PUT |
| Beds | `/api/beds` + `/availability` + `/allocate` + `/discharge` + `/admissions` | GET/POST/PUT |
| Staff | `/api/staff` CRUD | GET/POST/PUT/DELETE |
| Reports | `/api/reports/dashboard`, `/revenue`, `/patient-growth`, `/doctor-performance` | GET |
