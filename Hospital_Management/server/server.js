// server/server.js  — Express main entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Static Files (Frontend) ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/patients',       require('./routes/patients'));
app.use('/api/doctors',        require('./routes/doctors'));
app.use('/api/departments',    require('./routes/doctors'));   // departments piggyback doctors router
app.use('/api/appointments',   require('./routes/appointments'));
app.use('/api/billing',        require('./routes/billing'));
app.use('/api/pharmacy',       require('./routes/pharmacy'));
app.use('/api/lab',            require('./routes/lab'));
app.use('/api/beds',           require('./routes/beds'));
app.use('/api/staff',          require('./routes/staff'));
app.use('/api/medical-records',require('./routes/medicalRecords'));
app.use('/api/reports',        require('./routes/reports'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, message: 'HMS API running', timestamp: new Date() }));

// ── Serve Frontend SPA (catch-all) ────────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API route not found' });
  }
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥 HMS Server running on http://localhost:${PORT}`);
  console.log(`📊 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:${PORT}\n`);
});

module.exports = app;
