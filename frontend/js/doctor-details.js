// frontend/js/doctor-details.js

(() => {
  /* --------------------------------------------------
     DOM references
  -------------------------------------------------- */
  const heroImg = document.getElementById("doctorHeroImg");
  const doctorName = document.getElementById("doctorName");
  const doctorTitle = document.getElementById("doctorTitle");
  const doctorClinic = document.getElementById("doctorClinic");
  const doctorFee = document.getElementById("doctorFee");
  const doctorRating = document.getElementById("doctorRating");
  const doctorBio = document.getElementById("doctorBio");

  const dateInput = document.getElementById("dateInput");
  const loadSlotsBtn = document.getElementById("loadSlotsBtn");

  const slotsError = document.getElementById("slotsError");
  const slotsLoading = document.getElementById("slotsLoading");
  const slotsWrap = document.getElementById("slotsWrap");

  const confirmBtn = document.getElementById("confirmBtn");
  const bookMsg = document.getElementById("bookMsg");


  /* --------------------------------------------------
     Page state
  -------------------------------------------------- */
  const doctorId = getQueryInt("id"); // ✅ from utils.session.js
  let selectedSlotId = null;


  /* --------------------------------------------------
     Small UI helpers (wrap shared utilities)
  -------------------------------------------------- */

  /**
   * Show a warning message related to slots.
   * We keep this wrapper so the rest of the code stays readable.
   * @param {string} msg
   */
  function showSlotsError(msg) {
    showAlert(slotsError, "warning", msg); // ✅ from utils.ui.js
  }

  /**
   * Hide slot error message.
   */
  function hideSlotsError() {
    hideAlert(slotsError);
  }

  /**
   * Show booking success message.
   * @param {string} msg
   */
  function showBookingMessage(msg) {
    showAlert(bookMsg, "success", msg);
  }

  /**
   * Hide booking message.
   */
  function hideBookingMessage() {
    hideAlert(bookMsg);
  }

  /**
   * Toggle slots loading indicator + disable load button.
   * @param {boolean} isLoading
   */
  function setSlotsLoading(isLoading) {
    if (isLoading) {
      slotsLoading.classList.remove("d-none");
      setButtonLoading(loadSlotsBtn, true, "Loading..."); // ✅ from utils.ui.js
    } else {
      slotsLoading.classList.add("d-none");
      setButtonLoading(loadSlotsBtn, false);
    }
  }


  /* --------------------------------------------------
     Doctor rendering
  -------------------------------------------------- */

  /**
   * Safely set the hero image.
   * Supports both imageUrl (camelCase) and ImageUrl (PascalCase).
   * @param {any} doctor
   */
  function setDoctorImage(doctor) {
   const img = resolveImageUrl(doctor?.imageUrl || doctor?.ImageUrl);
    heroImg.src = img;

    // Fallback if image fails to load
    heroImg.onerror = () => {
      heroImg.src = "../assets/img/doctor-placeholder.png";
    };
  }

  /**
   * Render doctor fields into the UI.
   * Supports both camelCase and PascalCase fields from .NET JSON.
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
   * Load doctor info from backend.
   */
  async function loadDoctor() {
    hideSlotsError();

    try {
      const doctor = await apiFetch(`/doctors/${doctorId}`);
      renderDoctor(doctor);
    } catch (e) {
      showSlotsError(e.message);
    }
  }


  /* --------------------------------------------------
     Slots
  -------------------------------------------------- */

  /**
   * Format an ISO datetime into "HH:mm" (local time).
   * @param {string} iso
   * @returns {string}
   */
  function formatTime(iso) {
    if (!iso) return "--:--";
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  /**
   * Clear current slot selection.
   */
  function resetSlotSelection() {
    selectedSlotId = null;
    confirmBtn.disabled = true;
    slotsWrap.querySelectorAll(".cb-slot-btn").forEach(b => b.classList.remove("active"));
  }

  /**
   * Render available slots as buttons (pills).
   * @param {Array} slots
   */
  function renderSlots(slots) {
    slotsWrap.innerHTML = "";
    resetSlotSelection();

    if (!slots || slots.length === 0) {
      showSlotsError("No available slots for this date.");
      return;
    }

    slots.forEach(s => {
      const slotId = s.id || s.Id;
      const start = s.startTime || s.StartTime;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cb-slot-btn";
      btn.textContent = formatTime(start);

      btn.addEventListener("click", () => {
        // Remove active state from all
        slotsWrap.querySelectorAll(".cb-slot-btn").forEach(b => b.classList.remove("active"));

        // Set current active
        btn.classList.add("active");

        // Save selection
        selectedSlotId = slotId;
        confirmBtn.disabled = false;
      });

      slotsWrap.appendChild(btn);
    });
  }

  /**
   * Load available slots for the selected date.
   */
  async function loadSlots() {
    hideSlotsError();
    hideBookingMessage();
    resetSlotSelection();

    const date = dateInput.value;
    if (!date) {
      showSlotsError("Please select a date first.");
      return;
    }

    setSlotsLoading(true);
    slotsWrap.innerHTML = "";

    try {
      const slots = await apiFetch(`/doctors/${doctorId}/slots?date=${date}`);
      renderSlots(slots);
    } catch (e) {
      showSlotsError(e.message);
    } finally {
      setSlotsLoading(false);
    }
  }


  /* --------------------------------------------------
     Booking
  -------------------------------------------------- */

  /**
   * Confirm appointment booking for selected slot.
   */
  async function confirmBooking() {
    hideSlotsError();
    hideBookingMessage();

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

      // Reload slots to reflect the new booking (slot becomes unavailable)
      await loadSlots();

    } catch (e) {
      showSlotsError(e.message);
      confirmBtn.disabled = false;
    }
  }


  /* --------------------------------------------------
     Init
  -------------------------------------------------- */

  // ✅ Use shared auth guard
  requireAuth();

  // Validate doctor id from URL
  if (!doctorId) {
    showSlotsError("Missing doctor id in URL.");
    return;
  }

  // Default date = today
  dateInput.valueAsDate = new Date();

  // Events
  loadSlotsBtn.addEventListener("click", loadSlots);
  confirmBtn.addEventListener("click", confirmBooking);

  // Initial load
  loadDoctor();
})();