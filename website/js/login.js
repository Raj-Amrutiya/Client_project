// ============ Login Page ============
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('loginForm');
    if (!form) return;

    Validator.attachValidation(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!Validator.validateForm(form)) return;

        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        try {
            const res = await fetch(`${Config.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                Auth.setToken(data.token);
                Auth.setUser(data.user);

                // Sync guest cart to server
                const guestCart = CartManager.getLocal();
                if (guestCart.length > 0) {
                    for (const item of guestCart) {
                        try {
                            await Auth.fetchWithAuth(`${Config.API_BASE}/cart/add`, {
                                method: 'POST',
                                body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity })
                            });
                        } catch { /* ignore */ }
                    }
                    await CartManager.syncFromServer();
                }

                showToast('Login successful!', 'success');

                // Redirect
                const params = new URLSearchParams(window.location.search);
                const redirect = params.get('redirect') || 'index.html';
                setTimeout(() => window.location.href = redirect, 500);
            } else {
                showToast(data.error || 'Invalid email or password', 'error');
            }
        } catch {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
        }
    });

    // Show/hide password
    const togglePwd = form.querySelector('.toggle-password');
    if (togglePwd) {
        togglePwd.addEventListener('click', () => {
            const pwdInput = form.querySelector('[name="password"]');
            const isPassword = pwdInput.type === 'password';
            pwdInput.type = isPassword ? 'text' : 'password';
            togglePwd.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }
});
