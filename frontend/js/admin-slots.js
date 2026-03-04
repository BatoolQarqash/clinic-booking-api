// frontend/js/admin-slots.js
requireAdmin();
qs("logoutBtn").addEventListener("click", logout);
qs("createBtn").addEventListener("click", createSlots);

async function loadDoctors() {
  hideBox("pageError");
  try {
    const docs = await apiFetch("/admin/doctors", { auth: true });
    const sel = qs("doctorId");
    sel.innerHTML = "";

    docs.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = `#${d.id} - ${d.fullName}`;
      sel.appendChild(opt);
    });
  } catch (e) {
    showBox("pageError", e.message);
  }
}

async function createSlots() {
  hideBox("pageError");
  hideBox("pageOk");

  const body = {
    doctorId: Number(qs("doctorId").value),
    date: qs("date").value.trim(),
    startTime: qs("startTime").value.trim(),
    endTime: qs("endTime").value.trim(),
    slotMinutes: Number(qs("slotMinutes").value || 30)
  };

  try {
    const res = await apiFetch("/admin/slots/bulk", { method: "POST", body, auth: true });
    showBox("pageOk", res.message || "Done.", "success");
  } catch (e) {
    showBox("pageError", e.message);
  }
}

loadDoctors();