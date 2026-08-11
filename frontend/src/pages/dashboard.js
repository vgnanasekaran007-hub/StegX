/**
 * StegX Dashboard Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - System health status card (backend ping, latency)
 *  - Animated stat counters with trend indicators
 *  - Quick-start wizard for first-time users
 *  - Improved activity feed with relative timestamps
 *  - Animated hero with particle backdrop reference
 */
import { apiFetch, getApiBase } from '../api.js';
import { healthCheck } from '../api.js';
import { staggerIn, animateCounter, typeText, glowPulse } from '../three/animations.js';

export function renderDashboard(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <div class="holo-panel" style="padding:40px 32px; margin-bottom:32px; text-align:center; position:relative; overflow:hidden;">
      <div style="position:relative; z-index:2;">
        <div style="font-size:48px; margin-bottom:16px;" id="hero-icon">◈</div>
        <h1 class="page-title" style="font-size:36px; margin-bottom:12px;">StegX Studio</h1>
        <p id="hero-tagline" class="page-subtitle" style="font-size:16px; min-height:24px;">
          AI-Powered Universal Steganography Platform
        </p>
        <div class="flex items-center justify-between gap-16 mt-24" style="justify-content:center; flex-wrap:wrap;">
          <a href="#/hide" class="btn btn-primary btn-lg">⊕ Hide Data</a>
          <a href="#/extract" class="btn btn-secondary btn-lg">⊖ Extract Data</a>
          <a href="#/ai-recommend" class="btn btn-accent btn-lg">🤖 AI Recommend</a>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <h3 class="section-title" style="margin-bottom:0;">🌐 System Status</h3>
        <button class="btn btn-ghost btn-sm" id="refresh-health-btn" title="Refresh status">↻</button>
      </div>
      <div id="health-status" style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:16px;">
        <div class="metric">
          <span class="metric-label">Backend</span>
          <span id="health-backend" class="tag tag-primary" style="font-size:12px;">Checking…</span>
        </div>
        <div class="metric">
          <span class="metric-label">Latency</span>
          <span id="health-latency" style="color:var(--text-primary); font-weight:600;">—</span>
        </div>
        <div class="metric">
          <span class="metric-label">API Version</span>
          <span id="health-version" style="color:var(--text-secondary);">v1.0</span>
        </div>
        <div class="metric">
          <span class="metric-label">Quality</span>
          <span id="health-quality" class="tag tag-secondary" style="font-size:12px;">—</span>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="cards-grid" style="margin-bottom:32px;">
      <div class="stat-card stagger-item">
        <div class="stat-card-icon">📊</div>
        <div class="stat-card-value" id="stat-operations">0</div>
        <div class="stat-card-label">Total Operations</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-card-icon">🔒</div>
        <div class="stat-card-value" id="stat-hides">0</div>
        <div class="stat-card-label">Data Hidden</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-card-icon">🔓</div>
        <div class="stat-card-value" id="stat-extracts">0</div>
        <div class="stat-card-label">Data Extracted</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-card-icon">🔐</div>
        <div class="stat-card-value" id="stat-encryptions">0</div>
        <div class="stat-card-label">Encryptions</div>
      </div>
    </div>

    <!-- Quick Actions & Capabilities -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px;">
      <!-- Steganography Engines -->
      <div class="glass-panel stagger-item">
        <h3 class="section-title">⚡ Steganography Engines</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          ${_engineCard('🖼️', 'Image', 'LSB · DCT · DWT · Hybrid', '#/image-steg')}
          ${_engineCard('🎵', 'Audio', 'LSB · Phase · Echo · Spread', '#/audio-steg')}
          ${_engineCard('🎬', 'Video', 'LSB · DCT · DWT · Motion', '#/video-steg')}
          ${_engineCard('📝', 'Text', 'ZWC · Unicode · Whitespace', '#/text-steg')}
        </div>
      </div>

      <!-- Security Suite -->
      <div class="glass-panel stagger-item">
        <h3 class="section-title">🔐 Security Suite</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${['AES-256', 'AES-192', 'AES-128', 'ChaCha20', 'Blowfish', 'RSA', 'ECC']
            .map(
              (algo, i) => `
            <div style="display:flex; align-items:center; justify-content:space-between;
                        padding:10px 14px; background:var(--bg-glass);
                        border-radius:var(--radius-sm); border:1px solid var(--border-glass);
                        transition:var(--transition-fast);"
                 class="security-row">
              <span style="font-size:13px; font-weight:500;">${algo}</span>
              <div style="display:flex; gap:8px; align-items:center;">
                <span class="text-xs text-muted">${['256-bit', '192-bit', '128-bit', '256-bit', 'Variable', '2048-bit', '256-bit'][i]}</span>
                <span class="tag tag-accent" style="font-size:10px;">Ready</span>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="glass-panel stagger-item" style="margin-bottom:32px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
        <h3 class="section-title" style="margin-bottom:0;">📋 Recent Activity</h3>
        <a href="#/history" class="btn btn-ghost btn-sm">View All →</a>
      </div>
      <div id="recent-activity">
        <div class="text-center text-muted" style="padding:32px;">
          <div style="font-size:32px; margin-bottom:12px; opacity:0.4;">📋</div>
          <p>No recent activity yet. Start by hiding or extracting data!</p>
        </div>
      </div>
    </div>

    <!-- AI Assistant -->
    <div class="holo-panel stagger-item">
      <h3 class="section-title">🤖 AI Assistant</h3>
      <div style="padding:20px; background:var(--bg-glass); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
        <p style="font-family:var(--font-mono); font-size:13px; color:var(--primary);" id="ai-greeting">
          &gt; Initializing StegX AI assistant...
        </p>
        <p class="text-sm text-muted mt-8">
          Navigate to <a href="#/ai-recommend" style="color:var(--primary);">AI Recommend</a> for algorithm suggestions,
          or use <a href="#/hide" style="color:var(--accent);">Hide Data</a> to begin steganography.
        </p>
      </div>
      <div class="mt-12 text-xs text-muted" style="display:flex; gap:16px; flex-wrap:wrap;">
        <span>💡 Tip: Press <kbd style="background:var(--bg-glass); padding:2px 6px; border-radius:4px; font-family:var(--font-mono);">Ctrl+K</kbd> for command palette</span>
        <span>⌨ <kbd style="background:var(--bg-glass); padding:2px 6px; border-radius:4px; font-family:var(--font-mono);">Ctrl+1-9</kbd> for quick navigation</span>
      </div>
    </div>
  `;

  // Animate entrance
  staggerIn('.stagger-item');

  // Glow effect on hero icon
  const heroIcon = document.getElementById('hero-icon');
  if (heroIcon) glowPulse(heroIcon);

  // Load live data
  _loadStats();
  _loadRecentActivity();
  _loadHealthStatus();

  // Health refresh button
  const refreshBtn = document.getElementById('refresh-health-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.animation = 'spin 0.5s ease';
      _loadHealthStatus();
      setTimeout(() => refreshBtn.style.animation = '', 500);
    });
  }

  // AI greeting typewriter
  setTimeout(() => {
    const el = document.getElementById('ai-greeting');
    if (el) {
      typeText(
        el,
        '> StegX AI ready. Upload a file to get algorithm recommendations and security analysis.',
        { speed: 20 }
      );
    }
  }, 800);
}

/* ── Helpers ───────────────────────────────────────────────────── */

function _engineCard(icon, title, desc, link) {
  return `
    <a href="${link}" class="float-card" style="padding:16px; text-decoration:none; cursor:pointer;">
      <div style="font-size:20px; margin-bottom:8px;">${icon}</div>
      <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${title}</div>
      <div class="text-xs text-muted">${desc}</div>
    </a>`;
}

async function _loadStats() {
  try {
    const res = await apiFetch('/api/stats');
    if (!res.ok) return;
    const d = await res.json();
    animateCounter(document.getElementById('stat-operations'),  d.total_operations);
    animateCounter(document.getElementById('stat-hides'),       d.total_hides);
    animateCounter(document.getElementById('stat-extracts'),    d.total_extracts);
    animateCounter(document.getElementById('stat-encryptions'), d.total_encryptions);
  } catch (_) {
    /* backend not running — ignore */
  }
}

async function _loadRecentActivity() {
  try {
    const res = await apiFetch('/api/history?per_page=5');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.operations || data.operations.length === 0) return;

    const el = document.getElementById('recent-activity');
    if (!el) return;

    el.innerHTML = data.operations
      .map(
        (op) => `
        <div style="display:flex; align-items:center; gap:12px; padding:12px;
                    border-bottom:1px solid var(--border-glass);
                    transition:background var(--transition-fast);"
             class="activity-row">
          <span style="font-size:18px;">
            ${op.operation_type === 'hide' ? '🔒' : op.operation_type === 'extract' ? '🔓' : '🔐'}
          </span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:600; color:var(--text-primary);">
              ${(op.operation_type || '').toUpperCase()}
            </div>
            <div class="text-xs text-muted">${op.algorithm || 'N/A'} · ${op.cover_type || 'N/A'}</div>
          </div>
          <span class="tag tag-primary">${op.status}</span>
          <span class="text-xs text-muted">${_relativeTime(op.timestamp)}</span>
        </div>`
      )
      .join('');
  } catch (_) {
    /* backend not running — ignore */
  }
}

async function _loadHealthStatus() {
  const backendEl = document.getElementById('health-backend');
  const latencyEl = document.getElementById('health-latency');
  const qualityEl = document.getElementById('health-quality');

  try {
    const result = await healthCheck();
    if (backendEl) {
      backendEl.textContent = result.alive ? 'Online' : 'Offline';
      backendEl.className = `tag ${result.alive ? 'tag-accent' : 'tag-danger'}`;
      backendEl.style.fontSize = '12px';
    }
    if (latencyEl) {
      latencyEl.textContent = result.alive ? `${result.latencyMs}ms` : '—';
      latencyEl.style.color = result.latencyMs < 200 ? 'var(--accent)' :
                               result.latencyMs < 500 ? 'var(--warning)' : 'var(--danger)';
    }
  } catch {
    if (backendEl) { backendEl.textContent = 'Offline'; backendEl.className = 'tag tag-danger'; }
    if (latencyEl) latencyEl.textContent = '—';
  }

  if (qualityEl) {
    const { getQualityLevel } = await import('../three/scene.js');
    const q = getQualityLevel();
    qualityEl.textContent = q.charAt(0).toUpperCase() + q.slice(1);
  }
}

function _relativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
