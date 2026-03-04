// frontend/js/admin.js
// Shared helpers for Admin pages

function requireAdmin() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);

  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (role !== "Admin") {
    // Not admin -> send to normal home
    window.location.href = "home.html";
  }
}

function getUserSafe() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "login.html";
}

function qs(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = qs(id);
  if (el) el.textContent = text;
}

function showBox(id, msg, type = "danger") {
  const el = qs(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove("d-none");
}

function hideBox(id) {
  const el = qs(id);
  if (!el) return;
  el.classList.add("d-none");
  el.textContent = "";
}

function toLocal(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}