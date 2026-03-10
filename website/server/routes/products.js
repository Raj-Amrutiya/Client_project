const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware');

const router = express.Router();

// Get all products with filtering, sorting, pagination
router.get('/', async (req, res) => {
    try {
        const {
            category, brand, min_price, max_price, rating,
            featured, search, sort, page = 1, limit = 12
        } = req.query;

        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug,
            (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
        `;
        const params = [];

        if (category) {
            query += ' AND c.slug = ?';
            params.push(category);
        }
        if (brand) {
            query += ' AND p.brand = ?';
            params.push(brand);
        }
        if (min_price) {
            query += ' AND p.price >= ?';
            params.push(Number(min_price));
        }
        if (max_price) {
            query += ' AND p.price <= ?';
            params.push(Number(max_price));
        }
        if (rating) {
            query += ' AND p.rating_avg >= ?';
            params.push(Number(rating));
        }
        if (featured === 'true') {
            query += ' AND p.is_featured = 1';
        }
        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Count total
        const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0].total;

        // Sorting
        switch (sort) {
            case 'price-low': query += ' ORDER BY p.price ASC'; break;
            case 'price-high': query += ' ORDER BY p.price DESC'; break;
            case 'rating': query += ' ORDER BY p.rating_avg DESC'; break;
            case 'newest': query += ' ORDER BY p.created_at DESC'; break;
            case 'name-az': query += ' ORDER BY p.name ASC'; break;
            default: query += ' ORDER BY p.is_featured DESC, p.created_at DESC';
        }

        // Pagination
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const [products] = await db.query(query, params);

        res.json({
            products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error('Products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product by ID or slug
router.get('/:idOrSlug', async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const isId = !isNaN(idOrSlug);

        const [products] = await db.query(
            `SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM products p LEFT JOIN categories c ON p.category_id = c.id
             WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'} AND p.is_active = 1`,
            [idOrSlug]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = products[0];

        // Get images
        const [images] = await db.query(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
            [product.id]
        );

        // Get variants
        const [variants] = await db.query(
            'SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1',
            [product.id]
        );

        // Get reviews
        const [reviews] = await db.query(
            `SELECT r.*, u.first_name, u.last_name FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ? AND r.is_approved = 1
             ORDER BY r.created_at DESC LIMIT 10`,
            [product.id]
        );

        res.json({ product: { ...product, images, variants, reviews } });
    } catch (err) {
        console.error('Product detail error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1 WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.sort_order'
        );
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get brands
router.get('/meta/brands', async (req, res) => {
    try {
        const [brands] = await db.query(
            'SELECT DISTINCT brand FROM products WHERE is_active = 1 AND brand IS NOT NULL ORDER BY brand'
        );
        res.json({ brands: brands.map(b => b.brand) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

module.exports = router;
