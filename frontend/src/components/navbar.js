/**
 * StegX Navbar Component
 */
export function renderNavbar() {
  const navbar = document.getElementById('navbar');
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

  // Hamburger toggle
  document.getElementById('nav-hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
}
