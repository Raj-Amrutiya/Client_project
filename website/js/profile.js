// ============ Profile Page ============
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html?redirect=profile.html';
        return;
    }

    initProfilePage();
});

function initProfilePage() {
    initTabs();
    bindLogout();
    loadProfile();
    loadAddresses();
    loadOrders();
    loadWishlist();
    bindAddAddress();
    setupAccountForm();
    setupPasswordForm();
}

// ============ Tabs ============
function initTabs() {
    const navItems = document.querySelectorAll('.profile-nav-item[data-tab]');
    const tabs = document.querySelectorAll('.profile-tab');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            if (!tabName) return;

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            tabs.forEach(tab => {
                const expectedId = `tab${tabName.charAt(0).toUpperCase()}${tabName.slice(1)}`;
                tab.classList.toggle('active', tab.id === expectedId);
            });
        });
    });
}

function bindLogout() {
    const logoutBtn = document.getElementById('profileLogout');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ============ Load Profile ============
async function loadProfile() {
    let user = Auth.getUser();

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/users/profile`);
        if (res && res.ok) {
            const data = await res.json();
            if (data && data.user) {
                user = data.user;
                Auth.setUser(user);
            }
        }
    } catch {
        // Keep local user if API call fails.
    }

    if (!user) return;

    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || user.email || 'User';

    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    if (profileName) profileName.textContent = fullName;
    if (profileEmail) profileEmail.textContent = user.email || '';

    const avatar = document.querySelector('.avatar-circle');
    if (avatar) {
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase();
        avatar.textContent = initials || (user.email ? user.email.charAt(0).toUpperCase() : 'U');
    }

    const accFirstName = document.getElementById('accFirstName');
    const accLastName = document.getElementById('accLastName');
    const accEmail = document.getElementById('accEmail');
    const accPhone = document.getElementById('accPhone');

    if (accFirstName) accFirstName.value = firstName;
    if (accLastName) accLastName.value = lastName;
    if (accEmail) accEmail.value = user.email || '';
    if (accPhone) accPhone.value = user.phone || '';
}

// ============ Addresses ============
async function loadAddresses() {
    const grid = document.getElementById('addressesGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/users/addresses`);
        if (!res || !res.ok) {
            grid.innerHTML = `
                <div class="profile-empty">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>No Addresses Yet</h3>
                    <p>Add your delivery address for faster checkout.</p>
                </div>
            `;
            return;
        }

        const data = await res.json();
        const addresses = data.addresses || [];

        if (addresses.length === 0) {
            grid.innerHTML = `
                <div class="profile-empty">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>No Addresses Yet</h3>
                    <p>Add your delivery address for faster checkout.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = addresses.map(addr => `
            <div class="profile-address-item">
                <h4>${addr.full_name || 'Address'}</h4>
                <p>${addr.address_line1 || ''}</p>
                ${addr.address_line2 ? `<p>${addr.address_line2}</p>` : ''}
                <p>${addr.city || ''}, ${addr.state || ''} - ${addr.postal_code || ''}</p>
                <p>Phone: ${addr.phone || '-'}</p>
            </div>
        `).join('');
    } catch {
        grid.innerHTML = '<p class="text-center">Failed to load addresses.</p>';
    }
}

function bindAddAddress() {
    const btn = document.getElementById('addAddressBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        showAddressModal();
    });
}

function showAddressModal() {
    const existing = document.getElementById('addressModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'addressModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 620px; text-align: left; padding: 28px;">
            <h3 style="margin-bottom: 14px;">Add New Address</h3>
            <form id="addressFormProfile">
                <div class="form-row">
                    <div class="form-group"><label>Full Name *</label><input type="text" id="addrFullName" required></div>
                    <div class="form-group"><label>Phone *</label><input type="tel" id="addrPhone" required></div>
                </div>
                <div class="form-group"><label>Address Line 1 *</label><input type="text" id="addrLine1" required></div>
                <div class="form-group"><label>Address Line 2</label><input type="text" id="addrLine2"></div>
                <div class="form-row">
                    <div class="form-group"><label>City *</label><input type="text" id="addrCity" required></div>
                    <div class="form-group"><label>State *</label><input type="text" id="addrState" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Postal Code *</label><input type="text" id="addrPostal" required></div>
                    <div class="form-group"><label>Address Type</label>
                        <select id="addrType">
                            <option value="shipping">Shipping</option>
                            <option value="billing">Billing</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:6px;">
                    <button type="button" class="btn btn-outline" id="closeAddressModal" style="border-color: var(--gray-300); color: var(--gray-700);">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Address</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeAddressModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.remove());
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const form = document.getElementById('addressFormProfile');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.disabled = true;

        try {
            const payload = {
                address_type: document.getElementById('addrType')?.value || 'shipping',
                full_name: document.getElementById('addrFullName')?.value.trim() || '',
                address_line1: document.getElementById('addrLine1')?.value.trim() || '',
                address_line2: document.getElementById('addrLine2')?.value.trim() || null,
                city: document.getElementById('addrCity')?.value.trim() || '',
                state: document.getElementById('addrState')?.value.trim() || '',
                postal_code: document.getElementById('addrPostal')?.value.trim() || '',
                phone: document.getElementById('addrPhone')?.value.trim() || ''
            };

            const res = await Auth.fetchWithAuth(`${Config.API_BASE}/users/addresses`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res && res.ok) {
                showToast('Address added successfully!', 'success');
                modal.remove();
                loadAddresses();
            } else {
                const data = res ? await res.json() : null;
                showToast(data?.error || 'Failed to add address', 'error');
            }
        } catch {
            showToast('Something went wrong', 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    });
}

// ============ Orders ============
async function loadOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/orders`);
        if (!res || !res.ok) {
            list.innerHTML = `
                <div class="profile-empty">
                    <i class="fas fa-box-open"></i>
                    <h3>No Orders Found</h3>
                    <p>You have not placed any order yet.</p>
                    <a href="products.html" class="btn btn-primary btn-sm">Start Shopping</a>
                </div>
            `;
            return;
        }

        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="profile-empty">
                    <i class="fas fa-box-open"></i>
                    <h3>No Orders Found</h3>
                    <p>You have not placed any order yet.</p>
                    <a href="products.html" class="btn btn-primary btn-sm">Start Shopping</a>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.slice(0, 8).map(order => `
            <div class="profile-order-item">
                <div class="profile-order-left">
                    <h4>Order #${order.order_number}</h4>
                    <p>${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} · ${formatPrice(order.total_amount)}</p>
                </div>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
        `).join('');
    } catch {
        list.innerHTML = '<p class="text-center">Failed to load orders.</p>';
    }
}

// ============ Wishlist ============
async function loadWishlist() {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        const res = await Auth.fetchWithAuth(`${Config.API_BASE}/wishlist`);
        if (!res || !res.ok) {
            grid.innerHTML = `
                <div class="profile-empty">
                    <i class="fas fa-heart-broken"></i>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Save products you love and come back later.</p>
                    <a href="products.html" class="btn btn-primary btn-sm">Browse Products</a>
                </div>
            `;
            return;
        }

        const data = await res.json();
        const items = data.items || [];

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="profile-empty">
                    <i class="fas fa-heart-broken"></i>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Save products you love and come back later.</p>
                    <a href="products.html" class="btn btn-primary btn-sm">Browse Products</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(item => createProductCard({
            id: item.product_id,
            name: item.name,
            slug: item.slug,
            price: item.price,
            compare_price: item.compare_price,
            image_url: item.image_url,
            rating_avg: item.rating_avg || 0,
            is_featured: item.is_featured || 0,
            category_name: item.category_name || ''
        })).join('');
    } catch {
        grid.innerHTML = '<p class="text-center">Failed to load wishlist.</p>';
    }
}

// ============ Account Form ============
function setupAccountForm() {
    const form = document.getElementById('accountForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        const firstName = document.getElementById('accFirstName')?.value.trim() || '';
        const lastName = document.getElementById('accLastName')?.value.trim() || '';
        const phone = document.getElementById('accPhone')?.value.trim() || null;

        try {
            const res = await Auth.fetchWithAuth(`${Config.API_BASE}/users/profile`, {
                method: 'PUT',
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone
                })
            });

            if (res && res.ok) {
                const currentUser = Auth.getUser() || {};
                const updatedUser = {
                    ...currentUser,
                    first_name: firstName,
                    last_name: lastName,
                    phone
                };
                Auth.setUser(updatedUser);

                const profileName = document.getElementById('profileName');
                if (profileName) {
                    profileName.textContent = `${firstName} ${lastName}`.trim() || updatedUser.email || 'User';
                }

                showToast('Profile updated successfully!', 'success');
            } else {
                showToast('Failed to update profile', 'error');
            }
        } catch {
            showToast('Something went wrong', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

// ============ Password Form ============
function setupPasswordForm() {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPwd = document.getElementById('currentPassword')?.value || '';
        const newPwd = document.getElementById('newPassword')?.value || '';
        const confirmPwd = document.getElementById('confirmNewPassword')?.value || '';

        if (newPwd !== confirmPwd) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPwd.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const res = await Auth.fetchWithAuth(`${Config.API_BASE}/auth/change-password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
            });

            const data = res ? await res.json() : null;
            if (res && res.ok) {
                showToast('Password changed successfully!', 'success');
                form.reset();
            } else {
                showToast(data?.error || 'Failed to change password', 'error');
            }
        } catch {
            showToast('Something went wrong', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}
