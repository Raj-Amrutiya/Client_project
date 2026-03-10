const express = require('express');
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware');

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        let orderBy = 'r.created_at DESC';
        if (sort === 'rating-high') orderBy = 'r.rating DESC';
        if (sort === 'rating-low') orderBy = 'r.rating ASC';
        if (sort === 'helpful') orderBy = 'r.helpful_count DESC';

        const [reviews] = await db.query(
            `SELECT r.*, u.first_name, u.last_name
             FROM reviews r JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ? AND r.is_approved = 1
             ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
            [req.params.productId, Number(limit), (Number(page) - 1) * Number(limit)]
        );

        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND is_approved = 1',
            [req.params.productId]
        );

        // Rating distribution
        const [distribution] = await db.query(
            `SELECT rating, COUNT(*) as count FROM reviews
             WHERE product_id = ? AND is_approved = 1 GROUP BY rating ORDER BY rating DESC`,
            [req.params.productId]
        );

        res.json({ reviews, total, distribution });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Add review
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { product_id, rating, title, comment } = req.body;

        if (!product_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Product ID and valid rating (1-5) required' });
        }

        // Check if user already reviewed this product
        const [existing] = await db.query(
            'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Check if user purchased this product
        const [purchased] = await db.query(
            `SELECT oi.id FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
            [req.user.id, product_id]
        );

        await db.query(
            'INSERT INTO reviews (user_id, product_id, rating, title, comment, is_verified_purchase) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, product_id, rating, title || null, comment || null, purchased.length > 0 ? 1 : 0]
        );

        // Update product rating
        const [[{ avgRating, ratingCount }]] = await db.query(
            'SELECT AVG(rating) as avgRating, COUNT(*) as ratingCount FROM reviews WHERE product_id = ? AND is_approved = 1',
            [product_id]
        );

        await db.query(
            'UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?',
            [Math.round(avgRating * 10) / 10, ratingCount, product_id]
        );

        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (err) {
        console.error('Review error:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM reviews WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Review not found' });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;
