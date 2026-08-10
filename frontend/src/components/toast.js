/**
 * StegX Toast Notifications — Rewritten from Scratch
 *
 * Lightweight, self-cleaning toast system.  Supports success / error /
 * info / warning types with auto-dismiss and manual close.
 */

let _counter = 0;

/**
 * Show a toast notification.
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {string} title
 * @param {string} message
 * @param {number} duration — auto-dismiss in ms (default 4 000)
 */
export function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${++_counter}`;
  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const el = document.createElement('div');
  el.id = id;
  el.className = `toast toast-${type}`;
  el.style.setProperty('--toast-duration', `${duration}ms`);
  el.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
    <div class="toast-content">
      <div class="toast-title">${_esc(title)}</div>
      <div class="toast-message">${_esc(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close">✕</button>
  `;

  // Close button handler
  el.querySelector('.toast-close').addEventListener('click', () => _dismiss(el));

  container.appendChild(el);

  // Auto-dismiss
  const timer = setTimeout(() => _dismiss(el), duration);
  el._dismissTimer = timer;
}

/** Remove a toast element with exit animation. */
function _dismiss(el) {
  if (!el || !el.parentNode) return;
  clearTimeout(el._dismissTimer);
  el.classList.add('toast-exit');
  setTimeout(() => el.remove(), 300);
}

/** Basic HTML escaping to prevent XSS in dynamic content. */
function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── Convenience API ───────────────────────────────────────────── */

export const toast = {
  success: (title, msg) => showToast('success', title, msg),
  error:   (title, msg) => showToast('error',   title, msg),
  info:    (title, msg) => showToast('info',    title, msg),
  warning: (title, msg) => showToast('warning', title, msg),
};
