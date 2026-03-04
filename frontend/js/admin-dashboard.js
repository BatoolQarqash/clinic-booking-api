// frontend/js/admin-dashboard.js
requireAdmin();

const me = getUserSafe();
setText("adminName", me?.fullName ? `Welcome, ${me.fullName}` : "Welcome, Admin");

qs("logoutBtn").addEventListener("click", logout);

async function loadDashboard() {
  hideBox("dashError");

  try {
    // Doctors count
    const doctors = await apiFetch("/admin/doctors", { auth: true });
    setText("doctorsCount", `${doctors.length} doctors`);

    // Appointments total (uses metadata)
    const appts = await apiFetch("/admin/appointments?page=1&pageSize=1", { auth: true });
    setText("apptsTotal", `${appts.total} total`);
  } catch (e) {
    showBox("dashError", e.message, "danger");
  }
}

loadDashboard();