// ============================================================
// js/api.js — Shared API Utility
// SCENTÉ · Week 2
//
// HOW TO USE ON ANY PAGE:
//   <script src="../js/api.js"></script>   (load BEFORE other scripts)
//
// Provides:
//   api.get(path)           → GET  /api/{path}
//   api.post(path, body)    → POST /api/{path}
//   api.put(path, body)     → PUT  /api/{path}
//   api.delete(path)        → DELETE /api/{path}
//   api.patch(path, body)   → PATCH /api/{path}
//
// Features:
//   • Auto-attaches JWT Bearer header on all requests
//   • 401 → clears session + redirects to /pages/login.html
//   • 500 → shows toast error message
//   • Returns parsed JSON or throws with a readable message
// ============================================================

const API_BASE_URL = 'http://localhost:5123'; // Change to deployed URL when live

const api = (() => {

  // ── Get JWT token from sessionStorage ────────────────────
  function getToken() {
    const session = JSON.parse(sessionStorage.getItem('session') || 'null');
    return session?.token || null;
  }

  // ── Build headers ─────────────────────────────────────────
  function buildHeaders(includeBody = false) {
    const headers = {};

    if (includeBody) {
      headers['Content-Type'] = 'application/json';
    }

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // ── Core fetch wrapper ────────────────────────────────────
  async function request(method, path, body = null) {
    const url = `${API_BASE_URL}/${path.replace(/^\//, '')}`;
    const hasBody = body !== null && ['POST', 'PUT', 'PATCH'].includes(method);

    const options = {
      method,
      headers: buildHeaders(hasBody),
    };

    if (hasBody) {
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkError) {
      // Network failure (API down, no internet)
      if (typeof showToast === 'function') {
        showToast('Cannot reach the server. Please check your connection.', 'error');
      }
      throw new Error('Network error: ' + networkError.message);
    }

    // ── Handle 401 Unauthorized ───────────────────────────
    if (response.status === 401) {
      sessionStorage.removeItem('session');
      if (typeof showToast === 'function') {
        showToast('Session expired. Please sign in again.', 'error');
      }
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 1200);
      throw new Error('Unauthorized');
    }

    // ── Handle 403 Forbidden ──────────────────────────────
    if (response.status === 403) {
      if (typeof showToast === 'function') {
        showToast('You do not have permission to do that.', 'error');
      }
      throw new Error('Forbidden');
    }

    // ── Handle 500+ Server Errors ─────────────────────────
    if (response.status >= 500) {
      if (typeof showToast === 'function') {
        showToast('Something went wrong on the server. Try again later.', 'error');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    // ── Handle 404 Not Found ──────────────────────────────
    if (response.status === 404) {
      throw new Error('Not found');
    }

    // ── Handle 400 Bad Request ────────────────────────────
    if (response.status === 400) {
      let errorMsg = 'Bad request';
      try {
        const errData = await response.json();
        errorMsg = errData.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    // ── 204 No Content (DELETE, etc.) ─────────────────────
    if (response.status === 204) {
      return null;
    }

    // ── Parse JSON response ───────────────────────────────
    try {
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  // ── Public API methods ────────────────────────────────────
  return {
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    put:    (path, body)  => request('PUT',    path, body),
    patch:  (path, body)  => request('PATCH',  path, body),
    delete: (path)        => request('DELETE', path),
  };
})();

// Make available globally
window.api = api;