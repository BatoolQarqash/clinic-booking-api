// frontend/js/doctor-details.js

(() => {
  // ---------- DOM references ----------
  const heroImg = document.getElementById("doctorHeroImg");
  const doctorName = document.getElementById("doctorName");
  const doctorTitle = document.getElementById("doctorTitle");
  const doctorClinic = document.getElementById("doctorClinic");
  const doctorFee = document.getElementById("doctorFee");
  const doctorRating = document.getElementById("doctorRating");
  const doctorBio = document.getElementById("doctorBio");

  const dateInput = document.getElementById("dateInput");
  const loadSlotsBtn = document.getElementById("loadSlotsBtn");
  const slotsWrap = document.getElementById("slotsWrap");
  const slotsError = document.getElementById("slotsError");
  const slotsLoading = document.getElementById("slotsLoading");

  const confirmBtn = document.getElementById("confirmBtn");
  const bookMsg = document.getElementById("bookMsg");

  // ---------- State ----------
  let doctorId = null;
  let selectedSlotId = null;

  /**
   * Require user authentication.
   * Redirects to login if token is missing.
   */
  function requireAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) window.location.href = "login.html";
  }

  /**
   * Read doctor id from URL query string.
   * Example: doctor-details.html?id=3
   * @returns {number|null}
   */
  function getDoctorIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"), 10);
    return Number.isFinite(id) ? id : null;
  }

  /**
   * Show a warning alert (used for slot loading issues).
   * @param {string} msg
   */
  function showSlotsError(msg) {
    slotsError.textContent = msg;
    slotsError.classList.remove("d-none");
  }

  /**
   * Hide slot error alert.
   */
  function hideSlotsError() {
    slotsError.textContent = "";
    slotsError.classList.add("d-none");
  }

  /**
   * Show a success message after booking.
   * @param {string} msg
   */
  function showBookingMessage(msg) {
    bookMsg.textContent = msg;
    bookMsg.classList.remove("d-none");
  }

  /**
   * Hide booking message.
   */
  function hideBookingMessage() {
    bookMsg.textContent = "";
    bookMsg.classList.add("d-none");
  }

  /**
   * Set doctor hero image safely.
   * Supports both: imageUrl (camelCase) and ImageUrl (PascalCase).
   * @param {any} doctor
   */
  function setDoctorImage(doctor) {
    const img =
      doctor.imageUrl ||
      doctor.ImageUrl || // ✅ very important (backend may return PascalCase)
      "../assets/img/doctor-placeholder.png";

    heroImg.src = img;

    // If the image fails, fallback to placeholder
    heroImg.onerror = () => {
      heroImg.src = "../assets/img/doctor-placeholder.png";
    };
  }

  /**
   * Render doctor details into the UI.
   * @param {any} doctor
   */
  function renderDoctor(doctor) {
    setDoctorImage(doctor);

    doctorName.textContent = doctor.fullName || doctor.FullName || "Doctor";
    doctorTitle.textContent = doctor.title || doctor.Title || "";
    doctorClinic.textContent = doctor.clinicName || doctor.ClinicName || "";
    doctorFee.textContent = `$${doctor.fee ?? doctor.Fee ?? 0}`;
    doctorRating.textContent = doctor.rating ?? doctor.Rating ?? "—";
    doctorBio.textContent = doctor.bio || doctor.Bio || "";
  }

  /**
   * Load doctor data from backend.
   */
  async function loadDoctor() {
    try {
      const doctor = await apiFetch(`/doctors/${doctorId}`);
      renderDoctor(doctor);
    } catch (e) {
      showSlotsError(e.message);
    }
  }

  /**
   * Format time label from ISO (slot start time).
   * @param {string} iso
   */
  function formatTime(iso) {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  /**
   * Render available slots as clickable pills.
   * @param {Array} slots
   */
  function renderSlots(slots) {
    slotsWrap.innerHTML = "";
    selectedSlotId = null;
    confirmBtn.disabled = true;

    if (!slots || slots.length === 0) {
      showSlotsError("No available slots for this date.");
      return;
    }

    slots.forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cb-slot-btn";
      btn.textContent = formatTime(s.startTime || s.StartTime);

      btn.addEventListener("click", () => {
        // Remove active from all buttons
        slotsWrap.querySelectorAll(".cb-slot-btn").forEach(b => b.classList.remove("active"));

        // Set this as active
        btn.classList.add("active");

        // Save selection
        selectedSlotId = s.id || s.Id;
        confirmBtn.disabled = false;
      });

      slotsWrap.appendChild(btn);
    });
  }

  /**
   * Load available slots for selected date.
   */
  async function loadSlots() {
    hideSlotsError();
    hideBookingMessage();

    const date = dateInput.value;
    if (!date) {
      showSlotsError("Please select a date first.");
      return;
    }

    loadSlotsBtn.disabled = true;
    slotsLoading.classList.remove("d-none");
    slotsWrap.innerHTML = "";
    confirmBtn.disabled = true;

    try {
      const slots = await apiFetch(`/doctors/${doctorId}/slots?date=${date}`);
      renderSlots(slots);
    } catch (e) {
      showSlotsError(e.message);
    } finally {
      loadSlotsBtn.disabled = false;
      slotsLoading.classList.add("d-none");
    }
  }

  /**
   * Confirm booking for the selected slot.
   */
  async function confirmBooking() {
    hideBookingMessage();
    hideSlotsError();

    if (!selectedSlotId) {
      showSlotsError("Please select a slot first.");
      return;
    }

    confirmBtn.disabled = true;

    try {
      const res = await apiFetch("/appointments", {
        method: "POST",
        auth: true,
        body: {
          doctorId,
          slotId: selectedSlotId
        }
      });

      showBookingMessage(res?.message || "Appointment booked successfully!");
      // Refresh slots to show updated availability
      await loadSlots();
    } catch (e) {
      showSlotsError(e.message);
      confirmBtn.disabled = false;
    }
  }

  // ---------- Init ----------
  requireAuth();

  doctorId = getDoctorIdFromUrl();
  if (!doctorId) {
    showSlotsError("Missing doctor id in URL.");
    return;
  }

  // Default date = today
  dateInput.valueAsDate = new Date();

  loadSlotsBtn.addEventListener("click", loadSlots);
  confirmBtn.addEventListener("click", confirmBooking);

  loadDoctor();
})();