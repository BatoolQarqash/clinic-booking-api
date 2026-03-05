// frontend/js/admin-appointments.js

(() => {
  requireAdmin();

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

  function showMsg(type, text) { showAlert(pageMsg, type, text); }
  function hideMsg() { hideAlert(pageMsg); }

  // Pagination state
  let page = getQueryInt("page") || 1;
  let pageSize = getQueryInt("pageSize") || 10;

  function readFiltersFromUrlIntoUi() {
    statusSelect.value = getQueryParam("status") || "";
    doctorIdInput.value = getQueryParam("doctorId") || "";
    dateInput.value = getQueryParam("date") || "";
  }

  function writeUiToUrl() {
    setUrlParams({
      page,
      pageSize,
      status: statusSelect.value,
      doctorId: doctorIdInput.value.trim(),
      date: dateInput.value
    });
  }

  function buildUrl() {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (statusSelect.value) qs.set("status", statusSelect.value);
    if (doctorIdInput.value.trim()) qs.set("doctorId", doctorIdInput.value.trim());
    if (dateInput.value) qs.set("date", dateInput.value);

    return `/admin/appointments?${qs.toString()}`;
  }

  function render(data) {
    rows.innerHTML = "";
    emptyBox.classList.add("d-none");

    // Support both shapes: array OR paged object
    const items = Array.isArray(data) ? data : (data.items || data.Items || []);
    const total = data?.total ?? data?.Total ?? null;

    if (!items.length) {
      emptyBox.classList.remove("d-none");
    }

    items.forEach(a => {
      const id = a.id || a.Id;

      const doctor = a.doctor || a.Doctor || {};
      const user = a.user || a.User || {};
      const slot = a.slot || a.Slot || {};

      const docName = doctor.fullName || doctor.FullName || "—";
      const userName = user.fullName || user.FullName || user.email || user.Email || "—";
      const start = slot.startTime || slot.StartTime;
      const status = a.status || a.Status || "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${docName}</td>
        <td>${userName}</td>
        <td>${formatDateTime(start)}</td>
        <td><span class="badge bg-dark">${status}</span></td>
      `;
      rows.appendChild(tr);
    });

    // Page info
    if (total !== null) pageInfo.textContent = `Page ${page} • Total ${total}`;
    else pageInfo.textContent = `Page ${page}`;

    // Disable prev when on first page
    prevBtn.disabled = page <= 1;

    // If server doesn't return total, allow next always (MVP)
    // If total exists, you can compute last page; for now keep simple.
  }

  async function load() {
    hideMsg();
    writeUiToUrl();

    try {
      const data = await apiFetch(buildUrl(), { auth: true });
      render(data);
    } catch (e) {
      showMsg("danger", e.message);
    }
  }

  // Events
  applyBtn.addEventListener("click", () => { page = 1; load(); });
  refreshBtn.addEventListener("click", load);

  resetBtn.addEventListener("click", () => {
    statusSelect.value = "";
    doctorIdInput.value = "";
    dateInput.value = "";
    page = 1;
    load();
  });

  prevBtn.addEventListener("click", () => { if (page > 1) { page--; load(); } });
  nextBtn.addEventListener("click", () => { page++; load(); });

  // Init
  readFiltersFromUrlIntoUi();
  load();
})();