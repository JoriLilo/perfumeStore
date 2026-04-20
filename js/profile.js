
document.addEventListener("DOMContentLoaded", () => {

  const session = JSON.parse(sessionStorage.getItem("session"));

  if (!session || !session.loggedIn) {
    window.location.href = "/pages/login.html";
    return;
  }

  const nameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const oldPwInput = document.getElementById("old-password");
  const newPwInput = document.getElementById("new-password");
  const confirmPwInput = document.getElementById("confirm-password");
  const profileForm = document.getElementById("profile-form");
  const avatarEl = document.getElementById("avatar-initials");

  function loadUserData() {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const currentUser = users.find(u => u.email === session.email);
    
    console.log("Session:", session);
    console.log("Current user from localStorage:", currentUser);
    
    let fullName = "";
    
    if (currentUser) {
      const firstName = currentUser.firstName || currentUser.firstname || currentUser.first_name || currentUser.name || "";
      const lastName = currentUser.lastName || currentUser.lastname || currentUser.last_name || currentUser.surname || "";
      
      fullName = `${firstName} ${lastName}`.trim();
      
      if (!fullName && session.name) {
        fullName = session.name;
      }
      
      if (!fullName && session.email) {
        fullName = session.email.split('@')[0];
      }
    } else {
      fullName = session.name || session.email?.split('@')[0] || "User";
    }
    
    nameInput.value = fullName;
    emailInput.value = session.email || "";
    
    if (avatarEl) {
      const parts = fullName.trim().split(/\s+/);
      const initials = parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join("");
      avatarEl.textContent = initials || "U";
    }
    
    oldPwInput.value = "";
    newPwInput.value = "";
    confirmPwInput.value = "";
  }
  
  loadUserData();

  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = btn.querySelector("i");
      
      if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash";
        btn.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        icon.className = "bi bi-eye";
        btn.setAttribute("aria-label", "Show password");
      }
    });
  });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = nameInput.value.trim();

    if (!newName) {
      showToast("Name cannot be empty.", "error");
      nameInput.focus();
      return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === session.email);

    if (userIndex === -1) {
      const newUser = {
        firstName: newName.split(' ')[0] || newName,
        lastName: newName.split(' ').slice(1).join(' ') || "",
        email: session.email,
        password: "",
        joinDate: new Date().toISOString().split("T")[0]
      };
      users.push(newUser);
    }

    const oldPw = oldPwInput.value;
    const newPw = newPwInput.value;
    const confirmPw = confirmPwInput.value;

    const wantsPasswordChange = oldPw || newPw || confirmPw;

    if (wantsPasswordChange) {
      if (!oldPw || !newPw || !confirmPw) {
        showToast("Fill in all password fields to change your password.", "error");
        return;
      }

      if (userIndex !== -1) {
        if (oldPw !== users[userIndex].password) {
          showToast("Current password is incorrect.", "error");
          oldPwInput.focus();
          return;
        }
      }

      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordPattern.test(newPw)) {
        showToast("Password needs 8+ chars, upper & lowercase, and a number.", "error");
        newPwInput.focus();
        return;
      }

      if (newPw !== confirmPw) {
        showToast("New passwords do not match.", "error");
        confirmPwInput.focus();
        return;
      }

      if (userIndex !== -1) {
        users[userIndex].password = newPw;
      }
    }

    if (userIndex !== -1) {
      const nameParts = newName.trim().split(/\s+/);
      users[userIndex].firstName = nameParts[0] || "";
      users[userIndex].lastName = nameParts.slice(1).join(" ") || "";
      users[userIndex].name = newName;
    }

    localStorage.setItem("users", JSON.stringify(users));

    session.name = newName;
    sessionStorage.setItem("session", JSON.stringify(session));

    if (avatarEl) {
      const parts = newName.trim().split(/\s+/);
      const initials = parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join("");
      avatarEl.textContent = initials || "U";
    }

    oldPwInput.value = "";
    newPwInput.value = "";
    confirmPwInput.value = "";

    document.querySelectorAll(".toggle-password i").forEach(icon => {
      icon.className = "bi bi-eye";
    });
    document.querySelectorAll(".toggle-password input, .password-wrapper input").forEach(input => {
      if (input.type === "text") input.type = "password";
    });

    showToast("Profile updated successfully!");
  });

});

function logout() {
  sessionStorage.removeItem("session");
  showToast("You have been logged out", "info");
  setTimeout(() => {
    window.location.href = "/index.html";
  }, 1000);
}

window.logout = logout;