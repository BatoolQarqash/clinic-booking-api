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

  // Favorite UI
  const favoriteBtn = document.getElementById("favoriteBtn");
  const favoriteIcon = document.getElementById("favoriteIcon");

  /* --------------------------------------------------
     Page state
  -------------------------------------------------- */
  const doctorId = getQueryInt("id");
  let selectedSlotId = null;
  let currentDoctor = null;

  /* --------------------------------------------------
     Favorites storage
  -------------------------------------------------- */
  const FAVORITES_KEY = "cb_favorite_doctors";

  /**
   * Read favorite doctors from localStorage.
   * @returns {Array}
   */
  function getFavoriteDoctors() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch {
      return [];
    }
  }

  /**
   * Save favorite doctors to localStorage.
   * @param {Array} items
   */
  function saveFavoriteDoctors(items) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  }

  /**
   * Check if a doctor is already in favorites.
   * @param {number|string} id
   * @returns {boolean}
   */
  function isFavoriteDoctor(id) {
    return getFavoriteDoctors().some(d => String(d.id) === String(id));
  }

  /**
   * Add doctor to favorites if not already saved.
   * @param {any} doctor
   */
  function addFavoriteDoctor(doctor) {
    const items = getFavoriteDoctors();

    if (items.some(d => String(d.id) === String(doctor.id || doctor.Id))) {
      return;
    }

    items.push({
      id: doctor.id || doctor.Id,
      fullName: doctor.fullName || doctor.FullName || "Doctor",
      title: doctor.title || doctor.Title || "",
      clinicName: doctor.clinicName || doctor.ClinicName || "",
      imageUrl: doctor.imageUrl || doctor.ImageUrl || "",
      fee: doctor.fee ?? doctor.Fee ?? null,
      serviceName:
        doctor.service?.name ||
        doctor.Service?.Name ||
        doctor.serviceName ||
        doctor.ServiceName ||
        ""
    });

    saveFavoriteDoctors(items);
  }

  /**
   * Remove doctor from favorites.
   * @param {number|string} id
   */
  function removeFavoriteDoctor(id) {
    const items = getFavoriteDoctors().filter(d => String(d.id) !== String(id));
    saveFavoriteDoctors(items);
  }

  /**
   * Update favorite icon state in the UI.
   */
  function refreshFavoriteUi() {
    if (!favoriteIcon || !doctorId) return;

    if (isFavoriteDoctor(doctorId)) {
      favoriteIcon.className = "bi bi-heart-fill";
      favoriteIcon.style.color = "#dc3545";
    } else {
      favoriteIcon.className = "bi bi-heart";
      favoriteIcon.style.color = "";
    }
  }

  /**
   * Toggle current doctor as favorite/unfavorite.
   */
  function toggleFavoriteDoctor() {
    if (!currentDoctor) return;

    const id = currentDoctor.id || currentDoctor.Id;
    if (!id) return;

    if (isFavoriteDoctor(id)) {
      removeFavoriteDoctor(id);
      showBookingMessage("Doctor removed from favorites.");
    } else {
      addFavoriteDoctor(currentDoctor);
      showBookingMessage("Doctor added to favorites.");
    }

    refreshFavoriteUi();
  }

  /* --------------------------------------------------
     Small UI helpers
  -------------------------------------------------- */

  /**
   * Show a warning message related to slots.
   * @param {string} msg
   */
  function showSlotsError(msg) {
    showAlert(slotsError, "warning", msg);
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
      setButtonLoading(loadSlotsBtn, true, "Loading...");
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
   * @param {any} doctor
   */
  function setDoctorImage(doctor) {
    const img = resolveImageUrl(doctor?.imageUrl || doctor?.ImageUrl);
    heroImg.src = img;

    heroImg.onerror = () => {
      heroImg.src = "../assets/img/doctor-placeholder.png";
    };
  }

  /**
   * Render doctor fields into the UI.
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
      currentDoctor = doctor;
      renderDoctor(doctor);
      refreshFavoriteUi();
    } catch (e) {
      showSlotsError(e.message);
    }
  }

  /* --------------------------------------------------
     Slots
  -------------------------------------------------- */

  /**
   * Format an ISO datetime into "HH:mm".
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
   * Render available slots as buttons.
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
        slotsWrap.querySelectorAll(".cb-slot-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSlotId = slotId;
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
      await loadSlots();
    } catch (e) {
      showSlotsError(e.message);
      confirmBtn.disabled = false;
    }
  }

  /* --------------------------------------------------
     Init
  -------------------------------------------------- */

  requireAuth();

  if (!doctorId) {
    showSlotsError("Missing doctor id in URL.");
    return;
  }

  dateInput.valueAsDate = new Date();

  loadSlotsBtn.addEventListener("click", loadSlots);
  confirmBtn.addEventListener("click", confirmBooking);
  favoriteBtn?.addEventListener("click", toggleFavoriteDoctor);

  loadDoctor();
})();