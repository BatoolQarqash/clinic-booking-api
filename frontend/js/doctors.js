// ===== Guards =====
const token = localStorage.getItem(TOKEN_KEY);
if (!token) window.location.href = "login.html";

// ===== Read URL params (serviceId, q) =====
// Example: doctors.html?serviceId=2&q=omar
const params = new URLSearchParams(window.location.search);

// serviceId might be "2" or null
const serviceIdFromUrl = params.get("serviceId");
// q might be "omar" or null
const qFromUrl = params.get("q") || "";

// ===== DOM refs =====
const searchInput = document.getElementById("searchInput");
const serviceSelect = document.getElementById("serviceSelect");
const applyBtn = document.getElementById("applyBtn");

const doctorsList = document.getElementById("doctorsList");
const errorBox = document.getElementById("errorBox");
const emptyBox = document.getElementById("emptyBox");
const resultCount = document.getElementById("resultCount");

// Put initial values in UI from URL
searchInput.value = qFromUrl;
if (serviceIdFromUrl) serviceSelect.value = serviceIdFromUrl;

// ===== Helper: show/hide errors =====
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("d-none");
}
function hideError() {
  errorBox.textContent = "";
  errorBox.classList.add("d-none");
}

// ===== Load services to fill the dropdown =====
async function loadServicesDropdown() {
  try {
    const services = await apiFetch("/services");
    services.forEach(s => {
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = s.name;
      serviceSelect.appendChild(opt);
    });

    // After options exist, set selected from URL (if any)
    if (serviceIdFromUrl) serviceSelect.value = serviceIdFromUrl;
  } catch (e) {
    // Not fatal (page can still work without dropdown)
    console.warn("Failed to load services:", e.message);
  }
}

// ===== Build query string for API =====
function buildDoctorsApiUrl() {
  const serviceId = serviceSelect.value;     // "" or "2"
  const q = searchInput.value.trim();        // "" or "omar"

  const query = new URLSearchParams();

  if (serviceId) query.set("serviceId", serviceId);
  if (q) query.set("q", q);

  // Result: "/doctors?serviceId=2&q=omar"
  const qs = query.toString();
  return qs ? `/doctors?${qs}` : "/doctors";
}

// ===== Update browser URL (so filter/search is shareable) =====
function updatePageUrl() {
  const serviceId = serviceSelect.value;
  const q = searchInput.value.trim();

  const query = new URLSearchParams();
  if (serviceId) query.set("serviceId", serviceId);
  if (q) query.set("q", q);

  const newUrl = query.toString()
    ? `doctors.html?${query.toString()}`
    : "doctors.html";

  // Replace current URL without reloading page
  window.history.replaceState({}, "", newUrl);
}

// ===== Render doctors =====
function renderDoctors(doctors) {
  doctorsList.innerHTML = "";
  emptyBox.classList.add("d-none");

  resultCount.textContent = doctors.length ? `${doctors.length} results` : "";

  if (!doctors.length) {
    emptyBox.classList.remove("d-none");
    return;
  }

  doctors.forEach(d => {
    const card = document.createElement("div");
    card.className = "cb-doctor-card";

    card.innerHTML = `
      <div class="cb-doctor-left">
        <img class="cb-doctor-img" src="${d.imageUrl || '../assets/img/doctor-placeholder.png'}"
             onerror="this.src='../assets/img/doctor-placeholder.png'" alt="doctor" />
        <div class="cb-doctor-info">
          <div class="cb-doctor-name">${d.fullName}</div>
          <div class="cb-doctor-title">${d.title || ""}</div>
          <div class="cb-doctor-meta">
            <span><i class="bi bi-cash-coin"></i> $${d.fee}</span>
            <span><i class="bi bi-award"></i> ${d.service?.name ?? ""}</span>
          </div>
        </div>
      </div>
      <div class="cb-doctor-right">
        <div class="cb-rating"><i class="bi bi-star-fill"></i> ${d.rating ?? "4.8"}</div>
        <a class="cb-arrow-btn" href="doctor-details.html?id=${d.id}">
          <i class="bi bi-arrow-right"></i>
        </a>
      </div>
    `;

    doctorsList.appendChild(card);
  });
}

// ===== Load doctors from API =====
async function loadDoctors() {
  hideError();
  const apiUrl = buildDoctorsApiUrl();

  try {
    const doctors = await apiFetch(apiUrl);
    renderDoctors(doctors);
    updatePageUrl();
  } catch (e) {
    showError(e.message);
  }
}

// ===== Events =====
applyBtn.addEventListener("click", loadDoctors);

// Optional: press Enter in search triggers load
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadDoctors();
});

// ===== Init =====
loadServicesDropdown().then(loadDoctors);