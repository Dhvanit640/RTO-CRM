const apiBase = 'http://localhost:5000/api/agents';
function getToken() { return localStorage.getItem('insurance-token'); }
function authGuard() { if (!getToken()) { window.location.href = 'index.html'; } }

async function loadAgents() {
  const tbody = document.getElementById('agentTableBody');
  if (!tbody) return;
  const response = await fetch(`${apiBase}/all`);
  const data = await response.json();
  tbody.innerHTML = data.map(a => `
    <tr>
      <td>${a.agent_name}</td>
      <td>${a.agent_code}</td>
      <td>${a.email}</td>
      <td>${a.status}</td>
      <td><button onclick="deleteAgent(${a.id})">Delete</button></td>
    </tr>
  `).join('');
}

async function loadLeaderboard() {
  const el = document.getElementById('leaderboard');
  if (!el) return;
  const response = await fetch(`${apiBase}/leaderboard`);
  const data = await response.json();
  el.innerHTML = data.map(item => `<div class="stat-card"><h3>${item.agent_name}</h3><p>${item.policy_count} policies</p></div>`).join('');
}

async function deleteAgent(id) {
  await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
  loadAgents();
}

document.addEventListener('DOMContentLoaded', () => {
  authGuard();
  document.getElementById('userName').textContent = 'Admin';
  const form = document.getElementById('agentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        agent_name: document.getElementById('agent_name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        agent_code: document.getElementById('agent_code').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        joining_date: document.getElementById('joining_date').value,
        status: document.getElementById('status').value,
        commission_percent: document.getElementById('commission_percent').value,
      };
      await fetch(`${apiBase}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      loadAgents();
      loadLeaderboard();
    });
  }
  loadAgents();
  loadLeaderboard();
});
