/**
 * StegX Toast Notifications
 */
let toastCounter = 0;

export function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${++toastCounter}`;
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast-${type}`;
  toast.style.setProperty('--toast-duration', `${duration}ms`);
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="document.getElementById('${id}')?.remove()">✕</button>
  `;
  toast.querySelector('::after')?.style?.setProperty('animation-duration', `${duration}ms`);

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export const toast = {
  success: (title, msg) => showToast('success', title, msg),
  error: (title, msg) => showToast('error', title, msg),
  info: (title, msg) => showToast('info', title, msg),
  warning: (title, msg) => showToast('warning', title, msg),
};
