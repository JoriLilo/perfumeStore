// ============================================================
// js/profile.js — Profile Page Logic
// Parfum · Handles profile form population, editing & password change
//
// Uses the same auth pattern as auth.js:
//   - sessionStorage "session"  → current logged-in user
//   - localStorage   "users"   → array of all registered users
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ── Auth guard — redirect to login if not signed in ──────
  const session = JSON.parse(sessionStorage.getItem("session"));

  if (!session || !session.loggedIn) {
    window.location.href = "login.html";
    return;
  }

  // ── DOM refs ─────────────────────────────────────────────
  const nameInput     = document.getElementById("full-name");
  const emailInput    = document.getElementById("email");
  const oldPwInput    = document.getElementById("old-password");
  const newPwInput    = document.getElementById("new-password");
  const confirmPwInput = document.getElementById("confirm-password");
  const profileForm   = document.querySelector(".profile-card form");
  const avatarEl      = document.querySelector(".avatar-placeholder span");

  // ── Force-clear password fields (browsers autofill these even with autocomplete=off) ──
  oldPwInput.value     = "";
  newPwInput.value     = "";
  confirmPwInput.value = "";

  // ── Populate form with current user data ─────────────────
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find(u => u.email === session.email);

  // DEBUG — open browser console (F12) to see what properties your user actually has
  console.log("Current user object from localStorage:", currentUser);
  console.log("Session object:", session);

  // Build the full name by checking every common combination of first/last name fields.
  // Covers: firstName+lastName, firstname+lastname, first_name+last_name,
  //         name+surname, name+lastName, fname+lname, given_name+family_name
  function buildFullName(user) {
    if (!user) return "";

    const first =
      user.firstName || user.firstname || user.first_name ||
      user.fname     || user.given_name || user.first      || "";

    const last =
      user.lastName  || user.lastname  || user.last_name  ||
      user.surname   || user.lname     || user.family_name || user.last || "";

    // If we found both parts, join them
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;

    // Fallback: single `name` or `fullName` field
    return user.fullName || user.full_name || user.name || "";
  }

  let fullName = buildFullName(currentUser);
  if (!fullName) fullName = buildFullName(session);

  nameInput.value  = fullName;
  emailInput.value = session.email || "";

  // Set avatar initials from the full name
  if (avatarEl && fullName) {
    const parts = fullName.trim().split(/\s+/);
    const initials = parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join("");
    avatarEl.textContent = initials;
  }

  // ── Show / Hide password toggle (works for all 3 fields) ──
  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const eyeIcon = btn.querySelector(".icon-eye");
      const eyeOffIcon = btn.querySelector(".icon-eye-off");

      if (input.type === "password") {
        input.type = "text";
        eyeIcon.style.display = "none";
        eyeOffIcon.style.display = "block";
        btn.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        eyeIcon.style.display = "block";
        eyeOffIcon.style.display = "none";
        btn.setAttribute("aria-label", "Show password");
      }
    });
  });

  // ── Form submit — save changes ───────────────────────────
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = nameInput.value.trim();

    // — Basic validation —
    if (!newName) {
      showToast("Name cannot be empty.", "error");
      nameInput.focus();
      return;
    }

    // — Grab users array from localStorage —
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === session.email);

    if (userIndex === -1) {
      showToast("User not found. Please log in again.", "error");
      return;
    }

    // — Handle password change (only if any password field is filled) —
    const oldPw    = oldPwInput.value;
    const newPw    = newPwInput.value;
    const confirmPw = confirmPwInput.value;

    const wantsPasswordChange = oldPw || newPw || confirmPw;

    if (wantsPasswordChange) {
      // All three fields must be filled
      if (!oldPw || !newPw || !confirmPw) {
        showToast("Fill in all password fields to change your password.", "error");
        return;
      }

      // Verify current password
      if (oldPw !== users[userIndex].password) {
        showToast("Current password is incorrect.", "error");
        oldPwInput.focus();
        return;
      }

      // Validate new password strength (same rule as register)
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordPattern.test(newPw)) {
        showToast("New password needs 8+ chars, upper & lowercase, and a number.", "error");
        newPwInput.focus();
        return;
      }

      // Confirm match
      if (newPw !== confirmPw) {
        showToast("New passwords do not match.", "error");
        confirmPwInput.focus();
        return;
      }

      // Update password
      users[userIndex].password = newPw;
    }

    // — Update name —
    users[userIndex].name = newName;
    localStorage.setItem("users", JSON.stringify(users));

    // — Update session —
    session.name = newName;
    sessionStorage.setItem("session", JSON.stringify(session));

    // — Update avatar initials —
    if (avatarEl) {
      const parts = newName.trim().split(/\s+/);
      const initials = parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join("");
      avatarEl.textContent = initials;
    }

    // — Clear password fields —
    oldPwInput.value    = "";
    newPwInput.value    = "";
    confirmPwInput.value = "";

    showToast("Profile updated successfully!");
  });
});