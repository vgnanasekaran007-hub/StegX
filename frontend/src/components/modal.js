/**
 * StegX Modal Component — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Focus trap for accessibility (Tab/Shift-Tab cycling)
 *  - Size variants: sm, md, lg, fullscreen
 *  - Confirmation dialog shortcut
 *  - Slide-in animation with backdrop blur
 *  - Loading state for async modal actions
 *  - Escape key and backdrop click to close
 */

let _activeKeyHandler = null;
let _previousFocus = null;

/** Show a modal dialog. */
export function showModal(title, bodyHtml, options = {}) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  _previousFocus = document.activeElement;

  const size = options.size || 'md';
  const actions = options.actions || [];

  const actionsHtml = actions
    .map(
      (a) =>
        `<button class="btn ${a.class || 'btn-ghost'}" id="modal-action-${a.id}" ${a.disabled ? 'disabled' : ''}>${a.label}</button>`
    )
    .join('');

  overlay.innerHTML = `
    <div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${_esc(title)}">
      <div class="modal-header">
        <h3 class="modal-title">${_esc(title)}</h3>
        <button class="btn btn-ghost btn-sm modal-close-btn" aria-label="Close modal">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${actionsHtml ? `<div class="modal-footer">${actionsHtml}</div>` : ''}
      <div class="modal-loading hidden" id="modal-loading">
        <div class="spinner" style="margin:0 auto;"></div>
        <p class="text-sm text-muted mt-8" id="modal-loading-text">Processing…</p>
      </div>
    </div>
  `;

  overlay.classList.remove('hidden');

  // Trigger entrance animation
  const modal = overlay.querySelector('.modal');
  requestAnimationFrame(() => {
    overlay.classList.add('modal-overlay-active');
    if (modal) modal.classList.add('modal-active');
  });

  // Close handlers
  const closeBtn = overlay.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Keyboard: Escape to close + focus trap
  if (_activeKeyHandler) {
    document.removeEventListener('keydown', _activeKeyHandler);
  }
  _activeKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    // Focus trap
    if (e.key === 'Tab' && modal) {
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };
  document.addEventListener('keydown', _activeKeyHandler);

  // Action button handlers
  actions.forEach((a) => {
    const btn = document.getElementById(`modal-action-${a.id}`);
    if (btn) {
      btn.addEventListener('click', async () => {
        if (a.onClick) {
          // Support async actions with loading state
          if (a.showLoading) {
            setModalLoading(true, a.loadingText);
            try {
              await a.onClick();
            } finally {
              setModalLoading(false);
            }
          } else {
            await a.onClick();
          }
        }
        if (a.autoClose !== false) closeModal();
      });
    }
  });

  // Auto-focus first actionable element
  requestAnimationFrame(() => {
    const firstBtn = modal?.querySelector('button, input, select, textarea');
    if (firstBtn) firstBtn.focus();
  });
}

/** Close the modal with exit animation. */
export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;

  const modal = overlay.querySelector('.modal');
  if (modal) modal.classList.remove('modal-active');
  overlay.classList.remove('modal-overlay-active');

  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }, 250);

  if (_activeKeyHandler) {
    document.removeEventListener('keydown', _activeKeyHandler);
    _activeKeyHandler = null;
  }

  // Restore focus
  if (_previousFocus && typeof _previousFocus.focus === 'function') {
    _previousFocus.focus();
    _previousFocus = null;
  }
}

/** Show/hide loading spinner in the modal. */
export function setModalLoading(loading, text) {
  const el = document.getElementById('modal-loading');
  const body = document.querySelector('.modal-body');
  const footer = document.querySelector('.modal-footer');
  const textEl = document.getElementById('modal-loading-text');

  if (el) el.classList.toggle('hidden', !loading);
  if (body) body.style.display = loading ? 'none' : '';
  if (footer) footer.style.display = loading ? 'none' : '';
  if (textEl && text) textEl.textContent = text;
}

/**
 * Shortcut: Show a confirmation dialog.
 * @param {string} title
 * @param {string} message
 * @param {object} [options]
 * @param {string} [options.confirmLabel='Confirm']
 * @param {string} [options.confirmClass='btn-primary']
 * @param {string} [options.cancelLabel='Cancel']
 * @returns {Promise<boolean>} — resolves true if confirmed, false if cancelled
 */
export function confirmModal(title, message, options = {}) {
  return new Promise((resolve) => {
    showModal(title, `<p class="text-sm" style="color:var(--text-secondary);">${message}</p>`, {
      size: 'sm',
      actions: [
        {
          id: 'cancel',
          label: options.cancelLabel || 'Cancel',
          class: 'btn-ghost',
          onClick: () => resolve(false),
        },
        {
          id: 'confirm',
          label: options.confirmLabel || 'Confirm',
          class: options.confirmClass || 'btn-primary',
          onClick: () => resolve(true),
        },
      ],
    });
  });
}

function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
