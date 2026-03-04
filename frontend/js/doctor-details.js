// ====== Guards & helpers ======
const token = localStorage.getItem(TOKEN_KEY);
if (!token) window.location.href = "login.html";

// Read doctorId from URL: doctor-details.html?id=123
const params = new URLSearchParams(window.location.search);
const doctorId = parseInt(params.get("id"), 10);

if (!doctorId) {
  alert("Missing doctor id");
  window.location.href = "home.html";
}

let selectedSlotId = null;

// ====== DOM refs ======
const slotsLoading = document.getElementById("slotsLoading");

const nameEl = document.getElementById("doctorName");
const titleEl = document.getElementById("doctorTitle");
const clinicEl = document.getElementById("doctorClinic");
const feeEl = document.getElementById("doctorFee");
const ratingEl = document.getElementById("doctorRating");
const bioEl = document.getElementById("doctorBio");
const imgEl = document.getElementById("doctorHeroImg");

const dateInput = document.getElementById("dateInput");
const loadSlotsBtn = document.getElementById("loadSlotsBtn");
const slotsWrap = document.getElementById("slotsWrap");
const slotsError = document.getElementById("slotsError");
const confirmBtn = document.getElementById("confirmBtn");
const bookMsg = document.getElementById("bookMsg");

// ====== Default date: tomorrow (avoid past date) ======
const today = new Date();
today.setDate(today.getDate() + 1);
dateInput.valueAsDate = today;

// ====== UI helpers ======
function showSlotsError(msg) {
  slotsError.textContent = msg;
  slotsError.classList.remove("d-none");
}

function hideSlotsError() {
  slotsError.textContent = "";
  slotsError.classList.add("d-none");
}

function resetBookingUI() {
  selectedSlotId = null;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Confirm";
  bookMsg.classList.add("d-none");
  bookMsg.textContent = "";
}

function setLoading(isLoading) {
  if (slotsLoading) {
    if (isLoading) slotsLoading.classList.remove("d-none");
    else slotsLoading.classList.add("d-none");
  }

  loadSlotsBtn.disabled = isLoading;
  // Confirm enabled only if slot selected and not loading
  confirmBtn.disabled = isLoading || !selectedSlotId;
}

// Format "2026-02-22T09:00:00" -> "09:00 - 09:30"
function formatTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const pad = (n) => String(n).padStart(2, "0");
  const s = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const e = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return `${s} - ${e}`;
}

// ====== Load doctor info ======
async function loadDoctor() {
  const d = await apiFetch(`/doctors/${doctorId}`); // public endpoint

  nameEl.textContent = d.fullName;
  titleEl.textContent = d.title || "";
  clinicEl.textContent = d.clinicName || "";
  feeEl.textContent = `$${d.fee}`;
  ratingEl.textContent = d.rating ?? "4.8";
  bioEl.textContent = d.bio || "";

  if (d.imageUrl) imgEl.src = d.imageUrl;
}

// ====== Load available slots for selected date ======
async function loadSlots() {
  hideSlotsError();
  resetBookingUI();
  slotsWrap.innerHTML = "";

  const date = dateInput.value; // "YYYY-MM-DD"
  if (!date) {
    showSlotsError("Please choose a date.");
    return;
  }

  setLoading(true);

  try {
    const slots = await apiFetch(`/doctors/${doctorId}/slots?date=${date}`, { auth: true });

    if (!slots.length) {
      showSlotsError("No available slots for this date.");
      return;
    }

    // Render slots as buttons
    slots.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cb-slot-btn";
      btn.textContent = formatTimeRange(s.startTime, s.endTime);

      btn.addEventListener("click", () => {
        // Unselect all
        document.querySelectorAll(".cb-slot-btn").forEach((b) => b.classList.remove("active"));
        // Select this
        btn.classList.add("active");
        selectedSlotId = s.id;
        confirmBtn.disabled = false;
      });

      slotsWrap.appendChild(btn);
    });
  } catch (e) {
    showSlotsError(e.message);
  } finally {
    // ✅ Always re-enable the Load button even if we return early
    setLoading(false);
  }
}

// ====== Book selected slot ======
async function bookSelectedSlot() {
  hideSlotsError();
  bookMsg.classList.add("d-none");
  bookMsg.textContent = "";

  if (!selectedSlotId) {
    showSlotsError("Please select a time slot.");
    return;
  }

  // UI: prevent double clicks
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Booking...";

  try {
    const result = await apiFetch("/appointments", {
      method: "POST",
      auth: true,
      body: {
        doctorId,
        slotId: selectedSlotId
      }
    });

    bookMsg.textContent = `✅ ${result.message}`;
    bookMsg.classList.remove("d-none");

    // Reset selection (user must select again)
    selectedSlotId = null;

    // Refresh slots after booking (booked slot should disappear)
    await loadSlots();
  } catch (e) {
    showSlotsError(e.message);
  } finally {
    confirmBtn.textContent = "Confirm";
    // Enable confirm only if a slot is currently selected (usually false after booking)
    confirmBtn.disabled = !selectedSlotId;
  }
}

// ====== Events ======
loadSlotsBtn.addEventListener("click", loadSlots);
confirmBtn.addEventListener("click", bookSelectedSlot);

// ====== Init ======
loadDoctor().then(loadSlots);