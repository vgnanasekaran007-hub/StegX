/**
 * StegX Navbar Component — Rewritten from Scratch
 */

export function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <a href="#/" class="nav-brand" id="nav-brand">
      <div class="nav-logo">SX</div>
      <div>
        <div class="nav-title">StegX</div>
        <div class="nav-subtitle">Steganography Studio</div>
      </div>
    </a>
    <div class="nav-actions">
      <div class="nav-status">
        <div class="nav-status-dot"></div>
        <span>SYSTEM ONLINE</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="nav-theme-btn" title="Toggle Theme">🎨</button>
    </div>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  `;

  // Hamburger toggle for mobile
  const hamburger = document.getElementById('nav-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });
  }
}
