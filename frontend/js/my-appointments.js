// frontend/js/my-appointments.js

(() => {
  /**
   * Ensure user is logged in before accessing this page.
   */
  function requireAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) window.location.href = "login.html";
  }

  /**
   * Show a message alert.
   * @param {"success"|"danger"|"warning"|"info"} type
   * @param {string} text
   */
  function showMessage(type, text) {
    pageMsg.className = `alert alert-${type}`;
    pageMsg.textContent = text;
    pageMsg.classList.remove("d-none");
  }

  /**
   * Hide the message alert.
   */
  function hideMessage() {
    pageMsg.textContent = "";
    pageMsg.classList.add("d-none");
  }

  /**
   * Convert ISO datetime string to a readable local string.
   * @param {string} iso
   */
  function toLocal(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  /**
   * Render appointments as responsive grid cards.
   * @param {Array} items
   */
  function renderAppointments(items) {
    apptList.innerHTML = "";
    emptyBox.classList.add("d-none");

    if (!items || items.length === 0) {
      emptyBox.classList.remove("d-none");
      return;
    }

    items.forEach(a => {
      const status = (a.status || "").toLowerCase();

      const badgeClass =
        status === "booked" ? "bg-success" :
        status === "cancelled" ? "bg-danger" :
        status === "completed" ? "bg-primary" :
        "bg-secondary";

      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4"; // grid on desktop

      col.innerHTML = `
        <div class="cb-appt-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold">${a.doctor?.fullName || "Doctor"}</div>
              <div class="text-muted small">${a.doctor?.clinicName || ""}</div>
            </div>
            <span class="badge ${badgeClass} text-uppercase">${a.status || "—"}</span>
          </div>

          <div class="mt-2 text-muted small">
            <i class="bi bi-clock"></i>
            ${toLocal(a.slot?.startTime)} → ${toLocal(a.slot?.endTime)}
          </div>

          <div class="mt-3 d-flex justify-content-end gap-2">
            <a class="btn btn-outline-primary btn-sm"
               href="doctor-details.html?id=${a.doctor?.id}">
              View Doctor
            </a>

            <button class="btn btn-danger btn-sm"
                    data-action="cancel"
                    data-id="${a.id}"
                    ${status !== "booked" ? "disabled" : ""}>
              Cancel
            </button>
          </div>
        </div>
      `;

      apptList.appendChild(col);
    });
  }

  /**
   * Load appointments from backend.
   */
  async function loadAppointments() {
    hideMessage();
    loadingBox.classList.remove("d-none");
    apptList.innerHTML = "";
    emptyBox.classList.add("d-none");

    try {
      const items = await apiFetch("/appointments/my", { auth: true });
      renderAppointments(items);
    } catch (e) {
      showMessage("danger", e.message);
    } finally {
      loadingBox.classList.add("d-none");
    }
  }

  /**
   * Cancel an appointment by id.
   * @param {string|number} apptId
   * @param {HTMLButtonElement} btn
   */
  async function cancelAppointment(apptId, btn) {
    hideMessage();

    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Cancelling...";

    try {
      const res = await apiFetch(`/appointments/${apptId}/cancel`, {
        method: "PATCH",
        auth: true
      });

      showMessage("success", res?.message || "Cancelled successfully.");
      await loadAppointments();
    } catch (e) {
      showMessage("warning", e.message);
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  // ---------- Init ----------
  requireAuth();

  const apptList = document.getElementById("apptList"); // should be "row g-3" in HTML
  const emptyBox = document.getElementById("emptyBox");
  const loadingBox = document.getElementById("loadingBox");
  const pageMsg = document.getElementById("pageMsg");
  const refreshBtn = document.getElementById("refreshBtn");

  // Event delegation (cleaner than binding per button globally)
  apptList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='cancel']");
    if (!btn) return;
    cancelAppointment(btn.dataset.id, btn);
  });

  refreshBtn.addEventListener("click", loadAppointments);
  loadAppointments();
})();