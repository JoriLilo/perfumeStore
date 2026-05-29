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
  // ── LOGIN ────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');

if (loginForm) {

  console.log("Login form found");

  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === 'true') {
    showToastLocal('Account created successfully!');
  }

  loginForm.addEventListener('submit', async function (e) {

    e.preventDefault();

    console.log("LOGIN SUBMIT TRIGGERED");

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    console.log("Email:", email);
    console.log("Password length:", password?.length);

    document.querySelectorAll('.error-message')
      .forEach(el => el.textContent = '');

    document.querySelectorAll('.form-input')
      .forEach(i => i.classList.remove('input-error'));

    let valid = true;

    if (!email) {
      console.log("Email missing");
      showFieldError('loginEmailError', 'loginEmail', 'Email is required');
      valid = false;
    }

    if (!password) {
      console.log("Password missing");
      showFieldError('loginPasswordError', 'loginPassword', 'Password is required');
      valid = false;
    }

    if (!valid) {
      console.log("Validation failed");
      return;
    }

    try {

      console.log("Sending login request...");

      const data = await api.post('api/auth/login', {
        email,
        password
      });

      console.log("LOGIN SUCCESS");
      console.log(data);

      const session = {
        token: data.token,
        name: data.name,
        email: data.email,
        loggedIn: true
      };

      sessionStorage.setItem(
        'session',
        JSON.stringify(session)
      );

      console.log("Session saved");

      window.location.href = '/index.html';

    } catch (err) {

      console.error("LOGIN FAILED");
      console.error(err);

      showFieldError(
        'loginPasswordError',
        'loginPassword',
        'Invalid email or password',
        true
      );
    }
  });
}
loginForm.addEventListener('submit', async function (e) {

    console.log("STEP 1 - submit fired");

    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    console.log("STEP 2 - values read");
    console.log(email);
    console.log(password);

    try {

        console.log("STEP 3 - before api call");

        const data = await api.post('api/auth/login', {
            email,
            password
        });

        console.log("STEP 4 - login success");
        console.log(data);

    } catch (err) {

        console.log("STEP 5 - login failed");
        console.error(err);

    }
});



});
