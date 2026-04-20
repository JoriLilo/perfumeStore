document.addEventListener('DOMContentLoaded', () => {

  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      
  document.querySelectorAll(".error-message").forEach(e => e.textContent = "");
  document.querySelectorAll(".form-input").forEach(i => i.classList.remove("input-error"));

  const nameRegex = /^[A-Za-z]+$/;

  let valid = true;

  if (!firstName) {
  document.getElementById("firstNameError").textContent = "Name is required";
  document.getElementById("firstName").classList.add("input-error");
  valid = false;
} else if (!nameRegex.test(firstName)) {
  document.getElementById("firstNameError").innerHTML =
    `<i class="bi bi-exclamation-circle-fill error-icon"></i> Only letters allowed`;
  document.getElementById("firstName").classList.add("input-error");
  valid = false;
}

if (!lastName) {
  document.getElementById("lastNameError").textContent = "Surname is required";
  document.getElementById("lastName").classList.add("input-error");
  valid = false;
} else if (!nameRegex.test(lastName)) {
  document.getElementById("lastNameError").innerHTML =
    `<i class="bi bi-exclamation-circle-fill error-icon"></i> Only letters allowed`;
  document.getElementById("lastName").classList.add("input-error");
  valid = false;
}

  if (!email) {
    document.getElementById("emailError").textContent = "Email is required";
    document.getElementById("email").classList.add("input-error");
    valid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email && !emailPattern.test(email)) {
  document.getElementById("emailError").innerHTML =
    `<i class="bi bi-exclamation-circle-fill error-icon"></i> Enter a valid email address (example: email@email.com).`;

  document.getElementById("email").classList.add("input-error");
  valid = false;
}

  if (!password) {
    document.getElementById("passwordError").textContent = "Password is required";
    document.getElementById("password").classList.add("input-error");
    valid = false;
  }

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (password && !passwordPattern.test(password)) {
    document.getElementById("passwordError").innerHTML =
        `<i class="bi bi-exclamation-circle-fill error-icon"></i>Enter a secure password: at least 8 characters, including upper-case and lower-case letters and numbers.`;

    document.getElementById("password").classList.add("input-error");
    valid = false;
    }

  if (!confirmPassword) {
    document.getElementById("confirmError").textContent = "Confirm your password";
    document.getElementById("confirmPassword").classList.add("input-error");
    valid = false;
  }

  if (password && confirmPassword && password !== confirmPassword) {
    document.getElementById("confirmError").textContent = "Passwords do not match";
    document.getElementById("confirmPassword").classList.add("input-error");
    valid = false;
  }

  if (!valid) return;

      let users = JSON.parse(localStorage.getItem("users")) || [];

      const exists = users.find(user => user.email === email);

if (exists) {
  document.getElementById("emailError").innerHTML =
    `<i class="bi bi-exclamation-circle-fill error-icon"></i> This email is already registered. Try logging in.`;

  document.getElementById("email").classList.add("input-error");
  return;
}

      const newUser = {
        firstName,
        lastName,
        email,
        password,
        joinDate: new Date().toISOString().split("T")[0]
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      window.location.href = "login.html?registered=true";
    });
  }

  const loginForm = document.getElementById("login-form");

    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    document.querySelectorAll(".error-message").forEach(e => e.textContent = "");
    document.querySelectorAll(".form-input").forEach(i => i.classList.remove("input-error"));

    let valid = true;

    if (!email) {
      document.getElementById("loginEmailError").textContent = "Email is required";
      document.getElementById("loginEmail").classList.add("input-error");
      valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailPattern.test(email)) {
      document.getElementById("loginEmailError").innerHTML =
        `<i class="bi bi-exclamation-circle-fill error-icon"></i> Enter a valid email address (example: email@email.com).`;

      document.getElementById("loginEmail").classList.add("input-error");
      valid = false;
    }

    if (!password) {
      document.getElementById("loginPasswordError").textContent = "Password is required";
      document.getElementById("loginPassword").classList.add("input-error");
      valid = false;
    }

    if (!valid) return;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      document.getElementById("loginPasswordError").innerHTML =
        `<i class="bi bi-exclamation-circle-fill error-icon"></i> Invalid email or password`;

      document.getElementById("loginPassword").classList.add("input-error");
      return;
    }

    const session = {
      name: user.firstName,
      email: user.email,
      loggedIn: true
    };

    sessionStorage.setItem("session", JSON.stringify(session));

    window.location.href = "/index.html";
  });
}

  if (window.location.pathname.includes("login.html")) {
    const params = new URLSearchParams(window.location.search);

    if (params.get("registered") === "true") {
        showToast("Account created successfully!");  
    }
};


const loginPassword = document.getElementById("loginPassword");
const toggleLogin = document.getElementById("toggleLoginPassword");

if (loginPassword && toggleLogin) {
  toggleLogin.addEventListener("click", () => {
    const isHidden = loginPassword.type === "password";
    loginPassword.type = isHidden ? "text" : "password";

    toggleLogin.classList.toggle("bi-eye");
    toggleLogin.classList.toggle("bi-eye-slash");
  });
}

const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (password && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";

    togglePassword.classList.toggle("bi-eye");
    togglePassword.classList.toggle("bi-eye-slash");
  });
}

const confirmPassword = document.getElementById("confirmPassword");
const toggleConfirm = document.getElementById("toggleConfirmPassword");

if (confirmPassword && toggleConfirm) {
  toggleConfirm.addEventListener("click", () => {
    const isHidden = confirmPassword.type === "password";
    confirmPassword.type = isHidden ? "text" : "password";

    toggleConfirm.classList.toggle("bi-eye");
    toggleConfirm.classList.toggle("bi-eye-slash");
  });

}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

let users = JSON.parse(localStorage.getItem("users")) || [];

let updated = false;

users = users.map(user => {
  if (!user.joinDate) {
    updated = true;
    return {
      ...user,
      joinDate: new Date().toISOString().split("T")[0]
    };
  }
  return user;
});

if (updated) {
  localStorage.setItem("users", JSON.stringify(users));
}
})

const profileLink = document.getElementById("profile-link");

if (profileLink) {
  profileLink.addEventListener("click", function (e) {
    const session = JSON.parse(sessionStorage.getItem("session"));

    if (!session || !session.loggedIn) {
      e.preventDefault(); 
      window.location.href = "/pages/login.html";
    }
  });
}