// frontend/js/utils.session.js

/**
 * Get JWT token from localStorage.
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get user role from localStorage.
 * @returns {string|null}
 */
function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

/**
 * Read current user object safely.
 * @returns {{id:number, fullName:string, email:string}|null}
 */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

/**
 * Save session after login/register.
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
 * Clear session and redirect to login.
 */
function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "login.html";
}

/**
 * Guard: require logged-in user.
 */
function requireAuth() {
  if (!getToken()) window.location.href = "login.html";
}

/**
 * Guard: require admin role.
 */
function requireAdmin() {
  requireAuth();
  if (getRole() !== "Admin") window.location.href = "home.html";
}

/**
 * Read query string value by name.
 * @param {string} name
 * @returns {string|null}
 */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Read query string as integer.
 * @param {string} name
 * @returns {number|null}
 */
function getQueryInt(name) {
  const v = parseInt(getQueryParam(name), 10);
  return Number.isFinite(v) ? v : null;
}

/**
 * Format ISO datetime into readable local time.
 * @param {string} iso
 * @returns {string}
 */
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/**
 * Update current page URL query string without reloading.
 * Example: setUrlParams({ page: 2, status: "booked" })
 * @param {Record<string, any>} params
 */
function setUrlParams(params) {
  const q = new URLSearchParams(window.location.search);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") q.delete(key);
    else q.set(key, String(value));
  });

  const qs = q.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
}