/**
 * StegX Sidebar Component — Rewritten from Scratch
 */

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

/**
 * Render the sidebar into #sidebar.
 */
export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = '';
  for (const section of MENU) {
    html += `<div class="sidebar-section">`;
    html += `<div class="sidebar-section-title">${section.section}</div>`;
    for (const item of section.items) {
      const badge = item.badge
        ? `<span class="sidebar-badge">${item.badge}</span>`
        : '';
      html += `
        <a class="sidebar-item" href="${item.path}"
           data-page="${item.id}" id="nav-${item.id}">
          <span class="sidebar-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${badge}
        </a>`;
    }
    html += `</div>`;
  }

  sidebar.innerHTML = html;

  // Use event delegation for click handling
  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('.sidebar-item');
    if (link) {
      // Close mobile sidebar when a link is tapped
      sidebar.classList.remove('open');
    }
  });
}

/**
 * Highlight the active sidebar item matching `pageId`.
 */
export function setActiveSidebarItem(pageId) {
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach((item) => item.classList.remove('active'));

  const active = document.querySelector(`[data-page="${pageId}"]`);
  if (active) active.classList.add('active');
}
