// ============ Product Detail Page ============
document.addEventListener('DOMContentLoaded', () => {
    loadProductDetail();
});

async function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    const container = document.getElementById('productDetail');
    if (!container) return;

    try {
        const res = await fetch(`${Config.API_BASE}/products/${productId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const product = data.product;

        document.title = `${product.name} - ShopVerse`;

        // Update breadcrumb
        const breadcrumbEl = document.getElementById('breadcrumbProduct');
        if (breadcrumbEl) {
            breadcrumbEl.textContent = product.name;
        }

        // Build full product detail HTML
        const mainImage = (product.images && product.images.length > 0) ? product.images[0].image_url : 'https://via.placeholder.com/600x600?text=No+Image';
        const discount = product.compare_price
            ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
            : 0;

        container.innerHTML = `
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${mainImage}" alt="${product.name}" id="mainImage">
                </div>
                ${product.images && product.images.length > 1 ? `
                <div class="thumbnail-list">
                    ${product.images.map((img, i) => `
                        <div class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeImage('${img.image_url}', this)">
                            <img src="${img.image_url}" alt="${product.name}">
                        </div>
                    `).join('')}
                </div>` : ''}
            </div>
            <div class="product-info-detail">
                <h1 class="product-title">${product.name}</h1>
                ${product.brand ? `<p class="product-brand">by <strong>${product.brand}</strong></p>` : ''}
                <div class="product-rating">
                    ${generateStars(product.rating_avg || 0)}
                    <span class="rating-text">${product.rating_avg || 0} (${product.rating_count || 0} reviews)</span>
                </div>
                <div class="product-price-detail">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.compare_price ? `<span class="original-price">${formatPrice(product.compare_price)}</span><span class="discount-badge">${discount}% OFF</span>` : ''}
                </div>
                <p class="product-description">${product.description || product.short_description || ''}</p>
                <div class="stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}">
                    <i class="fas ${product.stock_quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : 'Out of Stock'}
                </div>
                <div class="quantity-selector">
                    <label>Quantity:</label>
                    <div class="qty-controls">
                        <button onclick="changeQty(-1)">-</button>
                        <input type="number" id="productQty" value="1" min="1" max="${product.stock_quantity}" readonly>
                        <button onclick="changeQty(1)">+</button>
                    </div>
                </div>
                <div class="product-buttons">
                    <button class="btn btn-primary btn-lg add-to-cart-btn" onclick="addProductToCart()" ${product.stock_quantity <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="btn btn-secondary btn-lg buy-now-btn" onclick="buyNow()" ${product.stock_quantity <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-bolt"></i> Buy Now
                    </button>
                    <button class="btn btn-outline btn-lg" onclick="toggleWishlist(${product.id})">
                        <i class="far fa-heart"></i> Wishlist
                    </button>
                </div>
                <div class="product-meta">
                    ${product.sku ? `<p><strong>SKU:</strong> ${product.sku}</p>` : ''}
                    ${product.category_name ? `<p><strong>Category:</strong> <a href="products.html?category=${product.category_slug}">${product.category_name}</a></p>` : ''}
                </div>
                <div class="product-features">
                    <div class="feature"><i class="fas fa-truck"></i> Free Delivery on orders over ₹999</div>
                    <div class="feature"><i class="fas fa-undo"></i> 30-Day Easy Returns</div>
                    <div class="feature"><i class="fas fa-shield-alt"></i> 1 Year Warranty</div>
                    <div class="feature"><i class="fas fa-lock"></i> Secure Payment</div>
                </div>
            </div>
        `;

        // Store product data globally for cart
        window._currentProduct = product;

        // Load reviews section
        loadReviews(product.id);

        // Load related products
        loadRelatedProducts(product.category_slug, product.id);

    } catch {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Product not found</h3>
                <a href="products.html" class="btn btn-primary">Browse Products</a>
            </div>
        `;
    }
}

function changeImage(src, thumbnail) {
    const mainImg = document.getElementById('mainImage');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    if (thumbnail) thumbnail.classList.add('active');
}

function changeQty(delta) {
    const input = document.getElementById('productQty');
    if (!input) return;
    const newVal = parseInt(input.value) + delta;
    const max = parseInt(input.max) || 999;
    if (newVal >= 1 && newVal <= max) input.value = newVal;
}

async function addProductToCart() {
    const product = window._currentProduct;
    if (!product) return;

    const qty = parseInt(document.getElementById('productQty')?.value || 1);
    const variantSelect = document.getElementById('variantSelect');
    const variantId = variantSelect ? variantSelect.value : null;

    await CartManager.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        compare_price: product.compare_price,
        image_url: product.images?.[0]?.image_url || '',
        slug: product.slug
    }, qty, variantId);
}

async function buyNow() {
    const product = window._currentProduct;
    if (!product) return;

    const qty = parseInt(document.getElementById('productQty')?.value || 1);
    const added = await CartManager.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        compare_price: product.compare_price,
        image_url: product.images?.[0]?.image_url || '',
        slug: product.slug
    }, qty, null);

    if (added) {
        window.location.href = 'checkout.html';
    }
}

async function loadReviews(productId) {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    try {
        const res = await fetch(`${Config.API_BASE}/reviews/product/${productId}`);
        const data = await res.json();

        if (data.reviews && data.reviews.length > 0) {
            container.innerHTML = `
                <h2>Customer Reviews</h2>
                <div class="reviews-summary">
                    <div class="rating-distribution">
                        ${[5, 4, 3, 2, 1].map(star => {
                            const count = data.distribution?.find(d => d.rating === star)?.count || 0;
                            const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                            return `<div class="rating-bar"><span>${star} <i class="fas fa-star"></i></span><div class="bar"><div class="fill" style="width:${pct}%"></div></div><span>${count}</span></div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="reviews-list">
                    ${data.reviews.map(r => `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-rating">${generateStars(r.rating)}</div>
                                <strong>${r.first_name} ${r.last_name?.[0] || ''}.</strong>
                                ${r.is_verified_purchase ? '<span class="verified"><i class="fas fa-check"></i> Verified</span>' : ''}
                                <span class="review-date">${new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            ${r.title ? `<h4>${r.title}</h4>` : ''}
                            ${r.comment ? `<p>${r.comment}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<h2>Customer Reviews</h2><p>No reviews yet. Be the first to review!</p>';
        }
    } catch { /* ignore */ }
}

async function loadRelatedProducts(categorySlug, excludeId) {
    const grid = document.getElementById('relatedProducts');
    if (!grid || !categorySlug) return;

    try {
        const res = await fetch(`${Config.API_BASE}/products?category=${categorySlug}&limit=4`);
        const data = await res.json();
        const filtered = data.products?.filter(p => p.id !== parseInt(excludeId)) || [];

        if (filtered.length > 0) {
            grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
        }
    } catch { /* ignore */ }
}
