function showError(boxId, msg) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = msg;
  box.classList.remove("d-none");
}

function hideError(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = "";
  box.classList.add("d-none");
}

async function handleLogin() {
  hideError("loginError");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showError("loginError", "Please enter email and password.");
    return;
  }

  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password }
    });

    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(ROLE_KEY, result.role);
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: result.id,
      fullName: result.fullName,
      email: result.email
    }));

    // Redirect based on role
    if (result.role === "Admin") {
      window.location.href = "admin-dashboard.html"; // لاحقًا
    } else {
      window.location.href = "home.html"; // لاحقًا
    }
  } catch (e) {
    showError("loginError", e.message);
  }
}

async function handleRegister() {
  hideError("registerError");

  const fullName = document.getElementById("regFullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!fullName || !email || !password) {
    showError("registerError", "Please fill in all fields.");
    return;
  }

  try {
    const result = await apiFetch("/auth/register", {
      method: "POST",
      body: { fullName, email, password }
    });

    // Auto-login after register
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(ROLE_KEY, result.role);
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: result.id,
      fullName: result.fullName,
      email: result.email
    }));

    window.location.href = "home.html";
  } catch (e) {
    showError("registerError", e.message);
  }
}

// Attach events if buttons exist on the page
document.getElementById("loginBtn")?.addEventListener("click", handleLogin);
document.getElementById("registerBtn")?.addEventListener("click", handleRegister);