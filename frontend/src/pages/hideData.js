/**
 * StegX Hide Data Page
 * Universal hide module — step wizard for steganographic embedding.
 */
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

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
            <textarea class="input-field" id="secret-text-input" placeholder="Enter your secret message here..." rows="6"></textarea>
          </div>
          <button class="btn btn-primary mt-16" id="confirm-text-btn">Confirm Text</button>
        </div>
      </div>

      <!-- Step 3: Configure -->
      <div id="step-3" class="hidden mt-24">
        <h3 class="section-title">⚙ Configure Steganography</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="input-group">
            <label class="input-label">Algorithm</label>
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
            <input type="password" class="input-field" id="password-input" placeholder="Enter encryption password">
          </div>
        </div>

        <!-- Capacity Info -->
        <div id="capacity-info" class="mt-16" style="padding:16px; background:var(--bg-glass); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
          <div class="text-xs text-muted font-mono">CAPACITY ANALYSIS</div>
          <div id="capacity-details" class="mt-8 text-sm">Calculating...</div>
        </div>

        <button class="btn btn-primary btn-lg mt-24 w-full" id="process-btn">🚀 Start Embedding</button>
      </div>

      <!-- Step 4: Results -->
      <div id="step-4" class="hidden mt-24">
        <h3 class="section-title">✓ Results</h3>
        <div id="process-status" class="text-center" style="padding:32px;">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          <p class="text-sm text-muted">Processing...</p>
        </div>
        <div id="process-results" class="hidden"></div>
      </div>
    </div>
  `;

  // Init upload zones
  initUploadZone('cover-upload', (data) => {
    coverFileData = data;
    document.getElementById('step-2')?.classList.remove('hidden');
    updateWizardStep(2);
    updateAlgorithmOptions(data.file_type);
    toast.success('Cover File', `${data.filename} uploaded successfully`);
  });

  initUploadZone('secret-upload', (data) => {
    secretFileData = data;
    document.getElementById('step-3')?.classList.remove('hidden');
    updateWizardStep(3);
    loadCapacity();
    toast.success('Secret File', `${data.filename} uploaded successfully`);
  });

  // Tabs
  document.querySelectorAll('#secret-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#secret-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('secret-file-tab').classList.toggle('hidden', tabName !== 'file');
      document.getElementById('secret-text-tab').classList.toggle('hidden', tabName !== 'text');
    });
  });

  // Confirm text
  document.getElementById('confirm-text-btn')?.addEventListener('click', () => {
    const text = document.getElementById('secret-text-input')?.value;
    if (!text) { toast.warning('Missing', 'Enter a secret message'); return; }
    secretFileData = { type: 'text', text, size_bytes: new Blob([text]).size };
    document.getElementById('step-3')?.classList.remove('hidden');
    updateWizardStep(3);
    loadCapacity();
    toast.success('Secret Text', 'Message confirmed');
  });

  // Encryption toggle
  document.getElementById('encryption-select')?.addEventListener('change', (e) => {
    const group = document.getElementById('password-group');
    if (group) group.style.display = e.target.value ? 'block' : 'none';
  });

  // Process button
  document.getElementById('process-btn')?.addEventListener('click', processHide);

  staggerIn('.wizard-step');
}

function updateWizardStep(step) {
  for (let i = 1; i <= 4; i++) {
    const ws = document.getElementById(`ws-${i}`);
    if (!ws) continue;
    ws.classList.remove('active', 'completed');
    if (i < step) ws.classList.add('completed');
    if (i === step) ws.classList.add('active');
  }
}

function updateAlgorithmOptions(fileType) {
  const select = document.getElementById('algorithm-select');
  if (!select) return;

  const options = {
    image: [
      { value: 'lsb', label: 'LSB (Fastest, Highest Capacity)' },
      { value: 'dct', label: 'DCT (Frequency Domain, Robust)' },
      { value: 'dwt', label: 'DWT (Wavelet Transform, High Quality)' },
      { value: 'hybrid', label: 'Hybrid (Combined Approach)' },
    ],
    audio: [
      { value: 'lsb', label: 'LSB (Simple, High Capacity)' },
      { value: 'phase_coding', label: 'Phase Coding (High Quality)' },
      { value: 'echo_hiding', label: 'Echo Hiding (Subtle)' },
      { value: 'spread_spectrum', label: 'Spread Spectrum (Most Secure)' },
    ],
    video: [
      { value: 'lsb', label: 'LSB (Frame-based)' },
      { value: 'dct', label: 'DCT (Frequency Domain)' },
      { value: 'dwt', label: 'DWT (Wavelet Transform)' },
    ],
  };

  const opts = options[fileType] || options.image;
  select.innerHTML = opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

async function loadCapacity() {
  if (!coverFileData) return;
  const details = document.getElementById('capacity-details');
  const algo = document.getElementById('algorithm-select')?.value || 'lsb';

  try {
    const formData = new FormData();
    formData.append('file_id', coverFileData.file_id);
    formData.append('cover_type', coverFileData.file_type);
    formData.append('algorithm', algo);

    const res = await fetch('/api/capacity', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      const secretSize = secretFileData?.size_bytes || 0;
      const fits = secretSize <= data.max_capacity_bytes;

      details.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">
          <div class="metric">
            <span class="metric-label">Max Capacity</span>
            <span class="metric-value" style="font-size:18px;">${data.max_capacity_readable}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Secret Size</span>
            <span class="metric-value" style="font-size:18px; color:${fits ? 'var(--accent)' : 'var(--danger)'};">${formatSize(secretSize)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Status</span>
            <span class="tag ${fits ? 'tag-accent' : 'tag-danger'}">${fits ? '✓ Fits' : '✕ Too Large'}</span>
          </div>
        </div>
      `;
    }
  } catch (e) {
    if (details) details.textContent = 'Could not analyze capacity (backend not running?)';
  }
}

async function processHide() {
  if (!coverFileData) { toast.error('Error', 'No cover file uploaded'); return; }
  if (!secretFileData) { toast.error('Error', 'No secret data provided'); return; }

  updateWizardStep(4);
  document.getElementById('step-4')?.classList.remove('hidden');

  const formData = new FormData();
  formData.append('cover_file_id', coverFileData.file_id);
  formData.append('cover_type', coverFileData.file_type);
  formData.append('algorithm', document.getElementById('algorithm-select')?.value || 'lsb');
  formData.append('bit_depth', document.getElementById('bit-depth-select')?.value || '1');

  if (secretFileData.type === 'text') {
    formData.append('secret_text', secretFileData.text);
  } else {
    formData.append('secret_file_id', secretFileData.file_id);
  }

  const enc = document.getElementById('encryption-select')?.value;
  const pwd = document.getElementById('password-input')?.value;
  if (enc) { formData.append('encryption', enc); formData.append('password', pwd || 'default'); }

  try {
    const res = await fetch('/api/hide', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok && data.success) {
      const results = document.getElementById('process-results');
      const status = document.getElementById('process-status');
      if (status) status.classList.add('hidden');
      if (results) {
        results.classList.remove('hidden');
        results.innerHTML = `
          <div class="holo-panel" style="text-align:center; padding:32px;">
            <div style="font-size:48px; margin-bottom:16px;">✓</div>
            <h3 style="font-family:var(--font-display); font-size:20px; color:var(--accent); margin-bottom:8px;">Embedding Successful!</h3>
            <p class="text-sm text-muted mb-24">${data.message}</p>
            <a href="${data.download_url}" download class="btn btn-accent btn-lg">⬇ Download Stego File</a>
          </div>
          ${data.quality_metrics ? `
            <div class="mt-24" style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
              <div class="stat-card">
                <div class="stat-card-label">PSNR</div>
                <div class="stat-card-value" style="font-size:20px;">${data.quality_metrics.psnr?.toFixed(2) || 'N/A'} <span class="metric-unit">dB</span></div>
              </div>
              <div class="stat-card">
                <div class="stat-card-label">SSIM</div>
                <div class="stat-card-value" style="font-size:20px;">${data.quality_metrics.ssim?.toFixed(4) || 'N/A'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-card-label">MSE</div>
                <div class="stat-card-value" style="font-size:20px;">${data.quality_metrics.mse?.toFixed(4) || 'N/A'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-card-label">BER</div>
                <div class="stat-card-value" style="font-size:20px;">${data.quality_metrics.ber?.toFixed(6) || 'N/A'}</div>
              </div>
            </div>
          ` : ''}
        `;
      }
      toast.success('Success', data.message);
    } else {
      throw new Error(data.detail || data.error || 'Embedding failed');
    }
  } catch (e) {
    document.getElementById('process-status').innerHTML = `
      <div style="font-size:48px; margin-bottom:16px;">✕</div>
      <h3 style="color:var(--danger); font-family:var(--font-display);">Embedding Failed</h3>
      <p class="text-sm text-muted mt-8">${e.message}</p>
      <button class="btn btn-ghost mt-16" onclick="location.hash='#/hide'">Try Again</button>
    `;
    toast.error('Error', e.message);
  }
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
