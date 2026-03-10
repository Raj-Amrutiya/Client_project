# ShopVerse - Full-Stack E-Commerce Website

A complete e-commerce platform built with Node.js, Express, MySQL, and advanced HTML/CSS/JavaScript.

## Features

- **Product Catalog** — Browse, search, filter, and sort products with categories and brands
- **User Authentication** — Register, login, JWT-based auth, password change
- **Shopping Cart** — Add/remove items, quantity updates, guest cart with localStorage
- **Checkout** — Multi-step checkout with shipping address, payment selection, and order review
- **Order Management** — View orders, order details, cancel orders
- **Wishlist** — Save products for later
- **Product Reviews** — Rate and review purchased products
- **Coupon System** — Discount codes with percentage/flat discounts
- **Admin Dashboard** — Manage products, orders, customers, categories
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend:** HTML5, CSS3 (Custom Properties, Grid, Flexbox), Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Auth:** JWT + bcrypt
- **Icons:** Font Awesome 6.5
- **Font:** Google Inter

## Setup Instructions

### Prerequisites

- Node.js 16+
- MySQL 8.0+

### 1. Clone & Install

```bash
cd website
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shopverse_db
JWT_SECRET=your_secret_key_here
PORT=3000
```

### 3. Setup Database

```bash
npm run db:setup
```

This creates the database, tables, and seed data (sample products, categories, and admin account).

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Visit **http://localhost:3000** in your browser.

### Default Admin Account

- **Email:** admin@shopverse.com
- **Password:** Admin@123

## Project Structure

```
website/
├── database/
│   └── schema.sql          # MySQL schema + seed data
├── server/
│   ├── server.js            # Express app entry point
│   ├── db.js                # MySQL connection pool
│   ├── middleware.js         # Auth middleware
│   ├── db-setup.js          # Database setup script
│   └── routes/
│       ├── auth.js          # Authentication API
│       ├── products.js      # Products API
│       ├── cart.js           # Cart API
│       ├── orders.js        # Orders API
│       ├── users.js         # User profile & addresses
│       ├── admin.js         # Admin API
│       ├── coupons.js       # Coupon API
│       ├── reviews.js       # Reviews API
│       └── wishlist.js      # Wishlist API
├── css/
│   ├── style.css            # Main styles
│   ├── navbar.css           # Navigation styles
│   ├── responsive.css       # Media queries
│   └── admin.css            # Admin dashboard styles
├── js/
│   ├── config.js            # API configuration
│   ├── auth.js              # Auth manager
│   ├── cart.js              # Cart manager
│   ├── script.js            # Common utilities
│   ├── home.js              # Homepage logic
│   ├── products.js          # Product listing
│   ├── product-detail.js    # Product detail page
│   ├── cart-page.js         # Cart page
│   ├── checkout.js          # Checkout flow
│   ├── validation.js        # Form validation
│   ├── login.js             # Login page
│   ├── register.js          # Registration page
│   ├── profile.js           # Profile page
│   ├── orders.js            # Orders page
│   ├── wishlist.js          # Wishlist page
│   └── admin.js             # Admin dashboard
├── index.html               # Homepage
├── products.html            # Product listing
├── product-detail.html      # Product detail
├── cart.html                # Shopping cart
├── checkout.html            # Checkout
├── login.html               # Login
├── register.html            # Registration
├── profile.html             # User profile
├── orders.html              # Order history
├── wishlist.html            # Wishlist
├── admin.html               # Admin dashboard
├── package.json
└── .env.example
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/products | List products (filter, sort, paginate) |
| GET | /api/products/:id | Product detail |
| GET | /api/products/meta/categories | Get categories |
| GET | /api/cart | Get user cart |
| POST | /api/cart/add | Add to cart |
| POST | /api/orders | Place order |
| GET | /api/orders | Get user orders |
| POST | /api/coupons/validate | Validate coupon |
| GET | /api/wishlist | Get wishlist |
| POST | /api/reviews | Add review |
| GET | /api/admin/stats | Admin dashboard |

## Git Commit & Branch Policy

- Perform commits only on your own branch. Do not commit to anyone else's branch.
- If you need to check out another branch, do so only for review or reference—do not make changes in branches owned by others.
- Always ensure you are working in your own branch before making any changes or commits.

## Folders
- `js/`: JavaScript files
- `images/`: Image assets
- `assets/fonts/`: Fonts
- `assets/icons/`: Icons

## Pages
- `index.html`: Home page
- `about.html`: About page
- `contact.html`: Contact page
