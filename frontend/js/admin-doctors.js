// frontend/js/admin-doctors.js
requireAdmin();
qs("logoutBtn").addEventListener("click", logout);

const modalEl = qs("doctorModal");
const modal = new bootstrap.Modal(modalEl);

let allServices = [];
let allDoctors = [];

qs("applyBtn").addEventListener("click", renderFiltered);
qs("newDoctorBtn").addEventListener("click", () => openModalForCreate());
qs("saveBtn").addEventListener("click", saveDoctor);

function fillServices(selectEl, includeAll = false) {
  if (includeAll) selectEl.innerHTML = `<option value="">All services</option>`;
  else selectEl.innerHTML = "";

  allServices.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    selectEl.appendChild(opt);
  });
}

function renderFiltered() {
  hideBox("pageError");
  hideBox("pageOk");

  const q = (qs("q").value || "").trim().toLowerCase();
  const serviceId = qs("serviceId").value;

  let items = [...allDoctors];
  if (q) items = items.filter(d => (d.fullName || "").toLowerCase().includes(q));
  if (serviceId) items = items.filter(d => String(d.serviceId) === String(serviceId));

  renderRows(items);
}

function renderRows(items) {
  const tbody = qs("rows");
  tbody.innerHTML = "";

  items.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>
        <div class="fw-semibold">${d.fullName}</div>
        <div class="text-muted small">${d.title || "—"}</div>
      </td>
      <td>${d.serviceName || "—"}</td>
      <td>$${d.fee}</td>
      <td>${d.rating ?? "—"}</td>
      <td>${d.isActive ? `<span class="badge bg-success">Yes</span>` : `<span class="badge bg-secondary">No</span>`}</td>
      <td class="text-end">
        <button class="btn btn-outline-primary btn-sm me-1" data-edit="${d.id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm" data-del="${d.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openModalForEdit(btn.dataset.edit));
  });

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteDoctor(btn.dataset.del));
  });
}

function openModalForCreate() {
  hideBox("modalError");
  setText("modalTitle", "New Doctor");

  qs("doctorId").value = "";
  qs("fullName").value = "";
  qs("title").value = "";
  qs("bio").value = "";
  qs("clinicName").value = "";
  qs("imageUrl").value = "";
  qs("fee").value = "0";
  qs("rating").value = "";
  qs("isActive").checked = true;

  fillServices(qs("serviceIdModal"), false);
  qs("serviceIdModal").value = allServices[0]?.id ?? "";

  modal.show();
}

async function openModalForEdit(id) {
  hideBox("modalError");
  setText("modalTitle", `Edit Doctor #${id}`);

  try {
    const d = await apiFetch(`/admin/doctors/${id}`, { auth: true });

    qs("doctorId").value = d.id;
    qs("fullName").value = d.fullName || "";
    qs("title").value = d.title || "";
    qs("bio").value = d.bio || "";
    qs("clinicName").value = d.clinicName || "";
    qs("imageUrl").value = d.imageUrl || "";
    qs("fee").value = d.fee ?? 0;
    qs("rating").value = d.rating ?? "";
    qs("isActive").checked = !!d.isActive;

    fillServices(qs("serviceIdModal"), false);
    qs("serviceIdModal").value = d.serviceId;

    modal.show();
  } catch (e) {
    showBox("pageError", e.message);
  }
}

async function saveDoctor() {
  hideBox("modalError");
  hideBox("pageError");
  hideBox("pageOk");

  const id = qs("doctorId").value;

  // Short validation in UI (backend still validates)
  const fullName = qs("fullName").value.trim();
  if (!fullName) {
    showBox("modalError", "Full Name is required.");
    return;
  }

  const body = {
    fullName,
    title: qs("title").value.trim() || null,
    bio: qs("bio").value.trim() || null,
    imageUrl: qs("imageUrl").value.trim() || null,
    clinicName: qs("clinicName").value.trim() || null,
    fee: Number(qs("fee").value || 0),
    rating: qs("rating").value === "" ? null : Number(qs("rating").value),
    serviceId: Number(qs("serviceIdModal").value),
    isActive: qs("isActive").checked
  };

  try {
    if (!id) {
      await apiFetch("/admin/doctors", { method: "POST", body, auth: true });
      showBox("pageOk", "Doctor created.", "success");
    } else {
      await apiFetch(`/admin/doctors/${id}`, { method: "PUT", body, auth: true });
      showBox("pageOk", "Doctor updated.", "success");
    }

    modal.hide();
    await loadAll();
  } catch (e) {
    showBox("modalError", e.message);
  }
}

async function deleteDoctor(id) {
  hideBox("pageError");
  hideBox("pageOk");

  if (!confirm(`Delete doctor #${id}?`)) return;

  try {
    await apiFetch(`/admin/doctors/${id}`, { method: "DELETE", auth: true });
    showBox("pageOk", "Doctor deleted.", "success");
    await loadAll();
  } catch (e) {
    showBox("pageError", e.message);
  }
}

async function loadAll() {
  try {
    allServices = await apiFetch("/services");
    fillServices(qs("serviceId"), true);
    fillServices(qs("serviceIdModal"), false);

    allDoctors = await apiFetch("/admin/doctors", { auth: true });
    renderFiltered();
  } catch (e) {
    showBox("pageError", e.message);
  }
}

loadAll();