// server/config/db.js — MySQL2 connection pool with PDO-like interface
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'hms_db',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  timezone:           '+05:30',
  charset:            'utf8mb4',
});

// Test on startup
pool.getConnection()
  .then(conn => { console.log('✅ MySQL connected'); conn.release(); })
  .catch(err  => { console.error('❌ MySQL error:', err.message); process.exit(1); });

// Helper: run a query and return rows
const query  = (sql, params) => pool.execute(sql, params);
const single = async (sql, params) => { const [rows] = await pool.execute(sql, params); return rows[0] || null; };

module.exports = { pool, query, single };
