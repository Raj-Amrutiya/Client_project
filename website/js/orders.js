// ============ Orders Page ============
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html?redirect=orders.html';
        return;
    }
    loadOrders();
    setupOrderFilters();
});

async function loadOrders(status = 'all') {
    const container = document.querySelector('.orders-list');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        const url = status && status !== 'all'
            ? `${Config.API_BASE}/orders?status=${status}`
            : `${Config.API_BASE}/orders`;

        const res = await Auth.fetchWithAuth(url);
        if (!res) return;
        const data = await res.json();

        if (data.orders && data.orders.length > 0) {
            container.innerHTML = data.orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <h3>Order #${order.order_number}</h3>
                            <p class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="order-status-wrap">
                            <span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </div>
                    </div>
                    <div class="order-items">
                        ${(order.items || []).map(item => `
                            <div class="order-item">
                                <img src="${item.image_url || 'images/placeholder.jpg'}" alt="${item.product_name}">
                                <div class="order-item-info">
                                    <h4>${item.product_name}</h4>
                                    <p>${formatPrice(item.product_price)} × ${item.quantity}</p>
                                </div>
                                <span class="order-item-total">${formatPrice(item.total)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            <span>Total:</span>
                            <strong>${formatPrice(order.total_amount)}</strong>
                        </div>
                        <div class="order-actions">
                            ${['pending', 'confirmed'].includes(order.status)
                                ? `<button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.order_number}')">Cancel Order</button>`
                                : ''
                            }
                            <button class="btn btn-sm btn-outline" onclick="viewOrderDetails('${order.order_number}')">View Details</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No orders found</h3>
                    <p>You haven't placed any orders yet.</p>
                    <a href="products.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
        }
    } catch {
        container.innerHTML = '<p class="text-center">Failed to load orders.</p>';
    }
}

function setupOrderFilters() {
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadOrders(btn.dataset.status);
        });
    });
}

async function cancelOrder(orderNumber) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/orders/${orderNumber}/cancel`, {
            method: 'PUT'
        });

        if (res && res.ok) {
            showToast('Order cancelled successfully', 'success');
            loadOrders();
        } else {
            const data = await res?.json();
            showToast(data?.error || 'Failed to cancel order', 'error');
        }
    } catch {
        showToast('Something went wrong', 'error');
    }
}

async function viewOrderDetails(orderNumber) {
    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/orders/${orderNumber}`);
        if (!res || !res.ok) return;
        const data = await res.json();
        const order = data.order;

        // Create and show modal
        const existingModal = document.querySelector('.order-detail-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'order-detail-modal modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                <h2>Order #${order.order_number}</h2>
                <div class="order-detail-grid">
                    <div>
                        <h4>Status</h4>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                    <div>
                        <h4>Payment</h4>
                        <p>${order.payment_method?.toUpperCase()} - ${order.payment_status}</p>
                    </div>
                    ${order.shipping_address ? `
                        <div>
                            <h4>Shipping Address</h4>
                            <p>${order.shipping_address.full_name}<br>
                            ${order.shipping_address.address_line1}<br>
                            ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.postal_code}</p>
                        </div>
                    ` : ''}
                </div>
                <h4>Items</h4>
                ${(order.items || []).map(item => `
                    <div class="order-detail-item">
                        <span>${item.product_name} × ${item.quantity}</span>
                        <span>${formatPrice(item.total)}</span>
                    </div>
                `).join('')}
                <hr>
                <div class="order-detail-item"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
                ${order.discount_amount > 0 ? `<div class="order-detail-item"><span>Discount</span><span>-${formatPrice(order.discount_amount)}</span></div>` : ''}
                <div class="order-detail-item"><span>Shipping</span><span>${order.shipping_cost == 0 ? 'FREE' : formatPrice(order.shipping_cost)}</span></div>
                <div class="order-detail-item"><span>Tax</span><span>${formatPrice(order.tax_amount)}</span></div>
                <div class="order-detail-item total"><span><strong>Total</strong></span><span><strong>${formatPrice(order.total_amount)}</strong></span></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch {
        showToast('Failed to load order details', 'error');
    }
}
