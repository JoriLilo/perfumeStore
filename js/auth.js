// ============================================================
// js/auth.js — Authentication Logic
// SCENTÉ · Updated Week 2 (fixed)
//
// Changes from Week 1:
//   • Register & Login now call real API endpoints via api.js
//   • JWT token from API response is stored in sessionStorage
//   • session object now includes { token, userId, name, email, loggedIn }
//   • Kept same validation UX (inline errors, password toggles)
// ============================================================

// ── Helpers (top-level so they're always available) ─────────

// Show an inline error under a field and red-border the input.
function showFieldError(errorId, inputId, message, persistent = false) {
  const errEl = document.getElementById(errorId);
  const inEl  = document.getElementById(inputId);
  if (errEl) errEl.textContent = message;
  if (inEl)  inEl.classList.add('input-error');
}

// Lightweight toast that falls back to alert() if no toast() helper exists.
function showToastLocal(message) {
  if (typeof showToast === 'function') {
    showToast(message, 'error');
    return;
  }
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = message;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
  } else {
    alert(message);
  }
}

// Merge guest localStorage cart into the user's DB cart after login/register.
// Safe no-op if there's no guest cart, no merge endpoint, or it fails.
async function mergeGuestCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('scente_cart') || '[]');
    if (!Array.isArray(cart) || cart.length === 0) return;

    await api.post('api/cart/merge', { items: cart });
    localStorage.removeItem('scente_cart');
  } catch (err) {
    // Endpoint may not exist yet — don't block login/register flow.
    console.warn('Guest cart merge skipped:', err.message);
  }
}

// ── Page wiring ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Password show/hide toggles ────────────────────────────
  function wireToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input  = document.getElementById(inputId);
    if (!toggle || !input) return;
    toggle.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      toggle.className = showing ? 'bi bi-eye' : 'bi bi-eye-slash';
    });
  }
  wireToggle('togglePassword',        'password');
  wireToggle('toggleConfirmPassword', 'confirmPassword');
  wireToggle('toggleLoginPassword',   'loginPassword');

  // ── REGISTER ──────────────────────────────────────────────
  const registerForm = document.getElementById('register-form');

  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const firstName       = document.getElementById('firstName').value.trim();
      const lastName        = document.getElementById('lastName').value.trim();
      const email           = document.getElementById('email').value.trim();
      const password        = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Clear previous errors
      document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      document.querySelectorAll('.form-input').forEach(i => i.classList.remove('input-error'));

      const nameRegex = /^[A-Za-z]+$/;
      let valid = true;

      if (!firstName) {
        showFieldError('firstNameError', 'firstName', 'Name is required');
        valid = false;
      } else if (!nameRegex.test(firstName)) {
        showFieldError('firstNameError', 'firstName', 'Only letters allowed', true);
        valid = false;
      }

      if (!lastName) {
        showFieldError('lastNameError', 'lastName', 'Surname is required');
        valid = false;
      } else if (!nameRegex.test(lastName)) {
        showFieldError('lastNameError', 'lastName', 'Only letters allowed', true);
        valid = false;
      }

      if (!email) {
        showFieldError('emailError', 'email', 'Email is required');
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('emailError', 'email', 'Enter a valid email address (example: email@email.com).', true);
        valid = false;
      }

      if (!password) {
        showFieldError('passwordError', 'password', 'Password is required');
        valid = false;
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        showFieldError('passwordError', 'password', 'Enter a secure password: at least 8 characters, including upper-case and lower-case letters and numbers.', true);
        valid = false;
      }

      if (!confirmPassword) {
        showFieldError('confirmError', 'confirmPassword', 'Confirm your password');
        valid = false;
      } else if (password && confirmPassword && password !== confirmPassword) {
        showFieldError('confirmError', 'confirmPassword', 'Passwords do not match');
        valid = false;
      }

      if (!valid) return;

      // ── Call API ───────────────────────────────────────────
      try {
        const data = await api.post('api/auth/register', {
          firstName,
          lastName,
          email,
          password
        });

        const session = {
          token:    data.token,
          userId:   data.userId,
          name:     data.name,
          email:    data.email,
          loggedIn: true
        };
        sessionStorage.setItem('session', JSON.stringify(session));

        await mergeGuestCart();

        window.location.href = '/index.html';

      } catch (err) {
        if (err.message?.toLowerCase().includes('email')) {
          showFieldError('emailError', 'email', 'This email is already registered. Try logging in.', true);
        } else {
          showToastLocal(err.message || 'Registration failed. Please try again.');
        }
      }
    });
  }

  // ── LOGIN ─────────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      showToastLocal('Account created successfully!');
    }

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email    = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      document.querySelectorAll('.form-input').forEach(i => i.classList.remove('input-error'));

      let valid = true;
      if (!email) {
        showFieldError('loginEmailError', 'loginEmail', 'Email is required');
        valid = false;
      }
      if (!password) {
        showFieldError('loginPasswordError', 'loginPassword', 'Password is required');
        valid = false;
      }
      if (!valid) return;

      try {
        const data = await api.post('api/auth/login', { email, password });

        const session = {
          token:    data.token,
          userId:   data.userId,
          name:     data.name,
          email:    data.email,
          loggedIn: true
        };
        sessionStorage.setItem('session', JSON.stringify(session));

        await mergeGuestCart();

        window.location.href = '/index.html';

      } catch (err) {
        console.error('LOGIN FAILED', err);
        showFieldError('loginPasswordError', 'loginPassword', 'Invalid email or password', true);
      }
    });
  }

});