// Guard: if not logged in, go to login
const token = localStorage.getItem(TOKEN_KEY);
if (!token) window.location.href = "login.html";

// Show user name (if saved)
try {
  const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  document.getElementById("helloName").textContent = user.fullName || "User";
} catch {}

// DOM refs
const servicesRow = document.getElementById("servicesRow");
const servicesError = document.getElementById("servicesError");

const doctorsList = document.getElementById("doctorsList");
const doctorsError = document.getElementById("doctorsError");

// Choose icons for 1st services (fallback if API returns different names)
function serviceIcon(name) {
  const n = (name || "").toLowerCase();

  // EXACT mapping requested:
  if (n.includes("dent")) return "bi-tooth";           // Dentistry
  if (n.includes("neuro")) return "bi-brain";          // Neurology
  if (n.includes("card")) return "bi-heart-pulse";     // Cardiology
  if (n.includes("derma") || n.includes("skin")) return "bi-droplet"; // Dermatology
  if (n.includes("pedia") || n.includes("child")) return "bi-emoji-smile"; // Pediatrics
  if (n.includes("ortho") || n.includes("bone")) return "bi-bandaid"; // Orthopedics
  if (n.includes("oph") || n.includes("eye")) return "bi-eye";        // Ophthalmology
  if (n === "ent" || n.includes("ear")) return "bi-ear";              // ENT

  return "bi-grid";
}

async function loadServices() {
  servicesError.classList.add("d-none");
  servicesRow.innerHTML = "";

  try {
    const services = await apiFetch("/services"); // public endpoint

    services.forEach(s => {
      const card = document.createElement("a");
      card.className = "cb-service-card";
      card.href = `doctors.html?serviceId=${s.id}`;

      card.innerHTML = `
        <div class="cb-service-icon"><i class="bi ${serviceIcon(s.name)}"></i></div>
        <div class="cb-service-name">${s.name}</div>
      `;

      servicesRow.appendChild(card);
    });
  } catch (e) {
    servicesError.textContent = e.message;
    servicesError.classList.remove("d-none");
  }
}

async function loadTopDoctors() {
  doctorsError.classList.add("d-none");
  doctorsList.innerHTML = "";

  try {
    // For MVP: just get doctors list (you can later add rating sort in backend)
    const doctors = await apiFetch("/doctors/top?take=5");
    // Show first 5 as "Top"
    doctors.slice(0, 5).forEach(d => {
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
              <span><i class="bi bi-cash-coin"></i> Fee: $${d.fee}</span>
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
  } catch (e) {
    doctorsError.textContent = e.message;
    doctorsError.classList.remove("d-none");
  }
}

loadServices();
loadTopDoctors();