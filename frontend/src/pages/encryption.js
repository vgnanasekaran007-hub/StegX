/**
 * StegX Encryption Page — Rewritten from Scratch
 */
import { apiFetch, getApiBase } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

let encFileData = null;

export function renderEncryption(container) {
  encFileData = null;

  const algos = [
    { n: 'AES-256',  s: '256-bit key',     t: 'Block cipher',    r: 'Highest' },
    { n: 'ChaCha20', s: '256-bit key',     t: 'Stream cipher',   r: 'Very High' },
    { n: 'Blowfish', s: 'Variable key',    t: 'Block cipher',    r: 'High' },
    { n: 'RSA',      s: '2048+ bit key',   t: 'Asymmetric',      r: 'Very High' },
    { n: 'ECC',      s: '256-bit curve',   t: 'Elliptic curve',  r: 'Highest' },
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
          <input type="password" class="input-field" id="enc-password" placeholder="Enter strong password">
        </div>
      </div>
      <button class="btn btn-primary btn-lg mt-24 w-full" id="enc-process-btn">🔒 Encrypt File</button>
      <div id="enc-result" class="hidden mt-16"></div>
    </div>
    <div class="cards-grid mt-32 stagger-item">
      ${algos
        .map(
          (a) => `
        <div class="float-card">
          <h3 style="font-family:var(--font-display); font-size:14px; color:var(--primary); margin-bottom:8px;">${a.n}</h3>
          <div class="text-xs text-muted">${a.s} · ${a.t}</div>
          <div class="mt-8"><span class="tag tag-accent">${a.r} Security</span></div>
        </div>`
        )
        .join('')}
    </div>`;

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

  // ── Process ──────────────────────────────────────────────────
  _on('enc-process-btn', 'click', async () => {
    if (!encFileData) { toast.error('Error', 'Upload a file first'); return; }
    const pwd = _val('enc-password');
    if (!pwd) { toast.warning('Missing', 'Enter a password'); return; }

    const form = new FormData();
    form.append('file_id', encFileData.file_id);
    form.append('algorithm', _val('enc-algorithm'));
    form.append('password', pwd);

    try {
      const res = await apiFetch(`/api/${mode}`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        const result = document.getElementById('enc-result');
        if (result) {
          result.classList.remove('hidden');
          result.innerHTML = `
            <div class="holo-panel text-center" style="padding:24px;">
              <div style="font-size:40px;">✓</div>
              <h3 style="color:var(--accent); font-family:var(--font-display); margin:12px 0;">${data.message}</h3>
              <p class="text-xs text-muted font-mono">Hash: ${data.hash_verification}</p>
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

function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
