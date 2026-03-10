const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server.');

    const dbName = process.env.DB_NAME || 'shopverse_db';

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`Database "${dbName}" ready.`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements and execute one by one
    const statements = schema
        .replace(/CREATE DATABASE.*?;/gi, '')
        .replace(/USE\s+\w+\s*;/gi, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
        try {
            await connection.query(stmt);
        } catch (err) {
            // Skip duplicate entry errors (seed data already exists)
            if (err.code === 'ER_DUP_ENTRY') continue;
            console.error(`Warning: ${err.message.substring(0, 100)}`);
        }
    }

    console.log('Schema and seed data loaded successfully!');

    console.log('\n✅ Database setup complete!');
    console.log(`   Database: ${dbName}`);
    console.log('   Admin login: admin@ecommerce.com / Admin@123');
    console.log('\n   Run "npm run dev" to start the server.\n');

    await connection.end();
}

setupDatabase().catch(err => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
});
