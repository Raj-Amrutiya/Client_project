// ============ Register Page ============
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('registerForm');
    if (!form) return;

    Validator.attachValidation(form);

    // Password strength meter
    const pwdInput = form.querySelector('[name="password"]');
    const strengthBar = form.querySelector('.strength-bar-fill');
    const strengthText = form.querySelector('.strength-text');

    if (pwdInput) {
        pwdInput.addEventListener('input', () => {
            const result = Validator.passwordStrength(pwdInput.value);
            if (strengthBar) {
                strengthBar.style.width = (result.score / 5) * 100 + '%';
                strengthBar.className = `strength-bar-fill ${result.class}`;
            }
            if (strengthText) strengthText.textContent = result.label;
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!Validator.validateForm(form)) return;

        const terms = form.querySelector('[name="terms"]');
        if (terms && !terms.checked) {
            showToast('Please accept the terms and conditions', 'warning');
            return;
        }

        const formData = {
            first_name: form.querySelector('[name="first_name"]').value.trim(),
            last_name: form.querySelector('[name="last_name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            phone: form.querySelector('[name="phone"]')?.value.trim() || null,
            password: form.querySelector('[name="password"]').value
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

        try {
            const res = await fetch(`${Config.API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                Auth.setToken(data.token);
                Auth.setUser(data.user);
                showToast('Account created successfully!', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            } else {
                showToast(data.error || 'Registration failed', 'error');
            }
        } catch {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account';
        }
    });

    // Show/hide password
    form.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.closest('.form-group').querySelector('input');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    });
});
