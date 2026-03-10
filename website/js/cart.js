// Cart Manager - handles both localStorage and API sync
const CartManager = {
    CART_KEY: 'shopverse_cart',

    getLocal() {
        const cart = localStorage.getItem(this.CART_KEY);
        return cart ? JSON.parse(cart) : [];
    },

    saveLocal(items) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(items));
        this.updateBadge();
    },

    clearLocal() {
        localStorage.removeItem(this.CART_KEY);
        this.updateBadge();
    },

    updateBadge() {
        const items = this.getLocal();
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    async addItem(product, quantity = 1, variantId = null) {
        if (Auth.isLoggedIn()) {
            try {
                const res = await Auth.fetchWithAuth(`${Config.API_BASE}/cart/add`, {
                    method: 'POST',
                    body: JSON.stringify({ product_id: product.id, quantity, variant_id: variantId })
                });
                if (res && res.ok) {
                    await this.syncFromServer();
                    showToast('Added to cart!', 'success');
                    return true;
                }
                const data = await res.json();
                showToast(data.error || 'Failed to add to cart', 'error');
                return false;
            } catch {
                showToast('Failed to add to cart', 'error');
                return false;
            }
        } else {
            // Guest cart - localStorage only
            const items = this.getLocal();
            const existingIndex = items.findIndex(i => i.product_id === product.id && i.variant_id === variantId);

            if (existingIndex > -1) {
                items[existingIndex].quantity += quantity;
            } else {
                items.push({
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    compare_price: product.compare_price,
                    image_url: product.image_url,
                    slug: product.slug,
                    quantity,
                    variant_id: variantId
                });
            }
            this.saveLocal(items);
            showToast('Added to cart!', 'success');
            return true;
        }
    },

    async updateQuantity(itemId, quantity) {
        if (Auth.isLoggedIn()) {
            try {
                const res = await Auth.fetchWithAuth(`${Config.API_BASE}/cart/update/${itemId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ quantity })
                });
                if (res && res.ok) await this.syncFromServer();
            } catch { /* ignore */ }
        } else {
            const items = this.getLocal();
            const item = items.find(i => i.product_id === itemId);
            if (item) {
                item.quantity = quantity;
                this.saveLocal(items);
            }
        }
    },

    async removeItem(itemId) {
        if (Auth.isLoggedIn()) {
            try {
                const res = await Auth.fetchWithAuth(`${Config.API_BASE}/cart/remove/${itemId}`, { method: 'DELETE' });
                if (res && res.ok) await this.syncFromServer();
            } catch { /* ignore */ }
        } else {
            const items = this.getLocal().filter(i => i.product_id !== itemId);
            this.saveLocal(items);
        }
    },

    async clearCart() {
        if (Auth.isLoggedIn()) {
            try {
                await Auth.fetchWithAuth(`${Config.API_BASE}/cart/clear`, { method: 'DELETE' });
            } catch { /* ignore */ }
        }
        this.clearLocal();
    },

    async syncFromServer() {
        if (!Auth.isLoggedIn()) return;
        try {
            const res = await Auth.fetchWithAuth(`${Config.API_BASE}/cart`);
            if (res && res.ok) {
                const data = await res.json();
                this.saveLocal(data.items || []);
            }
        } catch { /* ignore */ }
    },

    getTotal() {
        const items = this.getLocal();
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    getCount() {
        return this.getLocal().reduce((sum, item) => sum + item.quantity, 0);
    }
};

// Init cart badge on page load
document.addEventListener('DOMContentLoaded', () => {
    CartManager.updateBadge();
    if (Auth.isLoggedIn()) CartManager.syncFromServer();
});
