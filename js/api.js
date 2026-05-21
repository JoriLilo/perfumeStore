// ============================================================
// js/api.js — Shared API Utility
// SCENTÉ
//
// Load this script before any page-specific JS that calls the API.
// <script src="/js/api.js"></script>
//
// Usage:
//   const products = await api.get('/products?pageSize=4');
//   const result   = await api.post('/auth/login', { email, password });
//   await api.put('/users/me', { firstName, lastName });
//   await api.delete('/wishlist/5');
// ============================================================

const BASE_URL = 'http://localhost:5123/api';  // ← update to deployed URL in production

// ── Token helpers ─────────────────────────────────────────
function getToken() {
  return localStorage.getItem('scente_token');
}

function setToken(token) {
  localStorage.setItem('scente_token', token);
}

function clearToken() {
  localStorage.removeItem('scente_token');
}

function isLoggedIn() {
  return !!getToken();
}

// ── Core request ──────────────────────────────────────────
async function request(method, path, body = null) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    // Network error (server down, no internet)
    showToast?.('Connection error. Please try again.', 'error');
    throw err;
  }

  // ── 401: token expired or invalid → force logout ────────
  if (response.status === 401) {
    clearToken();
    showToast?.('Session expired. Please sign in again.', 'error');
    setTimeout(() => {
      window.location.href = '/pages/login.html';
    }, 1500);
    throw new Error('Unauthorized');
  }

  // ── 403: not allowed ────────────────────────────────────
  if (response.status === 403) {
    showToast?.('You do not have permission to do that.', 'error');
    throw new Error('Forbidden');
  }

  // ── 500: server error ───────────────────────────────────
  if (response.status >= 500) {
    showToast?.('Something went wrong. Please try again later.', 'error');
    throw new Error('Server error');
  }

  // ── Parse response ───────────────────────────────────────
  // Some endpoints return 204 No Content (e.g. DELETE)
  if (response.status === 204) return null;

  const json = await response.json();

  // ── Non-2xx with a JSON body (e.g. 400 validation errors) ─
  if (!response.ok) {
    const message = json?.message || 'An error occurred.';
    showToast?.(message, 'error');
    throw new Error(message);
  }

  // Return the data field if the API wraps responses, otherwise return as-is
  return json?.data !== undefined ? json.data : json;
}

// ── Public API surface ────────────────────────────────────
const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
};

// ── Auth helpers (used by auth.js, navbar, etc.) ──────────
function saveSession(token, name, email) {
  setToken(token);
  sessionStorage.setItem('session', JSON.stringify({ loggedIn: true, name, email }));
}

function logout() {
  clearToken();
  sessionStorage.removeItem('session');
  window.location.href = '/index.html';
}

// ── Auth guard — call at top of any protected page ────────
// Usage: requireAuth();  ← redirects to login if not logged in
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/login.html';
  }
}

// Expose to global scope
window.api        = api;
window.saveSession = saveSession;
window.logout     = logout;
window.isLoggedIn = isLoggedIn;
window.requireAuth = requireAuth;