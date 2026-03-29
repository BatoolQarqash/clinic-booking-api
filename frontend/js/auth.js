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

  /**
   * Hide login error alert.
   */
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

  /**
   * Hide register error alert.
   */
  function hideRegisterError() {
    hideAlert(registerErrorBox);
  }

  /* --------------------------------------------------
     Redirect helpers
  -------------------------------------------------- */

  /**
   * Read redirect target from current URL query string.
   * Example:
   * login.html?redirect=doctor-details.html%3Fid%3D1
   * @returns {string|null}
   */
  function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  }

  /**
   * Redirect user after successful login/register.
   * Priority:
   * 1) redirect query parameter
   * 2) role-based default route
   * @param {string} role
   */
  function redirectByRole(role) {
    const redirectTarget = getRedirectTarget();

    if (redirectTarget) {
      window.location.href = redirectTarget;
      return;
    }

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

    if (loginBtn) setButtonLoading(loginBtn, true, "Signing in...");

    try {
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password }
      });

      const role = result.role || result.Role || "User";

      saveSession({
        token: result.token || result.Token,
        role,
        id: result.id || result.Id,
        fullName: result.fullName || result.FullName,
        email: result.email || result.Email
      });

      redirectByRole(role);

    } catch (e) {
      showLoginError(e.message || "Login failed.");
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

      saveSession({
        token: result.token || result.Token,
        role,
        id: result.id || result.Id,
        fullName: result.fullName || result.FullName,
        email: result.email || result.Email
      });

      redirectByRole(role);

    } catch (e) {
      showRegisterError(e.message || "Registration failed.");
    } finally {
      if (registerBtn) setButtonLoading(registerBtn, false);
    }
  }

  /* --------------------------------------------------
     Events
  -------------------------------------------------- */

  loginBtn?.addEventListener("click", handleLogin);
  registerBtn?.addEventListener("click", handleRegister);
})();