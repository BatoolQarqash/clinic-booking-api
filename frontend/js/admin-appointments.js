// frontend/js/admin-appointments.js

(() => {
  requireAdmin();

  /* --------------------------------------------------
     DOM references
  -------------------------------------------------- */
  const pageMsg = document.getElementById("pageMsg");

  const statusSelect = document.getElementById("statusSelect");
  const doctorIdInput = document.getElementById("doctorIdInput");
  const dateInput = document.getElementById("dateInput");

  const applyBtn = document.getElementById("applyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  const rows = document.getElementById("rows");
  const emptyBox = document.getElementById("emptyBox");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageInfo = document.getElementById("pageInfo");

  /* --------------------------------------------------
     State
  -------------------------------------------------- */
  let allAppointments = [];
  let currentPage = 1;
  const pageSize = 10;

  /* --------------------------------------------------
     UI helpers
  -------------------------------------------------- */
  function showMsg(type, text) {
    showAlert(pageMsg, type, text);
  }

  function hideMsg() {
    hideAlert(pageMsg);
  }

  /**
   * Convert any ISO/startTime to YYYY-MM-DD for exact date compare.
   * @param {string} iso
   * @returns {string}
   */
  function toDateOnly(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /**
   * Safely get appointments array from API response.
   * Supports array OR paged object.
   * @param {any} data
   * @returns {Array}
   */
  function extractItems(data) {
    if (Array.isArray(data)) return data;
    return data?.items || data?.Items || [];
  }

  /* --------------------------------------------------
     Loading
  -------------------------------------------------- */

  /**
   * Load all appointments from backend once.
   * We use a larger page size and filter on frontend
   * because backend filter param names may differ.
   */
  async function loadAppointments() {
    hideMsg();

    try {
      // Increase page size so admin can filter locally in MVP
      const data = await apiFetch("/admin/appointments?page=1&pageSize=200", {
        auth: true
      });

      allAppointments = extractItems(data);
      currentPage = 1;
      applyFiltersAndRender();
    } catch (e) {
      showMsg("danger", e.message);
    }
  }

  /* --------------------------------------------------
     Filtering + pagination
  -------------------------------------------------- */

  /**
   * Filter cached appointments in frontend.
   * @returns {Array}
   */
  function getFilteredAppointments() {
    const selectedStatus = statusSelect.value.trim().toLowerCase();
    const doctorIdValue = doctorIdInput.value.trim();
    const selectedDate = dateInput.value; // format: YYYY-MM-DD

    return allAppointments.filter(a => {
      const status = String(a.status || a.Status || "").toLowerCase();

      const doctor = a.doctor || a.Doctor || {};
      const slot = a.slot || a.Slot || {};

      const doctorId = String(doctor.id || doctor.Id || a.doctorId || a.DoctorId || "");
      const slotStart = slot.startTime || slot.StartTime || "";
      const slotDate = toDateOnly(slotStart);

      const matchesStatus = !selectedStatus || status === selectedStatus;
      const matchesDoctorId = !doctorIdValue || doctorId === doctorIdValue;
      const matchesDate = !selectedDate || slotDate === selectedDate;

      return matchesStatus && matchesDoctorId && matchesDate;
    });
  }

  /**
   * Return current page slice from filtered items.
   * @param {Array} items
   * @returns {Array}
   */
  function paginate(items) {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  /**
   * Render table rows.
   * @param {Array} items
   * @param {number} total
   */
  function render(items, total) {
    rows.innerHTML = "";
    emptyBox.classList.add("d-none");

    if (!items.length) {
      emptyBox.classList.remove("d-none");
    }

    items.forEach(a => {
      const id = a.id || a.Id;
      const doctor = a.doctor || a.Doctor || {};
      const user = a.user || a.User || {};
      const slot = a.slot || a.Slot || {};

      const doctorName = doctor.fullName || doctor.FullName || "—";
      const userName =
        user.fullName ||
        user.FullName ||
        user.email ||
        user.Email ||
        "—";

      const start = slot.startTime || slot.StartTime;
      const status = a.status || a.Status || "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${doctorName}</td>
        <td>${userName}</td>
        <td>${formatDateTime(start)}</td>
        <td><span class="badge bg-dark">${status}</span></td>
      `;
      rows.appendChild(tr);
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    pageInfo.textContent = `Page ${currentPage} • Total ${total}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  /**
   * Apply filters and re-render table.
   */
  function applyFiltersAndRender() {
    hideMsg();

    const filtered = getFilteredAppointments();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    // Keep current page valid
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const pageItems = paginate(filtered);
    render(pageItems, filtered.length);
  }

  /* --------------------------------------------------
     Events
  -------------------------------------------------- */
  applyBtn.addEventListener("click", () => {
    currentPage = 1;
    applyFiltersAndRender();
  });

  refreshBtn.addEventListener("click", loadAppointments);

  resetBtn.addEventListener("click", () => {
    statusSelect.value = "";
    doctorIdInput.value = "";
    dateInput.value = "";
    currentPage = 1;
    applyFiltersAndRender();
  });

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFiltersAndRender();
    }
  });

  nextBtn.addEventListener("click", () => {
    currentPage++;
    applyFiltersAndRender();
  });

  /* --------------------------------------------------
     Init
  -------------------------------------------------- */
  loadAppointments();
})();