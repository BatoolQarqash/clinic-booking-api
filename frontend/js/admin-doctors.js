// frontend/js/admin-doctors.js

(() => {
  requireAdmin();

  /* --------------------------------------------------
     DOM references
  -------------------------------------------------- */
  const pageMsg = document.getElementById("pageMsg");
  const qInput = document.getElementById("qInput");
  const serviceSelect = document.getElementById("serviceSelect");
  const searchBtn = document.getElementById("searchBtn");
  const newBtn = document.getElementById("newBtn");

  const rows = document.getElementById("rows");
  const emptyBox = document.getElementById("emptyBox");

  // Modal
  const modalEl = document.getElementById("doctorModal");
  const modal = new bootstrap.Modal(modalEl);
  const modalTitle = document.getElementById("modalTitle");
  const modalMsg = document.getElementById("modalMsg");

  const fullNameInput = document.getElementById("fullNameInput");
  const titleInput = document.getElementById("titleInput");
  const bioInput = document.getElementById("bioInput");
  const clinicInput = document.getElementById("clinicInput");
  const modalServiceSelect = document.getElementById("modalServiceSelect");
  const feeInput = document.getElementById("feeInput");
  const ratingInput = document.getElementById("ratingInput");
  const imageFileInput = document.getElementById("imageFileInput");
  const currentImageWrap = document.getElementById("currentImageWrap");
  const currentImagePreview = document.getElementById("currentImagePreview");
  const saveBtn = document.getElementById("saveBtn");

  /* --------------------------------------------------
     State
  -------------------------------------------------- */
  let editingId = null;
  let allDoctors = [];
  let allServices = [];
  let currentEditingDoctor = null;

  /* --------------------------------------------------
     UI helpers
  -------------------------------------------------- */
  function showPageMsg(type, text) {
    showAlert(pageMsg, type, text);
  }

  function hidePageMsg() {
    hideAlert(pageMsg);
  }

  function showModalMsg(type, text) {
    showAlert(modalMsg, type, text);
  }

  function hideModalMsg() {
    hideAlert(modalMsg);
  }

  /* --------------------------------------------------
     Data helpers
  -------------------------------------------------- */
  function getDoctorServiceName(d) {
    return (
      d.serviceName ||
      d.ServiceName ||
      d.service?.name ||
      d.Service?.Name ||
      "—"
    );
  }

  function getDoctorServiceId(d) {
    return (
      d.serviceId ||
      d.ServiceId ||
      d.service?.id ||
      d.Service?.Id ||
      null
    );
  }

  function isDoctorActive(d) {
    return Boolean(d.isActive ?? d.IsActive);
  }

  function getStatusBadgeHtml(active) {
    return active
      ? `<span class="badge bg-success">Active</span>`
      : `<span class="badge bg-secondary">Inactive</span>`;
  }

  function getActionButtonsHtml(id, active) {
    if (active) {
      return `
        <button class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm" data-action="deactivate" data-id="${id}">
          <i class="bi bi-trash"></i>
        </button>
      `;
    }

    return `
      <button class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${id}">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-outline-success btn-sm" data-action="activate" data-id="${id}">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    `;
  }

  function fillServiceDropdowns() {
    serviceSelect.innerHTML = `<option value="">All Services</option>`;
    modalServiceSelect.innerHTML = `<option value="">Select service</option>`;

    allServices.forEach(s => {
      const id = s.id || s.Id;
      const name = s.name || s.Name || "Service";

      const opt1 = document.createElement("option");
      opt1.value = String(id);
      opt1.textContent = name;
      serviceSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = String(id);
      opt2.textContent = name;
      modalServiceSelect.appendChild(opt2);
    });
  }

  /* --------------------------------------------------
     Load data
  -------------------------------------------------- */
  async function loadServices() {
    try {
      const services = await apiFetch("/services");
      allServices = services || [];
      fillServiceDropdowns();
    } catch {
      // Not fatal
    }
  }

  async function loadDoctors() {
    hidePageMsg();

    try {
      const items = await apiFetch("/admin/doctors", { auth: true });
      allDoctors = items || [];
      applyFiltersAndRender();
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  /* --------------------------------------------------
     Filtering
  -------------------------------------------------- */
  function getFilteredDoctors() {
    const q = qInput.value.trim().toLowerCase();
    const selectedServiceId = serviceSelect.value;

    return allDoctors.filter(d => {
      const fullName = (d.fullName || d.FullName || "").toLowerCase();
      const clinicName = (d.clinicName || d.ClinicName || "").toLowerCase();
      const title = (d.title || d.Title || "").toLowerCase();
      const serviceName = getDoctorServiceName(d).toLowerCase();
      const serviceId = getDoctorServiceId(d);

      const matchesText =
        !q ||
        fullName.includes(q) ||
        clinicName.includes(q) ||
        title.includes(q) ||
        serviceName.includes(q);

      const matchesService =
        !selectedServiceId ||
        String(serviceId) === String(selectedServiceId);

      return matchesText && matchesService;
    });
  }

  /* --------------------------------------------------
     Rendering
  -------------------------------------------------- */
  function renderDoctors(items) {
    rows.innerHTML = "";
    emptyBox.classList.add("d-none");

    if (!items.length) {
      emptyBox.classList.remove("d-none");
      return;
    }

    items.forEach(d => {
      const id = d.id || d.Id;
      const name = d.fullName || d.FullName || "Doctor";
      const clinicName = d.clinicName || d.ClinicName || "";
      const serviceName = getDoctorServiceName(d);
      const fee = d.fee ?? d.Fee ?? "—";
      const rating = d.rating ?? d.Rating ?? "—";
      const active = isDoctorActive(d);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>
          <div class="fw-semibold">${name}</div>
          <div class="text-muted small">${clinicName}</div>
        </td>
        <td>${serviceName}</td>
        <td>$${fee}</td>
        <td>${rating}</td>
        <td>${getStatusBadgeHtml(active)}</td>
        <td class="text-end">
          ${getActionButtonsHtml(id, active)}
        </td>
      `;
      rows.appendChild(tr);
    });
  }

  function applyFiltersAndRender() {
    hidePageMsg();
    renderDoctors(getFilteredDoctors());
  }

  /* --------------------------------------------------
     Modal helpers
  -------------------------------------------------- */
  function resetModalFields() {
    fullNameInput.value = "";
    titleInput.value = "";
    bioInput.value = "";
    clinicInput.value = "";
    modalServiceSelect.value = "";
    feeInput.value = "";
    ratingInput.value = "";
    imageFileInput.value = "";
    currentEditingDoctor = null;

    currentImageWrap.classList.add("d-none");
    currentImagePreview.src = "";
  }

  function openCreateModal() {
    editingId = null;
    currentEditingDoctor = null;
    modalTitle.textContent = "Create Doctor";
    hideModalMsg();
    resetModalFields();
    modal.show();
  }

  async function openEditModal(id) {
    editingId = id;
    modalTitle.textContent = `Edit Doctor #${id}`;
    hideModalMsg();

    try {
      const d = await apiFetch(`/admin/doctors/${id}`, { auth: true });
      currentEditingDoctor = d;

      fullNameInput.value = d.fullName || d.FullName || "";
      titleInput.value = d.title || d.Title || "";
      bioInput.value = d.bio || d.Bio || "";
      clinicInput.value = d.clinicName || d.ClinicName || "";
      modalServiceSelect.value = String(getDoctorServiceId(d) || "");
      feeInput.value = d.fee ?? d.Fee ?? "";
      ratingInput.value = d.rating ?? d.Rating ?? "";
      imageFileInput.value = "";

      const currentImageUrl = d.imageUrl || d.ImageUrl || "";
      if (currentImageUrl) {
        currentImagePreview.src = resolveImageUrl(currentImageUrl);
        currentImageWrap.classList.remove("d-none");
      } else {
        currentImageWrap.classList.add("d-none");
        currentImagePreview.src = "";
      }

      modal.show();
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  /* --------------------------------------------------
     Build FormData
  -------------------------------------------------- */
  function buildDoctorFormData(isActiveValue) {
    const formData = new FormData();

    formData.append("fullName", fullNameInput.value.trim());
    formData.append("title", titleInput.value.trim());
    formData.append("bio", bioInput.value.trim());
    formData.append("clinicName", clinicInput.value.trim());
    formData.append("serviceId", modalServiceSelect.value || "");
    formData.append("fee", feeInput.value || "0");
    formData.append("rating", ratingInput.value || "0");
    formData.append("isActive", String(isActiveValue));

    const file = imageFileInput.files?.[0];
    if (file) {
      formData.append("imageFile", file);
    }

    return formData;
  }

  /* --------------------------------------------------
     Save doctor
  -------------------------------------------------- */
  async function saveDoctor() {
    hideModalMsg();

    const serviceIdValue = modalServiceSelect.value;
    const fullNameValue = fullNameInput.value.trim();

    if (!fullNameValue || !serviceIdValue) {
      showModalMsg("warning", "Full name and Service are required.");
      return;
    }

    const isActiveValue = editingId
      ? isDoctorActive(currentEditingDoctor || {})
      : true;

    const formData = buildDoctorFormData(isActiveValue);

    setButtonLoading(saveBtn, true, "Saving...");

    try {
      if (editingId) {
        await apiFetch(`/admin/doctors/${editingId}`, {
          method: "PUT",
          auth: true,
          body: formData
        });
        showPageMsg("success", "Doctor updated.");
      } else {
        await apiFetch("/admin/doctors", {
          method: "POST",
          auth: true,
          body: formData
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

  /* --------------------------------------------------
     Status actions
  -------------------------------------------------- */
  async function deactivateDoctor(id) {
    hidePageMsg();

    if (!confirm("Deactivate this doctor?")) return;

    try {
      await apiFetch(`/admin/doctors/${id}`, {
        method: "DELETE",
        auth: true
      });

      showPageMsg("success", "Doctor deactivated.");
      await loadDoctors();
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  async function activateDoctor(id) {
    hidePageMsg();

    if (!confirm("Activate this doctor again?")) return;

    try {
      const doctor = await apiFetch(`/admin/doctors/${id}`, { auth: true });

      const formData = new FormData();
      formData.append("fullName", doctor.fullName || doctor.FullName || "");
      formData.append("title", doctor.title || doctor.Title || "");
      formData.append("bio", doctor.bio || doctor.Bio || "");
      formData.append("clinicName", doctor.clinicName || doctor.ClinicName || "");
      formData.append("serviceId", String(getDoctorServiceId(doctor) || ""));
      formData.append("fee", String(doctor.fee ?? doctor.Fee ?? 0));
      formData.append("rating", String(doctor.rating ?? doctor.Rating ?? 0));
      formData.append("isActive", "true");

      await apiFetch(`/admin/doctors/${id}`, {
        method: "PUT",
        auth: true,
        body: formData
      });

      showPageMsg("success", "Doctor activated.");
      await loadDoctors();
    } catch (e) {
      showPageMsg("danger", e.message);
    }
  }

  /* --------------------------------------------------
     Events
  -------------------------------------------------- */
  newBtn.addEventListener("click", openCreateModal);
  searchBtn.addEventListener("click", applyFiltersAndRender);

  qInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFiltersAndRender();
  });

  serviceSelect.addEventListener("change", applyFiltersAndRender);

  rows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "edit") openEditModal(id);
    if (action === "deactivate") deactivateDoctor(id);
    if (action === "activate") activateDoctor(id);
  });

  saveBtn.addEventListener("click", saveDoctor);

  /* --------------------------------------------------
     Init
  -------------------------------------------------- */
  loadServices().then(loadDoctors);
})();