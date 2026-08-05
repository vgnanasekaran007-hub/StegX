/**
 * StegX Extract Data Page
 */
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

let stegoFileData = null;

export function renderExtractData(container) {
  stegoFileData = null;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">⊖ Extract Data</h1>
      <p class="page-subtitle">Extract hidden data from stego files with auto-detection</p>
    </div>

    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">📁 Upload Stego File</h3>
      ${createUploadZone('stego-upload', {
        label: 'Drop your stego file here',
        subtitle: 'Image, audio, or video file with hidden data',
        icon: '🔍',
        accept: 'image/*,audio/*,video/*',
      })}
    </div>

    <div class="glass-panel stagger-item" id="extract-config" style="display:none; margin-bottom:24px;">
      <h3 class="section-title">⚙ Extraction Settings</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
        <div class="input-group">
          <label class="input-label">Cover Type</label>
          <select class="input-field" id="extract-cover-type">
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Algorithm</label>
          <select class="input-field" id="extract-algorithm">
            <option value="auto">Auto Detect</option>
            <option value="lsb">LSB</option>
            <option value="dct">DCT</option>
            <option value="dwt">DWT</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Bit Depth</label>
          <select class="input-field" id="extract-bit-depth">
            <option value="1">1 bit</option>
            <option value="2">2 bits</option>
            <option value="3">3 bits</option>
          </select>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
        <div class="input-group">
          <label class="input-label">Decryption Algorithm (if encrypted)</label>
          <select class="input-field" id="extract-encryption">
            <option value="">None (not encrypted)</option>
            <option value="aes-256">AES-256</option>
            <option value="aes-192">AES-192</option>
            <option value="aes-128">AES-128</option>
            <option value="chacha20">ChaCha20</option>
            <option value="blowfish">Blowfish</option>
            <option value="rsa">RSA</option>
            <option value="ecc">ECC</option>
          </select>
        </div>
        <div class="input-group" id="extract-password-group" style="display:none;">
          <label class="input-label">Password</label>
          <input type="password" class="input-field" id="extract-password" placeholder="Decryption password">
        </div>
      </div>
      <button class="btn btn-primary btn-lg mt-24 w-full" id="extract-btn">🔓 Extract Hidden Data</button>
    </div>

    <div class="glass-panel stagger-item hidden" id="extract-results-panel">
      <h3 class="section-title">📦 Extracted Data</h3>
      <div id="extract-results"></div>
    </div>
  `;

  initUploadZone('stego-upload', (data) => {
    stegoFileData = data;
    document.getElementById('extract-config').style.display = 'block';
    document.getElementById('extract-cover-type').value = data.file_type || 'image';
    toast.success('File Uploaded', `${data.filename} ready for extraction`);
  });

  document.getElementById('extract-encryption')?.addEventListener('change', (e) => {
    document.getElementById('extract-password-group').style.display = e.target.value ? 'block' : 'none';
  });

  document.getElementById('extract-btn')?.addEventListener('click', performExtraction);

  staggerIn('.stagger-item');
}

async function performExtraction() {
  if (!stegoFileData) { toast.error('Error', 'No stego file uploaded'); return; }

  const btn = document.getElementById('extract-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Extracting...'; }

  const formData = new FormData();
  formData.append('stego_file_id', stegoFileData.file_id);
  formData.append('cover_type', document.getElementById('extract-cover-type')?.value || 'image');
  formData.append('algorithm', document.getElementById('extract-algorithm')?.value || 'auto');
  formData.append('bit_depth', document.getElementById('extract-bit-depth')?.value || '1');

  const enc = document.getElementById('extract-encryption')?.value;
  const pwd = document.getElementById('extract-password')?.value;
  if (enc) { formData.append('encryption', enc); formData.append('password', pwd || ''); }

  try {
    const res = await fetch('/api/extract', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok && data.success) {
      const panel = document.getElementById('extract-results-panel');
      const results = document.getElementById('extract-results');
      panel.classList.remove('hidden');

      let preview = '';
      if (data.extracted_text) {
        preview = `
          <div class="input-group mt-16">
            <label class="input-label">Extracted Text</label>
            <textarea class="input-field" readonly rows="6" style="color:var(--accent);">${escapeHtml(data.extracted_text)}</textarea>
          </div>
        `;
      }

      results.innerHTML = `
        <div class="holo-panel" style="text-align:center; padding:24px;">
          <div style="font-size:40px; margin-bottom:12px;">✓</div>
          <h3 style="color:var(--accent); font-family:var(--font-display); font-size:18px;">${data.message}</h3>
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:20px;">
            <div class="metric">
              <span class="metric-label">Type</span>
              <span class="tag tag-primary">${data.extracted_type}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Algorithm</span>
              <span class="tag tag-secondary">${data.algorithm_detected || 'auto'}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Size</span>
              <span style="color:var(--text-primary); font-weight:600;">${formatSize(data.size_bytes)}</span>
            </div>
          </div>
          ${preview}
          <a href="${data.download_url}" download class="btn btn-accent btn-lg mt-24">⬇ Download Extracted File</a>
        </div>
      `;
      toast.success('Extraction Complete', data.message);
    } else {
      throw new Error(data.detail || 'Extraction failed');
    }
  } catch (e) {
    toast.error('Extraction Failed', e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔓 Extract Hidden Data'; }
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatSize(bytes) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
