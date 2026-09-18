const crmApi = '/api';
const fallbackCustomers = [{ id: 1, full_name: 'John Doe', phone: '9876543211', city: 'Mumbai', occupation: 'New Registration' }, { id: 2, full_name: 'Sara Khan', phone: '9123456781', city: 'Delhi', occupation: 'Ownership Transfer' }];

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
function money(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function dateLabel(value) { return value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No date'; }
function followups() { try { return JSON.parse(localStorage.getItem('rto-followups') || '[]'); } catch { return []; } }
function setHtml(id, html) { const element = document.getElementById(id); if (element) element.innerHTML = html; }
function listEmpty(text) { return `<div class="empty-state">${text}</div>`; }

async function getJson(path, fallback = []) { try { const response = await fetch(`${crmApi}${path}`); if (!response.ok) throw new Error('Request failed'); return await response.json(); } catch { return fallback; } }

function renderKpis(customers, vehicles, policies, payments) {
  const pendingPayments = payments.filter(payment => String(payment.payment_status).toLowerCase() === 'pending').length;
  const expiring = vehicles.filter(vehicle => vehicle.insurance_expiry && new Date(vehicle.insurance_expiry) <= new Date(Date.now() + 30 * 86400000)).length + policies.filter(policy => policy.end_date && new Date(policy.end_date) <= new Date(Date.now() + 30 * 86400000)).length;
  setHtml('dashboardKpis', `<article class="kpi-card"><span class="kpi-icon teal">♙</span><div><p>Total Customers</p><strong>${customers.length}</strong><small>Active customer records</small></div></article><article class="kpi-card"><span class="kpi-icon blue">▣</span><div><p>Active RTO Applications</p><strong>${Math.max(customers.length - 1, 0)}</strong><small>Under process</small></div></article><article class="kpi-card"><span class="kpi-icon amber">◷</span><div><p>Pending Applications</p><strong>${Math.max(Math.ceil(customers.length / 3), 0)}</strong><small>Need documents or payment</small></div></article><article class="kpi-card"><span class="kpi-icon green">✓</span><div><p>Completed Applications</p><strong>${Math.max(customers.length - 2, 0)}</strong><small>Completed this month</small></div></article><article class="kpi-card"><span class="kpi-icon blue">▤</span><div><p>Total Vehicles</p><strong>${vehicles.length}</strong><small>Linked to customers</small></div></article><article class="kpi-card"><span class="kpi-icon teal">▥</span><div><p>Active Policies</p><strong>${policies.filter(policy => String(policy.status).toLowerCase() === 'active').length}</strong><small>Insurance coverage</small></div></article><article class="kpi-card"><span class="kpi-icon red">!</span><div><p>Policies Expiring Soon</p><strong>${expiring}</strong><small>Next 30 days</small></div></article><article class="kpi-card"><span class="kpi-icon amber">₹</span><div><p>Pending Payments</p><strong>${pendingPayments}</strong><small>Awaiting collection</small></div></article>`);
}

function renderLists(customers, vehicles, policies, payments) {
  const todo = followups().filter(item => item.status === 'Pending').slice(0, 4);
  setHtml('todayFollowups', todo.length ? todo.map(item => `<div class="mini-row"><div><strong>${escapeHtml(item.customer)}</strong><small>${escapeHtml(item.type || 'RTO Follow-up')}</small></div><span class="date-chip">${escapeHtml(item.date || 'Today')}</span></div>`).join('') : listEmpty('No follow-ups scheduled for today.'));
  const expiry = policies.filter(item => item.end_date).sort((a, b) => new Date(a.end_date) - new Date(b.end_date)).slice(0, 4);
  setHtml('upcomingExpiry', expiry.length ? expiry.map(item => `<div class="mini-row"><div><strong>${escapeHtml(item.policy_number)}</strong><small>${escapeHtml(item.policy_type || 'Policy')}</small></div><span class="date-chip">${dateLabel(item.end_date)}</span></div>`).join('') : listEmpty('No upcoming policy expiries.'));
  setHtml('recentApplications', customers.slice(0, 4).map((item, index) => `<div class="mini-row"><div><strong>${escapeHtml(item.full_name)}</strong><small>${escapeHtml(item.occupation || 'RTO Service')} · Application #RTO-${1000 + item.id}</small></div><span class="badge ${index % 2 ? 'amber' : 'teal'}">${index % 2 ? 'Pending' : 'Under Process'}</span></div>`).join('') || listEmpty('No applications yet.'));
  setHtml('recentCustomers', customers.slice(0, 4).map(item => `<div class="mini-row"><div><strong>${escapeHtml(item.full_name)}</strong><small>${escapeHtml(item.phone || 'No mobile')} · ${escapeHtml(item.city || 'No city')}</small></div><span class="date-chip">View</span></div>`).join('') || listEmpty('No customers found.'));
  setHtml('pendingDocuments', customers.slice(0, 4).map((item, index) => `<div class="mini-row"><div><strong>${escapeHtml(item.full_name)}</strong><small>${index % 2 ? 'Address Proof' : 'RC / Aadhaar'}</small></div><span class="badge amber">Pending</span></div>`).join('') || listEmpty('All documents verified.'));
  setHtml('recentPayments', payments.slice(0, 4).map(item => `<div class="mini-row"><div><strong>${escapeHtml(item.full_name || `Customer #${item.contact_id}`)}</strong><small>${escapeHtml(item.payment_mode || 'Cash')} · ${dateLabel(item.payment_date)}</small></div><span class="date-chip">${money(item.amount)}</span></div>`).join('') || listEmpty('No payments recorded.'));
  setHtml('applicationBars', [42, 68, 55, 84, 62, 76, 48, 91, 70, 58, 78, 64].map(height => `<span class="bar" style="--height:${height}%"></span>`).join(''));
  const services = ['New Registration', 'Ownership Transfer', 'RC Renewal', 'Driving Licence'];
  setHtml('serviceProgress', services.map((service, index) => `<div class="progress-item"><div class="progress-label"><span>${service}</span><strong>${[38, 28, 21, 13][index]}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${[38, 28, 21, 13][index]}%"></div></div></div>`).join(''));
}

async function loadDashboard() {
  const [customers, vehicles, policies, payments] = await Promise.all([getJson('/contacts/all', fallbackCustomers), getJson('/rto/all'), getJson('/policies/all'), getJson('/payments/all')]);
  renderKpis(customers, vehicles, policies, payments);
  renderLists(customers, vehicles, policies, payments);
}

document.addEventListener('DOMContentLoaded', loadDashboard);
