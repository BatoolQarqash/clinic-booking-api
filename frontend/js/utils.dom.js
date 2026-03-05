// frontend/js/utils.dom.js

/**
 * Short helper for document.getElementById
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function byId(id) {
  return document.getElementById(id);
}

/**
 * Set text content safely (does nothing if element not found).
 * @param {string} id
 * @param {string} text
 */
function setText(id, text) {
  const el = byId(id);
  if (el) el.textContent = text;
}