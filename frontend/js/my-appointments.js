// ================================
// My Appointments Page Script
// - Loads the current user's appointments
// - Allows canceling an appointment (if allowed by backend policy)
// ================================

// 1) Guard: user must be logged in (token in localStorage)
const token = localStorage.getItem(TOKEN_KEY);
if (!token) window.location.href = "login.html";

// 2) DOM references
const apptList = document.getElementById("apptList");
const emptyBox = document.getElementById("emptyBox");
const loadingBox = document.getElementById("loadingBox");
const pageMsg = document.getElementById("pageMsg");
const refreshBtn = document.getElementById("refreshBtn");

// 3) Helpers for UI messages
function showMessage(type, text) {
  // type: "success" | "danger" | "warning" | "info"
  pageMsg.className = `alert alert-${type}`;
  pageMsg.textContent = text;
  pageMsg.classList.remove("d-none");
}

function hideMessage() {
  pageMsg.textContent = "";
  pageMsg.classList.add("d-none");
}

// 4) Small helper to format ISO datetime into readable text
function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");

  // Example: 2026-03-06 09:00
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 5) Render appointments as cards (same style as your doctor cards)
function renderAppointments(items) {
  apptList.innerHTML = "";
  emptyBox.classList.add("d-none");

  if (!items || items.length === 0) {
    emptyBox.classList.remove("d-none");
    return;
  }

  items.forEach(a => {
    const status = (a.status || "").toLowerCase();

    // Determine badge color based on status
    let badgeClass = "bg-secondary";
    if (status === "booked") badgeClass = "bg-success";
    if (status === "cancelled") badgeClass = "bg-danger";
    if (status === "completed") badgeClass = "bg-primary";

    const card = document.createElement("div");
    card.className = "cb-appt-card";

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${a.doctor.fullName}</div>
          <div class="text-muted small">${a.doctor.clinicName || ""}</div>
        </div>
        <span class="badge ${badgeClass}">${a.status}</span>
      </div>

      <div class="mt-2 text-muted small">
        <i class="bi bi-clock"></i>
        ${formatDateTime(a.slot.startTime)} → ${formatDateTime(a.slot.endTime)}
      </div>

      <div class="mt-2 d-flex justify-content-end gap-2">
        <a class="btn btn-outline-primary btn-sm"
           href="doctor-details.html?id=${a.doctor.id}">
           View Doctor
        </a>

        <button class="btn btn-danger btn-sm"
                data-appt-id="${a.id}"
                ${status !== "booked" ? "disabled" : ""}>
          Cancel
        </button>
      </div>
    `;

    apptList.appendChild(card);
  });

  // Attach cancel button events after rendering
  document.querySelectorAll("button[data-appt-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const apptId = btn.getAttribute("data-appt-id");
      await cancelAppointment(apptId, btn);
    });
  });
}

// 6) Load appointments from backend
async function loadAppointments() {
  hideMessage();
  loadingBox.classList.remove("d-none");
  apptList.innerHTML = "";
  emptyBox.classList.add("d-none");

  try {
    // This endpoint requires JWT (auth: true)
    const items = await apiFetch("/appointments/my", { auth: true });
    renderAppointments(items);
  } catch (e) {
    showMessage("danger", e.message);
  } finally {
    loadingBox.classList.add("d-none");
  }
}

// 7) Cancel appointment (calls PATCH /api/appointments/{id}/cancel)
async function cancelAppointment(apptId, buttonEl) {
  hideMessage();

  // Optional: confirm before cancel
  const ok = confirm("Are you sure you want to cancel this appointment?");
  if (!ok) return;

  // Disable button to prevent double clicks
  buttonEl.disabled = true;
  buttonEl.textContent = "Cancelling...";

  try {
    const res = await apiFetch(`/appointments/${apptId}/cancel`, {
      method: "PATCH",
      auth: true
    });

    showMessage("success", res.message || "Cancelled");
    // Reload list so status updates + slot becomes available again
    await loadAppointments();
  } catch (e) {
    showMessage("warning", e.message);
    // If cancel failed (e.g., within 1 hour), re-enable button
    buttonEl.disabled = false;
    buttonEl.textContent = "Cancel";
  }
}

// 8) Refresh button
refreshBtn.addEventListener("click", loadAppointments);

// 9) Init
loadAppointments();