/**
 * StegX Modal Component — Rewritten from Scratch
 *
 * Accessible modal with keyboard support (Escape to close),
 * backdrop click-to-close, and action buttons.
 */

/** Show a modal dialog. */
export function showModal(title, bodyHtml, actions = []) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const actionsHtml = actions
    .map(
      (a) =>
        `<button class="btn ${a.class || 'btn-ghost'}" id="modal-action-${a.id}">${a.label}</button>`
    )
    .join('');

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${_esc(title)}">
      <div class="modal-header">
        <h3 class="modal-title">${_esc(title)}</h3>
        <button class="btn btn-ghost btn-sm" id="modal-close" aria-label="Close modal">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${actionsHtml ? `<div class="modal-footer">${actionsHtml}</div>` : ''}
    </div>
  `;
  overlay.classList.remove('hidden');

  // Close handlers
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Keyboard: Escape to close
  const _onKey = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', _onKey);
    }
  };
  document.addEventListener('keydown', _onKey);

  // Action button handlers
  actions.forEach((a) => {
    const btn = document.getElementById(`modal-action-${a.id}`);
    if (btn) {
      btn.addEventListener('click', () => {
        if (a.onClick) a.onClick();
        if (a.autoClose !== false) closeModal();
      });
    }
  });
}

/** Close the modal. */
export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
