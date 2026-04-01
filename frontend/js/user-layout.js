document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("userNavMount");
  if (!mount) return;

  const page = window.location.pathname.split("/").pop()?.toLowerCase() || "";

  function isActive(target) {
    return page === target;
  }

  // doctor-details should highlight Doctors in nav
  const doctorsActive = isActive("doctors.html") || isActive("doctor-details.html");

  mount.innerHTML = `
    <div class="cb-nav-overlay" id="navOverlay"></div>

    <nav class="cb-bottom-nav" id="sideNav">
      <a class="cb-nav-item ${isActive("home.html") ? "active" : ""}" href="home.html" title="Home">
        <i class="bi bi-house-fill"></i>
        <span class="cb-nav-label">Home</span>
      </a>

      <a class="cb-nav-item ${doctorsActive ? "active" : ""}" href="doctors.html" title="Doctors">
        <i class="bi bi-people-fill"></i>
        <span class="cb-nav-label">Doctors</span>
      </a>

      <a class="cb-nav-item ${isActive("favorites.html") ? "active" : ""}" href="favorites.html" title="Favorites">
        <i class="bi bi-heart-fill"></i>
        <span class="cb-nav-label">Favorites</span>
      </a>

      <a class="cb-nav-item ${isActive("my-appointments.html") ? "active" : ""}" href="my-appointments.html" title="Appointments">
        <i class="bi bi-clipboard-check"></i>
        <span class="cb-nav-label">Appointments</span>
      </a>
    </nav>
  `;

  // Smart back buttons
  document.querySelectorAll("[data-smart-back]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const fallback = btn.getAttribute("data-fallback") || "home.html";
      const sameOriginReferrer =
        document.referrer &&
        document.referrer.startsWith(window.location.origin);

      if (window.history.length > 1 && sameOriginReferrer) {
        window.history.back();
        return;
      }

      window.location.href = fallback;
    });
  });
});