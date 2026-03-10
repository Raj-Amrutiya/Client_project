const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register
router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, password_hash, phone || null]
        );

        const token = jwt.sign(
            { id: result.insertId, email, role: 'customer' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: result.insertId, first_name, last_name, email, role: 'customer' }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const [users] = await db.query(
            'SELECT id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, first_name, last_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'Valid passwords required' });
        }

        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const valid = await bcrypt.compare(current_password, users[0].password_hash);

        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;
