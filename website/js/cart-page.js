// ============ Cart Page ============
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartContainer = document.querySelector('.cart-items');
    const summaryEl = document.querySelector('.cart-summary');
    const emptyCart = document.querySelector('.empty-cart');

    if (!cartContainer) return;

    const items = CartManager.getLocal();

    if (items.length === 0) {
        cartContainer.style.display = 'none';
        if (summaryEl) summaryEl.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        return;
    }

    cartContainer.style.display = 'block';
    if (summaryEl) summaryEl.style.display = 'block';
    if (emptyCart) emptyCart.style.display = 'none';

    cartContainer.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.product_id || item.id}">
            <div class="cart-item-image">
                <img src="${item.image_url || 'images/placeholder.jpg'}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <h3><a href="product-detail.html?id=${item.product_id || item.id}">${item.name}</a></h3>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                ${item.compare_price ? `<p class="cart-item-original">${formatPrice(item.compare_price)}</p>` : ''}
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateCartQty(${item.product_id || item.id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.product_id || item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">
                ${formatPrice(item.price * item.quantity)}
            </div>
            <button class="cart-item-remove" onclick="removeCartItem(${item.product_id || item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    updateCartSummary(items);
}

function updateCartSummary(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= Config.FREE_SHIPPING_THRESHOLD ? 0 : Config.SHIPPING_COST;
    const tax = Math.round(subtotal * Config.TAX_RATE * 100) / 100;
    const discount = window._appliedDiscount || 0;
    const total = subtotal - discount + shipping + tax;

    const subtotalEl = document.querySelector('.summary-subtotal');
    const shippingEl = document.querySelector('.summary-shipping');
    const taxEl = document.querySelector('.summary-tax');
    const discountEl = document.querySelector('.summary-discount');
    const totalEl = document.querySelector('.summary-total');
    const discountRow = document.querySelector('.discount-row');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
    if (taxEl) taxEl.textContent = formatPrice(tax);
    if (totalEl) totalEl.textContent = formatPrice(total);

    if (discountRow && discountEl) {
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountEl.textContent = `-${formatPrice(discount)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }

    // Free shipping progress
    const progressBar = document.querySelector('.shipping-progress-fill');
    const progressText = document.querySelector('.shipping-progress-text');
    if (progressBar) {
        const pct = Math.min((subtotal / Config.FREE_SHIPPING_THRESHOLD) * 100, 100);
        progressBar.style.width = pct + '%';
    }
    if (progressText) {
        if (subtotal >= Config.FREE_SHIPPING_THRESHOLD) {
            progressText.textContent = 'You qualify for free shipping!';
        } else {
            progressText.textContent = `Add ${formatPrice(Config.FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping`;
        }
    }
}

async function updateCartQty(itemId, newQty) {
    if (newQty < 1) {
        removeCartItem(itemId);
        return;
    }
    await CartManager.updateQuantity(itemId, newQty);
    renderCart();
}

async function removeCartItem(itemId) {
    await CartManager.removeItem(itemId);
    renderCart();
    showToast('Item removed from cart', 'info');
}

// Coupon
(function () {
    const couponForm = document.querySelector('.coupon-form');
    if (!couponForm) return;

    couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = couponForm.querySelector('input');
        const code = input?.value.trim();
        if (!code) return;

        try {
            const subtotal = CartManager.getTotal();
            const res = await fetch(`${Config.API_BASE}/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, subtotal })
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                window._appliedDiscount = data.discount;
                window._appliedCoupon = code;
                showToast(`Coupon applied! You save ${formatPrice(data.discount)}`, 'success');
                renderCart();
            } else {
                showToast(data.error || 'Invalid coupon', 'error');
            }
        } catch {
            showToast('Failed to apply coupon', 'error');
        }
    });
})();
