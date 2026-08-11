/**
 * StegX Navbar Component — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Live backend connection status indicator (ping/pong dot)
 *  - Breadcrumb showing current page name
 *  - Command palette trigger hint (Ctrl+K)
 *  - Improved mobile hamburger animation
 *  - Connection status auto-refresh
 */
import { healthCheck, getLastHealthStatus } from '../api.js';

const PAGE_NAMES = {
  '/':            'Dashboard',
  '/hide':        'Hide Data',
  '/extract':     'Extract Data',
  '/image-steg':  'Image Steganography',
  '/audio-steg':  'Audio Steganography',
  '/video-steg':  'Video Steganography',
  '/text-steg':   'Text Steganography',
  '/encryption':  'Encryption Suite',
  '/ai-recommend':'AI Recommendation',
  '/capacity':    'Capacity Analyzer',
  '/quality':     'Quality Analysis',
  '/metadata':    'Metadata Inspector',
  '/history':     'Operation History',
  '/settings':    'Settings',
};

let _healthInterval = null;

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
    <div class="nav-breadcrumb" id="nav-breadcrumb">
      <span class="nav-breadcrumb-item">Dashboard</span>
    </div>
    <div class="nav-actions">
      <div class="nav-status" id="nav-status" title="Backend connection status">
        <div class="nav-status-dot status-checking" id="nav-status-dot"></div>
        <span id="nav-status-text">CHECKING…</span>
      </div>
      <button class="btn btn-ghost btn-sm nav-kbd-hint" id="nav-search-btn" title="Command Palette (Ctrl+K)">
        <span class="nav-kbd">⌘K</span>
      </button>
    </div>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle navigation menu">
      <span></span><span></span><span></span>
    </button>
  `;

  // Hamburger toggle for mobile
  const hamburger = document.getElementById('nav-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.toggle('open');
        hamburger.classList.toggle('active');
      }
    });
  }

  // Run initial health check and set up periodic refresh
  _runHealthCheck();
  if (_healthInterval) clearInterval(_healthInterval);
  _healthInterval = setInterval(_runHealthCheck, 30_000); // every 30s

  // Listen for route changes to update breadcrumb
  window.addEventListener('hashchange', _updateBreadcrumb);
  _updateBreadcrumb();
}

/** Update the breadcrumb based on current hash route. */
function _updateBreadcrumb() {
  const el = document.getElementById('nav-breadcrumb');
  if (!el) return;

  const hash = window.location.hash || '#/';
  const path = hash.slice(1) || '/';
  const pageName = PAGE_NAMES[path] || 'Page';

  if (path === '/') {
    el.innerHTML = `<span class="nav-breadcrumb-item">Dashboard</span>`;
  } else {
    el.innerHTML = `
      <a href="#/" class="nav-breadcrumb-link">Home</a>
      <span class="nav-breadcrumb-sep">›</span>
      <span class="nav-breadcrumb-item">${pageName}</span>
    `;
  }
}

/** Run a health check and update the status dot. */
async function _runHealthCheck() {
  const dot = document.getElementById('nav-status-dot');
  const text = document.getElementById('nav-status-text');

  if (dot) {
    dot.className = 'nav-status-dot status-checking';
  }
  if (text) text.textContent = 'CHECKING…';

  try {
    const result = await healthCheck();
    if (dot) {
      dot.className = `nav-status-dot ${result.alive ? 'status-online' : 'status-offline'}`;
    }
    if (text) {
      text.textContent = result.alive
        ? `ONLINE · ${result.latencyMs}ms`
        : 'OFFLINE';
    }
  } catch {
    if (dot) dot.className = 'nav-status-dot status-offline';
    if (text) text.textContent = 'OFFLINE';
  }
}

/** Force a health check refresh (can be called externally). */
export function refreshStatus() {
  _runHealthCheck();
}
