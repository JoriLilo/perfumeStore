// ============================================================
// js/auth.js — Authentication Logic
// SCENTÉ · Updated Week 2
//
// Changes from Week 1:
//   • Register & Login now call real API endpoints via api.js
//   • JWT token from API response is stored in sessionStorage
//   • session object now includes { token, name, email, loggedIn }
//   • Kept same validation UX (inline errors, password toggles)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── REGISTER ─────────────────────────────────────────────
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

      // ── Call API ────────────────────────────────────────
      try {
        const data = await api.post('api/auth/register', {
          firstName,
          lastName,
          email,
          password
        });

        // Save session with JWT token
       const session = {
          token:    data.token,
          name:     data.name,
          email:    data.email,
          loggedIn: true
        };
        sessionStorage.setItem('session', JSON.stringify(session));

        // Merge guest cart into DB cart before redirecting
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


  // ── LOGIN ────────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');

  if (loginForm) {

    // Show success toast if coming from registration
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      showToastLocal('Account created successfully!');
    }

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      // Clear previous errors
      document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      document.querySelectorAll('.form-input').forEach(i => i.classList.remove('input-error'));

      let valid = true;

      if (!email) {
        showFieldError('loginEmailError', 'loginEmail', 'Email is required');
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('loginEmailError', 'loginEmail', 'Enter a valid email address (example: email@email.com).', true);
        valid = false;
      }

      if (!password) {
        showFieldError('loginPasswordError', 'loginPassword', 'Password is required');
        valid = false;
      }

      if (!valid) return;

      // ── Call API ────────────────────────────────────────
      try {
        const data = await api.post('api/auth/login', { email, password });

        // Save session with JWT token
        const session = {
          token:    data.token,
          name:     data.name,
          email:    data.email,
          loggedIn: true
        };
        sessionStorage.setItem('session', JSON.stringify(session));

        window.location.href = '/index.html';

      } catch (err) {
        showFieldError('loginPasswordError', 'loginPassword', 'Invalid email or password', true);
      }
    });
  }


  // ── PASSWORD TOGGLES ─────────────────────────────────────
  setupPasswordToggle('loginPassword',   'toggleLoginPassword');
  setupPasswordToggle('password',        'togglePassword');
  setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

});


// ── Profile link guard ────────────────────────────────────
const profileLink = document.getElementById('profile-link');
if (profileLink) {
  profileLink.addEventListener('click', function (e) {
    const session = JSON.parse(sessionStorage.getItem('session') || 'null');
    if (!session || !session.loggedIn) {
      e.preventDefault();
      window.location.href = '/pages/login.html';
    }
  });
}


// ── Helpers ───────────────────────────────────────────────
function showFieldError(errorId, inputId, message, withIcon = false) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);

  if (errorEl) {
    errorEl.innerHTML = withIcon
      ? `<i class="bi bi-exclamation-circle-fill error-icon"></i> ${message}`
      : message;
  }
  if (inputEl) inputEl.classList.add('input-error');
}

function setupPasswordToggle(inputId, toggleId) {
  const input  = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  toggle.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.classList.toggle('bi-eye',       !isHidden);
    toggle.classList.toggle('bi-eye-slash', isHidden);
  });
}

function showToastLocal(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  } else if (typeof showToast === 'function') {
    showToast(message, 'success');
  }
}

async function mergeGuestCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('scente_cart') || '[]');
    if (cart.length === 0) return;

    // Map localStorage cart items to the shape the API expects
    const guestItems = cart
      .filter(item => item.name && item.price)
      .map(item => ({
        productId: item.id || item.productId,
        size:      item.size || '50ml',
        quantity:  item.qty  || item.quantity || 1
      }))
      .filter(item => item.productId);

    if (guestItems.length === 0) return;

    await api.post('api/cart/merge', guestItems);

    // Clear localStorage cart after successful merge
    localStorage.removeItem('scente_cart');
  } catch (err) {
    console.warn('Cart merge failed:', err);
    // Non-critical — user can still shop, just don't block login
  }
}