// frontend/js/auth.js

(() => {
  /* --------------------------------------------------
     DOM references (optional per page)
     - login page uses login fields
     - register page uses register fields
  -------------------------------------------------- */
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  const loginErrorBox = document.getElementById("loginError");
  const registerErrorBox = document.getElementById("registerError");


  /* --------------------------------------------------
     UI helpers
  -------------------------------------------------- */

  /**
   * Show login error message in Bootstrap alert box.
   * @param {string} msg
   */
  function showLoginError(msg) {
    showAlert(loginErrorBox, "danger", msg);
  }

  /** Hide login error alert. */
  function hideLoginError() {
    hideAlert(loginErrorBox);
  }

  /**
   * Show register error message in Bootstrap alert box.
   * @param {string} msg
   */
  function showRegisterError(msg) {
    showAlert(registerErrorBox, "danger", msg);
  }

  /** Hide register error alert. */
  function hideRegisterError() {
    hideAlert(registerErrorBox);
  }


  /* --------------------------------------------------
     Navigation
  -------------------------------------------------- */

  /**
   * Redirect user after successful login based on role.
   * Admin -> admin-dashboard.html
   * User  -> home.html
   * @param {string} role
   */
  function redirectByRole(role) {
    window.location.href = (role === "Admin")
      ? "admin-dashboard.html"
      : "home.html";
  }


  /* --------------------------------------------------
     Login
  -------------------------------------------------- */

  /**
   * Handle login button click.
   * Reads inputs, calls API, saves session, then redirects.
   */
  async function handleLogin() {
    hideLoginError();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    if (!email || !password) {
      showLoginError("Please enter email and password.");
      return;
    }

    // Show loading state on the button
    if (loginBtn) setButtonLoading(loginBtn, true, "Signing in...");

    try {
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password }
      });

      // Support both role/Role just in case
      const role = result.role || result.Role || "User";

      // ✅ use shared session helper from utils.session.js
      saveSession({
        token: result.token || result.Token,
        role,
        id: result.id || result.Id,
        fullName: result.fullName || result.FullName,
        email: result.email || result.Email
      });

      redirectByRole(role);

    } catch (e) {
      showLoginError(e.message);
    } finally {
      if (loginBtn) setButtonLoading(loginBtn, false);
    }
  }


  /* --------------------------------------------------
     Register
  -------------------------------------------------- */

  /**
   * Handle register button click.
   * Registers user then auto-login (based on API response).
   */
  async function handleRegister() {
    hideRegisterError();

    const fullName = document.getElementById("regFullName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;

    if (!fullName || !email || !password) {
      showRegisterError("Please fill in all fields.");
      return;
    }

    if (registerBtn) setButtonLoading(registerBtn, true, "Creating account...");

    try {
      const result = await apiFetch("/auth/register", {
        method: "POST",
        body: { fullName, email, password }
      });

      const role = result.role || result.Role || "User";

      // ✅ use shared session helper
      saveSession({
        token: result.token || result.Token,
        role,
        id: result.id || result.Id,
        fullName: result.fullName || result.FullName,
        email: result.email || result.Email
      });

      // After register: go to home (MVP flow)
      window.location.href = "home.html";

    } catch (e) {
      showRegisterError(e.message);
    } finally {
      if (registerBtn) setButtonLoading(registerBtn, false);
    }
  }


  /* --------------------------------------------------
     Events
  -------------------------------------------------- */

  // Bind login if the button exists on this page
  loginBtn?.addEventListener("click", handleLogin);

  // Bind register if the button exists on this page
  registerBtn?.addEventListener("click", handleRegister);

})();