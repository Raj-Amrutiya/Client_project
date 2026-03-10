const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware');

const router = express.Router();

// Dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
        const [[{ totalRevenue }]] = await db.query("SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders WHERE status != 'cancelled'");
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users WHERE role = ?', ['customer']);
        const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) as totalProducts FROM products');
        const [[{ pendingOrders }]] = await db.query("SELECT COUNT(*) as pendingOrders FROM orders WHERE status IN ('pending', 'confirmed')");
        const [[{ lowStock }]] = await db.query('SELECT COUNT(*) as lowStock FROM products WHERE stock_quantity < 10 AND is_active = 1');

        const [recentOrders] = await db.query(
            `SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC LIMIT 10`
        );

        res.json({ stats: { totalOrders, totalRevenue, totalUsers, totalProducts, pendingOrders, lowStock }, recentOrders });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all products (admin)
router.get('/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        let query = `SELECT p.*, c.name as category_name,
            (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image_url
            FROM products p LEFT JOIN categories c ON p.category_id = c.id`;
        const params = [];

        if (search) {
            query += ' WHERE p.name LIKE ? OR p.sku LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), (Number(page) - 1) * Number(limit));

        const [products] = await db.query(query, params);
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM products p ${search ? 'WHERE p.name LIKE ? OR p.sku LIKE ?' : ''}`,
            search ? [`%${search}%`, `%${search}%`] : []
        );

        res.json({ products, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create product
router.post('/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, description, short_description, sku, price, compare_price, category_id, brand, stock_quantity, images } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const [result] = await db.query(
            `INSERT INTO products (name, slug, description, short_description, sku, price, compare_price, category_id, brand, stock_quantity)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, productSlug, description, short_description, sku, price, compare_price || null, category_id || null, brand || null, stock_quantity || 0]
        );

        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await db.query(
                    'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
                    [result.insertId, images[i], i === 0 ? 1 : 0, i]
                );
            }
        }

        res.status(201).json({ message: 'Product created', id: result.insertId });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, short_description, sku, price, compare_price, category_id, brand, stock_quantity, is_active, is_featured } = req.body;

        await db.query(
            `UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description),
             short_description = COALESCE(?, short_description), sku = COALESCE(?, sku),
             price = COALESCE(?, price), compare_price = ?, category_id = COALESCE(?, category_id),
             brand = ?, stock_quantity = COALESCE(?, stock_quantity),
             is_active = COALESCE(?, is_active), is_featured = COALESCE(?, is_featured)
             WHERE id = ?`,
            [name, description, short_description, sku, price, compare_price, category_id, brand, stock_quantity, is_active, is_featured, req.params.id]
        );

        res.json({ message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (soft delete)
router.delete('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get all orders (admin)
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let query = `SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o JOIN users u ON o.user_id = u.id`;
        const params = [];

        if (status && status !== 'all') {
            query += ' WHERE o.status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), (Number(page) - 1) * Number(limit));

        const [orders] = await db.query(query, params);
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status
router.put('/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Get all customers
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [customers] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
             COUNT(DISTINCT o.id) as order_count, COALESCE(SUM(o.total_amount), 0) as total_spent
             FROM users u LEFT JOIN orders o ON u.id = o.user_id
             WHERE u.role = 'customer'
             GROUP BY u.id ORDER BY u.created_at DESC`
        );
        res.json({ customers });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Manage categories
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, description, image_url } = req.body;
        const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
            [name, catSlug, description || null, image_url || null]
        );
        res.status(201).json({ message: 'Category created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, image_url, is_active } = req.body;
        await db.query(
            'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), image_url = COALESCE(?, image_url), is_active = COALESCE(?, is_active) WHERE id = ?',
            [name, description, image_url, is_active, req.params.id]
        );
        res.json({ message: 'Category updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update category' });
    }
});

module.exports = router;
