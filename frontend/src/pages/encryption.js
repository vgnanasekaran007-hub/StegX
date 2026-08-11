/**
 * StegX Encryption Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Password strength meter with visual feedback
 *  - Generate random password button
 *  - File hash verification display
 *  - Improved algorithm cards with security rating bars
 *  - Encryption time display on completion
 */
import { apiFetch, getApiBase } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

let encFileData = null;

export function renderEncryption(container) {
  encFileData = null;

  const algos = [
    { n: 'AES-256',  s: '256-bit key',   t: 'Block cipher',   r: 100, icon: '🛡️' },
    { n: 'ChaCha20', s: '256-bit key',   t: 'Stream cipher',  r: 95,  icon: '⚡' },
    { n: 'Blowfish', s: 'Variable key',  t: 'Block cipher',   r: 75,  icon: '🐡' },
    { n: 'RSA',      s: '2048+ bit key', t: 'Asymmetric',     r: 90,  icon: '🔑' },
    { n: 'ECC',      s: '256-bit curve', t: 'Elliptic curve', r: 100, icon: '📐' },
  ];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔐 Encryption Suite</h1>
      <p class="page-subtitle">Encrypt and decrypt files using military-grade algorithms</p>
    </div>
    <div class="tabs" id="enc-tabs">
      <button class="tab active" data-mode="encrypt">Encrypt</button>
      <button class="tab" data-mode="decrypt">Decrypt</button>
    </div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      ${createUploadZone('enc-upload', { label: 'Drop file to encrypt/decrypt', icon: '🔐' })}
    </div>
    <div class="glass-panel stagger-item" id="enc-config" style="display:none;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group">
          <label class="input-label">Algorithm</label>
          <select class="input-field" id="enc-algorithm">
            <option value="aes-256">AES-256 (Recommended)</option>
            <option value="aes-192">AES-192</option>
            <option value="aes-128">AES-128</option>
            <option value="chacha20">ChaCha20</option>
            <option value="blowfish">Blowfish</option>
            <option value="rsa">RSA (Hybrid)</option>
            <option value="ecc">ECC (Hybrid)</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Password</label>
          <div style="display:flex; gap:8px;">
            <input type="password" class="input-field" id="enc-password" placeholder="Enter strong password" style="flex:1;">
            <button class="btn btn-ghost btn-sm" id="gen-pwd-btn" title="Generate random password" style="white-space:nowrap;">🎲 Generate</button>
          </div>
          <div id="enc-pwd-strength" class="mt-4">
            <div class="progress-bar" style="height:4px;">
              <div class="progress-fill" id="enc-pwd-fill" style="width:0%; transition:width 0.3s;"></div>
            </div>
            <span class="text-xs" id="enc-pwd-text" style="color:var(--text-muted);">—</span>
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-lg mt-24 w-full" id="enc-process-btn">🔒 Encrypt File</button>
      <div id="enc-result" class="hidden mt-16"></div>
    </div>

    <!-- Algorithm Cards -->
    <div class="cards-grid mt-32 stagger-item">
      ${algos.map((a) => `
        <div class="float-card" style="position:relative; overflow:hidden;">
          <div style="font-size:24px; margin-bottom:8px;">${a.icon}</div>
          <h3 style="font-family:var(--font-display); font-size:14px; color:var(--primary); margin-bottom:4px;">${a.n}</h3>
          <div class="text-xs text-muted">${a.s} · ${a.t}</div>
          <div class="mt-8" style="display:flex; align-items:center; gap:8px;">
            <span class="text-xs text-muted">Security</span>
            <div class="progress-bar" style="flex:1; height:4px;">
              <div class="progress-fill" style="width:${a.r}%; background:${a.r >= 90 ? 'var(--accent)' : a.r >= 70 ? 'var(--warning)' : 'var(--danger)'}; transition:none;"></div>
            </div>
            <span class="text-xs" style="color:${a.r >= 90 ? 'var(--accent)' : 'var(--warning)'};">${a.r}%</span>
          </div>
        </div>`).join('')}
    </div>
  `;

  let mode = 'encrypt';

  // ── Tabs ─────────────────────────────────────────────────────
  document.querySelectorAll('#enc-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#enc-tabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.mode;
      const btn = document.getElementById('enc-process-btn');
      if (btn) btn.textContent = mode === 'encrypt' ? '🔒 Encrypt File' : '🔓 Decrypt File';
    });
  });

  // ── Upload ───────────────────────────────────────────────────
  initUploadZone('enc-upload', (data) => {
    encFileData = data;
    const config = document.getElementById('enc-config');
    if (config) config.style.display = 'block';
  });

  // ── Password strength ────────────────────────────────────────
  _on('enc-password', 'input', (e) => _updateStrength(e.target.value));

  // ── Generate random password ─────────────────────────────────
  _on('gen-pwd-btn', 'click', () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 20; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('enc-password');
    if (input) {
      input.type = 'text';
      input.value = pwd;
      _updateStrength(pwd);
      // Copy to clipboard
      navigator.clipboard.writeText(pwd);
      toast.info('Password Generated', 'Strong password copied to clipboard');
      // Hide password again after 3 seconds
      setTimeout(() => { if (input) input.type = 'password'; }, 3000);
    }
  });

  // ── Process ──────────────────────────────────────────────────
  _on('enc-process-btn', 'click', async () => {
    if (!encFileData) { toast.error('Error', 'Upload a file first'); return; }
    const pwd = _val('enc-password');
    if (!pwd) { toast.warning('Missing', 'Enter a password'); return; }

    const startTime = Date.now();
    const form = new FormData();
    form.append('file_id', encFileData.file_id);
    form.append('algorithm', _val('enc-algorithm'));
    form.append('password', pwd);

    try {
      const res = await apiFetch(`/api/${mode}`, { method: 'POST', body: form });
      const data = await res.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (data.success) {
        const result = document.getElementById('enc-result');
        if (result) {
          result.classList.remove('hidden');
          result.innerHTML = `
            <div class="holo-panel text-center" style="padding:24px;">
              <div style="font-size:40px;">✓</div>
              <h3 style="color:var(--accent); font-family:var(--font-display); margin:12px 0;">${data.message}</h3>
              <p class="text-xs text-muted">Completed in ${elapsed}s</p>
              ${data.hash_verification ? `
                <div class="mt-12" style="padding:8px 12px; background:var(--bg-glass); border-radius:var(--radius-sm);">
                  <span class="text-xs text-muted font-mono">Hash: ${data.hash_verification}</span>
                </div>` : ''}
              <a href="${getApiBase()}${data.download_url}" download class="btn btn-accent mt-16">⬇ Download</a>
            </div>`;
        }
        toast.success('Done', data.message);
      } else {
        throw new Error(data.detail);
      }
    } catch (e) { toast.error('Error', e.message); }
  });

  staggerIn('.stagger-item');
}

function _updateStrength(password) {
  const fill = document.getElementById('enc-pwd-fill');
  const text = document.getElementById('enc-pwd-text');
  if (!fill || !text) return;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { pct: 20,  color: 'var(--danger)',  label: 'Very Weak' },
    { pct: 40,  color: 'var(--danger)',  label: 'Weak' },
    { pct: 60,  color: 'var(--warning)', label: 'Fair' },
    { pct: 80,  color: 'var(--primary)', label: 'Strong' },
    { pct: 100, color: 'var(--accent)',  label: 'Very Strong' },
  ];

  const level = levels[Math.min(score, levels.length - 1)];
  fill.style.width = `${level.pct}%`;
  fill.style.background = level.color;
  text.textContent = password ? level.label : '—';
  text.style.color = level.color;
}

function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
