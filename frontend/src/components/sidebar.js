/**
 * StegX Sidebar Component — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Collapse/expand toggle with smooth animation
 *  - Tooltips when collapsed (showing label on hover)
 *  - Active indicator animation (sliding highlight bar)
 *  - Section collapse/expand
 *  - Persist collapsed state in localStorage
 *  - Mobile overlay with auto-close on link tap
 */

const LS_KEY = 'stegx_sidebar_collapsed';

const MENU = [
  {
    section: 'Main',
    items: [
      { id: 'dashboard',    icon: '◈', label: 'Dashboard',    path: '#/' },
      { id: 'hide-data',    icon: '⊕', label: 'Hide Data',    path: '#/hide' },
      { id: 'extract-data', icon: '⊖', label: 'Extract Data', path: '#/extract' },
    ],
  },
  {
    section: 'Steganography',
    items: [
      { id: 'image-steg', icon: '🖼', label: 'Image Steg', path: '#/image-steg', badge: '4' },
      { id: 'audio-steg', icon: '🎵', label: 'Audio Steg', path: '#/audio-steg', badge: '4' },
      { id: 'video-steg', icon: '🎬', label: 'Video Steg', path: '#/video-steg', badge: '5' },
      { id: 'text-steg',  icon: '📝', label: 'Text Steg',  path: '#/text-steg',  badge: '5' },
    ],
  },
  {
    section: 'Security',
    items: [
      { id: 'encryption', icon: '🔐', label: 'Encryption', path: '#/encryption' },
    ],
  },
  {
    section: 'Analysis',
    items: [
      { id: 'ai-recommend', icon: '🤖', label: 'AI Recommend',       path: '#/ai-recommend' },
      { id: 'capacity',     icon: '📊', label: 'Capacity Analyzer',  path: '#/capacity' },
      { id: 'quality',      icon: '📈', label: 'Quality Analysis',   path: '#/quality' },
      { id: 'metadata',     icon: '🔍', label: 'Metadata Inspector', path: '#/metadata' },
    ],
  },
  {
    section: 'System',
    items: [
      { id: 'history',  icon: '📋', label: 'History',  path: '#/history' },
      { id: 'settings', icon: '⚙',  label: 'Settings', path: '#/settings' },
    ],
  },
];

let _isCollapsed = false;

/**
 * Render the sidebar into #sidebar.
 */
export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Restore collapsed state
  _isCollapsed = localStorage.getItem(LS_KEY) === 'true';
  if (_isCollapsed) sidebar.classList.add('collapsed');

  let html = '';

  // Collapse toggle button
  html += `
    <button class="sidebar-toggle" id="sidebar-toggle" 
            aria-label="${_isCollapsed ? 'Expand' : 'Collapse'} sidebar"
            title="${_isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}">
      <span class="sidebar-toggle-icon">${_isCollapsed ? '▸' : '◂'}</span>
    </button>
  `;

  for (const section of MENU) {
    html += `<div class="sidebar-section">`;
    html += `<div class="sidebar-section-title" data-section="${section.section}" title="${section.section}">${section.section}</div>`;
    html += `<div class="sidebar-section-items">`;
    for (const item of section.items) {
      const badge = item.badge
        ? `<span class="sidebar-badge">${item.badge}</span>`
        : '';
      html += `
        <a class="sidebar-item" href="${item.path}"
           data-page="${item.id}" id="nav-${item.id}"
           title="${item.label}">
          <span class="sidebar-icon">${item.icon}</span>
          <span class="sidebar-label">${item.label}</span>
          ${badge}
        </a>`;
    }
    html += `</div></div>`;
  }

  // Active indicator bar (positioned absolutely, animates to active item)
  html += `<div class="sidebar-indicator" id="sidebar-indicator"></div>`;

  sidebar.innerHTML = html;

  // ── Collapse toggle ──────────────────────────────────────────
  const toggle = document.getElementById('sidebar-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      _isCollapsed = !_isCollapsed;
      sidebar.classList.toggle('collapsed', _isCollapsed);
      localStorage.setItem(LS_KEY, _isCollapsed);
      toggle.querySelector('.sidebar-toggle-icon').textContent = _isCollapsed ? '▸' : '◂';
      toggle.setAttribute('aria-label', _isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
      toggle.setAttribute('title', _isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    });
  }

  // ── Section collapse ─────────────────────────────────────────
  sidebar.querySelectorAll('.sidebar-section-title').forEach((titleEl) => {
    titleEl.addEventListener('click', () => {
      const items = titleEl.nextElementSibling;
      if (items) {
        items.classList.toggle('section-collapsed');
        titleEl.classList.toggle('collapsed');
      }
    });
  });

  // ── Link click handling (close mobile sidebar) ───────────────
  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('.sidebar-item');
    if (link) {
      sidebar.classList.remove('open');
      const hamburger = document.getElementById('nav-hamburger');
      if (hamburger) hamburger.classList.remove('active');
    }
  });
}

/**
 * Highlight the active sidebar item matching `pageId`.
 * Animates the indicator bar to the active item's position.
 */
export function setActiveSidebarItem(pageId) {
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach((item) => item.classList.remove('active'));

  const active = document.querySelector(`[data-page="${pageId}"]`);
  if (active) {
    active.classList.add('active');
    _animateIndicator(active);
  }
}

/** Animate the sliding indicator bar to the active item. */
function _animateIndicator(activeEl) {
  const indicator = document.getElementById('sidebar-indicator');
  const sidebar = document.getElementById('sidebar');
  if (!indicator || !sidebar) return;

  const sidebarRect = sidebar.getBoundingClientRect();
  const itemRect = activeEl.getBoundingClientRect();
  const top = itemRect.top - sidebarRect.top + sidebar.scrollTop;

  indicator.style.transform = `translateY(${top}px)`;
  indicator.style.height = `${itemRect.height}px`;
  indicator.style.opacity = '1';
}
