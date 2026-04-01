// frontend/js/my-appointments.js

(() => {
  /* --------------------------------------------------
     Auth Guard
  -------------------------------------------------- */
  requireAuth();

  /* --------------------------------------------------
     DOM references
  -------------------------------------------------- */
  const apptList = document.getElementById("apptList"); // ideally: class="row g-3"
  const emptyBox = document.getElementById("emptyBox");
  const loadingBox = document.getElementById("loadingBox");
  const pageMsg = document.getElementById("pageMsg");
  const refreshBtn = document.getElementById("refreshBtn");


  /* --------------------------------------------------
     UI helpers
  -------------------------------------------------- */

  /**
   * Show page-level alert message.
   * @param {"success"|"danger"|"warning"|"info"} type
   * @param {string} text
   */
  function showMessage(type, text) {
    showAlert(pageMsg, type, text);
  }

  /** Hide page-level alert message. */
  function hideMessage() {
    hideAlert(pageMsg);
  }

  /**
   * Get Bootstrap badge class based on appointment status.
   * @param {string} status
   * @returns {string}
   */
  function statusBadgeClass(status) {
    const s = (status || "").toLowerCase();

    if (s === "booked") return "bg-success";
    if (s === "cancelled") return "bg-danger";
    if (s === "completed") return "bg-primary";

    return "bg-secondary";
  }


  /* --------------------------------------------------
     Render appointments
  -------------------------------------------------- */

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
      const status = a.status || a.Status || "—";
      const badgeClass = statusBadgeClass(status);

      const doctor = a.doctor || a.Doctor || null;
      const slot = a.slot || a.Slot || null;

      const doctorName = doctor?.fullName || doctor?.FullName || "Doctor";
      const clinicName = doctor?.clinicName || doctor?.ClinicName || "";
      const doctorId = doctor?.id || doctor?.Id;

      const startTime = slot?.startTime || slot?.StartTime;
      const endTime = slot?.endTime || slot?.EndTime;

      const apptId = a.id || a.Id;

      const col = document.createElement("div");
       col.className = "col-12 col-md-6 col-xl-4";

      col.innerHTML = `
        <div class="cb-appt-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold">${doctorName}</div>
              <div class="text-muted small">${clinicName}</div>
            </div>
            <span class="badge ${badgeClass} text-uppercase">${status}</span>
          </div>

          <div class="mt-2 text-muted small">
            <i class="bi bi-clock"></i>
            ${formatDateTime(startTime)} → ${formatDateTime(endTime)}
          </div>

          <div class="mt-3 d-flex justify-content-end gap-2">
            <a class="btn btn-outline-primary btn-sm"
               href="doctor-details.html?id=${doctorId}">
              View Doctor
            </a>

            <button class="btn btn-danger btn-sm"
                    data-action="cancel"
                    data-id="${apptId}"
                    ${String(status).toLowerCase() !== "booked" ? "disabled" : ""}>
              Cancel
            </button>
          </div>
        </div>
      `;

      apptList.appendChild(col);
    });
  }


  /* --------------------------------------------------
     Data loading
  -------------------------------------------------- */

  /**
   * Load the user's appointments from backend.
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


  /* --------------------------------------------------
     Cancel appointment
  -------------------------------------------------- */

  /**
   * Cancel an appointment by id.
   * @param {string|number} apptId
   * @param {HTMLButtonElement} btn
   */
  async function cancelAppointment(apptId, btn) {
    hideMessage();

    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    // Show loading state on this button
    setButtonLoading(btn, true, "Cancelling...");

    try {
      const res = await apiFetch(`/appointments/${apptId}/cancel`, {
        method: "PATCH",
        auth: true
      });

      showMessage("success", res?.message || "Cancelled successfully.");
      await loadAppointments();

    } catch (e) {
      showMessage("warning", e.message);
      setButtonLoading(btn, false);
    }
  }


  /* --------------------------------------------------
     Init
  -------------------------------------------------- */

  // Event delegation (one listener for all cancel buttons)
  apptList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='cancel']");
    if (!btn) return;

    cancelAppointment(btn.dataset.id, btn);
  });

  // Refresh button
  refreshBtn.addEventListener("click", loadAppointments);

  // Initial load
  loadAppointments();

})();