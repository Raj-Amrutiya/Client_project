const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT * FROM orders WHERE user_id = ?`;
        const params = [req.user.id];

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';
        const [orders] = await db.query(query, params);

        // Get items for each order
        for (let order of orders) {
            const [items] = await db.query(
                `SELECT oi.*,
                 (SELECT image_url FROM product_images pi WHERE pi.product_id = oi.product_id AND pi.is_primary = 1 LIMIT 1) as image_url
                 FROM order_items oi WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        res.json({ orders });
    } catch (err) {
        console.error('Orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:orderNumber', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE order_number = ? AND user_id = ?',
            [req.params.orderNumber, req.user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        const [items] = await db.query(
            `SELECT oi.*,
             (SELECT image_url FROM product_images pi WHERE pi.product_id = oi.product_id AND pi.is_primary = 1 LIMIT 1) as image_url
             FROM order_items oi WHERE oi.order_id = ?`,
            [order.id]
        );
        order.items = items;

        // Get address
        if (order.shipping_address_id) {
            const [addresses] = await db.query('SELECT * FROM addresses WHERE id = ?', [order.shipping_address_id]);
            if (addresses.length > 0) order.shipping_address = addresses[0];
        }

        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Place order
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { shipping_address, payment_method, coupon_code } = req.body;

        // Get cart items
        const [carts] = await connection.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
        if (carts.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const [cartItems] = await connection.query(
            `SELECT ci.*, p.name, p.price, p.stock_quantity
             FROM cart_items ci JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = ?`,
            [carts[0].id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Verify stock
        for (const item of cartItems) {
            if (item.stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
            }
        }

        // Calculate subtotal
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping_cost = subtotal >= 999 ? 0 : 99;
        let discount_amount = 0;
        let coupon_id = null;

        // Apply coupon if provided
        if (coupon_code) {
            const [coupons] = await connection.query(
                `SELECT * FROM coupons WHERE code = ? AND is_active = 1
                 AND (start_date IS NULL OR start_date <= NOW())
                 AND (end_date IS NULL OR end_date >= NOW())
                 AND (usage_limit IS NULL OR used_count < usage_limit)`,
                [coupon_code]
            );

            if (coupons.length > 0) {
                const coupon = coupons[0];
                if (subtotal >= coupon.min_order_amount) {
                    if (coupon.discount_type === 'percentage') {
                        discount_amount = (subtotal * coupon.discount_value) / 100;
                        if (coupon.max_discount) {
                            discount_amount = Math.min(discount_amount, coupon.max_discount);
                        }
                    } else {
                        discount_amount = coupon.discount_value;
                    }
                    coupon_id = coupon.id;
                    await connection.query(
                        'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                        [coupon.id]
                    );
                }
            }
        }

        const tax_amount = Math.round((subtotal - discount_amount) * 0.18 * 100) / 100;
        const total_amount = subtotal - discount_amount + shipping_cost + tax_amount;
        const order_number = 'ORD-' + uuidv4().substring(0, 8).toUpperCase();

        // Save shipping address
        let addressId = null;
        if (shipping_address) {
            const [addrResult] = await connection.query(
                `INSERT INTO addresses (user_id, address_type, full_name, address_line1, address_line2, city, state, postal_code, country, phone)
                 VALUES (?, 'shipping', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.user.id, shipping_address.full_name,
                    shipping_address.address_line1, shipping_address.address_line2 || null,
                    shipping_address.city, shipping_address.state,
                    shipping_address.postal_code, shipping_address.country || 'India',
                    shipping_address.phone
                ]
            );
            addressId = addrResult.insertId;
        }

        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, order_number, subtotal, discount_amount, shipping_cost, tax_amount, total_amount, coupon_id, shipping_address_id, payment_method, payment_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, order_number, subtotal, discount_amount,
                shipping_cost, tax_amount, total_amount,
                coupon_id, addressId,
                payment_method || 'cod',
                payment_method === 'cod' ? 'pending' : 'paid',
                'confirmed'
            ]
        );

        const orderId = orderResult.insertId;

        // Create order items and update stock
        for (const item of cartItems) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_price, quantity, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.variant_id, item.name, item.price, item.quantity, item.price * item.quantity]
            );

            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Clear cart
        await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);

        await connection.commit();

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                order_number,
                total_amount,
                status: 'confirmed'
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Order error:', err);
        res.status(500).json({ error: 'Failed to place order' });
    } finally {
        connection.release();
    }
});

// Cancel order
router.put('/:orderNumber/cancel', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query(
            "SELECT * FROM orders WHERE order_number = ? AND user_id = ? AND status IN ('pending', 'confirmed')",
            [req.params.orderNumber, req.user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
        }

        await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orders[0].id]);

        // Restore stock
        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orders[0].id]);
        for (const item of items) {
            await db.query(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        res.json({ message: 'Order cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

module.exports = router;
