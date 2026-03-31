// frontend/js/admin.js — Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', async () => {
  const user = Auth.requireAuth(['admin']);
  if (!user) return;

  // Populate sidebar
  Sidebar.init();
  Sidebar.populate(user);
  document.getElementById('topbar-avatar').textContent = Fmt.initials(user.name);
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Load departments for dropdowns
  await loadDepartments();

  // Load default page
  await loadDashboard();
});

// ── Page Navigation ───────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${page}`)?.classList.remove('hidden');
  Sidebar.setActive(page);
  document.getElementById('page-title').textContent = {
    dashboard:'Dashboard', patients:'Patients', doctors:'Doctors',
    appointments:'Appointments', billing:'Billing & Payments',
    beds:'Bed Management', lab:'Laboratory', pharmacy:'Pharmacy',
    staff:'Staff', departments:'Departments', reports:'Analytics'
  }[page] || page;

  const loaders = { patients:loadPatients, doctors:loadDoctors, appointments:loadAppointments, billing:loadBilling, beds:loadBeds, lab:loadLab, pharmacy:loadPharmacy, staff:loadStaff, departments:loadDepartmentPage, reports:loadReports };
  if (loaders[page]) loaders[page]();
}

// ── Dashboard ─────────────────────────────────────────────────────
async function loadDashboard() {
  const res = await API.get('/reports/dashboard');
  if (!res?.success) { Toast.error('Failed to load dashboard'); return; }
  const d = res.data;

  document.getElementById('stats-grid').innerHTML = `
    <div class="card stat-card teal">
      <div class="card-body">
        <div class="stat-icon teal"><i class="fas fa-users"></i></div>
        <div class="stat-value">${Fmt.number(d.patients.total)}</div>
        <div class="stat-label">Total Patients</div>
        <div class="stat-change up"><i class="fas fa-arrow-up"></i> ${d.patients.this_month} this month</div>
      </div>
    </div>
    <div class="card stat-card purple">
      <div class="card-body">
        <div class="stat-icon purple"><i class="fas fa-user-doctor"></i></div>
        <div class="stat-value">${d.doctors.total}</div>
        <div class="stat-label">Active Doctors</div>
      </div>
    </div>
    <div class="card stat-card green">
      <div class="card-body">
        <div class="stat-icon green"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-value">${d.appointments.today}</div>
        <div class="stat-label">Today's Appointments</div>
      </div>
    </div>
    <div class="card stat-card amber">
      <div class="card-body">
        <div class="stat-icon amber"><i class="fas fa-indian-rupee-sign"></i></div>
        <div class="stat-value">${Fmt.currency(d.revenue.today)}</div>
        <div class="stat-label">Today's Revenue</div>
        <div class="stat-change up"><i class="fas fa-arrow-up"></i> ${Fmt.currency(d.revenue.month)} this month</div>
      </div>
    </div>`;

  await Promise.all([loadRevenueChart(30), loadDeptChart(), loadActivity(), loadDoctorPerf()]);
  Topbar.loadNotifications();
}

// ── Charts ────────────────────────────────────────────────────────
let revenueChartInst, deptChartInst;
async function loadRevenueChart(days=30) {
  const res = await API.get(`/reports/revenue?range=${days}`);
  if (!res?.success) return;
  const labels = res.data.map(r=>Fmt.date(r.date));
  const values = res.data.map(r=>r.revenue);
  if (revenueChartInst) revenueChartInst.destroy();
  revenueChartInst = new Chart(document.getElementById('revenueChart'), {
    type:'line',
    data:{ labels, datasets:[{ label:'Revenue (₹)', data:values, borderColor:'#00d4aa', backgroundColor:'rgba(0,212,170,0.08)', borderWidth:2.5, pointRadius:3, fill:true, tension:0.4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', maxTicksLimit:8 } }, y:{ grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', callback:v=>'₹'+v.toLocaleString('en-IN') } } } }
  });
}

async function loadDeptChart() {
  const res = await API.get('/reports/appointments-by-department');
  if (!res?.success) return;
  if (deptChartInst) deptChartInst.destroy();
  deptChartInst = new Chart(document.getElementById('deptChart'), {
    type:'doughnut',
    data:{ labels: res.data.map(r=>r.department||'Unknown'), datasets:[{ data: res.data.map(r=>r.count), backgroundColor:['#00d4aa','#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#8b5cf6'], borderWidth:0, spacing:4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', boxWidth:12, padding:16 } } }, cutout:'65%' }
  });
}

async function loadActivity() {
  const res = await API.get('/reports/recent-activity');
  const list = document.getElementById('activity-list');
  if (!res?.success || !res.data.length) { list.innerHTML='<div class="empty-state"><i class="fas fa-history"></i><p>No recent activity</p></div>'; return; }
  list.innerHTML = res.data.map(a=>`
    <div style="padding:12px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,0.04);">
      <div style="width:36px;height:36px;border-radius:8px;background:${a.type==='appointment'?'var(--teal-dim)':'rgba(245,158,11,0.15)'};display:flex;align-items:center;justify-content:center;font-size:14px;color:${a.type==='appointment'?'var(--teal)':'var(--amber)'}">
        <i class="fas ${a.type==='appointment'?'fa-calendar':'fa-file-invoice'}"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">${a.name}</div>
        <div style="font-size:12px;color:var(--text-muted);">${a.detail}</div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;">${Fmt.relTime(a.time)}</div>
    </div>`).join('');
}

async function loadDoctorPerf() {
  const res = await API.get('/reports/doctor-performance');
  const el = document.getElementById('doctor-perf');
  if (!res?.success || !res.data.length) { el.innerHTML='<div class="empty-state"><i class="fas fa-user-doctor"></i><p>No data</p></div>'; return; }
  el.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Doctor</th><th>Dept</th><th>Completed</th><th>Cancelled</th></tr></thead><tbody>${
    res.data.map(d=>`<tr><td><strong>${d.name}</strong><br><span class="text-xs text-muted">${d.specialization||''}</span></td><td>${d.department||'—'}</td><td><span class="text-green font-semibold">${d.completed}</span></td><td><span class="text-red">${d.cancelled}</span></td></tr>`).join('')
  }</tbody></table></div>`;
}

// ── Patients ──────────────────────────────────────────────────────
async function loadPatients() {
  const search = document.getElementById('patient-search')?.value||'';
  const res = await API.get(`/patients?search=${encodeURIComponent(search)}&limit=50`);
  buildTable('patients-table',
    [{ label:'Patient ID', key:'patient_id' },{ label:'Name', render:r=>`<strong>${r.name}</strong>` },{ label:'Phone', key:'phone' },{ label:'Gender', render:r=>r.gender?r.gender.charAt(0).toUpperCase()+r.gender.slice(1):'—' },{ label:'Blood', key:'blood_group' },{ label:'City', key:'city' },{ label:'Registered', render:r=>Fmt.date(r.created_at) }],
    res?.data, 'No patients found');
}

async function submitPatient() {
  const data = { name:document.getElementById('p-name').value, phone:document.getElementById('p-phone').value, email:document.getElementById('p-email').value, dob:document.getElementById('p-dob').value, gender:document.getElementById('p-gender').value, blood_group:document.getElementById('p-blood').value, city:document.getElementById('p-city').value, address:document.getElementById('p-address').value, emergency_contact_name:document.getElementById('p-ec-name').value, emergency_contact_phone:document.getElementById('p-ec-phone').value, allergies:document.getElementById('p-allergies').value };
  const res = await API.post('/patients', data);
  if (res?.success) { Toast.success('Patient registered: '+res.patientId); Modal.close('add-patient-modal'); document.getElementById('patient-form').reset(); loadPatients(); }
  else Toast.error(res?.message||'Failed');
}

// ── Doctors ───────────────────────────────────────────────────────
async function loadDoctors() {
  const res = await API.get('/doctors');
  buildTable('doctors-table',
    [{ label:'ID', key:'doctor_id' },{ label:'Name', render:r=>`<strong>${r.name}</strong>` },{ label:'Specialization', key:'specialization' },{ label:'Department', key:'department_name' },{ label:'Experience', render:r=>`${r.experience_years} yrs` },{ label:'Fee', render:r=>Fmt.currency(r.consultation_fee) },{ label:'Available', render:r=>`<span class="text-sm text-muted">${r.available_days}</span>` }],
    res?.data, 'No doctors found');
}

async function submitDoctor() {
  const data = { name:document.getElementById('d-name').value, phone:document.getElementById('d-phone').value, email:document.getElementById('d-email').value, password:document.getElementById('d-pass').value, department_id:document.getElementById('d-dept').value, specialization:document.getElementById('d-spec').value, qualification:document.getElementById('d-qual').value, experience_years:document.getElementById('d-exp').value, consultation_fee:document.getElementById('d-fee').value, available_days:document.getElementById('d-days').value, available_from:document.getElementById('d-from').value, available_to:document.getElementById('d-to').value, bio:document.getElementById('d-bio').value };
  const res = await API.post('/doctors', data);
  if (res?.success) { Toast.success('Doctor added!'); Modal.close('add-doctor-modal'); document.getElementById('doctor-form').reset(); loadDoctors(); }
  else Toast.error(res?.message||'Failed');
}

// ── Appointments ──────────────────────────────────────────────────
async function loadAppointments() {
  const date   = document.getElementById('appt-date-filter')?.value||'';
  const status = document.getElementById('appt-status-filter')?.value||'';
  const res = await API.get(`/appointments?date=${date}&status=${status}&limit=100`);
  buildTable('appointments-table',
    [{ label:'No.', key:'appointment_number' },{ label:'Patient', key:'patient_name' },{ label:'Doctor', key:'doctor_name' },{ label:'Date', render:r=>Fmt.date(r.appointment_date) },{ label:'Time', render:r=>Fmt.time(r.appointment_time) },{ label:'Token', render:r=>`<span class="badge badge-teal">#${r.token_number}</span>` },{ label:'Type', key:'type' },{ label:'Status', render:r=>getBadge(r.status) }],
    res?.data, 'No appointments found');
}

// ── Billing ───────────────────────────────────────────────────────
async function loadBilling() {
  const [billRes, statsRes] = await Promise.all([API.get('/billing?limit=50'), API.get('/billing/stats')]);
  if (statsRes?.success) {
    const s = statsRes.data;
    document.getElementById('billing-stats').innerHTML = `
      <div class="card stat-card green"><div class="card-body"><div class="stat-icon green"><i class="fas fa-indian-rupee-sign"></i></div><div class="stat-value">${Fmt.currency(s.today_revenue)}</div><div class="stat-label">Today Revenue</div></div></div>
      <div class="card stat-card teal"><div class="card-body"><div class="stat-icon teal"><i class="fas fa-chart-line"></i></div><div class="stat-value">${Fmt.currency(s.month_revenue)}</div><div class="stat-label">Month Revenue</div></div></div>
      <div class="card stat-card amber"><div class="card-body"><div class="stat-icon amber"><i class="fas fa-file-invoice"></i></div><div class="stat-value">${s.today_bills}</div><div class="stat-label">Today's Bills</div></div></div>
      <div class="card stat-card red"><div class="card-body"><div class="stat-icon red"><i class="fas fa-clock"></i></div><div class="stat-value">${Fmt.currency(s.pending_amount)}</div><div class="stat-label">Pending Amount</div></div></div>`;
  }
  buildTable('billing-table',
    [{ label:'Bill No.', key:'bill_number' },{ label:'Patient', key:'patient_name' },{ label:'Total', render:r=>Fmt.currency(r.net_amount) },{ label:'Paid', render:r=>`<span class="text-green">${Fmt.currency(r.amount_paid)}</span>` },{ label:'Balance', render:r=>`<span class="text-red">${Fmt.currency(r.balance_due)}</span>` },{ label:'Status', render:r=>getBadge(r.status) },{ label:'Date', render:r=>Fmt.date(r.created_at) }],
    billRes?.data, 'No bills found');
}

// ── Beds ──────────────────────────────────────────────────────────
async function loadBeds() {
  const [bedsRes, availRes] = await Promise.all([API.get('/beds'), API.get('/beds/availability')]);
  if (availRes?.success) {
    document.getElementById('bed-summary').innerHTML = availRes.data.map(w=>`
      <div class="card stat-card teal"><div class="card-body">
        <div class="stat-icon teal"><i class="fas fa-bed"></i></div>
        <div class="stat-value">${w.available}/${w.total}</div>
        <div class="stat-label">${w.ward_type.replace('_',' ').toUpperCase()}</div>
        <div class="stat-change" style="color:${w.occupied>0?'var(--amber)':'var(--green)'}">${w.occupied} occupied</div>
      </div></div>`).join('');
  }
  if (bedsRes?.success) {
    document.getElementById('bed-grid').innerHTML = bedsRes.data.map(b=>`
      <div class="bed-tile ${b.status}" title="${b.status==='occupied'?'Patient: '+b.current_patient:b.status}">
        <i class="fas fa-bed" style="font-size:22px;"></i>
        <strong>${b.bed_number}</strong>
        <span>${b.ward_name||b.ward_type}</span>
      </div>`).join('');
  }
}

// ── Lab ───────────────────────────────────────────────────────────
async function loadLab() {
  const res = await API.get('/lab/tests?limit=50');
  buildTable('lab-table',
    [{ label:'Test No.', key:'test_number' },{ label:'Patient', key:'patient_name' },{ label:'Test', key:'test_name' },{ label:'Doctor', key:'doctor_name' },{ label:'Priority', render:r=>getBadge(r.priority) },{ label:'Status', render:r=>getBadge(r.status) },{ label:'Requested', render:r=>Fmt.date(r.requested_date) }],
    res?.data, 'No lab tests found');
}

// ── Pharmacy ──────────────────────────────────────────────────────
async function loadPharmacy() {
  const res = await API.get('/pharmacy/medicines');
  buildTable('pharmacy-table',
    [{ label:'Medicine', render:r=>`<strong>${r.name}</strong><br><span class="text-xs text-muted">${r.generic_name||''}</span>` },{ label:'Category', key:'category' },{ label:'Manufacturer', key:'manufacturer' },{ label:'Stock', render:r=>`<span class="${r.total_stock<=10?'text-red font-bold':'text-green'}">${r.total_stock} ${r.unit||''}</span>` },{ label:'Price', render:r=>r.min_price?Fmt.currency(r.min_price):'—' },{ label:'Expiry', render:r=>Fmt.date(r.latest_expiry) }],
    res?.data, 'No medicines found');
}

// ── Staff ─────────────────────────────────────────────────────────
async function loadStaff() {
  const res = await API.get('/staff');
  buildTable('staff-table',
    [{ label:'Emp ID', key:'employee_id' },{ label:'Name', key:'name' },{ label:'Role', render:r=>r.role.replace('_',' ') },{ label:'Designation', key:'designation' },{ label:'Department', key:'department_name' },{ label:'Salary', render:r=>Fmt.currency(r.salary) },{ label:'Joined', render:r=>Fmt.date(r.join_date) },{ label:'Status', render:r=>r.is_active?'<span class="badge badge-green">Active</span>':'<span class="badge badge-red">Inactive</span>' }],
    res?.data, 'No staff found');
}

async function submitStaff() {
  const data = { name:document.getElementById('s-name').value, phone:document.getElementById('s-phone').value, email:document.getElementById('s-email').value, password:document.getElementById('s-pass').value, role:document.getElementById('s-role').value, department_id:document.getElementById('s-dept').value, designation:document.getElementById('s-desig').value, salary:document.getElementById('s-salary').value, join_date:document.getElementById('s-join').value };
  const res = await API.post('/staff', data);
  if (res?.success) { Toast.success('Staff added: '+res.employeeId); Modal.close('add-staff-modal'); document.getElementById('staff-form').reset(); loadStaff(); }
  else Toast.error(res?.message||'Failed');
}

// ── Departments ───────────────────────────────────────────────────
let departmentsCache = [];
async function loadDepartments() {
  const res = await API.get('/doctors/departments');
  if (!res?.success) return;
  departmentsCache = res.data;
  // Populate all dept selects
  ['d-dept','s-dept'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    el.innerHTML='<option value="">Select Department</option>'+res.data.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
  });
}

async function loadDepartmentPage() {
  const res = await API.get('/doctors/departments');
  document.getElementById('dept-grid').innerHTML = (res?.data||[]).map(d=>`
    <div class="card card-body">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
        <div class="stat-icon teal"><i class="fas fa-building"></i></div>
        <div><h3 style="font-weight:700;">${d.name}</h3><span class="badge badge-gray">${d.code}</span></div>
      </div>
      <p class="text-sm text-muted">${d.description||'No description'}</p>
    </div>`).join('');
}

// ── Analytics ─────────────────────────────────────────────────────
async function loadReports() {
  const [growth, dept] = await Promise.all([API.get('/reports/patient-growth'), API.get('/reports/appointments-by-department')]);
  if (growth?.success) {
    new Chart(document.getElementById('growthChart'), { type:'bar', data:{ labels:growth.data.map(r=>r.month), datasets:[{ label:'New Patients', data:growth.data.map(r=>r.new_patients), backgroundColor:'rgba(0,212,170,0.6)', borderColor:'var(--teal)', borderWidth:1, borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#64748b'}}, y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#64748b'}} } } });
  }
  if (dept?.success) {
    new Chart(document.getElementById('deptChart2'), { type:'bar', indexAxis:'y', data:{ labels:dept.data.map(r=>r.department||'Unknown'), datasets:[{ data:dept.data.map(r=>r.count), backgroundColor:'rgba(124,58,237,0.6)', borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#64748b'}}, y:{grid:{display:false},ticks:{color:'#94a3b8'}} } } });
  }
}
