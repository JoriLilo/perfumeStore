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
  window.location.href = "/pages/login.html";
  }

  // ── DOM refs ─────────────────────────────────────────────
  const nameInput     = document.getElementById("full-name");
  const emailInput    = document.getElementById("email");
  const oldPwInput    = document.getElementById("old-password");
  const newPwInput    = document.getElementById("new-password");
  const confirmPwInput = document.getElementById("confirm-password");
  const profileForm   = document.querySelector(".profile-card form");
  const avatarEl      = document.querySelector(".avatar-placeholder span");

  // ── Populate form with current user data ─────────────────
  nameInput.value  = session.name  || "";
  emailInput.value = session.email || "";

  // Set avatar initials from user name
  if (avatarEl && session.name) {
    const parts = session.name.trim().split(/\s+/);
    const initials = parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join("");
    avatarEl.textContent = initials;
  }

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