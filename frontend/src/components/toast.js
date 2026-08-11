/**
 * StegX Toast Notifications — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Toast stacking with max visible limit (5)
 *  - Auto-dismiss progress bar animation
 *  - Optional action buttons in toasts (e.g. "Undo", "View")
 *  - Improved entrance/exit animations
 *  - Queue system for overflow toasts
 */

let _counter = 0;
const MAX_VISIBLE = 5;
const _queue = [];

/**
 * Show a toast notification.
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {string} title
 * @param {string} message
 * @param {object} [options]
 * @param {number} [options.duration=4000] - Auto-dismiss in ms
 * @param {Array<{label:string, onClick:Function, class?:string}>} [options.actions] - Action buttons
 * @param {boolean} [options.persistent=false] - Don't auto-dismiss
 */
export function showToast(type, title, message, options = {}) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const duration = options.persistent ? 0 : (options.duration || 4000);

  // Queue if too many visible
  const visible = container.querySelectorAll('.toast:not(.toast-exit)');
  if (visible.length >= MAX_VISIBLE) {
    _queue.push({ type, title, message, options });
    return;
  }

  const id = `toast-${++_counter}`;
  const iconMap = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
    warning: '⚠',
  };

  const el = document.createElement('div');
  el.id = id;
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  // Build actions HTML
  const actionsHtml = (options.actions || [])
    .map((a, i) => `<button class="toast-action ${a.class || ''}" data-action-idx="${i}">${_esc(a.label)}</button>`)
    .join('');

  el.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
    <div class="toast-content">
      <div class="toast-title">${_esc(title)}</div>
      <div class="toast-message">${_esc(message)}</div>
      ${actionsHtml ? `<div class="toast-actions">${actionsHtml}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close notification">✕</button>
    ${duration > 0 ? `<div class="toast-progress"><div class="toast-progress-fill" style="animation-duration:${duration}ms"></div></div>` : ''}
  `;

  // Close button handler
  el.querySelector('.toast-close').addEventListener('click', () => _dismiss(el));

  // Action button handlers
  if (options.actions) {
    el.querySelectorAll('.toast-action').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.actionIdx, 10);
        const action = options.actions[idx];
        if (action?.onClick) action.onClick();
        _dismiss(el);
      });
    });
  }

  // Pause progress on hover
  if (duration > 0) {
    el.addEventListener('mouseenter', () => {
      const fill = el.querySelector('.toast-progress-fill');
      if (fill) fill.style.animationPlayState = 'paused';
      clearTimeout(el._dismissTimer);
    });
    el.addEventListener('mouseleave', () => {
      const fill = el.querySelector('.toast-progress-fill');
      if (fill) fill.style.animationPlayState = 'running';
      el._dismissTimer = setTimeout(() => _dismiss(el), 1500);
    });
  }

  container.appendChild(el);

  // Trigger entrance animation
  requestAnimationFrame(() => el.classList.add('toast-enter'));

  // Auto-dismiss
  if (duration > 0) {
    el._dismissTimer = setTimeout(() => _dismiss(el), duration);
  }
}

/** Remove a toast element with exit animation and process queue. */
function _dismiss(el) {
  if (!el || !el.parentNode) return;
  clearTimeout(el._dismissTimer);
  el.classList.remove('toast-enter');
  el.classList.add('toast-exit');
  setTimeout(() => {
    el.remove();
    _processQueue();
  }, 300);
}

/** Process queued toasts when space is available. */
function _processQueue() {
  if (_queue.length === 0) return;
  const container = document.getElementById('toast-container');
  if (!container) return;
  const visible = container.querySelectorAll('.toast:not(.toast-exit)');
  if (visible.length < MAX_VISIBLE) {
    const next = _queue.shift();
    showToast(next.type, next.title, next.message, next.options);
  }
}

/** Dismiss all visible toasts. */
export function dismissAll() {
  const container = document.getElementById('toast-container');
  if (!container) return;
  container.querySelectorAll('.toast').forEach(_dismiss);
  _queue.length = 0;
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
  success: (title, msg, opts) => showToast('success', title, msg, opts),
  error:   (title, msg, opts) => showToast('error',   title, msg, opts),
  info:    (title, msg, opts) => showToast('info',    title, msg, opts),
  warning: (title, msg, opts) => showToast('warning', title, msg, opts),
};
