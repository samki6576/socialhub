// Global state
let token = localStorage.getItem('token');
let currentUser = null;

// API helpers
const API = '/api';
const headers = () => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` })
});

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 3000);
}

// Auth check
async function checkAuth() {
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }
  try {
    const res = await fetch(`${API}/auth/me`, { headers: headers() });
    if (!res.ok) throw new Error('Unauthorized');
    currentUser = await res.json();
    return true;
  } catch (err) {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    return false;
  }
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }
});

// Expose for other scripts
window.token = token;
window.currentUser = currentUser;
window.headers = headers;
window.showToast = showToast;
window.checkAuth = checkAuth;
