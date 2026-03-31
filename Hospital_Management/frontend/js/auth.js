// frontend/js/auth.js — Login / Register logic

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    if (user) { location.href = Auth.getDashboardUrl(user.role); return; }
  }

  let currentRole = 'patient';  // default selected role

  // ── Tab switching ─────────────────────────────────────────────
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.auth-panel').forEach(p=>p.classList.toggle('hidden', p.id!==target));
      hideError();
    });
  });

  // ── Role selector ──────────────────────────────────────────────
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentRole = btn.dataset.role;
      // Show/hide register tab based on role (only patients can self-register)
      const registerTab = document.querySelector('[data-tab="register"]');
      if (registerTab) {
        registerTab.style.display = currentRole === 'patient' ? '' : 'none';
        if (currentRole !== 'patient') {
          document.querySelector('[data-tab="login"]').click();
        }
      }
    });
  });

  // ── Show/hide password ─────────────────────────────────────────
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling || btn.parentElement.querySelector('input');
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.className = `fas ${isPass ? 'fa-eye-slash' : 'fa-eye'} input-icon-right toggle-password`;
    });
  });

  // ── Login form ─────────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const btn = loginForm.querySelector('button[type="submit"]');
    setLoading(btn, true);

    const email    = loginForm.querySelector('#login-email').value.trim();
    const password = loginForm.querySelector('#login-password').value;

    if (!email || !password) { showError('Please fill all fields'); setLoading(btn, false); return; }

    const res = await API.post('/auth/login', { email, password });
    setLoading(btn, false);

    if (!res?.success) { showError(res?.message || 'Login failed'); return; }

    // Role mismatch check
    if (currentRole !== 'patient' && res.user.role !== currentRole) {
      showError(`This account is not a ${currentRole} account`);
      return;
    }

    Auth.setAuth(res.token, res.user);
    Toast.success(`Welcome back, ${res.user.name}!`);
    setTimeout(() => { location.href = Auth.getDashboardUrl(res.user.role); }, 500);
  });

  // ── Register form ──────────────────────────────────────────────
  const registerForm = document.getElementById('register-form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const btn = registerForm.querySelector('button[type="submit"]');
    setLoading(btn, true);

    const data = {
      name:     registerForm.querySelector('#reg-name').value.trim(),
      email:    registerForm.querySelector('#reg-email').value.trim(),
      phone:    registerForm.querySelector('#reg-phone').value.trim(),
      password: registerForm.querySelector('#reg-password').value,
      dob:      registerForm.querySelector('#reg-dob')?.value,
      gender:   registerForm.querySelector('#reg-gender')?.value,
      blood_group: registerForm.querySelector('#reg-blood')?.value,
    };

    if (!data.name || !data.email || !data.password) { showError('Name, email, and password are required'); setLoading(btn, false); return; }
    if (data.password.length < 8) { showError('Password must be at least 8 characters'); setLoading(btn, false); return; }

    const res = await API.post('/auth/register', data);
    setLoading(btn, false);

    if (!res?.success) { showError(res?.message || 'Registration failed'); return; }

    Auth.setAuth(res.token, res.user);
    Toast.success('Account created! Welcome to HMS.');
    setTimeout(() => { location.href = Auth.getDashboardUrl(res.user.role); }, 500);
  });

  // ── Helpers ───────────────────────────────────────────────────
  function showError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }
  function hideError() {
    const el = document.getElementById('auth-error');
    if (el) el.classList.remove('show');
  }
  function setLoading(btn, loading) {
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
  }
});
