// frontend/js/admin-dashboard.js

(() => {
  // Admin-only guard
  requireAdmin();

  const adminName = document.getElementById("adminName");
  const logoutBtn = document.getElementById("logoutBtn");

  // Show admin name from stored session
  const user = getCurrentUser();
  adminName.textContent = user?.fullName || "Admin";

  // Logout clears session and returns to login
  logoutBtn.addEventListener("click", () => logout());
})();