const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// Get wishlist
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT w.id, w.created_at as added_at, p.id as product_id, p.name, p.slug, p.price, p.compare_price, p.stock_quantity, p.rating_avg,
             (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image_url,
             c.name as category_name
             FROM wishlist w
             JOIN products p ON w.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE w.user_id = ? AND p.is_active = 1
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json({ items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// Add to wishlist
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.status(400).json({ error: 'Product ID required' });

        const [existing] = await db.query(
            'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing.length > 0) {
            return res.json({ message: 'Already in wishlist' });
        }

        await db.query(
            'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
            [req.user.id, product_id]
        );

        res.status(201).json({ message: 'Added to wishlist' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// Remove from wishlist
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, req.params.productId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not in wishlist' });
        res.json({ message: 'Removed from wishlist' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
    try {
        const [items] = await db.query(
            'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, req.params.productId]
        );
        res.json({ inWishlist: items.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check wishlist' });
    }
});

module.exports = router;
