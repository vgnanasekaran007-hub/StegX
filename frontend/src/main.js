/**
 * StegX 3D Universal Steganography Studio — Main Entry v2.0
 *
 * Features:
 *  - Loading splash screen on initial boot
 *  - Keyboard shortcut navigation (Ctrl+1–9)
 *  - Improved route transitions with error boundary
 *  - Performance monitoring toggle
 *  - Mouse tracking for particle interaction
 *  - Command palette (Ctrl+K) quick navigation
 */
import { initScene, animate, getQualityLevel } from './three/scene.js';
import { ParticleSystem } from './three/particles.js';
import { BinaryRain } from './three/binaryRain.js';
import { renderNavbar } from './components/navbar.js';
import { renderSidebar, setActiveSidebarItem } from './components/sidebar.js';

// Page imports
import { renderDashboard }         from './pages/dashboard.js';
import { renderHideData }          from './pages/hideData.js';
import { renderExtractData }       from './pages/extractData.js';
import { renderImageSteg }         from './pages/imageSteg.js';
import { renderAudioSteg }         from './pages/audioSteg.js';
import { renderVideoSteg }         from './pages/videoSteg.js';
import { renderTextSteg }          from './pages/textSteg.js';
import { renderEncryption }        from './pages/encryption.js';
import { renderAIRecommend }       from './pages/aiRecommend.js';
import { renderCapacityAnalyzer }  from './pages/capacityAnalyzer.js';
import { renderQualityAnalysis }   from './pages/qualityAnalysis.js';
import { renderMetadataInspector } from './pages/metadataInspector.js';
import { renderHistory }           from './pages/history.js';
import { renderSettings }          from './pages/settings.js';

/* ── Route Table ───────────────────────────────────────────────── */

const ROUTES = {
  '/':            { render: renderDashboard,         id: 'dashboard',    shortcut: '1' },
  '/hide':        { render: renderHideData,          id: 'hide-data',    shortcut: '2' },
  '/extract':     { render: renderExtractData,       id: 'extract-data', shortcut: '3' },
  '/image-steg':  { render: renderImageSteg,         id: 'image-steg' },
  '/audio-steg':  { render: renderAudioSteg,         id: 'audio-steg' },
  '/video-steg':  { render: renderVideoSteg,         id: 'video-steg' },
  '/text-steg':   { render: renderTextSteg,          id: 'text-steg' },
  '/encryption':  { render: renderEncryption,        id: 'encryption',   shortcut: '4' },
  '/ai-recommend':{ render: renderAIRecommend,       id: 'ai-recommend', shortcut: '5' },
  '/capacity':    { render: renderCapacityAnalyzer,  id: 'capacity' },
  '/quality':     { render: renderQualityAnalysis,   id: 'quality' },
  '/metadata':    { render: renderMetadataInspector,  id: 'metadata' },
  '/history':     { render: renderHistory,           id: 'history',      shortcut: '8' },
  '/settings':    { render: renderSettings,          id: 'settings',     shortcut: '9' },
};

// Build shortcut map
const SHORTCUT_MAP = {};
for (const [path, route] of Object.entries(ROUTES)) {
  if (route.shortcut) SHORTCUT_MAP[route.shortcut] = path;
}

/* ── Application Init ──────────────────────────────────────────── */

let particles = null;
let binaryRain = null;
let _commandPaletteOpen = false;

function init() {
  // Show splash screen briefly
  _showSplash();

  setTimeout(() => {
    // Render shell components
    renderNavbar();
    renderSidebar();

    // Initialise Three.js (graceful failure)
    try {
      const result = initScene();
      if (result && result.scene) {
        const quality = getQualityLevel();
        particles  = new ParticleSystem(result.scene, 2500, quality);
        binaryRain = new BinaryRain(result.scene, 30, quality);

        // Mouse tracking for particle interaction
        document.addEventListener('mousemove', (e) => {
          const x = (e.clientX / window.innerWidth - 0.5) * 2;
          const y = (e.clientY / window.innerHeight - 0.5) * 2;
          if (particles) particles.setMouse(x, y);
        }, { passive: true });

        animate((elapsed) => {
          if (particles)  particles.update(elapsed);
          if (binaryRain) binaryRain.update(elapsed);
        });
      }
    } catch (e) {
      console.warn('[StegX] Three.js init failed (WebGL may be unavailable):', e);
    }

    // Set up hash-router
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Keyboard shortcuts
    document.addEventListener('keydown', _handleKeyboard);

    // Hide splash
    _hideSplash();
  }, 300);
}

/* ── Splash Screen ─────────────────────────────────────────────── */

function _showSplash() {
  const container = document.getElementById('page-container');
  if (!container) return;
  container.innerHTML = `
    <div id="splash-screen" style="
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      height:80vh; text-align:center;
    ">
      <div style="font-size:64px; margin-bottom:24px; animation: pulse 1.5s infinite;">◈</div>
      <h1 style="font-family:var(--font-display); font-size:28px; color:var(--primary);
                  letter-spacing:4px; margin-bottom:12px;">STEGX</h1>
      <p style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted);
                letter-spacing:2px;">INITIALIZING SYSTEMS…</p>
      <div style="width:200px; height:2px; background:var(--bg-glass); margin-top:24px;
                  border-radius:2px; overflow:hidden;">
        <div style="height:100%; background:var(--primary); width:0%;
                    animation: loadingBar 1s ease-out forwards;"></div>
      </div>
    </div>
    <style>
      @keyframes loadingBar {
        0% { width: 0%; }
        50% { width: 60%; }
        100% { width: 100%; }
      }
    </style>
  `;
}

function _hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.transition = 'opacity 0.4s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
  }
}

/* ── Router ────────────────────────────────────────────────────── */

let _currentRoute = null;

function handleRoute() {
  const hash = window.location.hash || '#/';
  const path = hash.slice(1) || '/';
  const route = ROUTES[path];
  const container = document.getElementById('page-container');
  if (!container) return;

  // Skip if already on this route
  if (_currentRoute === path && container.children.length > 0) return;
  _currentRoute = path;

  if (route) {
    // Fade out
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(() => {
      try {
        route.render(container);
      } catch (err) {
        console.error(`[StegX] Page render error [${route.id}]:`, err);
        container.innerHTML = `
          <div style="text-align:center; padding:80px 20px;">
            <div style="font-size:64px; margin-bottom:24px;">⚠️</div>
            <h1 class="page-title" style="font-size:28px;">Something Went Wrong</h1>
            <p class="text-muted mt-8">${err.message}</p>
            <div class="mt-24" style="display:flex; gap:12px; justify-content:center;">
              <button class="btn btn-primary" onclick="location.hash='#/'">← Dashboard</button>
              <button class="btn btn-ghost" onclick="location.reload()">↻ Reload</button>
            </div>
            <details class="mt-24 text-left" style="max-width:600px; margin:24px auto 0;">
              <summary class="text-sm text-muted" style="cursor:pointer;">Error Details</summary>
              <pre class="mt-8" style="font-size:11px; color:var(--danger); background:var(--bg-glass);
                   padding:16px; border-radius:var(--radius-md); overflow-x:auto;
                   white-space:pre-wrap;">${err.stack || err.message}</pre>
            </details>
          </div>`;
      }

      setActiveSidebarItem(route.id);

      // Fade in
      requestAnimationFrame(() => {
        container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      });
    }, 200);
  } else {
    // 404
    container.innerHTML = `
      <div style="text-align:center; padding:80px 20px;">
        <div style="font-size:64px; margin-bottom:24px;">🔍</div>
        <h1 class="page-title" style="font-size:32px;">Page Not Found</h1>
        <p class="text-muted mt-8">The page <code style="color:var(--primary);">${path}</code> doesn't exist.</p>
        <a href="#/" class="btn btn-primary mt-24">← Back to Dashboard</a>
      </div>`;
  }
}

/* ── Keyboard Shortcuts ────────────────────────────────────────── */

function _handleKeyboard(e) {
  // Don't capture when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return;
  }

  // Ctrl+K — Command palette
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    _toggleCommandPalette();
    return;
  }

  // Ctrl+1-9 — Quick navigation
  if ((e.ctrlKey || e.metaKey) && SHORTCUT_MAP[e.key]) {
    e.preventDefault();
    window.location.hash = `#${SHORTCUT_MAP[e.key]}`;
    return;
  }
}

/* ── Command Palette ───────────────────────────────────────────── */

function _toggleCommandPalette() {
  if (_commandPaletteOpen) {
    _closeCommandPalette();
    return;
  }
  _commandPaletteOpen = true;

  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const routeList = Object.entries(ROUTES)
    .map(([path, route]) => {
      const shortcut = route.shortcut ? `<span class="nav-kbd">Ctrl+${route.shortcut}</span>` : '';
      const icon = {
        'dashboard': '◈', 'hide-data': '⊕', 'extract-data': '⊖',
        'image-steg': '🖼', 'audio-steg': '🎵', 'video-steg': '🎬',
        'text-steg': '📝', 'encryption': '🔐', 'ai-recommend': '🤖',
        'capacity': '📊', 'quality': '📈', 'metadata': '🔍',
        'history': '📋', 'settings': '⚙',
      }[route.id] || '◈';
      return `
        <a href="#${path}" class="cmd-item" data-path="${path}">
          <span class="cmd-icon">${icon}</span>
          <span class="cmd-label">${route.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          ${shortcut}
        </a>`;
    })
    .join('');

  overlay.innerHTML = `
    <div class="cmd-palette" role="dialog" aria-label="Command Palette">
      <div class="cmd-search-wrap">
        <input type="text" class="cmd-search" id="cmd-search" placeholder="Type a command or page name…" autofocus>
      </div>
      <div class="cmd-list" id="cmd-list">${routeList}</div>
      <div class="cmd-footer">
        <span class="text-xs text-muted">↑↓ Navigate · Enter Select · Esc Close</span>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');

  // Search filter
  const searchInput = document.getElementById('cmd-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.cmd-item').forEach((item) => {
        const label = item.querySelector('.cmd-label').textContent.toLowerCase();
        item.style.display = label.includes(q) ? '' : 'none';
      });
    });
  }

  // Click handlers
  document.querySelectorAll('.cmd-item').forEach((item) => {
    item.addEventListener('click', () => _closeCommandPalette());
  });

  // Escape to close
  const handler = (e) => {
    if (e.key === 'Escape') {
      _closeCommandPalette();
      document.removeEventListener('keydown', handler);
    }
  };
  document.addEventListener('keydown', handler);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) _closeCommandPalette();
  });
}

function _closeCommandPalette() {
  _commandPaletteOpen = false;
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }
}

/* ── Boot ──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);
