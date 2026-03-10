const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware');

const router = express.Router();

// Validate coupon
router.post('/validate', optionalAuth, async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) return res.status(400).json({ error: 'Coupon code required' });

        const [coupons] = await db.query(
            `SELECT * FROM coupons WHERE code = ? AND is_active = 1
             AND (start_date IS NULL OR start_date <= NOW())
             AND (end_date IS NULL OR end_date >= NOW())
             AND (usage_limit IS NULL OR used_count < usage_limit)`,
            [code]
        );

        if (coupons.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired coupon' });
        }

        const coupon = coupons[0];

        if (subtotal && subtotal < coupon.min_order_amount) {
            return res.status(400).json({
                error: `Minimum order amount is ₹${coupon.min_order_amount}`
            });
        }

        let discount = 0;
        if (subtotal) {
            if (coupon.discount_type === 'percentage') {
                discount = (subtotal * coupon.discount_value) / 100;
                if (coupon.max_discount) {
                    discount = Math.min(discount, coupon.max_discount);
                }
            } else {
                discount = coupon.discount_value;
            }
        }

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                max_discount: coupon.max_discount,
                min_order_amount: coupon.min_order_amount
            },
            discount: Math.round(discount * 100) / 100
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

module.exports = router;
