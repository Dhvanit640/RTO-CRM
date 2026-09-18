const apiBase = '/api/rto';

function getToken() { return localStorage.getItem('insurance-token'); }
function authGuard() { if (!getToken()) { window.location.href = 'index.html'; } }
function showMessage(message, type = 'success') { const el = document.getElementById('message'); if (el) { el.textContent = message; el.className = 'message ' + type; } }

async function loadVehicles() {
  const tbody = document.getElementById('vehicleTableBody');
  if (!tbody) return;
  const response = await fetch(`${apiBase}/all`);
  const data = await response.json();
  tbody.innerHTML = data.map(v => `
    <tr>
      <td>${v.owner_name}</td>
      <td>${v.vehicle_number}</td>
      <td>${v.vehicle_type}</td>
      <td>${v.rto_office}</td>
      <td>${v.insurance_expiry || 'N/A'}</td>
      <td><button onclick="deleteVehicle(${v.id})">Delete</button></td>
    </tr>
  `).join('');
}

async function deleteVehicle(id) {
  await fetch(`${apiBase}/delete/${id}`, { method: 'DELETE' });
  loadVehicles();
}

document.addEventListener('DOMContentLoaded', () => {
  authGuard();
  document.getElementById('userName').textContent = 'Admin';
  const form = document.getElementById('vehicleForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        owner_name: document.getElementById('owner_name').value,
        vehicle_number: document.getElementById('vehicle_number').value,
        vehicle_type: document.getElementById('vehicle_type').value,
        make: document.getElementById('make').value,
        model: document.getElementById('model').value,
        year: document.getElementById('year').value,
        engine_number: document.getElementById('engine_number').value,
        chassis_number: document.getElementById('chassis_number').value,
        rto_office: document.getElementById('rto_office').value,
        registration_date: document.getElementById('registration_date').value,
        fitness_expiry: document.getElementById('fitness_expiry').value,
        insurance_expiry: document.getElementById('insurance_expiry').value,
      };
      await fetch(`${apiBase}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      form.style.display = 'none';
      loadVehicles();
    });
  }
  loadVehicles();
});
