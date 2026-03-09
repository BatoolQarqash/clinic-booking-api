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

  // Notification UI
  const notifBtn = document.getElementById("notifBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const closeNotifBtn = document.getElementById("closeNotifBtn");
  const notifPanel = document.getElementById("notifPanel");
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");


  /* --------------------------------------------------
     UI helpers
  -------------------------------------------------- */

  /**
   * Show services error message.
   * @param {string} msg
   */
  function showServicesError(msg) {
    showAlert(servicesError, "danger", msg);
  }

  /**
   * Hide services error message.
   */
  function hideServicesError() {
    hideAlert(servicesError);
  }

  /**
   * Show doctors error message.
   * @param {string} msg
   */
  function showDoctorsError(msg) {
    showAlert(doctorsError, "danger", msg);
  }

  /**
   * Hide doctors error message.
   */
  function hideDoctorsError() {
    hideAlert(doctorsError);
  }


  /* --------------------------------------------------
     Service icon mapping
  -------------------------------------------------- */

  /**
   * Pick a Bootstrap icon based on service name.
   * @param {string} name
   * @returns {string}
   */
  function serviceIcon(name) {
    const n = (name || "").toLowerCase();

    if (n.includes("dent")) return "bi-tooth";
    if (n.includes("neuro")) return "bi-brain";
    if (n.includes("card")) return "bi-heart-pulse";
    if (n.includes("derma") || n.includes("skin")) return "bi-droplet";
    if (n.includes("pedia") || n.includes("child")) return "bi-emoji-smile";
    if (n.includes("ortho") || n.includes("bone")) return "bi-bandaid";
    if (n.includes("oph") || n.includes("eye")) return "bi-eye";
    if (n === "ent" || n.includes("ear")) return "bi-ear";

    return "bi-grid";
  }


  /* --------------------------------------------------
     Services section
  -------------------------------------------------- */

  /**
   * Render service cards.
   * @param {Array} services
   */
  function renderServices(services) {
    servicesRow.innerHTML = "";

    services.forEach(s => {
      const id = s.id || s.Id;
      const name = s.name || s.Name || "Service";

      const card = document.createElement("a");
      card.className = "cb-service-card";
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
      const services = await apiFetch("/services");
      renderServices(services);
    } catch (e) {
      showServicesError(e.message);
    }
  }


  /* --------------------------------------------------
     Top doctors section
  -------------------------------------------------- */

  /**
   * Render top doctors as cards.
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

      // Fallback image if backend image fails
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
     Notifications
     MVP approach:
     - We derive notifications from user's appointments.
     - No dedicated notifications table yet.
  -------------------------------------------------- */

  /**
   * Format a date string in a short readable form.
   * @param {string} iso
   * @returns {string}
   */
  function formatShortDate(iso) {
    if (!iso) return "Unknown date";
    return new Date(iso).toLocaleString();
  }

  /**
   * Build a notification object from an appointment.
   * This converts appointment data into a UI-friendly notification item.
   * @param {any} appt
   * @returns {{type:string, title:string, text:string, sortTime:number}}
   */
  function mapAppointmentToNotification(appt) {
    const doctor = appt.doctor || appt.Doctor || {};
    const slot = appt.slot || appt.Slot || {};
    const status = String(appt.status || appt.Status || "").toLowerCase();

    const doctorName = doctor.fullName || doctor.FullName || "Doctor";
    const startTime = slot.startTime || slot.StartTime || null;
    const startDate = startTime ? new Date(startTime) : null;
    const now = new Date();

    // Start with original appointment status notification
    if (status === "cancelled") {
      return {
        type: "cancelled",
        title: "Appointment cancelled",
        text: `Your appointment with ${doctorName} was cancelled.`,
        sortTime: startDate ? startDate.getTime() : 0
      };
    }

    if (status === "booked") {
      // Reminder if appointment is today or soon
      if (startDate) {
        const diffMs = startDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= 0 && diffHours <= 24) {
          return {
            type: "reminder",
            title: "Upcoming appointment",
            text: `Reminder: you have an appointment with ${doctorName} at ${formatShortDate(startTime)}.`,
            sortTime: startDate.getTime()
          };
        }

        if (
          startDate.getFullYear() === now.getFullYear() &&
          startDate.getMonth() === now.getMonth() &&
          startDate.getDate() === now.getDate()
        ) {
          return {
            type: "today",
            title: "Appointment today",
            text: `You have an appointment with ${doctorName} today at ${formatShortDate(startTime)}.`,
            sortTime: startDate.getTime()
          };
        }
      }

      return {
        type: "booked",
        title: "Appointment booked",
        text: `Your appointment with ${doctorName} is confirmed for ${formatShortDate(startTime)}.`,
        sortTime: startDate ? startDate.getTime() : 0
      };
    }

    return {
      type: "info",
      title: "Appointment update",
      text: `There is an update on your appointment with ${doctorName}.`,
      sortTime: startDate ? startDate.getTime() : 0
    };
  }

  /**
   * Remove duplicates and sort notifications by time descending.
   * @param {Array} notifications
   * @returns {Array}
   */
  function normalizeNotifications(notifications) {
    const seen = new Set();

    const unique = notifications.filter(n => {
      const key = `${n.type}|${n.title}|${n.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.sortTime - a.sortTime);
  }

  /**
   * Render notification items inside the panel.
   * @param {Array} notifications
   */
    /**
 * Render notifications and show badge only for NEW ones.
 */
function renderNotifications(notifications) {

  notifList.innerHTML = "";

  if (!notifications.length) {

    notifList.innerHTML = `
      <div class="text-muted small p-2">
        No notifications yet.
      </div>
    `;

    notifBadge.classList.add("d-none");
    return;
  }

  // Read timestamp stored locally
  const lastRead = Number(localStorage.getItem("notificationsLastRead") || 0);

  // Count new notifications
  const newNotifications = notifications.filter(n => n.sortTime > lastRead);

  notifications.forEach(n => {

    const item = document.createElement("div");
    item.className = "border-bottom px-2 py-2";

    item.innerHTML = `
      <div class="fw-semibold small">${n.title}</div>
      <div class="text-muted small">${n.text}</div>
    `;

    notifList.appendChild(item);

  });

  // Show badge only if there are NEW notifications
  if (newNotifications.length > 0) {
    notifBadge.textContent = newNotifications.length;
    notifBadge.classList.remove("d-none");
  } else {
    notifBadge.classList.add("d-none");
  }

}

  /**
   * Load user appointments and derive notifications from them.
   * This is the MVP notification source until we add a real Notification table.
   */
  async function loadNotifications() {
    try {
      const appointments = await apiFetch("/appointments/my", { auth: true });

      const notifications = normalizeNotifications(
        (appointments || []).map(mapAppointmentToNotification)
      );

      renderNotifications(notifications);
    } catch {
      // If notifications fail, keep panel usable with a fallback message
      notifList.innerHTML = `
        <div class="text-muted small p-2">
          Unable to load notifications right now.
        </div>
      `;
      notifBadge.classList.add("d-none");
    }
  }

  /**
   * Toggle notification panel open/closed.
   */
   function toggleNotificationsPanel() {

  const isHidden = notifPanel.classList.contains("d-none");

  notifPanel.classList.toggle("d-none");

  if (isHidden) {

    // User opened notifications -> mark as read
    localStorage.setItem("notificationsLastRead", Date.now());

    // Hide badge
    notifBadge.classList.add("d-none");
  }
}

  /**
   * Close notification panel.
   */
  function closeNotificationsPanel() {
    notifPanel.classList.add("d-none");
  }
  
  /**
 * Logout current user
 * This function clears the stored session
 * and redirects the user to login page.
 */
function handleLogout() {
  logout();
}
  /* --------------------------------------------------
     Init
  -------------------------------------------------- */

  // Show current user name from session
  const user = getCurrentUser();
  helloName.textContent = user?.fullName || "User";

  // Load page content
  loadServices();
  loadTopDoctors();
  loadNotifications();
  // Logout event
logoutBtn?.addEventListener("click", handleLogout);

  // Notification events
  notifBtn?.addEventListener("click", toggleNotificationsPanel);
  closeNotifBtn?.addEventListener("click", closeNotificationsPanel);

  // Close panel when clicking outside it
  document.addEventListener("click", (e) => {
    const clickedInsidePanel = notifPanel?.contains(e.target);
    const clickedButton = notifBtn?.contains(e.target);

    if (!clickedInsidePanel && !clickedButton) {
      closeNotificationsPanel();
    }
  });

})();