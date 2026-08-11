/**
 * StegX Settings Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - API key management with show/hide toggle
 *  - Backend connection test button
 *  - Import/export settings
 *  - Reset to defaults with confirmation
 *  - Version info display
 *  - Persistent settings via localStorage
 */
import { getApiKey, setApiKey, healthCheck } from '../api.js';
import { toast } from '../components/toast.js';
import { confirmModal } from '../components/modal.js';
import { staggerIn } from '../three/animations.js';

const LS_KEY = 'stegx_settings';

const DEFAULTS = {
  defaultAlgorithm: 'lsb',
  defaultBitDepth: '1',
  defaultEncryption: '',
  maxUploadSize: 500,
  autoDeleteHistory: false,
  historyRetention: 30,
  darkMode: true,
  animationsEnabled: true,
  showParticles: true,
  showBinaryRain: true,
};

function _load() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function _save(settings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

export function renderSettings(container) {
  const s = _load();
  const apiKey = getApiKey();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">⚙ Settings</h1>
      <p class="page-subtitle">Configure application preferences, API connectivity, and default behaviors</p>
    </div>

    <!-- API / Connection -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">🌐 API Connection</h3>
      <div class="input-group">
        <label class="input-label">API Key</label>
        <div style="display:flex; gap:8px;">
          <input type="password" class="input-field" id="settings-api-key" value="${_esc(apiKey)}" style="flex:1; font-family:var(--font-mono); font-size:12px;">
          <button class="btn btn-ghost btn-sm" id="toggle-key-visibility" title="Show/hide key">👁</button>
        </div>
        <div class="text-xs text-muted mt-4">This key authenticates your requests to the StegX backend</div>
      </div>
      <div style="display:flex; gap:12px; margin-top:16px;">
        <button class="btn btn-primary btn-sm" id="save-api-key">💾 Save Key</button>
        <button class="btn btn-ghost btn-sm" id="test-connection-btn">🔌 Test Connection</button>
        <span id="connection-status" class="text-sm" style="align-self:center;"></span>
      </div>
    </div>

    <!-- Defaults -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">🔧 Default Settings</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group">
          <label class="input-label">Default Algorithm</label>
          <select class="input-field" id="settings-algorithm">
            ${['lsb', 'dct', 'dwt', 'hybrid'].map((a) => `<option value="${a}" ${s.defaultAlgorithm === a ? 'selected' : ''}>${a.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Default Bit Depth</label>
          <select class="input-field" id="settings-bit-depth">
            ${['1', '2', '3', '4'].map((b) => `<option value="${b}" ${s.defaultBitDepth === b ? 'selected' : ''}>${b} bit${b !== '1' ? 's' : ''}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Default Encryption</label>
          <select class="input-field" id="settings-encryption">
            <option value="" ${!s.defaultEncryption ? 'selected' : ''}>None</option>
            ${['aes-256', 'aes-192', 'aes-128', 'chacha20', 'blowfish'].map((e) => `<option value="${e}" ${s.defaultEncryption === e ? 'selected' : ''}>${e.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Max Upload Size (MB)</label>
          <input type="number" class="input-field" id="settings-max-upload" value="${s.maxUploadSize}" min="1" max="2048">
        </div>
      </div>
    </div>

    <!-- Visual -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">🎨 Visual Settings</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${_toggle('settings-animations', 'Animations', s.animationsEnabled, 'Enable GSAP entrance and transition animations')}
        ${_toggle('settings-particles', 'Particles', s.showParticles, 'Show floating particle system in background')}
        ${_toggle('settings-binary-rain', 'Binary Rain', s.showBinaryRain, 'Show Matrix-style binary rain effect')}
      </div>
    </div>

    <!-- Data -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">📦 Data Management</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${_toggle('settings-auto-delete', 'Auto-delete History', s.autoDeleteHistory, 'Automatically delete old history entries')}
      </div>
      <div class="input-group mt-12" id="retention-group" style="${s.autoDeleteHistory ? '' : 'display:none;'}">
        <label class="input-label">History Retention (days)</label>
        <input type="number" class="input-field" id="settings-retention" value="${s.historyRetention}" min="1" max="365" style="max-width:120px;">
      </div>
    </div>

    <!-- Actions -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">💾 Import / Export</h3>
      <div class="flex gap-12" style="flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="export-settings-btn">📤 Export Settings</button>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer;">
          📥 Import Settings
          <input type="file" accept=".json" id="import-settings-input" style="display:none;">
        </label>
        <div style="flex:1;"></div>
        <button class="btn btn-ghost btn-sm" id="reset-defaults-btn" style="color:var(--danger);">↺ Reset to Defaults</button>
      </div>
    </div>

    <!-- Save -->
    <button class="btn btn-primary btn-lg w-full stagger-item" id="save-settings-btn">💾 Save All Settings</button>

    <!-- App Info -->
    <div class="text-center mt-24 stagger-item" style="opacity:0.5;">
      <p class="text-xs text-muted">StegX v1.0.0 · Built with Three.js, GSAP, Chart.js, and Vite</p>
      <p class="text-xs text-muted mt-4">Steganography Studio by StegX Team</p>
    </div>`;

  // ── API Key ──────────────────────────────────────────────────
  _on('toggle-key-visibility', 'click', () => {
    const input = document.getElementById('settings-api-key');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });

  _on('save-api-key', 'click', () => {
    const key = _val('settings-api-key');
    setApiKey(key);
    toast.success('Saved', 'API key updated');
  });

  _on('test-connection-btn', 'click', async () => {
    const status = document.getElementById('connection-status');
    if (status) { status.textContent = '⏳ Testing…'; status.style.color = 'var(--text-muted)'; }

    try {
      const result = await healthCheck();
      if (status) {
        status.textContent = result.alive ? `✓ Connected (${result.latencyMs}ms)` : '✕ Failed';
        status.style.color = result.alive ? 'var(--accent)' : 'var(--danger)';
      }
    } catch {
      if (status) { status.textContent = '✕ Connection failed'; status.style.color = 'var(--danger)'; }
    }
  });

  // ── Auto-delete toggle ──────────────────────────────────────
  const autoDeleteCb = document.getElementById('settings-auto-delete');
  if (autoDeleteCb) {
    autoDeleteCb.addEventListener('change', () => {
      const group = document.getElementById('retention-group');
      if (group) group.style.display = autoDeleteCb.checked ? 'block' : 'none';
    });
  }

  // ── Save ─────────────────────────────────────────────────────
  _on('save-settings-btn', 'click', () => {
    const settings = {
      defaultAlgorithm: _val('settings-algorithm'),
      defaultBitDepth: _val('settings-bit-depth'),
      defaultEncryption: _val('settings-encryption'),
      maxUploadSize: parseInt(_val('settings-max-upload'), 10) || 500,
      animationsEnabled: document.getElementById('settings-animations')?.checked ?? true,
      showParticles: document.getElementById('settings-particles')?.checked ?? true,
      showBinaryRain: document.getElementById('settings-binary-rain')?.checked ?? true,
      autoDeleteHistory: document.getElementById('settings-auto-delete')?.checked ?? false,
      historyRetention: parseInt(_val('settings-retention'), 10) || 30,
    };
    _save(settings);
    toast.success('Settings Saved', 'Your preferences have been saved');
  });

  // ── Export ───────────────────────────────────────────────────
  _on('export-settings-btn', 'click', () => {
    const blob = new Blob([JSON.stringify(_load(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stegx_settings.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported', 'Settings file downloaded');
  });

  // ── Import ───────────────────────────────────────────────────
  _on('import-settings-input', 'change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        _save({ ...DEFAULTS, ...imported });
        toast.success('Imported', 'Settings imported. Refresh the page to apply.');
      } catch {
        toast.error('Error', 'Invalid settings file');
      }
    };
    reader.readAsText(file);
  });

  // ── Reset ────────────────────────────────────────────────────
  _on('reset-defaults-btn', 'click', async () => {
    const confirmed = await confirmModal(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults? This cannot be undone.',
      { confirmLabel: 'Reset', confirmClass: 'btn-primary' }
    );
    if (confirmed) {
      _save(DEFAULTS);
      toast.success('Reset', 'Settings reset to defaults. Refreshing…');
      setTimeout(() => location.reload(), 1000);
    }
  });

  staggerIn('.stagger-item');
}

function _toggle(id, label, checked, desc) {
  return `
    <label style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg-glass); border-radius:var(--radius-sm); cursor:pointer; border:1px solid var(--border-glass);">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--primary);">
      <div>
        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">${label}</div>
        <div class="text-xs text-muted">${desc}</div>
      </div>
    </label>`;
}

function _esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
