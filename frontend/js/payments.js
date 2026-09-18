const apiBase = '/api/payments';
function getToken() { return localStorage.getItem('insurance-token'); }
function authGuard() { if (!getToken()) { window.location.href = 'index.html'; } }

async function loadSummary() {
  const el = document.getElementById('paymentsSummary');
  if (!el) return;
  const response = await fetch(`${apiBase}/summary`);
  const data = await response.json();
  el.innerHTML = `
    <div class="stat-card"><h3>Total Collected Today</h3><p>₹${Number(data.today || 0).toLocaleString()}</p></div>
    <div class="stat-card"><h3>Total Collected This Month</h3><p>₹${Number(data.month || 0).toLocaleString()}</p></div>
    <div class="stat-card"><h3>Pending Payments</h3><p>${data.pending}</p></div>
    <div class="stat-card"><h3>Total Revenue</h3><p>₹${Number(data.total || 0).toLocaleString()}</p></div>
  `;
}

async function loadPayments() {
  const tbody = document.getElementById('paymentTableBody');
  if (!tbody) return;
  const response = await fetch(`${apiBase}/all`);
  const data = await response.json();
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.full_name || 'N/A'}</td>
      <td>${p.policy_type || 'N/A'}</td>
      <td>₹${p.amount}</td>
      <td>${p.payment_status}</td>
      <td><a href="/api/payments/receipt/${p.id}" target="_blank">Receipt</a></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  authGuard();
  document.getElementById('userName').textContent = 'Admin';
  const form = document.getElementById('paymentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        contact_id: document.getElementById('contact_id').value,
        policy_id: document.getElementById('policy_id').value,
        policy_type: document.getElementById('policy_type').value,
        policy_number: document.getElementById('policy_number').value,
        payment_date: document.getElementById('payment_date').value,
        amount: document.getElementById('amount').value,
        payment_mode: document.getElementById('payment_mode').value,
        payment_status: document.getElementById('payment_status').value,
        transaction_id: document.getElementById('transaction_id').value,
        receipt_number: document.getElementById('receipt_number').value,
        notes: document.getElementById('notes').value,
      };
      await fetch(`${apiBase}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      loadSummary();
      loadPayments();
    });
  }
  loadSummary();
  loadPayments();
});
