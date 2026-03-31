# 🏥 MediCore HMS — Hospital Management System

A complete, production-ready **Hospital Management System** built with **Node.js + Express** backend, **MongoDB** database, and **HTML/CSS/JS** frontend featuring a premium dark glassmorphism design.

> *"Our Hospital Management System is a complete digital solution that replaces manual work with automation. It helps your hospital manage patients, billing, appointments, and staff efficiently from one platform."*

---

## 📸 Screenshots

| Landing Page | Login Page |
|:---:|:---:|
| Dark themed hero with animated floating dots, stats counter, features grid, pricing tiers | Glassmorphism card with 6-role selector, tabbed login/register, demo credentials |

| Admin Dashboard | Doctor Dashboard |
|:---:|:---:|
| Revenue charts, patient stats, doctor performance, recent activity | Today's appointments, prescription writer, patient search |

---

## 🎯 Objective

- ✅ Reduce manual paperwork
- ✅ Improve patient care and service speed
- ✅ Provide secure and centralized data storage
- ✅ Automate hospital workflows
- ✅ Increase operational efficiency

---

## 💼 Target Users

| Role | Access Level |
|------|-------------|
| 🛡️ **Hospital Admin** | Full system control — analytics, manage doctors/staff/departments |
| 🩺 **Doctors** | View appointments, patient history, write prescriptions, add diagnoses |
| 🧑‍💼 **Receptionists** | Register patients, book appointments, manage queue, allocate beds |
| 👤 **Patients** | Book appointments, view prescriptions/reports, payment history |
| 🔬 **Lab Technicians** | Manage test requests, upload results, generate reports |
| 💊 **Pharmacists** | Medicine inventory, stock alerts, billing, supplier management |

---

## ⚙️ Core Modules & Functionalities

### 1. 🛡️ Admin Panel
- Dashboard with real-time analytics (patients, revenue, appointments)
- Manage doctors, staff, and departments
- Role-based access control
- System-wide reports & charts (Chart.js)

### 2. 🩺 Doctor Module
- View today's appointments with token queue
- Access complete patient medical history
- Add diagnosis, vitals & treatment plans
- Write e-prescriptions with multiple medicines
- Mark appointments as completed

### 3. 🧑‍💼 Reception / Front Desk
- Patient registration form (full demographics)
- Appointment booking with doctor search
- Token system / queue management
- Admit & discharge patients (bed allocation)

### 4. 👤 Patient Module
- Online self-registration & login
- Browse & book appointments by doctor/department
- View prescriptions & lab reports
- Payment & billing history
- Doctor directory with specializations

### 5. 🔬 Laboratory Module
- Manage incoming test requests
- Update test status (sample collected → in progress → completed)
- Upload results with multiple parameters per test
- Priority-based queue (Normal / Urgent / Emergency)
- Daily stats dashboard

### 6. 💊 Pharmacy Module
- Complete medicine inventory (20 pre-loaded medicines)
- Stock management with batch tracking
- Low-stock & expiry alerts
- Add new medicines & suppliers
- Category-based filtering

### 7. 💳 Billing & Payments
- Auto-generate invoices with line items
- Support for multiple payment methods (Cash, Card, UPI, Insurance, NEFT)
- Partial payment tracking
- Tax & discount calculations
- Revenue statistics (today / monthly / pending)

### 8. 🛏️ Ward / Bed Management
- 21 pre-configured beds across 8 ward types
- Real-time availability tracking with visual bed grid
- ICU / General / Private / Emergency / Surgical / Maternity wards
- Admit & discharge workflow
- Active admissions list

### 9. 📅 Appointment Management
- Online & walk-in booking
- Doctor availability & schedule view
- Automatic token number generation
- Slot conflict detection
- Status management (pending → confirmed → completed / cancelled)

### 10. 📊 Reports & Analytics
- Daily / monthly revenue charts (line chart)
- Appointments by department (doughnut chart)
- Patient growth trends (bar chart)
- Doctor performance ranking
- Recent activity feed

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Secure Login | JWT tokens with 24-hour expiry |
| Password Encryption | bcrypt with 10 salt rounds |
| Role-Based Access | Middleware blocks unauthorized API access per endpoint |
| SQL Injection Prevention | Parameterized queries via Mongoose model validation & sanitization |
| CORS Policy | Configurable cross-origin resource sharing |
| Input Validation | Server-side validation on all endpoints |

---

## 🌐 Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| HTML5 | Semantic page structure |
| CSS3 (Custom Properties, Grid, Flexbox) | Layout & responsive design |
| CSS3 (Backdrop-filter, @keyframes) | Glassmorphism effects & animations |
| JavaScript ES6+ (Fetch API, async/await) | AJAX API calls |
| Chart.js 4.x | Interactive analytics charts |
| Font Awesome 6.5 | Icon library |
| Google Fonts (Inter + Poppins) | Premium typography |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| mongoose | MongoDB via Mongoose |
| jsonwebtoken (JWT) | Authentication tokens |
| bcryptjs | Password hashing |
| morgan | HTTP request logging |
| multer | File upload handling |
| cors | Cross-origin middleware |
| dotenv | Environment configuration |
| express-validator | Input validation |

### Database
| Technology | Purpose |
|-----------|---------|
| MongoDB 6.0+ | Relational database |
| 19 Tables | Full data model with foreign keys & indexes |

---

## 📁 Project Structure

```
Hospital_Management/
│
├── 📂 database/
│   ├── hms_schema.sql              # 19 tables + seed data (departments, beds, medicines)
│   └── seed.js                     # Bcrypt-hashed user seeder (10 demo users)
│
├── 📂 server/                      # ── NODE.JS BACKEND ──
│   ├── .env                        # Environment variables (DB credentials, JWT secret)
│   ├── .env.example                # Template for .env
│   ├── package.json                # Dependencies & scripts
│   ├── server.js                   # Express entry point (port 3000)
│   │
│   ├── 📂 config/
│   │   └── db.js                   # Mongoose connection
│   │
│   ├── 📂 middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── roleCheck.js            # Role-based access control factory
│   │
│   ├── 📂 controllers/             # 10 controllers (business logic)
│   │   ├── authController.js       # Login, register, getMe, changePassword, notifications
│   │   ├── patientController.js    # CRUD + medical records + prescriptions
│   │   ├── doctorController.js     # CRUD + schedule + departments listing
│   │   ├── appointmentController.js# CRUD + status + conflict check + today summary
│   │   ├── billingController.js    # Invoices + payments + revenue stats
│   │   ├── pharmacyController.js   # Medicines + stock + low-stock alerts
│   │   ├── labController.js        # Tests + results + stats
│   │   ├── bedController.js        # Availability + allocate + discharge + admissions
│   │   ├── staffController.js      # CRUD for non-doctor staff
│   │   ├── medicalRecordController.js # Records + prescriptions + auto-complete appointment
│   │   └── reportController.js     # Dashboard stats, revenue chart, doctor perf, growth
│   │
│   └── 📂 routes/                  # 11 route files (role-protected endpoints)
│       ├── auth.js
│       ├── patients.js
│       ├── doctors.js
│       ├── appointments.js
│       ├── billing.js
│       ├── pharmacy.js
│       ├── lab.js
│       ├── beds.js
│       ├── staff.js
│       ├── medicalRecords.js
│       └── reports.js
│
├── 📂 frontend/                    # ── HTML/CSS/JS FRONTEND ──
│   ├── index.html                  # Landing page (hero, features, pricing, CTA)
│   ├── login.html                  # Auth page (6-role selector, login/register tabs)
│   │
│   ├── 📂 css/
│   │   ├── main.css                # Full design system (cards, forms, tables, badges, toasts, modals)
│   │   ├── dashboard.css           # Sidebar + topbar + stats grid + bed tiles + tabs
│   │   └── auth.css                # Login page with animated gradient orbs
│   │
│   ├── 📂 js/
│   │   ├── config.js               # API wrapper, Auth helpers, Format utils, Status badges
│   │   ├── utils.js                # Toast, Modal, Sidebar, Table builder, Counter animation
│   │   ├── auth.js                 # Login/register form logic with validation
│   │   └── admin.js                # Admin dashboard logic (all 11 module pages)
│   │
│   └── 📂 pages/                   # Role-based dashboards (6 dashboards)
│       ├── admin/dashboard.html    # Admin: stats, charts, patients, doctors, staff, billing, beds, lab, pharmacy
│       ├── doctor/dashboard.html   # Doctor: appointments, patients, prescription writer
│       ├── receptionist/dashboard.html # Reception: register, book, beds, queue
│       ├── patient/dashboard.html  # Patient: book appointments, find doctors, bills, records
│       ├── lab/dashboard.html      # Lab: pending tests, add results, urgent queue
│       └── pharmacy/dashboard.html # Pharmacy: inventory, stock management, alerts
│
└── README.md                       # This file
```

**Total: 47 files**

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** v16+ installed
- **MongoDB** 6.0+ installed and running
- **npm** (comes with Node.js)

### Step 1: Clone / Navigate to project
```bash
cd /path/to/Hospital_Management
```

### Step 2: Create Database & Import Schema
```bash
# Import seed data via: cd server && npm run seed
```

This creates the `hms_db` database with all 19 tables and seeds:
- 10 departments
- 20 medicines with stock
- 21 hospital beds across 8 ward types

### Step 3: Configure Environment
```bash
# Edit the .env file with your MongoDB credentials
nano server/.env
```

Update these values:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
# MongoDB URI (see .env.example)
DB_NAME=hms_db
```

### Step 4: Install Dependencies
```bash
cd server
npm install
```

### Step 5: Seed Demo Users
```bash
cd ..
node database/seed.js
```

This creates 10 demo users with properly bcrypt-hashed passwords.

### Step 6: Start the Server
```bash
cd server

# Production
npm start

# Development (auto-reload with nodemon)
npm run dev
```

### Step 7: Open in Browser
```
🌐 Landing Page:  http://localhost:3000
🔑 Login Page:    http://localhost:3000/login.html
📊 API Health:    http://localhost:3000/api/health
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Dashboard Access |
|------|-------|----------|-----------------|
| 🛡️ Admin | `admin@hms.com` | `Admin@123` | Full system — all modules |
| 🩺 Doctor 1 | `doctor1@hms.com` | `Doctor@123` | Appointments, patients, prescriptions |
| 🩺 Doctor 2 | `doctor2@hms.com` | `Doctor@123` | Appointments, patients, prescriptions |
| 🩺 Doctor 3 | `doctor3@hms.com` | `Doctor@123` | Appointments, patients, prescriptions |
| 🧑‍💼 Receptionist | `recept@hms.com` | `Recept@123` | Register, book, beds, queue |
| 👤 Patient 1 | `patient1@hms.com` | `Patient@123` | Book appointments, view records |
| 👤 Patient 2 | `patient2@hms.com` | `Patient@123` | Book appointments, view records |
| 👤 Patient 3 | `patient3@hms.com` | `Patient@123` | Book appointments, view records |
| 🔬 Lab Tech | `lab@hms.com` | `Lab@123` | Pending tests, upload results |
| 💊 Pharmacist | `pharma@hms.com` | `Pharma@123` | Inventory, stock alerts |

---

## 📊 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | Login with email & password | Public |
| POST | `/api/auth/register` | Patient self-registration | Public |
| GET | `/api/auth/me` | Get current user profile | Authenticated |
| PUT | `/api/auth/change-password` | Change password | Authenticated |
| GET | `/api/auth/notifications` | Get user notifications | Authenticated |
| PUT | `/api/auth/notifications/:id/read` | Mark notification as read | Authenticated |

### Patients (`/api/patients`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/patients` | List all patients (search, paginate) | Admin, Doctor, Receptionist |
| GET | `/api/patients/:id` | Get patient details | Authenticated |
| POST | `/api/patients` | Register new patient | Admin, Receptionist |
| PUT | `/api/patients/:id` | Update patient info | Admin, Receptionist, Patient |
| DELETE | `/api/patients/:id` | Deactivate patient | Admin |
| GET | `/api/patients/:id/medical-records` | Get medical history | Admin, Doctor, Patient |
| GET | `/api/patients/:id/prescriptions` | Get prescriptions | Admin, Doctor, Patient, Pharmacist |

### Doctors (`/api/doctors`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/doctors` | List all doctors (filter by dept) | Authenticated |
| GET | `/api/doctors/departments` | List all departments | Authenticated |
| GET | `/api/doctors/:id` | Get doctor details | Authenticated |
| GET | `/api/doctors/:id/schedule` | Get doctor's schedule for a date | Authenticated |
| POST | `/api/doctors` | Add new doctor | Admin |
| PUT | `/api/doctors/:id` | Update doctor | Admin |
| DELETE | `/api/doctors/:id` | Deactivate doctor | Admin |

### Appointments (`/api/appointments`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/appointments` | List appointments (filtered) | Authenticated (role-scoped) |
| GET | `/api/appointments/:id` | Get appointment details | Authenticated |
| GET | `/api/appointments/today/summary` | Today's stats | Admin, Receptionist, Doctor |
| POST | `/api/appointments` | Book appointment | Admin, Receptionist, Patient |
| PUT | `/api/appointments/:id/status` | Update status | Authenticated |

### Billing (`/api/billing`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/billing` | List bills | Authenticated (role-scoped) |
| GET | `/api/billing/:id` | Get bill with items & payments | Authenticated |
| GET | `/api/billing/stats` | Revenue statistics | Admin, Receptionist |
| POST | `/api/billing` | Create new bill | Admin, Receptionist |
| POST | `/api/billing/:id/payment` | Record payment | Admin, Receptionist |

### Pharmacy (`/api/pharmacy`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/pharmacy/medicines` | List medicines | Authenticated |
| GET | `/api/pharmacy/medicines/:id` | Medicine with stocks | Authenticated |
| GET | `/api/pharmacy/alerts` | Low stock & expiry alerts | Admin, Pharmacist |
| GET | `/api/pharmacy/stats` | Pharmacy statistics | Admin, Pharmacist |
| POST | `/api/pharmacy/medicines` | Add medicine | Admin, Pharmacist |
| PUT | `/api/pharmacy/medicines/:id` | Update medicine | Admin, Pharmacist |
| POST | `/api/pharmacy/stock` | Add stock batch | Admin, Pharmacist |
| PUT | `/api/pharmacy/stock/:id` | Update stock quantity | Admin, Pharmacist |

### Laboratory (`/api/lab`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/lab/tests` | List lab tests | Authenticated |
| GET | `/api/lab/tests/:id` | Test with results | Authenticated |
| GET | `/api/lab/stats` | Lab statistics | Admin, Lab Tech, Doctor |
| POST | `/api/lab/tests` | Create test request | Admin, Doctor, Receptionist |
| PUT | `/api/lab/tests/:id/status` | Update test status | Admin, Lab Tech |
| POST | `/api/lab/tests/:id/results` | Upload results | Admin, Lab Tech |

### Beds (`/api/beds`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/beds` | List all beds | Authenticated |
| GET | `/api/beds/availability` | Ward-wise availability | Authenticated |
| GET | `/api/beds/admissions` | Active admissions | Admin, Receptionist, Doctor |
| POST | `/api/beds/allocate` | Admit patient to bed | Admin, Receptionist |
| PUT | `/api/beds/discharge/:id` | Discharge patient | Admin, Receptionist, Doctor |
| PUT | `/api/beds/:id/status` | Update bed status | Admin, Receptionist |

### Staff (`/api/staff`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/staff` | List all staff | Admin |
| POST | `/api/staff` | Add staff member | Admin |
| PUT | `/api/staff/:id` | Update staff | Admin |
| DELETE | `/api/staff/:id` | Deactivate staff | Admin |

### Medical Records (`/api/medical-records`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/medical-records` | Create record + prescription | Doctor |
| GET | `/api/medical-records/:id` | Get record with prescriptions | Admin, Doctor, Patient |

### Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/reports/dashboard` | Admin dashboard stats | Admin |
| GET | `/api/reports/revenue` | Revenue chart data | Admin |
| GET | `/api/reports/appointments-by-department` | Dept-wise appointments | Admin |
| GET | `/api/reports/patient-growth` | Monthly patient growth | Admin |
| GET | `/api/reports/doctor-performance` | Doctor rankings | Admin |
| GET | `/api/reports/recent-activity` | Recent activity feed | Admin |

---

## 🗄️ Database Schema (19 Tables)

| # | Table | Description | Key Relations |
|---|-------|-------------|---------------|
| 1 | `users` | All system users (6 roles) | Base table |
| 2 | `departments` | Hospital departments (10 seeded) | Referenced by doctors, staff |
| 3 | `doctors` | Doctor profiles | → users, departments |
| 4 | `patients` | Patient demographics & medical info | → users |
| 5 | `staff` | Non-doctor staff | → users, departments |
| 6 | `appointments` | Bookings with token system | → patients, doctors |
| 7 | `medical_records` | Visit records with vitals | → patients, doctors, appointments |
| 8 | `prescriptions` | E-prescription headers | → medical_records, patients, doctors |
| 9 | `prescription_items` | Medicine details per prescription | → prescriptions |
| 10 | `lab_tests` | Test requests with priority | → patients, doctors |
| 11 | `lab_results` | Test result parameters | → lab_tests |
| 12 | `beds` | Hospital beds (21 seeded) | 8 ward types |
| 13 | `bed_allocations` | Admission/discharge records | → beds, patients |
| 14 | `medicines` | Medicine catalog (20 seeded) | 9 categories |
| 15 | `medicine_stock` | Batch-wise stock tracking | → medicines |
| 16 | `billing` | Invoice headers | → patients, appointments |
| 17 | `billing_items` | Line items per invoice | → billing |
| 18 | `payments` | Payment records | → billing, patients |
| 19 | `notifications` | In-app notifications | → users |

---

## 🚀 Advanced Features (Selling Advantage)

- 📱 **Mobile-friendly responsive design** — works on all screen sizes
- 🎨 **Premium dark glassmorphism UI** — modern, professional aesthetic
- 📊 **Real-time analytics** — Chart.js powered dashboards
- 🔔 **In-app notification system** — appointment & billing alerts
- 🧾 **E-prescription system** — digital prescriptions with medicine details
- 📂 **Digital patient history** — complete medical records with vitals
- 🔐 **Role-based access control** — 6 roles with granular permissions
- ⚡ **Token/queue system** — automated appointment sequencing
- 💰 **Multi-payment support** — Cash, Card, UPI, Insurance, NEFT, Cheque
- 🛏️ **Visual bed management** — color-coded bed grid by status

---

## 💰 Business Value

| Benefit | Impact |
|---------|--------|
| ⏱️ **Saves Time** | Automates manual processes — registration, billing, reports |
| ❌ **Reduces Errors** | Digital records eliminate handwriting mistakes |
| 😊 **Patient Satisfaction** | Online booking, digital prescriptions, faster service |
| 📈 **Better Decisions** | Real-time analytics & reports for management |
| 💵 **Revenue Growth** | Efficient operations = more patients served |
| 🔒 **Data Security** | Encrypted passwords, role-based access, secure APIs |

---

## 💰 Pricing Strategy

| Plan | Price | Target |
|------|-------|--------|
| **Basic** | ₹10,000 – ₹25,000 | Small clinics (1-2 doctors) |
| **Standard** | ₹30,000 – ₹70,000 | Medium hospitals (all modules) |
| **Premium** | ₹1,00,000+ | Multi-branch with advanced features |
| **SaaS** | ₹1,000 – ₹5,000/month | Monthly subscription model |

---

## 🧩 Future Enhancements

- [ ] 🧠 AI diagnosis suggestions
- [ ] 📹 Telemedicine (video consultation)
- [ ] 📱 Mobile app (Android/iOS)
- [ ] 🌍 Multi-branch support
- [ ] 🔔 SMS/WhatsApp notifications
- [ ] 🏛️ Integration with government health systems
- [ ] 📄 PDF report generation
- [ ] 🌐 Multi-language support

---

## 🛠️ Development

```bash
# Start in development mode (auto-reload)
cd server && npm run dev

# Start in production mode
cd server && npm start

# Re-seed database
node database/seed.js
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🤝 Support

For support, customization, or deployment assistance, contact the development team.

---

<p align="center">
  <strong>Built with ❤️ for better healthcare</strong><br>
  Node.js · Express · MongoDB · Mongoose · HTML/CSS/JS · Chart.js
</p>
