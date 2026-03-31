// frontend/js/config.js — API configuration & shared helpers
const API_BASE = 'http://localhost:3000/api';

// ── Token helpers ─────────────────────────────────────────────────
const Auth = {
  getToken: ()  => localStorage.getItem('hms_token'),
  getUser:  ()  => JSON.parse(localStorage.getItem('hms_user') || 'null'),
  setAuth:  (token, user) => { localStorage.setItem('hms_token', token); localStorage.setItem('hms_user', JSON.stringify(user)); },
  clearAuth:()  => { localStorage.removeItem('hms_token'); localStorage.removeItem('hms_user'); },
  isLoggedIn:() => !!localStorage.getItem('hms_token'),
  requireAuth: (allowedRoles = []) => {
    const user = Auth.getUser();
    if (!Auth.isLoggedIn() || !user) { location.href = '/login.html'; return null; }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      location.href = Auth.getDashboardUrl(user.role);
      return null;
    }
    return user;
  },
  getDashboardUrl: (role) => {
    const map = {
      admin:          '/pages/admin/dashboard.html',
      doctor:         '/pages/doctor/dashboard.html',
      receptionist:   '/pages/receptionist/dashboard.html',
      patient:        '/pages/patient/dashboard.html',
      lab_technician: '/pages/lab/dashboard.html',
      pharmacist:     '/pages/pharmacy/dashboard.html',
    };
    return map[role] || '/login.html';
  },
};

// ── Fetch wrapper ─────────────────────────────────────────────────
const API = {
  headers: () => ({
    'Content-Type': 'application/json',
    ...(Auth.getToken() ? { Authorization: `Bearer ${Auth.getToken()}` } : {}),
  }),

  async request(method, endpoint, body = null) {
    const opts = { method, headers: API.headers() };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res  = await fetch(`${API_BASE}${endpoint}`, opts);
      const data = await res.json();
      if (res.status === 401) { Auth.clearAuth(); location.href = '/login.html'; return null; }
      return { ok: res.ok, status: res.status, ...data };
    } catch (err) {
      console.error('API Error:', err);
      return { ok: false, message: 'Network error. Check server connection.' };
    }
  },

  get:    (ep)       => API.request('GET',    ep),
  post:   (ep, body) => API.request('POST',   ep, body),
  put:    (ep, body) => API.request('PUT',    ep, body),
  patch:  (ep, body) => API.request('PATCH',  ep, body),
  delete: (ep)       => API.request('DELETE', ep),
};

// ── Format helpers ────────────────────────────────────────────────
const Fmt = {
  date:      (d)   => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  dateTime:  (d)   => d ? new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—',
  time:      (t)   => { if(!t) return '—'; const [h,m]=t.split(':'); const hr=+h; return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; },
  currency:  (n)   => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 }),
  number:    (n)   => Number(n||0).toLocaleString('en-IN'),
  initials:  (name)=> (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(),
  relTime:   (d)   => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; },
};

// ── Status badge map ──────────────────────────────────────────────
const StatusBadge = {
  pending:   '<span class="badge badge-amber">Pending</span>',
  confirmed: '<span class="badge badge-blue">Confirmed</span>',
  in_progress:'<span class="badge badge-purple">In Progress</span>',
  completed: '<span class="badge badge-green">Completed</span>',
  cancelled: '<span class="badge badge-red">Cancelled</span>',
  no_show:   '<span class="badge badge-gray">No Show</span>',
  paid:      '<span class="badge badge-green">Paid</span>',
  partially_paid:'<span class="badge badge-amber">Partial</span>',
  draft:     '<span class="badge badge-gray">Draft</span>',
  available: '<span class="badge badge-green">Available</span>',
  occupied:  '<span class="badge badge-red">Occupied</span>',
  maintenance:'<span class="badge badge-amber">Maintenance</span>',
  urgent:    '<span class="badge badge-red">Urgent</span>',
  normal:    '<span class="badge badge-gray">Normal</span>',
  emergency: '<span class="badge badge-red" style="animation:pulse-anim 1s infinite">⚡ Emergency</span>',
};
const getBadge = (status) => StatusBadge[status] || `<span class="badge badge-gray">${status}</span>`;

// ── Export ────────────────────────────────────────────────────────
window.API  = API;
window.Auth = Auth;
window.Fmt  = Fmt;
window.getBadge = getBadge;
