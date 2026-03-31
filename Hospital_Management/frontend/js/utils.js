// frontend/js/utils.js — Shared UI utilities (Toast, Modal, Sidebar)

// ── Toast Notifications ───────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (document.getElementById('toast-container')) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', duration = 4000) {
    this.init();
    const icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]} toast-icon"></i><span class="toast-msg">${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(100%)'; toast.style.transition='0.3s'; setTimeout(()=>toast.remove(), 300); }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ── Modal ─────────────────────────────────────────────────────────
const Modal = {
  open(id)  { document.getElementById(id)?.classList.add('active'); document.body.style.overflow='hidden'; },
  close(id) { document.getElementById(id)?.classList.remove('active'); document.body.style.overflow=''; },
  closeAll(){ document.querySelectorAll('.modal-overlay.active').forEach(m=>{ m.classList.remove('active'); }); document.body.style.overflow=''; },
};
// Close on overlay click
document.addEventListener('click', e => { if(e.target.classList.contains('modal-overlay')) Modal.closeAll(); });
// Close on X button
document.addEventListener('click', e => { if(e.target.closest('.modal-close')) { const m=e.target.closest('.modal-overlay'); if(m){m.classList.remove('active'); document.body.style.overflow='';} } });
// Close on Escape
document.addEventListener('keydown', e => { if(e.key==='Escape') Modal.closeAll(); });

// ── Sidebar ───────────────────────────────────────────────────────
const Sidebar = {
  init() {
    const toggle   = document.querySelector('.sidebar-toggle');
    const sidebar  = document.querySelector('.sidebar');
    const overlay  = document.querySelector('.sidebar-overlay');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  },

  setActive(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  },

  populate(user) {
    const el = document.getElementById('sidebar-user-name');
    const rl = document.getElementById('sidebar-user-role');
    const av = document.getElementById('sidebar-avatar');
    if (el) el.textContent = user.name;
    if (rl) rl.textContent = user.role.replace('_',' ');
    if (av) av.textContent = Fmt.initials(user.name);
  }
};

// ── Topbar ────────────────────────────────────────────────────────
const Topbar = {
  setTitle(title) { const el=document.getElementById('page-title'); if(el) el.textContent=title; },
  async loadNotifications() {
    const res = await API.get('/auth/notifications');
    if (!res?.success) return;
    const unread = res.data.filter(n=>!n.is_read).length;
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = unread ? 'block' : 'none';
  }
};

// ── Logout ────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.closest('#logout-btn')) {
    Auth.clearAuth();
    location.href = '/login.html';
  }
});

// ── Generic Table Builder ─────────────────────────────────────────
function buildTable(containerId, columns, rows, emptyMsg = 'No data found') {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  if (!rows || !rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>${emptyMsg}</p></div>`;
    return;
  }
  const thead = columns.map(c => `<th>${c.label}</th>`).join('');
  const tbody = rows.map(row => {
    const cells = columns.map(c => `<td>${c.render ? c.render(row) : (row[c.key] ?? '—')}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  wrap.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

// ── Confirm Dialog ────────────────────────────────────────────────
function confirmAction(message, onConfirm) {
  if (confirm(message)) onConfirm();
}

// ── Counter Animation ─────────────────────────────────────────────
function animateCounter(el, target, duration = 1000) {
  const start = 0;
  const step  = target / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { clearInterval(timer); current = target; }
    el.textContent = typeof target === 'float' ? current.toFixed(2) : Math.floor(current).toLocaleString('en-IN');
  }, 16);
}

// ── Debounce ──────────────────────────────────────────────────────
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ── Export ────────────────────────────────────────────────────────
window.Toast        = Toast;
window.Modal        = Modal;
window.Sidebar      = Sidebar;
window.Topbar       = Topbar;
window.buildTable   = buildTable;
window.confirmAction= confirmAction;
window.animateCounter = animateCounter;
window.debounce     = debounce;
