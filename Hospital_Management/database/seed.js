// database/seed.js — Run: cd server && npm run seed
const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const mongoose = require(path.join(serverDir, 'node_modules', 'mongoose'));
const bcrypt   = require(path.join(serverDir, 'node_modules', 'bcryptjs'));

// Import models
const User          = require('../server/models/User');
const Department    = require('../server/models/Department');
const Doctor        = require('../server/models/Doctor');
const Patient       = require('../server/models/Patient');
const Staff         = require('../server/models/Staff');
const Appointment   = require('../server/models/Appointment');
const Medicine      = require('../server/models/Medicine');
const MedicineStock = require('../server/models/MedicineStock');
const Bed           = require('../server/models/Bed');
const Billing       = require('../server/models/Billing');

const SALT = 10;
const hash = (pw) => bcrypt.hash(pw, SALT);

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hms_db';
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB — seeding…');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), Doctor.deleteMany({}),
    Patient.deleteMany({}), Staff.deleteMany({}), Appointment.deleteMany({}),
    Medicine.deleteMany({}), MedicineStock.deleteMany({}), Bed.deleteMany({}),
    Billing.deleteMany({}),
  ]);
  console.log('  ✓ Cleared existing data');

  // ── DEPARTMENTS ────────────────────────────────────────────────────────────
  const depts = await Department.insertMany([
    { name: 'Cardiology',  code: 'CARD', description: 'Heart & cardiovascular diseases' },
    { name: 'Neurology',   code: 'NEUR', description: 'Brain & nervous system disorders' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Bone, joint & muscle conditions' },
    { name: 'Pediatrics',  code: 'PEDI', description: 'Medical care for children' },
    { name: 'Gynecology',  code: 'GYNE', description: 'Women health & reproductive system' },
    { name: 'Oncology',    code: 'ONCO', description: 'Cancer diagnosis & treatment' },
    { name: 'Radiology',   code: 'RADI', description: 'Medical imaging & diagnostics' },
    { name: 'Emergency',   code: 'EMER', description: '24x7 emergency medical care' },
    { name: 'Pharmacy',    code: 'PHAR', description: 'Medicine dispensing & management' },
    { name: 'Laboratory',  code: 'LAB',  description: 'Diagnostic laboratory services' },
  ]);
  console.log(`  ✓ ${depts.length} departments`);

  // ── USERS ──────────────────────────────────────────────────────────────────
  const usersData = [
    { role: 'admin',          name: 'Admin User',       email: 'admin@hms.com',    password: 'Admin@123',   phone: '9800000001' },
    { role: 'doctor',         name: 'Dr. Arjun Mehta',  email: 'doctor1@hms.com',  password: 'Doctor@123',  phone: '9800000002' },
    { role: 'doctor',         name: 'Dr. Priya Sharma', email: 'doctor2@hms.com',  password: 'Doctor@123',  phone: '9800000003' },
    { role: 'doctor',         name: 'Dr. Rohan Gupta',  email: 'doctor3@hms.com',  password: 'Doctor@123',  phone: '9800000004' },
    { role: 'receptionist',   name: 'Riya Singh',       email: 'recept@hms.com',   password: 'Recept@123',  phone: '9800000005' },
    { role: 'patient',        name: 'Amit Kumar',       email: 'patient1@hms.com', password: 'Patient@123', phone: '9800000006' },
    { role: 'patient',        name: 'Sunita Patel',     email: 'patient2@hms.com', password: 'Patient@123', phone: '9800000007' },
    { role: 'lab_technician', name: 'Lab Tech Vijay',   email: 'lab@hms.com',      password: 'Lab@123',     phone: '9800000008' },
    { role: 'pharmacist',     name: 'Pharmacist Neha',  email: 'pharma@hms.com',   password: 'Pharma@123',  phone: '9800000009' },
    { role: 'patient',        name: 'Rahul Verma',      email: 'patient3@hms.com', password: 'Patient@123', phone: '9800000010' },
  ];

  const users = {};
  for (const u of usersData) {
    const hashed = await hash(u.password);
    const created = await User.create({ name: u.name, email: u.email, password: hashed, role: u.role, phone: u.phone });
    users[u.email] = created;
    console.log(`  → ${u.role}: ${u.email}`);
  }

  // ── DOCTORS ────────────────────────────────────────────────────────────────
  const doctorsData = [
    { email: 'doctor1@hms.com', deptIdx: 0, id: 'DOC001', spec: 'Cardiology',  qual: 'MBBS, MD Cardiology', exp: 12, fee: 800, days: 'Mon,Tue,Wed,Thu,Fri', from: '09:00', to: '17:00' },
    { email: 'doctor2@hms.com', deptIdx: 1, id: 'DOC002', spec: 'Neurology',   qual: 'MBBS, DM Neurology',  exp: 8,  fee: 700, days: 'Mon,Wed,Fri',         from: '10:00', to: '16:00' },
    { email: 'doctor3@hms.com', deptIdx: 2, id: 'DOC003', spec: 'Orthopedics', qual: 'MBBS, MS Ortho',      exp: 15, fee: 600, days: 'Tue,Thu,Sat',          from: '08:00', to: '14:00' },
  ];

  const doctorDocs = {};
  for (const d of doctorsData) {
    const doc = await Doctor.create({
      user_id: users[d.email]._id, department_id: depts[d.deptIdx]._id,
      doctor_id: d.id, specialization: d.spec, qualification: d.qual,
      experience_years: d.exp, consultation_fee: d.fee,
      available_days: d.days, available_from: d.from, available_to: d.to,
    });
    doctorDocs[d.email] = doc;
  }
  console.log(`  ✓ ${doctorsData.length} doctors`);

  // ── PATIENTS ───────────────────────────────────────────────────────────────
  const patientsData = [
    { email: 'patient1@hms.com', pid: 'PAT001', dob: '1990-05-15', gender: 'male',   blood: 'B+', city: 'Mumbai' },
    { email: 'patient2@hms.com', pid: 'PAT002', dob: '1985-08-22', gender: 'female', blood: 'O+', city: 'Delhi' },
    { email: 'patient3@hms.com', pid: 'PAT003', dob: '1995-12-10', gender: 'male',   blood: 'A+', city: 'Bangalore' },
  ];

  const patientDocs = {};
  for (const p of patientsData) {
    const pat = await Patient.create({
      user_id: users[p.email]._id, patient_id: p.pid,
      dob: new Date(p.dob), gender: p.gender, blood_group: p.blood, city: p.city,
    });
    patientDocs[p.email] = pat;
  }
  console.log(`  ✓ ${patientsData.length} patients`);

  // ── APPOINTMENTS ───────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appts = [
    { no: 'APT001', pat: 'patient1@hms.com', doc: 'doctor1@hms.com', time: '09:00', status: 'confirmed', reason: 'Chest pain checkup' },
    { no: 'APT002', pat: 'patient2@hms.com', doc: 'doctor2@hms.com', time: '10:30', status: 'pending',   reason: 'Headache & dizziness' },
    { no: 'APT003', pat: 'patient3@hms.com', doc: 'doctor3@hms.com', time: '11:00', status: 'completed', reason: 'Knee pain' },
  ];
  for (let i = 0; i < appts.length; i++) {
    const a = appts[i];
    await Appointment.create({
      appointment_number: a.no, patient_id: patientDocs[a.pat]._id,
      doctor_id: doctorDocs[a.doc]._id, appointment_date: today,
      appointment_time: a.time, status: a.status, reason: a.reason,
      token_number: i + 1,
    });
  }
  console.log(`  ✓ ${appts.length} appointments`);

  // ── BILLING SAMPLE ─────────────────────────────────────────────────────────
  await Billing.create({
    bill_number: 'BILL001', patient_id: patientDocs['patient1@hms.com']._id,
    subtotal: 1500, tax_percent: 18, tax_amount: 270, total_amount: 1770,
    net_amount: 1770, balance_due: 1770, status: 'pending',
    due_date: new Date(Date.now() + 7 * 86400000),
    items: [
      { item_name: 'Cardiology Consultation', item_type: 'consultation', quantity: 1, unit_price: 800, total_price: 800 },
      { item_name: 'ECG Test', item_type: 'lab_test', quantity: 1, unit_price: 700, total_price: 700 },
    ],
  });
  console.log('  ✓ 1 billing record');

  // ── STAFF ──────────────────────────────────────────────────────────────────
  await Staff.create({
    user_id: users['recept@hms.com']._id,
    department_id: depts[7]._id, // Emergency (idx 7)
    employee_id: 'EMP001', designation: 'Senior Receptionist',
    salary: 35000, join_date: new Date('2022-04-01'),
  });
  console.log('  ✓ 1 staff member');

  // ── MEDICINES ──────────────────────────────────────────────────────────────
  const medsData = [
    { name: 'Paracetamol 500mg',     generic: 'Paracetamol',       cat: 'tablet',    mfg: 'Sun Pharma',  unit: 'strip', rx: false },
    { name: 'Amoxicillin 250mg',     generic: 'Amoxicillin',       cat: 'capsule',   mfg: 'Cipla',       unit: 'strip', rx: true },
    { name: 'Omeprazole 20mg',       generic: 'Omeprazole',        cat: 'capsule',   mfg: 'Dr. Reddy',   unit: 'strip', rx: false },
    { name: 'Metformin 500mg',       generic: 'Metformin',         cat: 'tablet',    mfg: 'Mankind',     unit: 'strip', rx: true },
    { name: 'Atorvastatin 10mg',     generic: 'Atorvastatin',      cat: 'tablet',    mfg: 'Sun Pharma',  unit: 'strip', rx: true },
    { name: 'Amlodipine 5mg',        generic: 'Amlodipine',        cat: 'tablet',    mfg: 'Cipla',       unit: 'strip', rx: true },
    { name: 'Cetirizine 10mg',       generic: 'Cetirizine',        cat: 'tablet',    mfg: 'Mankind',     unit: 'strip', rx: false },
    { name: 'Ibuprofen 400mg',       generic: 'Ibuprofen',         cat: 'tablet',    mfg: 'Abbott',      unit: 'strip', rx: false },
    { name: 'Azithromycin 500mg',    generic: 'Azithromycin',      cat: 'tablet',    mfg: 'Cipla',       unit: 'strip', rx: true },
    { name: 'Metronidazole 400mg',   generic: 'Metronidazole',     cat: 'tablet',    mfg: 'Sun Pharma',  unit: 'strip', rx: true },
    { name: 'Vitamin C 500mg',       generic: 'Ascorbic Acid',     cat: 'tablet',    mfg: 'Mankind',     unit: 'strip', rx: false },
    { name: 'Dextrose Saline',       generic: 'Dextrose+NaCl',     cat: 'injection', mfg: 'B. Braun',    unit: 'bottle',rx: true },
    { name: 'Insulin Glargine',      generic: 'Insulin Glargine',  cat: 'injection', mfg: 'Sanofi',      unit: 'vial',  rx: true },
    { name: 'Salbutamol Inhaler',    generic: 'Salbutamol',        cat: 'inhaler',   mfg: 'Cipla',       unit: 'unit',  rx: true },
    { name: 'Calcium Carbonate',     generic: 'Calcium Carbonate', cat: 'tablet',    mfg: 'Abbott',      unit: 'strip', rx: false },
    { name: 'Pantoprazole 40mg',     generic: 'Pantoprazole',      cat: 'tablet',    mfg: 'Sun Pharma',  unit: 'strip', rx: false },
    { name: 'Losartan 50mg',         generic: 'Losartan',          cat: 'tablet',    mfg: 'Cipla',       unit: 'strip', rx: true },
    { name: 'Aspirin 75mg',          generic: 'Aspirin',           cat: 'tablet',    mfg: 'Bayer',       unit: 'strip', rx: false },
    { name: 'Clopidogrel 75mg',      generic: 'Clopidogrel',       cat: 'tablet',    mfg: 'Sun Pharma',  unit: 'strip', rx: true },
    { name: 'Hydroxychloroquine',    generic: 'Hydroxychloroquine',cat: 'tablet',    mfg: 'Ipca Labs',   unit: 'strip', rx: true },
  ];

  const medDocs = [];
  for (const m of medsData) {
    const doc = await Medicine.create({ name: m.name, generic_name: m.generic, category: m.cat, manufacturer: m.mfg, unit: m.unit, requires_prescription: m.rx });
    medDocs.push(doc);
  }
  console.log(`  ✓ ${medDocs.length} medicines`);

  // ── MEDICINE STOCK ─────────────────────────────────────────────────────────
  const stockData = [
    { idx: 0,  batch: 'B001', qty: 500, alert: 50, pp: 1.50,   sp: 2.50,    exp: '2026-12-31', sup: 'MedSupply Co' },
    { idx: 1,  batch: 'B002', qty: 300, alert: 30, pp: 5.00,   sp: 8.00,    exp: '2026-10-31', sup: 'PharmaWholesale' },
    { idx: 2,  batch: 'B003', qty: 400, alert: 40, pp: 3.00,   sp: 5.00,    exp: '2026-11-30', sup: 'MedSupply Co' },
    { idx: 3,  batch: 'B004', qty: 250, alert: 25, pp: 2.50,   sp: 4.00,    exp: '2026-09-30', sup: 'PharmaWholesale' },
    { idx: 4,  batch: 'B005', qty: 200, alert: 20, pp: 8.00,   sp: 12.00,   exp: '2026-08-31', sup: 'GenericMeds' },
    { idx: 5,  batch: 'B006', qty: 180, alert: 15, pp: 6.00,   sp: 9.00,    exp: '2026-07-31', sup: 'GenericMeds' },
    { idx: 6,  batch: 'B007', qty: 350, alert: 35, pp: 1.00,   sp: 2.00,    exp: '2026-12-31', sup: 'MedSupply Co' },
    { idx: 7,  batch: 'B008', qty: 420, alert: 40, pp: 1.80,   sp: 3.00,    exp: '2026-11-30', sup: 'PharmaWholesale' },
    { idx: 8,  batch: 'B009', qty: 8,   alert: 20, pp: 12.00,  sp: 18.00,   exp: '2026-10-31', sup: 'Cipla Direct' },
    { idx: 9,  batch: 'B010', qty: 150, alert: 15, pp: 2.00,   sp: 3.50,    exp: '2026-09-30', sup: 'MedSupply Co' },
    { idx: 10, batch: 'B011', qty: 600, alert: 50, pp: 0.50,   sp: 1.00,    exp: '2027-06-30', sup: 'GenericMeds' },
    { idx: 11, batch: 'B012', qty: 50,  alert: 5,  pp: 25.00,  sp: 40.00,   exp: '2026-06-30', sup: 'HospitalSupplies' },
    { idx: 12, batch: 'B013', qty: 15,  alert: 5,  pp: 350.00, sp: 500.00,  exp: '2026-05-31', sup: 'Sanofi Direct' },
    { idx: 13, batch: 'B014', qty: 25,  alert: 10, pp: 180.00, sp: 250.00,  exp: '2027-01-31', sup: 'Cipla Direct' },
    { idx: 14, batch: 'B015', qty: 280, alert: 25, pp: 1.20,   sp: 2.00,    exp: '2026-12-31', sup: 'GenericMeds' },
  ];
  for (const s of stockData) {
    await MedicineStock.create({
      medicine_id: medDocs[s.idx]._id, batch_number: s.batch,
      quantity: s.qty, min_stock_alert: s.alert,
      purchase_price: s.pp, selling_price: s.sp,
      expiry_date: new Date(s.exp), supplier: s.sup,
    });
  }
  console.log(`  ✓ ${stockData.length} stock entries`);

  // ── BEDS ───────────────────────────────────────────────────────────────────
  const bedsData = [
    { num: 'G-101',  ward: 'general',      floor: 1, name: 'General Ward A', st: 'available',   rate: 500 },
    { num: 'G-102',  ward: 'general',      floor: 1, name: 'General Ward A', st: 'occupied',    rate: 500 },
    { num: 'G-103',  ward: 'general',      floor: 1, name: 'General Ward A', st: 'available',   rate: 500 },
    { num: 'G-104',  ward: 'general',      floor: 1, name: 'General Ward A', st: 'maintenance', rate: 500 },
    { num: 'G-201',  ward: 'general',      floor: 2, name: 'General Ward B', st: 'available',   rate: 500 },
    { num: 'G-202',  ward: 'general',      floor: 2, name: 'General Ward B', st: 'available',   rate: 500 },
    { num: 'P-101',  ward: 'private',      floor: 1, name: 'Private Suite',  st: 'occupied',    rate: 2000 },
    { num: 'P-102',  ward: 'private',      floor: 1, name: 'Private Suite',  st: 'available',   rate: 2000 },
    { num: 'P-103',  ward: 'private',      floor: 2, name: 'Private Suite',  st: 'available',   rate: 2000 },
    { num: 'SP-101', ward: 'semi_private', floor: 1, name: 'Semi-Private',   st: 'available',   rate: 1200 },
    { num: 'SP-102', ward: 'semi_private', floor: 1, name: 'Semi-Private',   st: 'available',   rate: 1200 },
    { num: 'ICU-01', ward: 'icu',          floor: 3, name: 'ICU',            st: 'occupied',    rate: 8000 },
    { num: 'ICU-02', ward: 'icu',          floor: 3, name: 'ICU',            st: 'available',   rate: 8000 },
    { num: 'ICU-03', ward: 'icu',          floor: 3, name: 'ICU',            st: 'available',   rate: 8000 },
    { num: 'EMG-01', ward: 'emergency',    floor: 0, name: 'Emergency',      st: 'occupied',    rate: 1000 },
    { num: 'EMG-02', ward: 'emergency',    floor: 0, name: 'Emergency',      st: 'available',   rate: 1000 },
    { num: 'EMG-03', ward: 'emergency',    floor: 0, name: 'Emergency',      st: 'available',   rate: 1000 },
    { num: 'SUR-01', ward: 'surgical',     floor: 2, name: 'Surgical Ward',  st: 'available',   rate: 3000 },
    { num: 'SUR-02', ward: 'surgical',     floor: 2, name: 'Surgical Ward',  st: 'available',   rate: 3000 },
    { num: 'MAT-01', ward: 'maternity',    floor: 2, name: 'Maternity Ward', st: 'available',   rate: 2500 },
    { num: 'MAT-02', ward: 'maternity',    floor: 2, name: 'Maternity Ward', st: 'available',   rate: 2500 },
  ];
  for (const b of bedsData) {
    await Bed.create({ bed_number: b.num, ward_type: b.ward, floor: b.floor, ward_name: b.name, status: b.st, daily_rate: b.rate });
  }
  console.log(`  ✓ ${bedsData.length} beds`);

  await mongoose.disconnect();
  console.log('\n🎉 Seeding complete! Login credentials:');
  console.log('  Admin        → admin@hms.com       / Admin@123');
  console.log('  Doctor 1     → doctor1@hms.com     / Doctor@123');
  console.log('  Doctor 2     → doctor2@hms.com     / Doctor@123');
  console.log('  Receptionist → recept@hms.com      / Recept@123');
  console.log('  Patient 1    → patient1@hms.com    / Patient@123');
  console.log('  Lab Tech     → lab@hms.com         / Lab@123');
  console.log('  Pharmacist   → pharma@hms.com      / Pharma@123');
}

seed().catch((err) => { console.error('❌ Seed error:', err.message); process.exit(1); });
