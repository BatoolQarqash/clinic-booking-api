// frontend/js/favorites.js

(() => {
  /* --------------------------------------------------
     Auth guard
  -------------------------------------------------- */
  requireAuth();

  /* --------------------------------------------------
     DOM references
  -------------------------------------------------- */
  const favoritesList = document.getElementById("favoritesList");
  const emptyBox = document.getElementById("emptyBox");
  const pageMsg = document.getElementById("pageMsg");

  /* --------------------------------------------------
     Favorites storage helpers
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
   * Remove one doctor from favorites by id.
   * @param {number|string} doctorId
   */
  function removeFavoriteDoctor(doctorId) {
    const items = getFavoriteDoctors().filter(
      d => String(d.id) !== String(doctorId)
    );

    saveFavoriteDoctors(items);
    renderFavorites(items);
    showAlert(pageMsg, "success", "Doctor removed from favorites.");
  }

  /* --------------------------------------------------
     UI rendering
  -------------------------------------------------- */

  /**
   * Render favorite doctors grid.
   * @param {Array} items
   */
  function renderFavorites(items) {
    favoritesList.innerHTML = "";
    emptyBox.classList.add("d-none");

    if (!items.length) {
      emptyBox.classList.remove("d-none");
      return;
    }

    items.forEach(d => {
      const img = resolveImageUrl(d.imageUrl);

      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-xl-4";

      col.innerHTML = `
        <div class="cb-doctor-card">
          <div class="cb-doctor-left">
            <img class="cb-doctor-img" src="${img}" alt="doctor" />
            <div class="cb-doctor-info">
              <div class="cb-doctor-name">${d.fullName || "Doctor"}</div>
              <div class="cb-doctor-title">${d.title || ""}</div>
              <div class="cb-doctor-meta">
                <span><i class="bi bi-cash-coin"></i> $${d.fee ?? "—"}</span>
                <span><i class="bi bi-award"></i> ${d.serviceName || ""}</span>
              </div>
            </div>
          </div>

          <div class="cb-doctor-right flex-column align-items-end">
            <a class="cb-arrow-btn mb-2" href="doctor-details.html?id=${d.id}">
              <i class="bi bi-arrow-right"></i>
            </a>

            <button
              class="btn btn-sm btn-outline-danger"
              data-action="remove"
              data-id="${d.id}"
            >
              <i class="bi bi-heartbreak"></i>
            </button>
          </div>
        </div>
      `;

      const imgEl = col.querySelector("img");
      imgEl.addEventListener("error", () => {
        imgEl.src = "../assets/img/doctor-placeholder.png";
      });

      favoritesList.appendChild(col);
    });
  }

  /* --------------------------------------------------
     Events
  -------------------------------------------------- */

  favoritesList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='remove']");
    if (!btn) return;

    removeFavoriteDoctor(btn.dataset.id);
  });

  /* --------------------------------------------------
     Init
  -------------------------------------------------- */

  renderFavorites(getFavoriteDoctors());
})();