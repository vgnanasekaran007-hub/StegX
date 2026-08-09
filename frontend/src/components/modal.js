
/**
 * StegX Modal Component
 */
export function showModal(title, bodyHtml, actions = []) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const actionsHtml = actions.map(a =>
    `<button class="btn ${a.class || 'btn-ghost'}" id="modal-action-${a.id}">${a.label}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn btn-ghost btn-sm" id="modal-close">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${actionsHtml ? `<div class="modal-footer">${actionsHtml}</div>` : ''}
    </div>
  `;
  overlay.classList.remove('hidden');

  // Close handlers
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Action handlers
  actions.forEach(a => {
    document.getElementById(`modal-action-${a.id}`)?.addEventListener('click', () => {
      if (a.onClick) a.onClick();
      if (a.autoClose !== false) closeModal();
    });
  });
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}
