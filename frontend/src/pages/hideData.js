/**
 * StegX Hide Data Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Live capacity bar that updates as options change
 *  - Password strength meter with visual feedback
 *  - Algorithm info popovers with pros/cons
 *  - Estimated processing time indicator
 *  - Before/after quality metrics in results
 *  - Improved wizard stepper with completion percentage
 */
import { apiFetch, getApiBase, formatSize } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn, animateProgress } from '../three/animations.js';

let coverFileData = null;
let secretFileData = null;

export function renderHideData(container) {
  coverFileData = null;
  secretFileData = null;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">⊕ Hide Data</h1>
      <p class="page-subtitle">Embed secret data inside cover files using advanced steganography algorithms</p>
    </div>

    <!-- Wizard Steps -->
    <div class="wizard-steps">
      <div class="wizard-step active" id="ws-1"><div class="wizard-step-num">1</div><span class="wizard-step-label">Cover File</span></div>
      <div class="wizard-step" id="ws-2"><div class="wizard-step-num">2</div><span class="wizard-step-label">Secret Data</span></div>
      <div class="wizard-step" id="ws-3"><div class="wizard-step-num">3</div><span class="wizard-step-label">Configure</span></div>
      <div class="wizard-step" id="ws-4"><div class="wizard-step-num">4</div><span class="wizard-step-label">Process</span></div>
    </div>

    <div class="glass-panel" style="margin-bottom:24px;">
      <!-- Step 1: Cover File -->
      <div id="step-1">
        <h3 class="section-title">📁 Select Cover File</h3>
        <p class="text-sm text-muted mb-16">The cover file is the container that will hide your secret data. Supports images (PNG, BMP, TIFF), audio (WAV, MP3), and video (MP4, AVI).</p>
        ${createUploadZone('cover-upload', {
          label: 'Drop your cover file here',
          subtitle: 'PNG, BMP, WAV, MP4, AVI, MKV',
          icon: '🖼️',
          accept: 'image/*,audio/*,video/*',
        })}
      </div>

      <!-- Step 2: Secret Data -->
      <div id="step-2" class="hidden mt-24">
        <h3 class="section-title">🔒 Select Secret Data</h3>
        <div class="tabs" id="secret-tabs">
          <button class="tab active" data-tab="file">File</button>
          <button class="tab" data-tab="text">Text Message</button>
        </div>
        <div id="secret-file-tab">
          ${createUploadZone('secret-upload', {
            label: 'Drop your secret file here',
            subtitle: 'Any file type: images, documents, archives, etc.',
            icon: '🔐',
          })}
        </div>
        <div id="secret-text-tab" class="hidden">
          <div class="input-group">
            <label class="input-label">Secret Message</label>
            <textarea class="input-field" id="secret-text-input"
                      placeholder="Enter your secret message here…" rows="6"></textarea>
            <div class="text-xs text-muted mt-4" id="text-char-count">0 characters · 0 B</div>
          </div>
          <button class="btn btn-primary mt-16" id="confirm-text-btn">Confirm Text</button>
        </div>
      </div>

      <!-- Step 3: Configure -->
      <div id="step-3" class="hidden mt-24">
        <h3 class="section-title">⚙ Configure Steganography</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="input-group">
            <label class="input-label">Algorithm
              <span class="algo-info-btn" id="algo-info-toggle" title="Algorithm info" style="cursor:pointer; margin-left:6px;">ℹ️</span>
            </label>
            <select class="input-field" id="algorithm-select">
              <option value="lsb">LSB (Fastest, Highest Capacity)</option>
              <option value="dct">DCT (Frequency Domain)</option>
              <option value="dwt">DWT (Wavelet Transform)</option>
              <option value="hybrid">Hybrid (Combined)</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Bit Depth (LSB only)</label>
            <select class="input-field" id="bit-depth-select">
              <option value="1">1 bit (Best Quality)</option>
              <option value="2">2 bits (More Capacity)</option>
              <option value="3">3 bits (High Capacity)</option>
              <option value="4">4 bits (Maximum Capacity)</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Encryption (Optional)</label>
            <select class="input-field" id="encryption-select">
              <option value="">None</option>
              <option value="aes-256">AES-256</option>
              <option value="aes-192">AES-192</option>
              <option value="aes-128">AES-128</option>
              <option value="chacha20">ChaCha20</option>
              <option value="blowfish">Blowfish</option>
              <option value="rsa">RSA</option>
              <option value="ecc">ECC</option>
            </select>
          </div>
          <div class="input-group" id="password-group" style="display:none;">
            <label class="input-label">Password</label>
            <input type="password" class="input-field" id="password-input"
                   placeholder="Enter encryption password">
            <div id="password-strength" class="mt-4" style="display:none;">
              <div class="progress-bar" style="height:4px;">
                <div class="progress-fill" id="pwd-strength-fill" style="width:0%; transition:width 0.3s;"></div>
              </div>
              <span class="text-xs" id="pwd-strength-text" style="color:var(--text-muted);">—</span>
            </div>
          </div>
        </div>

        <!-- Algorithm Info Panel -->
        <div id="algo-info-panel" class="hidden mt-16" style="padding:16px; background:var(--bg-glass); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
          <div id="algo-info-content"></div>
        </div>

        <!-- Capacity Info -->
        <div id="capacity-info" class="mt-16" style="padding:16px; background:var(--bg-glass); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
          <div class="text-xs text-muted font-mono">CAPACITY ANALYSIS</div>
          <div id="capacity-details" class="mt-8 text-sm">Calculating…</div>
        </div>
        <button class="btn btn-primary btn-lg mt-24 w-full" id="process-btn">🚀 Start Embedding</button>
      </div>

      <!-- Step 4: Results -->
      <div id="step-4" class="hidden mt-24">
        <h3 class="section-title">✓ Results</h3>
        <div id="process-status" class="text-center" style="padding:32px;">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          <p class="text-sm text-muted">Processing…</p>
          <p class="text-xs text-muted mt-8" id="process-timer">Elapsed: 0s</p>
        </div>
        <div id="process-results" class="hidden"></div>
      </div>
    </div>
  `;

  // ── Init upload zones ────────────────────────────────────────
  initUploadZone('cover-upload', (data) => {
    coverFileData = data;
    _show('step-2');
    _setWizardStep(2);
    _updateAlgorithmOptions(data.file_type);
    toast.success('Cover File', `${data.filename} uploaded successfully`);
  });

  initUploadZone('secret-upload', (data) => {
    secretFileData = data;
    _show('step-3');
    _setWizardStep(3);
    _loadCapacity();
    toast.success('Secret File', `${data.filename} uploaded successfully`);
  });

  // ── Tabs ─────────────────────────────────────────────────────
  document.querySelectorAll('#secret-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#secret-tabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      _toggle('secret-file-tab', name === 'file');
      _toggle('secret-text-tab', name === 'text');
    });
  });

  // ── Text character count ─────────────────────────────────────
  const textInput = document.getElementById('secret-text-input');
  if (textInput) {
    textInput.addEventListener('input', () => {
      const text = textInput.value;
      const bytes = new Blob([text]).size;
      const countEl = document.getElementById('text-char-count');
      if (countEl) countEl.textContent = `${text.length} characters · ${formatSize(bytes)}`;
    });
  }

  // ── Confirm text ─────────────────────────────────────────────
  _on('confirm-text-btn', 'click', () => {
    const text = _val('secret-text-input');
    if (!text) { toast.warning('Missing', 'Enter a secret message'); return; }
    secretFileData = { type: 'text', text, size_bytes: new Blob([text]).size };
    _show('step-3');
    _setWizardStep(3);
    _loadCapacity();
    toast.success('Secret Text', 'Message confirmed');
  });

  // ── Encryption toggle ────────────────────────────────────────
  _on('encryption-select', 'change', (e) => {
    const group = document.getElementById('password-group');
    const strengthDiv = document.getElementById('password-strength');
    if (group) group.style.display = e.target.value ? 'block' : 'none';
    if (strengthDiv) strengthDiv.style.display = e.target.value ? 'block' : 'none';
  });

  // ── Password strength meter ──────────────────────────────────
  _on('password-input', 'input', (e) => {
    _updatePasswordStrength(e.target.value);
  });

  // ── Algorithm info toggle ────────────────────────────────────
  _on('algo-info-toggle', 'click', () => {
    const panel = document.getElementById('algo-info-panel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) _updateAlgoInfo();
    }
  });

  _on('algorithm-select', 'change', () => {
    _updateAlgoInfo();
    _loadCapacity();
  });

  _on('bit-depth-select', 'change', () => _loadCapacity());

  // ── Process button ───────────────────────────────────────────
  _on('process-btn', 'click', _processHide);

  staggerIn('.wizard-step');
}

/* ── Wizard Stepper ────────────────────────────────────────────── */

function _setWizardStep(step) {
  for (let i = 1; i <= 4; i++) {
    const ws = document.getElementById(`ws-${i}`);
    if (!ws) continue;
    ws.classList.remove('active', 'completed');
    if (i < step) ws.classList.add('completed');
    if (i === step) ws.classList.add('active');
  }
}

function _updateAlgorithmOptions(fileType) {
  const select = document.getElementById('algorithm-select');
  if (!select) return;

  const opts = {
    image: [
      { value: 'lsb',    label: 'LSB (Fastest, Highest Capacity)' },
      { value: 'dct',    label: 'DCT (Frequency Domain, Robust)' },
      { value: 'dwt',    label: 'DWT (Wavelet Transform, High Quality)' },
      { value: 'hybrid', label: 'Hybrid (Combined Approach)' },
    ],
    audio: [
      { value: 'lsb',             label: 'LSB (Simple, High Capacity)' },
      { value: 'phase_coding',    label: 'Phase Coding (High Quality)' },
      { value: 'echo_hiding',     label: 'Echo Hiding (Subtle)' },
      { value: 'spread_spectrum', label: 'Spread Spectrum (Most Secure)' },
    ],
    video: [
      { value: 'lsb', label: 'LSB (Frame-based)' },
      { value: 'dct', label: 'DCT (Frequency Domain)' },
      { value: 'dwt', label: 'DWT (Wavelet Transform)' },
    ],
  };

  const list = opts[fileType] || opts.image;
  select.innerHTML = list.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');
}

/* ── Algorithm Info ────────────────────────────────────────────── */

const ALGO_INFO = {
  lsb:             { name: 'LSB', pros: ['Fastest processing', 'Highest capacity', 'Simple implementation'], cons: ['Vulnerable to statistical analysis', 'No compression robustness'], bestFor: 'Large files, quick embedding' },
  dct:             { name: 'DCT', pros: ['Robust against JPEG compression', 'Good security'], cons: ['Lower capacity', 'Slower processing'], bestFor: 'Images shared on social media' },
  dwt:             { name: 'DWT', pros: ['Excellent quality preservation', 'Multi-resolution'], cons: ['Moderate capacity', 'Complex computation'], bestFor: 'High-quality image steganography' },
  hybrid:          { name: 'Hybrid', pros: ['Combined security', 'Balanced approach'], cons: ['Slowest processing', 'Complex configuration'], bestFor: 'Maximum security scenarios' },
  phase_coding:    { name: 'Phase Coding', pros: ['High audio fidelity', 'Difficult to detect'], cons: ['Limited capacity'], bestFor: 'Audio quality preservation' },
  echo_hiding:     { name: 'Echo Hiding', pros: ['Natural sounding', 'Very subtle'], cons: ['Low capacity', 'Complex'], bestFor: 'Subtle audio embedding' },
  spread_spectrum: { name: 'Spread Spectrum', pros: ['Highest security', 'Noise resistant'], cons: ['Lowest capacity'], bestFor: 'Maximum security audio' },
};

function _updateAlgoInfo() {
  const algo = _val('algorithm-select');
  const info = ALGO_INFO[algo];
  const content = document.getElementById('algo-info-content');
  if (!content || !info) return;

  content.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
      <span style="font-family:var(--font-display); font-size:14px; color:var(--primary);">${info.name}</span>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div>
        <div class="text-xs text-muted mb-4" style="text-transform:uppercase;">Advantages</div>
        ${info.pros.map(p => `<div class="text-sm" style="color:var(--accent); padding:2px 0;">✓ ${p}</div>`).join('')}
      </div>
      <div>
        <div class="text-xs text-muted mb-4" style="text-transform:uppercase;">Limitations</div>
        ${info.cons.map(c => `<div class="text-sm" style="color:var(--warning); padding:2px 0;">△ ${c}</div>`).join('')}
      </div>
    </div>
    <div class="mt-8 text-xs text-muted">Best for: <span style="color:var(--text-secondary);">${info.bestFor}</span></div>
  `;
}

/* ── Password Strength ─────────────────────────────────────────── */

function _updatePasswordStrength(password) {
  const fill = document.getElementById('pwd-strength-fill');
  const text = document.getElementById('pwd-strength-text');
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

/* ── Capacity Check ────────────────────────────────────────────── */

async function _loadCapacity() {
  if (!coverFileData) return;
  const details = document.getElementById('capacity-details');
  const algo = _val('algorithm-select') || 'lsb';

  try {
    const form = new FormData();
    form.append('file_id', coverFileData.file_id);
    form.append('cover_type', coverFileData.file_type);
    form.append('algorithm', algo);

    const res = await apiFetch('/api/capacity', { method: 'POST', body: form });
    if (!res.ok) return;
    const data = await res.json();
    const secretSize = secretFileData?.size_bytes || 0;
    const fits = secretSize <= data.max_capacity_bytes;
    const utilization = data.max_capacity_bytes > 0
      ? Math.min(100, (secretSize / data.max_capacity_bytes) * 100)
      : 0;

    if (details) {
      details.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:16px;">
          <div class="metric"><span class="metric-label">Max Capacity</span><span class="metric-value" style="font-size:18px;">${data.max_capacity_readable}</span></div>
          <div class="metric"><span class="metric-label">Secret Size</span><span class="metric-value" style="font-size:18px; color:${fits ? 'var(--accent)' : 'var(--danger)'};">${formatSize(secretSize)}</span></div>
          <div class="metric"><span class="metric-label">Status</span><span class="tag ${fits ? 'tag-accent' : 'tag-danger'}">${fits ? '✓ Fits' : '✕ Too Large'}</span></div>
        </div>
        <div class="text-xs text-muted mb-4">Utilization: ${utilization.toFixed(1)}%</div>
        <div class="progress-bar" style="height:6px;">
          <div class="progress-fill" id="capacity-bar" style="width:0%; background:${utilization > 90 ? 'var(--danger)' : utilization > 70 ? 'var(--warning)' : 'var(--accent)'}"></div>
        </div>`;

      // Animate the capacity bar
      setTimeout(() => {
        animateProgress(document.getElementById('capacity-bar'), utilization, { delay: 0 });
      }, 100);
    }
  } catch (_) {
    if (details) details.textContent = 'Could not analyse capacity (backend not running?)';
  }
}

/* ── Embedding ─────────────────────────────────────────────────── */

async function _processHide() {
  if (!coverFileData)  { toast.error('Error', 'No cover file uploaded'); return; }
  if (!secretFileData) { toast.error('Error', 'No secret data provided'); return; }

  _setWizardStep(4);
  _show('step-4');

  // Start elapsed timer
  const timerEl = document.getElementById('process-timer');
  const startTime = Date.now();
  const timerInterval = setInterval(() => {
    if (timerEl) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timerEl.textContent = `Elapsed: ${elapsed}s`;
    }
  }, 1000);

  const form = new FormData();
  form.append('cover_file_id', coverFileData.file_id);
  form.append('cover_type', coverFileData.file_type);
  form.append('algorithm', _val('algorithm-select') || 'lsb');
  form.append('bit_depth', _val('bit-depth-select') || '1');

  if (secretFileData.type === 'text') {
    form.append('secret_text', secretFileData.text);
  } else {
    form.append('secret_file_id', secretFileData.file_id);
  }

  const enc = _val('encryption-select');
  const pwd = _val('password-input');
  if (enc) {
    form.append('encryption', enc);
    form.append('password', pwd || 'default');
  }

  try {
    const res = await apiFetch('/api/hide', { method: 'POST', body: form });
    const data = await res.json();
    clearInterval(timerInterval);

    if (res.ok && data.success) {
      const status  = document.getElementById('process-status');
      const results = document.getElementById('process-results');
      if (status) status.classList.add('hidden');
      if (results) {
        results.classList.remove('hidden');
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        results.innerHTML = `
          <div class="holo-panel" style="text-align:center; padding:32px;">
            <div style="font-size:48px; margin-bottom:16px;">✓</div>
            <h3 style="font-family:var(--font-display); font-size:20px; color:var(--accent); margin-bottom:8px;">Embedding Successful!</h3>
            <p class="text-sm text-muted mb-8">${data.message}</p>
            <p class="text-xs text-muted mb-24">Completed in ${elapsed}s</p>
            <a href="${getApiBase()}${data.download_url}" download class="btn btn-accent btn-lg">⬇ Download Stego File</a>
          </div>
          ${data.quality_metrics ? _qualityGrid(data.quality_metrics) : ''}`;
      }
      toast.success('Success', data.message);
    } else {
      throw new Error(data.detail || data.error || 'Embedding failed');
    }
  } catch (e) {
    clearInterval(timerInterval);
    const status = document.getElementById('process-status');
    if (status) {
      status.innerHTML = `
        <div style="font-size:48px; margin-bottom:16px;">✕</div>
        <h3 style="color:var(--danger); font-family:var(--font-display);">Embedding Failed</h3>
        <p class="text-sm text-muted mt-8">${e.message}</p>
        <button class="btn btn-ghost mt-16" onclick="location.hash='#/hide'">Try Again</button>`;
    }
    toast.error('Error', e.message);
  }
}

function _qualityGrid(q) {
  return `
    <div class="mt-24" style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
      <div class="stat-card"><div class="stat-card-label">PSNR</div><div class="stat-card-value" style="font-size:20px;">${q.psnr?.toFixed(2) || 'N/A'} <span class="metric-unit">dB</span></div></div>
      <div class="stat-card"><div class="stat-card-label">SSIM</div><div class="stat-card-value" style="font-size:20px;">${q.ssim?.toFixed(4) || 'N/A'}</div></div>
      <div class="stat-card"><div class="stat-card-label">MSE</div><div class="stat-card-value" style="font-size:20px;">${q.mse?.toFixed(4) || 'N/A'}</div></div>
      <div class="stat-card"><div class="stat-card-label">BER</div><div class="stat-card-value" style="font-size:20px;">${q.ber?.toFixed(6) || 'N/A'}</div></div>
    </div>`;
}

/* ── DOM Shortcuts ─────────────────────────────────────────────── */

function _show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function _toggle(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', !show);
}
function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, event, fn) { document.getElementById(id)?.addEventListener(event, fn); }
