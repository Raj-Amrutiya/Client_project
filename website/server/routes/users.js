const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: users[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { first_name, last_name, phone } = req.body;
        await db.query(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
            [first_name, last_name, phone || null, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get addresses
router.get('/addresses', authenticateToken, async (req, res) => {
    try {
        const [addresses] = await db.query(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json({ addresses });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// Add address
router.post('/addresses', authenticateToken, async (req, res) => {
    try {
        const { address_type, full_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default } = req.body;

        if (!full_name || !address_line1 || !city || !state || !postal_code || !phone) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        if (is_default) {
            await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        }

        const [result] = await db.query(
            `INSERT INTO addresses (user_id, address_type, full_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, address_type || 'shipping', full_name, address_line1, address_line2 || null, city, state, postal_code, country || 'India', phone, is_default ? 1 : 0]
        );

        res.status(201).json({ message: 'Address added', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add address' });
    }
});

// Update address
router.put('/addresses/:id', authenticateToken, async (req, res) => {
    try {
        const { full_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default } = req.body;

        const [addresses] = await db.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (addresses.length === 0) return res.status(404).json({ error: 'Address not found' });

        if (is_default) {
            await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        }

        await db.query(
            `UPDATE addresses SET full_name = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ?, is_default = ? WHERE id = ? AND user_id = ?`,
            [full_name, address_line1, address_line2 || null, city, state, postal_code, country || 'India', phone, is_default ? 1 : 0, req.params.id, req.user.id]
        );

        res.json({ message: 'Address updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update address' });
    }
});

// Delete address
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Address not found' });
        res.json({ message: 'Address deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

module.exports = router;
