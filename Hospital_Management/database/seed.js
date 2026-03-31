// database/seed.js — Run: node database/seed.js
require('dotenv').config({ path: './server/.env' });
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT = 10;
const hash = (pw) => bcrypt.hash(pw, SALT);

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'hms_db',
    multipleStatements: true,
  });

  console.log('✅ Connected to DB — seeding users…');

  // ── USERS ──────────────────────────────────────────────────────────────────
  const users = [
    // role, name, email, password, phone
    ['admin',          'Admin User',      'admin@hms.com',       'Admin@123',    '9800000001'],
    ['doctor',         'Dr. Arjun Mehta', 'doctor1@hms.com',     'Doctor@123',   '9800000002'],
    ['doctor',         'Dr. Priya Sharma','doctor2@hms.com',     'Doctor@123',   '9800000003'],
    ['doctor',         'Dr. Rohan Gupta', 'doctor3@hms.com',     'Doctor@123',   '9800000004'],
    ['receptionist',   'Riya Singh',      'recept@hms.com',      'Recept@123',   '9800000005'],
    ['patient',        'Amit Kumar',      'patient1@hms.com',    'Patient@123',  '9800000006'],
    ['patient',        'Sunita Patel',    'patient2@hms.com',    'Patient@123',  '9800000007'],
    ['lab_technician', 'Lab Tech Vijay',  'lab@hms.com',         'Lab@123',      '9800000008'],
    ['pharmacist',     'Pharmacist Neha', 'pharma@hms.com',      'Pharma@123',   '9800000009'],
    ['patient',        'Rahul Verma',     'patient3@hms.com',    'Patient@123',  '9800000010'],
  ];

  const userIds = {};
  for (const [role, name, email, password, phone] of users) {
    const hashed = await hash(password);
    const [res] = await conn.execute(
      `INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      [name, email, hashed, role, phone]
    );
    userIds[email] = res.insertId;
    console.log(`  → ${role}: ${email} [id:${res.insertId}]`);
  }

  // ── DOCTORS ────────────────────────────────────────────────────────────────
  const doctorData = [
    { email:'doctor1@hms.com', dept:1, id:'DOC001', spec:'Cardiology',  qual:'MBBS, MD Cardiology', exp:12, fee:800, days:'Mon,Tue,Wed,Thu,Fri', from:'09:00', to:'17:00' },
    { email:'doctor2@hms.com', dept:2, id:'DOC002', spec:'Neurology',   qual:'MBBS, DM Neurology',  exp:8,  fee:700, days:'Mon,Wed,Fri',         from:'10:00', to:'16:00' },
    { email:'doctor3@hms.com', dept:3, id:'DOC003', spec:'Orthopedics', qual:'MBBS, MS Ortho',      exp:15, fee:600, days:'Tue,Thu,Sat',          from:'08:00', to:'14:00' },
  ];
  const doctorIds = {};
  for (const d of doctorData) {
    const [res] = await conn.execute(
      `INSERT INTO doctors (user_id,department_id,doctor_id,specialization,qualification,experience_years,consultation_fee,available_days,available_from,available_to)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      [userIds[d.email], d.dept, d.id, d.spec, d.qual, d.exp, d.fee, d.days, d.from, d.to]
    );
    doctorIds[d.email] = res.insertId;
  }

  // ── PATIENTS ───────────────────────────────────────────────────────────────
  const patientData = [
    { email:'patient1@hms.com', pid:'PAT001', dob:'1990-05-15', gender:'male',   blood:'B+', city:'Mumbai',    phone:'9800000006' },
    { email:'patient2@hms.com', pid:'PAT002', dob:'1985-08-22', gender:'female', blood:'O+', city:'Delhi',     phone:'9800000007' },
    { email:'patient3@hms.com', pid:'PAT003', dob:'1995-12-10', gender:'male',   blood:'A+', city:'Bangalore', phone:'9800000010' },
  ];
  const patientIds = {};
  for (const p of patientData) {
    const [res] = await conn.execute(
      `INSERT INTO patients (user_id,patient_id,dob,gender,blood_group,city)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      [userIds[p.email], p.pid, p.dob, p.gender, p.blood, p.city]
    );
    patientIds[p.email] = res.insertId;
  }

  // ── APPOINTMENTS ───────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const appts = [
    { no:'APT001', pat:'patient1@hms.com', doc:'doctor1@hms.com', date:today, time:'09:00', status:'confirmed', reason:'Chest pain checkup' },
    { no:'APT002', pat:'patient2@hms.com', doc:'doctor2@hms.com', date:today, time:'10:30', status:'pending',   reason:'Headache & dizziness' },
    { no:'APT003', pat:'patient3@hms.com', doc:'doctor3@hms.com', date:today, time:'11:00', status:'completed', reason:'Knee pain' },
  ];
  for (const a of appts) {
    await conn.execute(
      `INSERT INTO appointments (appointment_number,patient_id,doctor_id,appointment_date,appointment_time,status,reason,token_number)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      [a.no, patientIds[a.pat], doctorIds[a.doc], a.date, a.time, a.status, a.reason, appts.indexOf(a)+1]
    );
  }

  // ── BILLING SAMPLE ─────────────────────────────────────────────────────────
  await conn.execute(
    `INSERT INTO billing (bill_number,patient_id,subtotal,tax_percent,tax_amount,total_amount,net_amount,balance_due,status,due_date)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    ['BILL001', patientIds['patient1@hms.com'], 1500, 18, 270, 1770, 1770, 1770, 'pending', new Date(Date.now()+7*86400000).toISOString().split('T')[0]]
  );
  const [billRes] = await conn.query(`SELECT id FROM billing WHERE bill_number='BILL001'`);
  if (billRes.length) {
    await conn.execute(
      `INSERT IGNORE INTO billing_items (billing_id,item_name,item_type,quantity,unit_price,total_price) VALUES
       (?,?,?,?,?,?)`,
      [billRes[0].id, 'Cardiology Consultation', 'consultation', 1, 800, 800]
    );
    await conn.execute(
      `INSERT IGNORE INTO billing_items (billing_id,item_name,item_type,quantity,unit_price,total_price) VALUES
       (?,?,?,?,?,?)`,
      [billRes[0].id, 'ECG Test', 'lab_test', 1, 700, 700]
    );
  }

  // ── STAFF ──────────────────────────────────────────────────────────────────
  await conn.execute(
    `INSERT INTO staff (user_id,department_id,employee_id,designation,salary,join_date)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    [userIds['recept@hms.com'], 8, 'EMP001', 'Senior Receptionist', 35000, '2022-04-01']
  );

  await conn.end();
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
