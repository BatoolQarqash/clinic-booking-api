// frontend/js/home.js

(() => {
  /* --------------------------------------------------
     Auth Guard
     - This page is for logged-in users only.
  -------------------------------------------------- */
  requireAuth();

  /* --------------------------------------------------
     DOM references
  -------------------------------------------------- */
  const helloName = document.getElementById("helloName");

  const servicesRow = document.getElementById("servicesRow");
  const servicesError = document.getElementById("servicesError");

  const doctorsList = document.getElementById("doctorsList");
  const doctorsError = document.getElementById("doctorsError");


  /* --------------------------------------------------
     UI helpers (wrappers to keep code readable)
  -------------------------------------------------- */

  /**
   * Show services error message (Bootstrap alert).
   * @param {string} msg
   */
  function showServicesError(msg) {
    showAlert(servicesError, "danger", msg);
  }

  /** Hide services error message. */
  function hideServicesError() {
    hideAlert(servicesError);
  }

  /**
   * Show doctors error message (Bootstrap alert).
   * @param {string} msg
   */
  function showDoctorsError(msg) {
    showAlert(doctorsError, "danger", msg);
  }

  /** Hide doctors error message. */
  function hideDoctorsError() {
    hideAlert(doctorsError);
  }


  /* --------------------------------------------------
     Service icon mapping (Bootstrap Icons)
  -------------------------------------------------- */

  /**
   * Pick an icon class based on service name.
   * @param {string} name
   * @returns {string}
   */
  function serviceIcon(name) {
    const n = (name || "").toLowerCase();

    // Mapping requested by you
    if (n.includes("dent")) return "bi-tooth";                // Dentistry
    if (n.includes("neuro")) return "bi-brain";               // Neurology
    if (n.includes("card")) return "bi-heart-pulse";          // Cardiology
    if (n.includes("derma") || n.includes("skin")) return "bi-droplet"; // Dermatology
    if (n.includes("pedia") || n.includes("child")) return "bi-emoji-smile"; // Pediatrics
    if (n.includes("ortho") || n.includes("bone")) return "bi-bandaid"; // Orthopedics
    if (n.includes("oph") || n.includes("eye")) return "bi-eye";        // Ophthalmology
    if (n === "ent" || n.includes("ear")) return "bi-ear";              // ENT

    return "bi-grid";
  }


  /* --------------------------------------------------
     Services section
  -------------------------------------------------- */

  /**
   * Render services as horizontal scroll cards.
   * @param {Array} services
   */
  function renderServices(services) {
    servicesRow.innerHTML = "";

    services.forEach(s => {
      const id = s.id || s.Id;
      const name = s.name || s.Name || "Service";

      const card = document.createElement("a");
      card.className = "cb-service-card";

      // Clicking a service opens doctors page filtered by serviceId
      card.href = `doctors.html?serviceId=${id}`;

      card.innerHTML = `
        <div class="cb-service-icon">
          <i class="bi ${serviceIcon(name)}"></i>
        </div>
        <div class="cb-service-name">${name}</div>
      `;

      servicesRow.appendChild(card);
    });
  }

  /**
   * Load services from backend.
   */
  async function loadServices() {
    hideServicesError();
    servicesRow.innerHTML = "";

    try {
      const services = await apiFetch("/services"); // public endpoint
      renderServices(services);
    } catch (e) {
      showServicesError(e.message);
    }
  }


  /* --------------------------------------------------
     Top doctors section
  -------------------------------------------------- */

  /**
   * Render top doctors as cards (mobile-first list).
   * @param {Array} doctors
   */
  function renderTopDoctors(doctors) {
    doctorsList.innerHTML = "";

    const top = (doctors || []).slice(0, 5);

    top.forEach(d => {
      const id = d.id || d.Id;
      const name = d.fullName || d.FullName || "Doctor";
      const title = d.title || d.Title || "";
      const fee = d.fee ?? d.Fee ?? "—";
      const rating = d.rating ?? d.Rating ?? "—";

      // Support both ImageUrl and imageUrl (backend vs frontend naming)
      const img = resolveImageUrl(d.imageUrl || d.ImageUrl);
      const card = document.createElement("div");
      card.className = "cb-doctor-card";

      card.innerHTML = `
        <div class="cb-doctor-left">
          <img class="cb-doctor-img" src="${img}" alt="doctor" />
          <div class="cb-doctor-info">
            <div class="cb-doctor-name">${name}</div>
            <div class="cb-doctor-title">${title}</div>
            <div class="cb-doctor-meta">
              <span><i class="bi bi-cash-coin"></i> Fee: $${fee}</span>
            </div>
          </div>
        </div>

        <div class="cb-doctor-right">
          <div class="cb-rating"><i class="bi bi-star-fill"></i> ${rating}</div>
          <a class="cb-arrow-btn" href="doctor-details.html?id=${id}">
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      `;

      // Image fallback (avoid inline onerror in HTML)
      const imgEl = card.querySelector("img");
      imgEl.addEventListener("error", () => {
        imgEl.src = "../assets/img/doctor-placeholder.png";
      });

      doctorsList.appendChild(card);
    });
  }

  /**
   * Load top doctors from backend.
   */
  async function loadTopDoctors() {
    hideDoctorsError();
    doctorsList.innerHTML = "";

    try {
      const doctors = await apiFetch("/doctors/top?take=5");
      renderTopDoctors(doctors);
    } catch (e) {
      showDoctorsError(e.message);
    }
  }


  /* --------------------------------------------------
     Init
  -------------------------------------------------- */

  // Show user name (if stored in session)
  const user = getCurrentUser();
  helloName.textContent = user?.fullName || "User";

  // Load page sections
  loadServices();
  loadTopDoctors();

})();