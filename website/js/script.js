// ============ Dynamic Footer ============
function renderFooter() {
    const el = document.getElementById('footer');
    if (!el) return;
    const year = new Date().getFullYear();
    el.innerHTML = `
    <footer class="main-footer">
        <div class="container">
            <div class="footer-top">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <span class="logo-icon"><i class="fas fa-shopping-bag"></i></span>
                        <span class="logo-text">Shop<span class="logo-accent">Verse</span></span>
                    </div>
                    <p>Premium products. Fast delivery. Trusted support.</p>
                    <div class="social-links">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-links">
                    <div class="footer-col">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="products.html">All Products</a></li>
                            <li><a href="products.html?featured=true">Featured</a></li>
                            <li><a href="products.html?category=electronics">Electronics</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Help</h4>
                        <ul>
                            <li><a href="contact.html">Contact Us</a></li>
                            <li><a href="about.html">About Us</a></li>
                            <li><a href="#">Return Policy</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Account</h4>
                        <ul>
                            <li><a href="profile.html">My Profile</a></li>
                            <li><a href="orders.html">Orders</a></li>
                            <li><a href="cart.html">Cart</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Contact</h4>
                        <ul class="contact-info">
                            <li><i class="fas fa-phone"></i> +91 98765 43210</li>
                            <li><i class="fas fa-envelope"></i> support@shopverse.com</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${year} ShopVerse. All rights reserved.</p>
                <div class="payment-methods">
                    <i class="fab fa-cc-visa" title="Visa"></i>
                    <i class="fab fa-cc-mastercard" title="Mastercard"></i>
                    <i class="fab fa-cc-paypal" title="PayPal"></i>
                    <i class="fab fa-cc-amex" title="Amex"></i>
                    <i class="fab fa-google-pay" title="Google Pay"></i>
                </div>
            </div>
        </div>
    </footer>`;  
}
document.addEventListener('DOMContentLoaded', renderFooter);

// ============ Toast Notification ============
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============ Header Scroll Effect ============
(function () {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        header.classList.toggle('scrolled', currentScroll > 50);

        if (currentScroll > 300) {
            header.classList.toggle('header-hidden', currentScroll > lastScroll);
        } else {
            header.classList.remove('header-hidden');
        }
        lastScroll = currentScroll;
    });
})();

// ============ Mobile Navigation ============
(function () {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    const overlay = document.querySelector('.nav-overlay');

    if (!hamburger || !mainNav) return;

    function toggleNav() {
        hamburger.classList.toggle('active');
        mainNav.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
    }

    hamburger.addEventListener('click', toggleNav);
    if (overlay) overlay.addEventListener('click', toggleNav);

    // Close nav on link click (mobile)
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) toggleNav();
        });
    });
})();

// ============ Search Overlay ============
(function () {
    const searchBtn = document.querySelector('.search-btn');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchClose = document.querySelector('.search-close');
    const searchInput = document.querySelector('.search-overlay input');
    const searchResults = document.querySelector('.search-suggestions');

    if (!searchBtn || !searchOverlay) return;

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchOverlay.classList.add('active');
        if (searchInput) searchInput.focus();
    });

    if (searchClose) {
        searchClose.addEventListener('click', () => searchOverlay.classList.remove('active'));
    }

    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) searchOverlay.classList.remove('active');
    });

    // Live search
    let searchTimeout;
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            searchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${Config.API_BASE}/products?search=${encodeURIComponent(query)}&limit=5`);
                    const data = await res.json();
                    if (data.products && data.products.length > 0) {
                        searchResults.innerHTML = data.products.map(p => `
                            <a href="product-detail.html?id=${p.id}" class="search-suggestion-item">
                                <img src="${p.image_url || 'images/placeholder.jpg'}" alt="${p.name}">
                                <div>
                                    <strong>${p.name}</strong>
                                    <span>${Config.CURRENCY}${p.price.toLocaleString()}</span>
                                </div>
                            </a>
                        `).join('');
                    } else {
                        searchResults.innerHTML = '<p class="no-results">No products found</p>';
                    }
                } catch {
                    searchResults.innerHTML = '';
                }
            }, 300);
        });

        // Search form submit
        const searchForm = searchOverlay.querySelector('form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) window.location.href = `products.html?search=${encodeURIComponent(query)}`;
            });
        }
    }
})();

// ============ Back to Top ============
(function () {
    const backToTop = document.querySelector('.back-to-top');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.pageYOffset > 500);
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ============ User Dropdown ============
(function () {
    const userBtn = document.querySelector('.user-btn');
    const userDropdown = document.querySelector('.user-dropdown');
    if (!userBtn || !userDropdown) return;

    userBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => userDropdown.classList.remove('active'));

    // Logout handler
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
})();

// ============ Utility Functions ============
function formatPrice(price) {
    return `${Config.CURRENCY}${Number(price).toLocaleString('en-IN')}`;
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function createProductCard(product) {
    const discount = product.compare_price
        ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
        : 0;

    return `
        <div class="product-card" data-id="${product.id}">
            ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
            ${product.is_featured ? '<span class="badge badge-featured">Featured</span>' : ''}
            <div class="product-image">
                <a href="product-detail.html?id=${product.id}">
                    <img src="${product.image_url || 'images/placeholder.jpg'}" alt="${product.name}" loading="lazy">
                </a>
                <div class="product-actions">
                    <button class="btn-action wishlist-btn" onclick="toggleWishlist(${product.id})" title="Add to Wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="btn-action" onclick="quickAddToCart(${product.id}, '${product.name}', ${product.price}, ${product.compare_price || 'null'}, '${product.image_url || ''}', '${product.slug || ''}')" title="Add to Cart">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <p class="product-category">${product.category_name || ''}</p>
                <h3 class="product-name"><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                <div class="product-rating">
                    ${generateStars(product.rating_avg || 0)}
                    <span>(${product.rating_count || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.compare_price ? `<span class="original-price">${formatPrice(product.compare_price)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) stars += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

async function quickAddToCart(id, name, price, comparePrice, imageUrl, slug) {
    await CartManager.addItem({ id, name, price, compare_price: comparePrice, image_url: imageUrl, slug }, 1);
}

async function toggleWishlist(productId) {
    if (!Auth.isLoggedIn()) {
        showToast('Please login to add to wishlist', 'warning');
        return;
    }
    try {
        const checkRes = await Auth.fetchWithAuth(`${Config.API_BASE}/wishlist/check/${productId}`);
        if (!checkRes) return;
        const checkData = await checkRes.json();

        if (checkData.inWishlist) {
            await Auth.fetchWithAuth(`${Config.API_BASE}/wishlist/remove/${productId}`, { method: 'DELETE' });
            showToast('Removed from wishlist', 'info');
        } else {
            await Auth.fetchWithAuth(`${Config.API_BASE}/wishlist/add`, {
                method: 'POST',
                body: JSON.stringify({ product_id: productId })
            });
            showToast('Added to wishlist!', 'success');
        }
    } catch {
        showToast('Failed to update wishlist', 'error');
    }
}

// ============ Newsletter ============
(function () {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        if (email) {
            showToast('Thank you for subscribing!', 'success');
            form.reset();
        }
    });
})();