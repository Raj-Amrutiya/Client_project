const express = require('express');
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware');

const router = express.Router();

// Get cart
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);

        if (carts.length === 0) {
            return res.json({ items: [], total: 0 });
        }

        const [items] = await db.query(
            `SELECT ci.*, p.name, p.price, p.compare_price, p.slug, p.stock_quantity,
             (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image_url,
             c.name as category_name
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             LEFT JOIN categories cat ON p.category_id = cat.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE ci.cart_id = ?`,
            [carts[0].id]
        );

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        res.json({ items, total });
    } catch (err) {
        console.error('Cart error:', err);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to cart
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity = 1, variant_id = null } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID required' });
        }

        // Check product exists and has stock
        const [products] = await db.query(
            'SELECT id, stock_quantity, price, name FROM products WHERE id = ? AND is_active = 1',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (products[0].stock_quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Get or create cart
        let [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);

        let cartId;
        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].id;
        }

        // Check if item already in cart
        const [existing] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
            [cartId, product_id, variant_id, variant_id]
        );

        if (existing.length > 0) {
            const newQty = existing[0].quantity + quantity;
            await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
        } else {
            await db.query(
                'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
                [cartId, product_id, variant_id, quantity]
            );
        }

        res.json({ message: 'Item added to cart' });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
router.put('/update/:itemId', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Verify ownership
        const [items] = await db.query(
            `SELECT ci.id, p.stock_quantity FROM cart_items ci
             JOIN cart c ON ci.cart_id = c.id
             JOIN products p ON ci.product_id = p.id
             WHERE ci.id = ? AND c.user_id = ?`,
            [itemId, req.user.id]
        );

        if (items.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        if (items[0].stock_quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove cart item
router.delete('/remove/:itemId', authenticateToken, async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT ci.id FROM cart_items ci
             JOIN cart c ON ci.cart_id = c.id
             WHERE ci.id = ? AND c.user_id = ?`,
            [req.params.itemId, req.user.id]
        );

        if (items.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        await db.query('DELETE FROM cart_items WHERE id = ?', [req.params.itemId]);
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Clear cart
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
        if (carts.length > 0) {
            await db.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
        }
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

module.exports = router;
