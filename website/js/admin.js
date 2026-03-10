// ============ Admin Dashboard ============
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
        window.location.href = 'login.html';
        return;
    }
    initAdmin();
});

function initAdmin() {
    setupAdminNav();
    loadDashboard();
}

// ============ Sidebar Navigation ============
function setupAdminNav() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.section;
            if (!target) return;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(s => {
                s.classList.toggle('active', s.id === target);
            });

            // Load section data
            switch (target) {
                case 'dashboard': loadDashboard(); break;
                case 'admin-products': loadAdminProducts(); break;
                case 'admin-orders': loadAdminOrders(); break;
                case 'admin-customers': loadAdminCustomers(); break;
            }
        });
    });
}

// ============ Dashboard ============
async function loadDashboard() {
    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/admin/stats`);
        if (!res || !res.ok) return;
        const data = await res.json();

        // Update stat cards
        const stats = data.stats;
        updateStat('totalOrders', stats.totalOrders);
        updateStat('totalRevenue', formatPrice(stats.totalRevenue));
        updateStat('totalUsers', stats.totalUsers);
        updateStat('totalProducts', stats.totalProducts);

        // Recent orders table
        const tbody = document.querySelector('.recent-orders-table tbody');
        if (tbody && data.recentOrders) {
            tbody.innerHTML = data.recentOrders.map(order => `
                <tr>
                    <td>${order.order_number}</td>
                    <td>${order.first_name} ${order.last_name}</td>
                    <td>${formatPrice(order.total_amount)}</td>
                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch {
        showToast('Failed to load dashboard', 'error');
    }
}

function updateStat(id, value) {
    const el = document.querySelector(`[data-stat="${id}"], #${id}`);
    if (el) el.textContent = value;
}

// ============ Products Management ============
async function loadAdminProducts(page = 1) {
    const tbody = document.querySelector('.admin-products-table tbody');
    if (!tbody) return;

    try {
        const search = document.querySelector('.admin-product-search')?.value || '';
        const params = new URLSearchParams({ page, limit: 20 });
        if (search) params.set('search', search);

        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/admin/products?${params}`);
        if (!res || !res.ok) return;
        const data = await res.json();

        tbody.innerHTML = data.products.map(p => `
            <tr>
                <td><img src="${p.image_url || 'images/placeholder.jpg'}" width="50" alt="${p.name}"></td>
                <td>${p.name}</td>
                <td>${p.category_name || '-'}</td>
                <td>${formatPrice(p.price)}</td>
                <td>${p.stock_quantity}</td>
                <td><span class="status-badge ${p.is_active ? 'status-active' : 'status-inactive'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch {
        showToast('Failed to load products', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/admin/products/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            showToast('Product deleted', 'success');
            loadAdminProducts();
        }
    } catch {
        showToast('Failed to delete product', 'error');
    }
}

// ============ Orders Management ============
async function loadAdminOrders(status = 'all') {
    const tbody = document.querySelector('.admin-orders-table tbody');
    if (!tbody) return;

    try {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.set('status', status);

        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/admin/orders?${params}`);
        if (!res || !res.ok) return;
        const data = await res.json();

        tbody.innerHTML = data.orders.map(order => `
            <tr>
                <td>${order.order_number}</td>
                <td>${order.first_name} ${order.last_name}</td>
                <td>${formatPrice(order.total_amount)}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        ${['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s =>
                            `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                        ).join('')}
                    </select>
                </td>
                <td>${order.payment_method}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch {
        showToast('Failed to load orders', 'error');
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (res && res.ok) showToast('Order status updated', 'success');
        else showToast('Failed to update status', 'error');
    } catch {
        showToast('Failed to update status', 'error');
    }
}

// ============ Customers ============
async function loadAdminCustomers() {
    const tbody = document.querySelector('.admin-customers-table tbody');
    if (!tbody) return;

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/admin/customers`);
        if (!res || !res.ok) return;
        const data = await res.json();

        tbody.innerHTML = data.customers.map(c => `
            <tr>
                <td>${c.first_name} ${c.last_name}</td>
                <td>${c.email}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.order_count}</td>
                <td>${formatPrice(c.total_spent)}</td>
                <td>${new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch {
        showToast('Failed to load customers', 'error');
    }
}

// ============ Product Search ============
(function () {
    const searchInput = document.querySelector('.admin-product-search');
    if (!searchInput) return;
    let timeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => loadAdminProducts(), 400);
    });
})();
