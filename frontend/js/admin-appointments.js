// frontend/js/admin-appointments.js
requireAdmin();
qs("logoutBtn").addEventListener("click", logout);

qs("applyBtn").addEventListener("click", () => {
  page = 1;
  loadPage();
});

qs("prevBtn").addEventListener("click", () => {
  if (page > 1) {
    page--;
    loadPage();
  }
});

qs("nextBtn").addEventListener("click", () => {
  if (page < totalPages) {
    page++;
    loadPage();
  }
});

let page = 1;
const pageSize = 20;
let totalPages = 1;

async function loadDoctorsFilter() {
  try {
    const docs = await apiFetch("/admin/doctors", { auth: true });
    const sel = qs("doctorId");
    // keep "All" option
    docs.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.fullName;
      sel.appendChild(opt);
    });
  } catch (e) {
    showBox("pageError", e.message);
  }
}

function buildUrl() {
  const status = qs("status").value;
  const doctorId = qs("doctorId").value;
  const userEmail = qs("userEmail").value.trim();
  const from = qs("from").value.trim();
  const to = qs("to").value.trim();

  const p = new URLSearchParams();
  p.set("page", page);
  p.set("pageSize", pageSize);

  if (status) p.set("status", status);
  if (doctorId) p.set("doctorId", doctorId);
  if (userEmail) p.set("userEmail", userEmail);
  if (from) p.set("from", from);
  if (to) p.set("to", to);

  return `/admin/appointments?${p.toString()}`;
}

async function loadPage() {
  hideBox("pageError");

  try {
    const res = await apiFetch(buildUrl(), { auth: true });
    totalPages = res.totalPages || 1;

    setText("meta", `Page ${res.page} / ${res.totalPages} • Total ${res.total}`);
    renderRows(res.items || []);
  } catch (e) {
    showBox("pageError", e.message);
  }
}

function renderRows(items) {
  const tbody = qs("rows");
  tbody.innerHTML = "";

  items.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.id}</td>
      <td><span class="badge bg-secondary">${a.status}</span></td>
      <td>
        <div class="fw-semibold">${a.user?.fullName || "—"}</div>
        <div class="text-muted small">${a.user?.email || "—"}</div>
      </td>
      <td>${a.doctor?.fullName || "—"}</td>
      <td>
        <div class="text-muted small">${toLocal(a.slot?.startTime)} → ${toLocal(a.slot?.endTime)}</div>
      </td>
      <td class="text-muted small">${toLocal(a.createdAt)}</td>
    `;
    tbody.appendChild(tr);
  });
}

(async function init() {
  await loadDoctorsFilter();
  await loadPage();
})();