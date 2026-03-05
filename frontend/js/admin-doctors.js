// frontend/js/admin-doctors.js

(() => {
  requireAdmin();

  // DOM
  const pageMsg = document.getElementById("pageMsg");
  const qInput = document.getElementById("qInput");
  const serviceSelect = document.getElementById("serviceSelect");
  const searchBtn = document.getElementById("searchBtn");
  const newBtn = document.getElementById("newBtn");

  const rows = document.getElementById("rows");
  const emptyBox = document.getElementById("emptyBox");

  // Modal DOM
  const modalEl = document.getElementById("doctorModal");
  const modal = new bootstrap.Modal(modalEl);
  const modalTitle = document.getElementById("modalTitle");
  const modalMsg = document.getElementById("modalMsg");

  const fullNameInput = document.getElementById("fullNameInput");
  const titleInput = document.getElementById("titleInput");
  const clinicInput = document.getElementById("clinicInput");
  const modalServiceSelect = document.getElementById("modalServiceSelect");
  const feeInput = document.getElementById("feeInput");
  const ratingInput = document.getElementById("ratingInput");
  const imageUrlInput = document.getElementById("imageUrlInput");
  const saveBtn = document.getElementById("saveBtn");

  // State
  let editingId = null;
  let cachedServices = [];

  function showPageMsg(type, text) { showAlert(pageMsg, type, text); }
  function hidePageMsg() { hideAlert(pageMsg); }

  function showModalMsg(type, text) { showAlert(modalMsg, type, text); }
  function hideModalMsg() { hideAlert(modalMsg); }

  /**
   * Load services for dropdowns (filters + modal).
   */
  async function loadServices() {
    try {
      const services = await apiFetch("/services");
      cachedServices = services || [];

      // Filter dropdown
      serviceSelect.innerHTML = `<option value="">All Services</option>`;
      // Modal dropdown
      modalServiceSelect.innerHTML = `<option value="">Select service</option>`;

      cachedServices.forEach(s => {
        const id = s.id || s.Id;
        const name = s.name || s.Name;

        const opt1 = document.createElement("option");
        opt1.value = String(id);
        opt1.textContent = name;
        serviceSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = String(id);
        opt2.textContent = name;
        modalServiceSelect.appendChild(opt2);
      });
    } catch {
      // Not fatal
    }
  }

  /**
   * Build query for admin doctors endpoint.
   */
  function buildDoctorsUrl() {
    const q = qInput.value.trim();
    const serviceId = serviceSelect.value;

    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (serviceId) qs.set("serviceId", serviceId);

    const s = qs.toString();
    return s ? `/admin/doctors?${s}` : "/admin/doctors";
  }

  /**
   * Render doctors table.
   */
  function renderDoctors(items) {
    rows.innerHTML = "";
    emptyBox.classList.add("d-none");

    if (!items || items.length === 0) {
      emptyBox.classList.remove("d-none");
      return;
    }

    items.forEach(d => {
      const id = d.id || d.Id;
      const name = d.fullName || d.FullName || "Doctor";
      const serviceName = d.service?.name || d.Service?.Name || "—";
      const fee = d.fee ?? d.Fee ?? "—";
      const rating = d.rating ?? d.Rating ?? "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>
          <div class="fw-semibold">${name}</div>
          <div class="text-muted small">${d.clinicName || d.ClinicName || ""}</div>
        </td>
        <td>${serviceName}</td>
        <td>$${fee}</td>
        <td>${rating}</td>
        <td class="text-end">
          <button class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      rows.appendChild(tr);
    });
  }

  /**
   * Load doctors from backend.
   */
  async function loadDoctors() {
    hidePageMsg();
    try {
      const items = await apiFetch(buildDoctorsUrl(), { auth: true });
      renderDoctors(items);
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  /**
   * Open modal for create.
   */
  function openCreateModal() {
    editingId = null;
    modalTitle.textContent = "Create Doctor";
    hideModalMsg();

    fullNameInput.value = "";
    titleInput.value = "";
    clinicInput.value = "";
    modalServiceSelect.value = "";
    feeInput.value = "";
    ratingInput.value = "";
    imageUrlInput.value = "";

    modal.show();
  }

  /**
   * Load doctor details for edit (admin endpoint).
   */
  async function openEditModal(id) {
    editingId = id;
    modalTitle.textContent = `Edit Doctor #${id}`;
    hideModalMsg();

    try {
      const d = await apiFetch(`/admin/doctors/${id}`, { auth: true });

      fullNameInput.value = d.fullName || d.FullName || "";
      titleInput.value = d.title || d.Title || "";
      clinicInput.value = d.clinicName || d.ClinicName || "";

      const serviceId = d.serviceId || d.ServiceId || d.service?.id || d.Service?.Id || "";
      modalServiceSelect.value = serviceId ? String(serviceId) : "";

      feeInput.value = d.fee ?? d.Fee ?? "";
      ratingInput.value = d.rating ?? d.Rating ?? "";
      imageUrlInput.value = d.imageUrl || d.ImageUrl || "";

      modal.show();
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  /**
   * Create or update doctor (upsert).
   */
  async function saveDoctor() {
    hideModalMsg();

    const payload = {
      fullName: fullNameInput.value.trim(),
      title: titleInput.value.trim(),
      clinicName: clinicInput.value.trim(),
      serviceId: modalServiceSelect.value ? parseInt(modalServiceSelect.value, 10) : null,
      fee: feeInput.value ? parseFloat(feeInput.value) : 0,
      rating: ratingInput.value ? parseFloat(ratingInput.value) : 0,
      imageUrl: imageUrlInput.value.trim()
    };

    if (!payload.fullName || !payload.serviceId) {
      showModalMsg("warning", "Full name and Service are required.");
      return;
    }

    setButtonLoading(saveBtn, true, "Saving...");

    try {
      if (editingId) {
        await apiFetch(`/admin/doctors/${editingId}`, {
          method: "PUT",
          auth: true,
          body: payload
        });
        showPageMsg("success", "Doctor updated.");
      } else {
        await apiFetch("/admin/doctors", {
          method: "POST",
          auth: true,
          body: payload
        });
        showPageMsg("success", "Doctor created.");
      }

      modal.hide();
      await loadDoctors();

    } catch (e) {
      showModalMsg("danger", e.message);
    } finally {
      setButtonLoading(saveBtn, false);
    }
  }

  /**
   * Delete doctor.
   */
  async function deleteDoctor(id) {
    hidePageMsg();

    if (!confirm("Delete this doctor?")) return;

    try {
      await apiFetch(`/admin/doctors/${id}`, { method: "DELETE", auth: true });
      showPageMsg("success", "Doctor deleted.");
      await loadDoctors();
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  // Events
  newBtn.addEventListener("click", openCreateModal);
  searchBtn.addEventListener("click", loadDoctors);

  rows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    if (btn.dataset.action === "edit") openEditModal(id);
    if (btn.dataset.action === "delete") deleteDoctor(id);
  });

  saveBtn.addEventListener("click", saveDoctor);

  // Init
  loadServices().then(loadDoctors);
})();