// frontend/js/auth.js

(() => {
  /**
   * Show an error box with a message.
   * @param {string} boxId - DOM element id of the error box
   * @param {string} msg - Error message to display
   */
  function showError(boxId, msg) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.textContent = msg;
    box.classList.remove("d-none");
  }

  /**
   * Hide an error box.
   * @param {string} boxId - DOM element id of the error box
   */
  function hideError(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.textContent = "";
    box.classList.add("d-none");
  }

  /**
   * Save auth session data in localStorage.
   * @param {{token:string, role:string, id:number, fullName:string, email:string}} result
   */
  function saveSession(result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(ROLE_KEY, result.role);
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: result.id,
      fullName: result.fullName,
      email: result.email
    }));
  }

  /**
   * Redirect user after login based on their role.
   * Admin -> admin-dashboard.html
   * User  -> home.html
   * @param {string} role
   */
  function redirectByRole(role) {
    window.location.href = role === "Admin"
      ? "admin-dashboard.html"
      : "home.html";
  }

  /**
   * Handle login form submit.
   */
  async function handleLogin() {
    hideError("loginError");

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    if (!email || !password) {
      showError("loginError", "Please enter email and password.");
      return;
    }

    try {
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password }
      });

      saveSession(result);
      redirectByRole(result.role);
    } catch (e) {
      showError("loginError", e.message);
    }
  }

  /**
   * Handle register form submit.
   */
  async function handleRegister() {
    hideError("registerError");

    const fullName = document.getElementById("regFullName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;

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
      saveSession(result);
      window.location.href = "home.html";
    } catch (e) {
      showError("registerError", e.message);
    }
  }

  // Bind buttons if present on the page
  document.getElementById("loginBtn")?.addEventListener("click", handleLogin);
  document.getElementById("registerBtn")?.addEventListener("click", handleRegister);
})();