// frontend/js/doctors.js

(() => {

  /* --------------------------------------------------
     Authentication Guard
     Redirect user to login if token does not exist
  -------------------------------------------------- */
  function requireAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) window.location.href = "login.html";
  }


  /* --------------------------------------------------
     UI Helpers
  -------------------------------------------------- */

  // Show error message
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("d-none");
  }

  // Hide error message
  function hideError() {
    errorBox.textContent = "";
    errorBox.classList.add("d-none");
  }


  /* --------------------------------------------------
     URL Filters
     Allows sharing filtered page link
  -------------------------------------------------- */

  function readUrlParams() {

    const params = new URLSearchParams(window.location.search);

    return {
      serviceId: params.get("serviceId") || "",
      q: params.get("q") || ""
    };

  }


  function updatePageUrl(filters) {

    const query = new URLSearchParams();

    if (filters.serviceId)
      query.set("serviceId", filters.serviceId);

    if (filters.q)
      query.set("q", filters.q);

    const newUrl = query.toString()
      ? `doctors.html?${query.toString()}`
      : "doctors.html";

    window.history.replaceState({}, "", newUrl);

  }


  /* --------------------------------------------------
     Build API URL
  -------------------------------------------------- */

  function buildDoctorsApiUrl(filters) {

    const query = new URLSearchParams();

    if (filters.serviceId)
      query.set("serviceId", filters.serviceId);

    if (filters.q)
      query.set("q", filters.q);

    const qs = query.toString();

    return qs ? `/doctors?${qs}` : "/doctors";

  }


  /* --------------------------------------------------
     Render Doctors
  -------------------------------------------------- */

  function renderDoctors(doctors) {

    doctorsList.innerHTML = "";

    emptyBox.classList.add("d-none");

    resultCount.textContent =
      doctors.length ? `${doctors.length} results` : "";

    if (!doctors.length) {
      emptyBox.classList.remove("d-none");
      return;
    }

    doctors.forEach(d => {

      // Bootstrap responsive column
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4";

      // Support camelCase or PascalCase from backend
      const img =
        d.imageUrl ||
        d.ImageUrl ||
        "../assets/img/doctor-placeholder.png";

      const serviceName =
        d.service?.name ||
        d.Service?.Name ||
        "";

      col.innerHTML = `

        <div class="cb-doctor-card">

          <div class="cb-doctor-left">

            <img class="cb-doctor-img"
                 src="${img}"
                 alt="doctor" />

            <div class="cb-doctor-info">

              <div class="cb-doctor-name">
                ${d.fullName || d.FullName || "Doctor"}
              </div>

              <div class="cb-doctor-title">
                ${d.title || d.Title || ""}
              </div>

              <div class="cb-doctor-meta">

                <span>
                  <i class="bi bi-cash-coin"></i>
                  $${d.fee ?? d.Fee ?? "—"}
                </span>

                <span>
                  <i class="bi bi-award"></i>
                  ${serviceName}
                </span>

              </div>

            </div>

          </div>

          <div class="cb-doctor-right">

            <div class="cb-rating">
              <i class="bi bi-star-fill"></i>
              ${d.rating ?? d.Rating ?? "—"}
            </div>

            <a class="cb-arrow-btn"
               href="doctor-details.html?id=${d.id || d.Id}">
               <i class="bi bi-arrow-right"></i>
            </a>

          </div>

        </div>

      `;

      // Image fallback
      const imageEl = col.querySelector("img");

      imageEl.addEventListener("error", () => {
        imageEl.src = "../assets/img/doctor-placeholder.png";
      });

      doctorsList.appendChild(col);

    });

  }


  /* --------------------------------------------------
     Load Services Dropdown
  -------------------------------------------------- */

  async function loadServicesDropdown() {

    try {

      const services = await apiFetch("/services");

      services.forEach(s => {

        const opt = document.createElement("option");

        opt.value = String(s.id || s.Id);
        opt.textContent = s.name || s.Name;

        serviceSelect.appendChild(opt);

      });

    } catch {

      // Not fatal

    }

  }


  /* --------------------------------------------------
     Load Doctors from API
  -------------------------------------------------- */

  async function loadDoctors() {

    hideError();

    const filters = {

      serviceId: serviceSelect.value,
      q: searchInput.value.trim()

    };

    try {

      const doctors = await apiFetch(
        buildDoctorsApiUrl(filters)
      );

      renderDoctors(doctors);

      updatePageUrl(filters);

    } catch (e) {

      showError(e.message);

    }

  }


  /* --------------------------------------------------
     Initialization
  -------------------------------------------------- */

  requireAuth();

  // DOM elements
  const searchInput = document.getElementById("searchInput");
  const serviceSelect = document.getElementById("serviceSelect");
  const applyBtn = document.getElementById("applyBtn");

  const doctorsList = document.getElementById("doctorsList");
  const errorBox = document.getElementById("errorBox");
  const emptyBox = document.getElementById("emptyBox");
  const resultCount = document.getElementById("resultCount");


  // Read URL filters first
  const initial = readUrlParams();

  searchInput.value = initial.q;


  // Event: apply filters
  applyBtn.addEventListener("click", loadDoctors);

  // Press Enter in search
  searchInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter")
      loadDoctors();

  });


  // Load dropdown then doctors
  loadServicesDropdown().then(() => {

    if (initial.serviceId)
      serviceSelect.value = initial.serviceId;

    loadDoctors();

  });

})();