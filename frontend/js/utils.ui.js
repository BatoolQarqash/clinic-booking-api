// frontend/js/utils.ui.js

/**
 * Show a Bootstrap alert inside an element.
 * @param {HTMLElement} el
 * @param {"success"|"danger"|"warning"|"info"} type
 * @param {string} text
 */
function showAlert(el, type, text) {
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = text;
  el.classList.remove("d-none");
}

/**
 * Hide a Bootstrap alert element.
 * @param {HTMLElement} el
 */
function hideAlert(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.add("d-none");
}

/**
 * Set loading state for a button.
 * Disables the button and changes its label, then restores it later.
 * @param {HTMLButtonElement} btn
 * @param {boolean} isLoading
 * @param {string} loadingText
 */
function setButtonLoading(btn, isLoading, loadingText = "Loading...") {
  if (!btn) return;

  if (isLoading) {
    btn.dataset.oldText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.oldText || btn.textContent;
    btn.disabled = false;
    delete btn.dataset.oldText;
  }
}