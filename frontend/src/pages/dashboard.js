/**
 * StegX Dashboard Page — Rewritten from Scratch
 * Animated hero, live statistics, quick actions, recent activity.
 */
import { apiFetch } from '../api.js';
import { staggerIn, animateCounter, typeText } from '../three/animations.js';

export function renderDashboard(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <div class="holo-panel" style="padding:40px 32px; margin-bottom:32px; text-align:center; position:relative; overflow:hidden;">
      <div style="position:relative; z-index:2;">
        <div style="font-size:48px; margin-bottom:16px;">◈</div>
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
          ${_engineCard('🖼️', 'Image', 'LSB · DCT · DWT · Hybrid')}
          ${_engineCard('🎵', 'Audio', 'LSB · Phase · Echo · Spread')}
          ${_engineCard('🎬', 'Video', 'LSB · DCT · DWT · Motion')}
          ${_engineCard('📝', 'Text', 'ZWC · Unicode · Whitespace')}
        </div>
      </div>

      <!-- Security Suite -->
      <div class="glass-panel stagger-item">
        <h3 class="section-title">🔐 Security Suite</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${['AES-256', 'AES-192', 'AES-128', 'ChaCha20', 'Blowfish', 'RSA', 'ECC']
            .map(
              (algo) => `
            <div style="display:flex; align-items:center; justify-content:space-between;
                        padding:10px 14px; background:var(--bg-glass);
                        border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
              <span style="font-size:13px; font-weight:500;">${algo}</span>
              <span class="tag tag-accent" style="font-size:10px;">Ready</span>
            </div>`
            )
            .join('')}
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="glass-panel stagger-item">
      <h3 class="section-title">📋 Recent Activity</h3>
      <div id="recent-activity">
        <div class="text-center text-muted" style="padding:32px;">
          <div style="font-size:32px; margin-bottom:12px; opacity:0.4;">📋</div>
          <p>No recent activity yet. Start by hiding or extracting data!</p>
        </div>
      </div>
    </div>

    <!-- AI Assistant -->
    <div class="holo-panel mt-32 stagger-item">
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
    </div>
  `;

  // Animate entrance
  staggerIn('.stagger-item');

  // Load live data
  _loadStats();
  _loadRecentActivity();

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

function _engineCard(icon, title, desc) {
  return `
    <div class="float-card" style="padding:16px;">
      <div style="font-size:20px; margin-bottom:8px;">${icon}</div>
      <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${title}</div>
      <div class="text-xs text-muted">${desc}</div>
    </div>`;
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
                    border-bottom:1px solid var(--border-glass);">
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
          <span class="text-xs text-muted">${new Date(op.timestamp).toLocaleString()}</span>
        </div>`
      )
      .join('');
  } catch (_) {
    /* backend not running — ignore */
  }
}
