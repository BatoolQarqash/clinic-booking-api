// frontend/js/landing.js

(() => {
  // -----------------------------
  // DOM references
  // -----------------------------
  const servicesList = document.getElementById("landingServicesList");
  const doctorsList = document.getElementById("landingDoctorsList");
  const doctorsError = document.getElementById("landingDoctorsError");
  const heroSearchForm = document.getElementById("heroSearchForm");
  const heroDoctorInput = document.getElementById("heroDoctorInput");
  const heroLocationInput = document.getElementById("heroLocationInput");

  // -----------------------------
  // Escape unsafe text before rendering it in HTML
  // -----------------------------
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // -----------------------------
  // Resolve doctor image URL
  // -----------------------------
  function resolveImageUrl(imageUrl) {
    if (!imageUrl) return "../assets/img/doctor-placeholder.png";

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return `${window.location.origin}${imageUrl}`;
    }

    return `../assets/img/${imageUrl}`;
  }

  // -----------------------------
  // Check whether the visitor already has a valid session token
  // -----------------------------
  function isLoggedIn() {
    return typeof getToken === "function" && !!getToken();
  }

  // -----------------------------
  // Build the final destination.
  // If logged in -> go directly to target page.
  // If not logged in -> go to login page with redirect target.
  // -----------------------------
  function buildProtectedTarget(targetPage) {
    if (isLoggedIn()) {
      return targetPage;
    }

    return `login.html?redirect=${encodeURIComponent(targetPage)}`;
  }

  // -----------------------------
  // Show error message box
  // -----------------------------
  function showDoctorsError(message) {
    doctorsError.textContent = message;
    doctorsError.classList.remove("d-none");
  }

  // -----------------------------
  // Hide error message box
  // -----------------------------
  function hideDoctorsError() {
    doctorsError.textContent = "";
    doctorsError.classList.add("d-none");
  }

  // -----------------------------
  // Render services list in About section
  // -----------------------------
  function renderServices(services) {
    const topServices = (services || []).slice(0, 6);

    if (!topServices.length) {
      servicesList.innerHTML = `
        <li>Online doctor appointments</li>
        <li>Specialist consultations</li>
        <li>Medical advice and support</li>
      `;
      return;
    }

    servicesList.innerHTML = topServices
      .map(service => {
        const serviceName = service.name || service.Name || "Medical service";
        return `<li>${escapeHtml(serviceName)}</li>`;
      })
      .join("");
  }

  // -----------------------------
  // Render doctor cards
  // Book Now checks session first
  // -----------------------------
  function renderDoctors(doctors) {
    doctorsList.innerHTML = "";

    const items = (doctors || []).slice(0, 4);

    if (!items.length) {
      doctorsList.innerHTML = `
        <article class="cb-doctor-landing-card">
          <div class="cb-doctor-landing-body">
            <h3>No doctors available yet</h3>
            <p>Add doctors from the admin panel and they will appear here automatically.</p>
          </div>
        </article>
      `;
      return;
    }

    items.forEach(doctor => {
      const id = doctor.id || doctor.Id;
      const fullName = doctor.fullName || doctor.FullName || "Doctor";
      const title = doctor.title || doctor.Title || "Specialist";
      const rating = doctor.rating ?? doctor.Rating ?? "New";
      const imageUrl = resolveImageUrl(doctor.imageUrl || doctor.ImageUrl);

      const safeName = escapeHtml(fullName);
      const safeTitle = escapeHtml(title);
      const safeRating = escapeHtml(rating);

      const targetPage = `doctor-details.html?id=${id}`;
      const finalUrl = buildProtectedTarget(targetPage);

      const card = document.createElement("article");
      card.className = "cb-doctor-landing-card";

      card.innerHTML = `
        <img
          class="cb-doctor-landing-image"
          src="${imageUrl}"
          alt="${safeName}"
        />

        <div class="cb-doctor-landing-body">
          <div class="cb-doctor-landing-top">
            <div>
              <h3>${safeName}</h3>
              <p>${safeTitle}</p>
            </div>

            <span class="cb-rating-chip">
              <i class="bi bi-star-fill"></i> ${safeRating}
            </span>
          </div>

          <a href="${finalUrl}" class="cb-btn cb-btn-primary cb-btn-block">
            Book Now
          </a>
        </div>
      `;

      const image = card.querySelector(".cb-doctor-landing-image");
      image.addEventListener("error", () => {
        image.src = "../assets/img/doctor-placeholder.png";
      });

      doctorsList.appendChild(card);
    });
  }

  // -----------------------------
  // Load services from backend
  // -----------------------------
  async function loadServices() {
    try {
      const services = await apiFetch("/services");
      renderServices(services);
    } catch (error) {
      renderServices([]);
      console.error("Failed to load services:", error.message);
    }
  }

  // -----------------------------
  // Load top doctors from backend
  // -----------------------------
  async function loadDoctors() {
    hideDoctorsError();
    doctorsList.innerHTML = "";

    try {
      const doctors = await apiFetch("/doctors/top?take=4");
      renderDoctors(doctors);
    } catch (error) {
      showDoctorsError(error.message || "Failed to load doctors.");
      renderDoctors([]);
      console.error("Failed to load doctors:", error.message);
    }
  }

  // -----------------------------
  // Hero search behavior
  // Search checks session first
  // -----------------------------
  heroSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = heroDoctorInput?.value?.trim() || "";
    const location = heroLocationInput?.value?.trim() || "";

    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    // Keep location in the URL for future use
    if (location) {
      params.set("location", location);
    }

    const targetPage = params.toString()
      ? `doctors.html?${params.toString()}`
      : "doctors.html";

    window.location.href = buildProtectedTarget(targetPage);
  });

  // -----------------------------
  // Initial page load
  // -----------------------------
  loadServices();
  loadDoctors();
})();