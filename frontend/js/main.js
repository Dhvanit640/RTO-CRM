const policies = [
  {
    name: 'Car Insurance',
    description: 'Complete protection for private vehicles, roadside assistance, and accident cover.',
    icon: '🚗',
    premium: 'From $25/mo',
  },
  {
    name: 'Bike Insurance',
    description: 'Affordable plans for daily commutes with theft, damage, and liability cover.',
    icon: '🏍️',
    premium: 'From $15/mo',
  },
  {
    name: 'Truck Insurance',
    description: 'Commercial-grade coverage for cargo transport, liability, and fleet operations.',
    icon: '🚚',
    premium: 'From $40/mo',
  },
  {
    name: 'Home Insurance',
    description: 'Safeguard your property and valuables from unexpected events and disasters.',
    icon: '🏠',
    premium: 'From $35/mo',
  },
  {
    name: 'Health Insurance',
    description: 'Flexible wellness and medical plans that support you and your loved ones.',
    icon: '🩺',
    premium: 'From $30/mo',
  },
  {
    name: 'Life Insurance',
    description: 'Long-term support for your family with secure financial planning options.',
    icon: '🌿',
    premium: 'From $20/mo',
  },
];

const apiBase = 'http://localhost:5000/api/auth';

function showMessage(element, message, type = 'success') {
  if (!element) return;
  element.textContent = message;
  element.className = `message ${type}`;
}

function setLoading(button, isLoading, text) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Please wait...' : text;
}

function getStoredToken() {
  return localStorage.getItem('insurance-token');
}

function redirectToDashboard() {
  window.location.href = 'dashboard.html';
}

function isAuthPage() {
  return ['index.html', 'register.html', 'otp.html'].includes(window.location.pathname.split('/').pop());
}

function checkAuth() {
  const token = getStoredToken();
  if (!token && window.location.pathname.includes('dashboard.html')) {
    window.location.href = 'index.html';
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const messageBox = form.querySelector('#message');
  const button = form.querySelector('button[type="submit"]');
  const payload = {
    email: form.querySelector('#email').value.trim(),
    password: form.querySelector('#password').value,
  };

  setLoading(button, true, 'Login');
  try {
    const response = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Login failed');
    localStorage.setItem('insurance-token', result.token);
    showMessage(messageBox, 'Login successful. Redirecting...', 'success');
    setTimeout(redirectToDashboard, 600);
  } catch (error) {
    showMessage(messageBox, error.message, 'error');
  } finally {
    setLoading(button, false, 'Login');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const messageBox = form.querySelector('#message');
  const button = form.querySelector('button[type="submit"]');
  const payload = {
    name: form.querySelector('#name').value.trim(),
    email: form.querySelector('#email').value.trim(),
    password: form.querySelector('#password').value,
    confirmPassword: form.querySelector('#confirmPassword').value,
  };

  if (payload.password.length < 6) {
    showMessage(messageBox, 'Password must be at least 6 characters long.', 'error');
    return;
  }

  setLoading(button, true, 'Send OTP');
  try {
    const response = await fetch(`${apiBase}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Registration failed');
    sessionStorage.setItem('otp-email', result.email);
    showMessage(messageBox, 'Registration successful. Redirecting to OTP verification...', 'success');
    setTimeout(() => window.location.href = 'otp.html', 600);
  } catch (error) {
    showMessage(messageBox, error.message, 'error');
  } finally {
    setLoading(button, false, 'Send OTP');
  }
}

async function handleOtp(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const messageBox = form.querySelector('#message');
  const button = form.querySelector('button[type="submit"]');
  const email = sessionStorage.getItem('otp-email') || '';
  const otp = form.querySelector('#otp').value.trim();

  if (!email) {
    showMessage(messageBox, 'Registration session expired. Please register again.', 'error');
    return;
  }

  setLoading(button, true, 'Verify OTP');
  try {
    const response = await fetch(`${apiBase}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Verification failed');
    sessionStorage.removeItem('otp-email');
    showMessage(messageBox, 'Account verified. Redirecting to login...', 'success');
    setTimeout(() => window.location.href = 'index.html', 800);
  } catch (error) {
    showMessage(messageBox, error.message, 'error');
  } finally {
    setLoading(button, false, 'Verify OTP');
  }
}

function renderDashboard() {
  // Policy cards removed from dashboard
}

async function handleLogout() {
  try {
    await fetch(`${apiBase}/logout`);
  } catch (error) {
    console.error(error);
  } finally {
    localStorage.removeItem('insurance-token');
    window.location.href = 'index.html';
  }
}

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const passwordInput = toggle.closest('.password-field').querySelector('input');
      const shouldShow = passwordInput.type === 'password';
      passwordInput.type = shouldShow ? 'text' : 'password';
      toggle.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
      toggle.setAttribute('aria-pressed', String(shouldShow));
    });
  });
}

function setupSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.querySelector('.sidebar-toggle')) return;

  const brand = sidebar.querySelector('.brand');
  if (brand && !brand.querySelector('.brand-mark')) {
    const brandName = brand.textContent.trim() || 'SureGuard';
    brand.innerHTML = `<span class="brand-mark">SG</span><span class="brand-label">${brandName}</span>`;
  }

  sidebar.querySelectorAll('nav a').forEach((link) => {
    const originalText = link.textContent.trim();
    const icon = originalText.match(/^\S+/)?.[0] || '•';
    const label = originalText.replace(/^\S+\s*/, '');
    link.dataset.icon = icon;
    link.dataset.tooltip = label;
    link.setAttribute('aria-label', label);
    link.innerHTML = `<span class="sidebar-icon" aria-hidden="true">${icon}</span><span class="sidebar-label">${label}</span>`;
  });

  const toggle = document.createElement('button');
  toggle.className = 'sidebar-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Collapse sidebar');
  sidebar.appendChild(toggle);

  const setCollapsed = (collapsed) => {
    sidebar.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    toggle.textContent = collapsed ? '›' : '‹';
    localStorage.setItem('sureguard-sidebar-collapsed', String(collapsed));
  };

  toggle.addEventListener('click', () => setCollapsed(!sidebar.classList.contains('is-collapsed')));
  setCollapsed(localStorage.getItem('sureguard-sidebar-collapsed') === 'true');
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupPasswordToggles();
  setupSidebarToggle();
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const otpForm = document.getElementById('otpForm');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (otpForm) otpForm.addEventListener('submit', handleOtp);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  if (window.location.pathname.includes('dashboard.html')) {
    if (!getStoredToken()) {
      window.location.href = 'index.html';
      return;
    }
    renderDashboard();
  }

  if (window.location.pathname.includes('otp.html') && !sessionStorage.getItem('otp-email')) {
    window.location.href = 'register.html';
  }

  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    if (getStoredToken()) redirectToDashboard();
  }
});
