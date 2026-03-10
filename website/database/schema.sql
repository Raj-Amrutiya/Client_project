-- =====================================================
-- E-Commerce Database Schema - MySQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Addresses Table
-- =====================================================
CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_type ENUM('billing', 'shipping') DEFAULT 'shipping',
    full_name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Categories Table
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_id INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Products Table
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    category_id INT,
    brand VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    weight DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_price (price),
    INDEX idx_featured (is_featured),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Product Images Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Product Variants Table (size, color, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Shopping Cart Table
-- =====================================================
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Cart Items Table
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    UNIQUE KEY unique_cart_product (cart_id, product_id, variant_id),
    INDEX idx_cart (cart_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Coupons Table
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount DECIMAL(10, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Orders Table
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    coupon_id INT,
    shipping_address_id INT,
    billing_address_id INT,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_id VARCHAR(255),
    notes TEXT,
    shipped_at DATETIME,
    delivered_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (billing_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Order Items Table
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Reviews Table
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_review (user_id, product_id),
    INDEX idx_product (product_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Wishlist Table
-- =====================================================
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Seed Data - Categories
-- =====================================================
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
('Electronics', 'electronics', 'Smartphones, laptops, gadgets and more', TRUE, 1),
('Fashion', 'fashion', 'Clothing, shoes, accessories', TRUE, 2),
('Home & Living', 'home-living', 'Furniture, decor, kitchen essentials', TRUE, 3),
('Books', 'books', 'Fiction, non-fiction, academic', TRUE, 4),
('Sports & Fitness', 'sports-fitness', 'Equipment, apparel, supplements', TRUE, 5),
('Beauty & Health', 'beauty-health', 'Skincare, makeup, wellness', TRUE, 6);

-- =====================================================
-- Seed Data - Products
-- =====================================================
INSERT INTO products (name, slug, description, short_description, sku, price, compare_price, category_id, brand, stock_quantity, is_active, is_featured, rating_avg, rating_count) VALUES
('Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life. Deep bass, crystal clear audio, comfortable over-ear design.', 'Premium noise-cancelling wireless headphones', 'ELEC-001', 2499.00, 3999.00, 1, 'SoundMax', 150, TRUE, TRUE, 4.50, 234),
('Smart Watch Pro', 'smart-watch-pro', 'Advanced fitness tracker with heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water resistant up to 50m.', 'Advanced fitness smartwatch with GPS', 'ELEC-002', 4999.00, 7499.00, 1, 'TechFit', 85, TRUE, TRUE, 4.30, 189),
('4K Ultra HD Webcam', 'ultra-hd-webcam', 'Professional 4K webcam with auto-focus, noise-cancelling mic, and adjustable ring light. Perfect for streaming and video calls.', 'Professional 4K webcam for streaming', 'ELEC-003', 3299.00, 4599.00, 1, 'VisionTech', 200, TRUE, FALSE, 4.70, 145),
('Laptop Stand Aluminum', 'laptop-stand-aluminum', 'Ergonomic aluminum laptop stand with adjustable height. Compatible with all laptops up to 17 inches. Improves airflow and posture.', 'Ergonomic aluminum laptop stand', 'ELEC-004', 1299.00, 1999.00, 1, 'DeskPro', 300, TRUE, FALSE, 4.20, 98),
('Men Casual Slim Fit Shirt', 'men-casual-slim-fit-shirt', 'Premium cotton casual shirt with slim fit design. Available in multiple colors. Breathable fabric, perfect for everyday wear.', 'Premium cotton casual slim fit shirt', 'FASH-001', 899.00, 1499.00, 2, 'StyleCraft', 500, TRUE, TRUE, 4.10, 312),
('Women Running Shoes', 'women-running-shoes', 'Lightweight running shoes with responsive cushioning. Breathable mesh upper, rubber outsole for superior traction.', 'Lightweight running shoes for women', 'FASH-002', 2199.00, 3499.00, 2, 'RunFlex', 180, TRUE, TRUE, 4.60, 267),
('Leather Crossbody Bag', 'leather-crossbody-bag', 'Genuine leather crossbody bag with adjustable strap. Multiple compartments, vintage design, perfect for daily use.', 'Genuine leather crossbody bag', 'FASH-003', 1599.00, 2499.00, 2, 'LeatherCo', 120, TRUE, FALSE, 4.40, 156),
('Modern Coffee Table', 'modern-coffee-table', 'Minimalist modern coffee table with tempered glass top and solid wood legs. Dimensions: 120x60x45cm.', 'Minimalist coffee table with glass top', 'HOME-001', 5999.00, 8999.00, 3, 'HomeStyle', 40, TRUE, TRUE, 4.50, 78),
('Ceramic Plant Pots Set', 'ceramic-plant-pots-set', 'Set of 3 decorative ceramic plant pots with drainage holes. Hand-painted designs, suitable for indoor plants.', 'Set of 3 decorative ceramic plant pots', 'HOME-002', 799.00, 1299.00, 3, 'GreenLife', 250, TRUE, FALSE, 4.30, 134),
('JavaScript: The Good Parts', 'javascript-good-parts', 'Classic programming book by Douglas Crockford. Learn the best features of JavaScript and how to use them effectively.', 'Classic JS programming book', 'BOOK-001', 399.00, 599.00, 4, 'OReilly', 500, TRUE, FALSE, 4.80, 456),
('Yoga Mat Premium', 'yoga-mat-premium', 'Extra thick 6mm yoga mat with non-slip surface. Eco-friendly TPE material, includes carrying strap. 183x61cm.', 'Premium eco-friendly yoga mat', 'SPRT-001', 999.00, 1499.00, 5, 'FitLife', 350, TRUE, TRUE, 4.40, 198),
('Vitamin C Serum', 'vitamin-c-serum', 'Advanced 20% Vitamin C serum with hyaluronic acid. Brightens skin, reduces dark spots, anti-aging formula. 30ml.', 'Advanced vitamin C face serum', 'BEAU-001', 699.00, 1199.00, 6, 'GlowUp', 400, TRUE, TRUE, 4.60, 278);

-- =====================================================
-- Seed Data - Product Images
-- =====================================================
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'Wireless Headphones', TRUE, 1),
(2, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'Smart Watch', TRUE, 1),
(3, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600', 'Webcam', TRUE, 1),
(4, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', 'Laptop Stand', TRUE, 1),
(5, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', 'Casual Shirt', TRUE, 1),
(6, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'Running Shoes', TRUE, 1),
(7, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', 'Leather Bag', TRUE, 1),
(8, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', 'Coffee Table', TRUE, 1),
(9, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600', 'Plant Pots', TRUE, 1),
(10, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', 'JavaScript Book', TRUE, 1),
(11, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', 'Yoga Mat', TRUE, 1),
(12, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', 'Vitamin C Serum', TRUE, 1);

-- =====================================================
-- Seed Data - Admin User (password: Admin@123)
-- =====================================================
INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
('Admin', 'User', 'admin@ecommerce.com', '$2b$10$placeholder_hash_replace_on_first_run', 'admin');

-- =====================================================
-- Seed Data - Coupons
-- =====================================================
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, start_date, end_date) VALUES
('WELCOME10', 'Welcome discount - 10% off', 'percentage', 10.00, 500.00, 500.00, 1000, '2026-01-01', '2026-12-31'),
('FLAT200', 'Flat ₹200 off on orders above ₹1500', 'fixed', 200.00, 1500.00, NULL, 500, '2026-01-01', '2026-12-31'),
('SUMMER25', 'Summer sale - 25% off', 'percentage', 25.00, 1000.00, 1000.00, 200, '2026-03-01', '2026-06-30');
