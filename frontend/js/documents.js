const apiBase = 'http://localhost:5000/api/documents';
function getToken() { return localStorage.getItem('insurance-token'); }
function authGuard() { if (!getToken()) { window.location.href = 'index.html'; } }

async function loadDocuments() {
  const grid = document.getElementById('documentGrid');
  if (!grid) return;
  const response = await fetch(`${apiBase}/all`);
  const data = await response.json();
  grid.innerHTML = data.map(doc => `
    <div class="card">
      <h3>${doc.document_type}</h3>
      <p>${doc.file_name}</p>
      <p>Customer: ${doc.full_name || 'N/A'}</p>
      <a href="http://localhost:5000${doc.file_path}" target="_blank">Preview</a>
      <a href="http://localhost:5000${doc.file_path}" download>Download</a>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  authGuard();
  document.getElementById('userName').textContent = 'Admin';
  const form = document.getElementById('documentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('file', document.getElementById('file').files[0]);
      formData.append('contact_id', document.getElementById('contact_id').value);
      formData.append('policy_id', document.getElementById('policy_id').value);
      formData.append('document_type', document.getElementById('document_type').value);
      formData.append('document_number', document.getElementById('document_number').value);
      formData.append('expiry_date', document.getElementById('expiry_date').value);
      formData.append('notes', document.getElementById('notes').value);
      await fetch(`${apiBase}/upload`, { method: 'POST', body: formData });
      loadDocuments();
    });
  }
  loadDocuments();
});
