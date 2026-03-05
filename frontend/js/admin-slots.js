// frontend/js/admin-slots.js

(() => {
  requireAdmin();

  const pageMsg = document.getElementById("pageMsg");

  const doctorSelect = document.getElementById("doctorSelect");
  const dateInput = document.getElementById("dateInput");
  const startInput = document.getElementById("startInput");
  const endInput = document.getElementById("endInput");
  const minutesInput = document.getElementById("minutesInput");
  const createBtn = document.getElementById("createBtn");

  function showMsg(type, text) { showAlert(pageMsg, type, text); }
  function hideMsg() { hideAlert(pageMsg); }

  /**
   * Load doctors for the dropdown using admin endpoint.
   */
  async function loadDoctorsDropdown() {
    try {
      const doctors = await apiFetch("/admin/doctors", { auth: true });

      doctorSelect.innerHTML = `<option value="">Select doctor</option>`;
      (doctors || []).forEach(d => {
        const opt = document.createElement("option");
        opt.value = String(d.id || d.Id);
        opt.textContent = d.fullName || d.FullName || `Doctor #${opt.value}`;
        doctorSelect.appendChild(opt);
      });

    } catch (e) {
      showMsg("danger", e.message);
    }
  }

  /**
   * Create bulk slots for selected doctor.
   * Uses: POST /admin/slots/bulk
   */
  async function createSlots() {
    hideMsg();

    const doctorId = doctorSelect.value ? parseInt(doctorSelect.value, 10) : null;
    const date = dateInput.value;
    const startTime = startInput.value;
    const endTime = endInput.value;
    const slotMinutes = minutesInput.value ? parseInt(minutesInput.value, 10) : 30;

    if (!doctorId || !date || !startTime || !endTime) {
      showMsg("warning", "Doctor, date, start, and end are required.");
      return;
    }

    setButtonLoading(createBtn, true, "Creating...");

    try {
      const res = await apiFetch("/admin/slots/bulk", {
        method: "POST",
        auth: true,
        body: { doctorId, date, startTime, endTime, slotMinutes }
      });

      showMsg("success", res?.message || "Slots created successfully.");

    } catch (e) {
      showMsg("danger", e.message);
    } finally {
      setButtonLoading(createBtn, false);
    }
  }

  // Defaults
  dateInput.valueAsDate = new Date();
  startInput.value = "09:00";
  endInput.value = "17:00";

  createBtn.addEventListener("click", createSlots);

  loadDoctorsDropdown();
})();