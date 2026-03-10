// ============ Wishlist Page ============
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html?redirect=wishlist.html';
        return;
    }
    loadWishlist();
});

async function loadWishlist() {
    const container = document.querySelector('.wishlist-grid');
    const emptyState = document.querySelector('.wishlist-empty');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/wishlist`);
        if (!res) return;
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            if (emptyState) emptyState.style.display = 'none';
            container.innerHTML = data.items.map(item => `
                <div class="wishlist-item" data-id="${item.product_id}">
                    <div class="wishlist-image">
                        <a href="product-detail.html?id=${item.product_id}">
                            <img src="${item.image_url || 'images/placeholder.jpg'}" alt="${item.name}">
                        </a>
                        <button class="wishlist-remove" onclick="removeFromWishlist(${item.product_id})" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="wishlist-info">
                        <p class="wishlist-category">${item.category_name || ''}</p>
                        <h3><a href="product-detail.html?id=${item.product_id}">${item.name}</a></h3>
                        <div class="product-rating">${generateStars(item.rating_avg || 0)}</div>
                        <div class="product-price">
                            <span class="current-price">${formatPrice(item.price)}</span>
                            ${item.compare_price ? `<span class="original-price">${formatPrice(item.compare_price)}</span>` : ''}
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="moveToCart(${item.product_id}, '${item.name}', ${item.price}, ${item.compare_price || 'null'}, '${item.image_url || ''}')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        }
    } catch {
        container.innerHTML = '<p class="text-center">Failed to load wishlist.</p>';
    }
}

async function removeFromWishlist(productId) {
    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/wishlist/remove/${productId}`, { method: 'DELETE' });
        if (res && res.ok) {
            showToast('Removed from wishlist', 'info');
            loadWishlist();
        }
    } catch {
        showToast('Failed to remove item', 'error');
    }
}

async function moveToCart(id, name, price, comparePrice, imageUrl) {
    const added = await CartManager.addItem({ id, name, price, compare_price: comparePrice, image_url: imageUrl }, 1);
    if (added) {
        await removeFromWishlist(id);
    }
}
