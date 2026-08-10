/**
 * StegX File Upload Component — Rewritten from Scratch
 *
 * Drag-and-drop AND click-to-browse file uploader with realistic
 * progress simulation, server cold-start handling, and clean error UI.
 */
import { apiFetch, formatSize } from '../api.js';

/* ── HTML Template ─────────────────────────────────────────────── */

/**
 * Returns the HTML string for an upload zone.
 * Call initUploadZone() after inserting into the DOM.
 */
export function createUploadZone(id, options = {}) {
  const accept = options.accept || '*/*';
  const label = options.label || 'Drop your file here or click to browse';
  const subtitle = options.subtitle || 'Supports all file formats';
  const icon = options.icon || '📁';

  return `
    <div class="upload-zone" id="${id}" tabindex="0" role="button"
         aria-label="${label}">
      <input type="file" accept="${accept}" id="${id}-input"
             style="display:none;">
      <div class="upload-zone-icon">${icon}</div>
      <div class="upload-zone-title">${label}</div>
      <div class="upload-zone-subtitle">${subtitle}</div>
      <div class="upload-progress hidden" id="${id}-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="${id}-progress-fill" style="width:0%"></div>
        </div>
        <div class="text-xs text-muted mt-8" id="${id}-progress-text">Uploading…</div>
      </div>
      <div class="upload-result hidden" id="${id}-result"></div>
    </div>
  `;
}

/* ── Initialisation ────────────────────────────────────────────── */

/**
 * Wire up the upload zone identified by `id`.
 * @param {string} id    — must match the id passed to createUploadZone
 * @param {Function} onUpload — callback(data) on successful upload
 */
export function initUploadZone(id, onUpload) {
  const zone = document.getElementById(id);
  const input = document.getElementById(`${id}-input`);
  if (!zone || !input) return;

  // ── Click to browse (the key fix!) ──────────────────────────
  zone.addEventListener('click', (e) => {
    // Don't re-trigger if clicking the input itself
    if (e.target === input) return;
    input.click();
  });

  // Keyboard accessibility
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  // ── Drag-and-drop ──────────────────────────────────────────
  zone.addEventListener('dragenter', _prevent);
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) _handleUpload(id, files[0], onUpload);
  });

  // ── File input change ──────────────────────────────────────
  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      _handleUpload(id, input.files[0], onUpload);
      // Reset so the same file can be re-selected
      input.value = '';
    }
  });
}

/* ── Upload Handler ────────────────────────────────────────────── */

async function _handleUpload(id, file, onUpload) {
  const progressDiv = document.getElementById(`${id}-progress`);
  const progressFill = document.getElementById(`${id}-progress-fill`);
  const progressText = document.getElementById(`${id}-progress-text`);
  const resultDiv = document.getElementById(`${id}-result`);

  // Show progress, hide previous result
  if (progressDiv) progressDiv.classList.remove('hidden');
  if (resultDiv) resultDiv.classList.add('hidden');
  if (progressFill) {
    progressFill.style.width = '0%';
    progressFill.style.background = '';
  }

  // ── Progress simulation ────────────────────────────────────
  let progress = 0;
  const startTime = Date.now();

  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;

    if (progress < 40) {
      progress += Math.random() * 8 + 2;
      if (progressText) {
        progressText.textContent =
          `Uploading ${file.name}… ${Math.round(Math.min(progress, 40))}%`;
      }
    } else if (progress < 70) {
      progress += Math.random() * 3 + 0.5;
      if (progressText) {
        progressText.textContent = `Processing… ${Math.round(Math.min(progress, 70))}%`;
      }
    } else if (progress < 90) {
      progress += Math.random() * 1.5 + 0.2;
      if (progressText) {
        progressText.textContent =
          `Connecting to server… ${Math.round(Math.min(progress, 90))}%`;
      }
    } else if (progress < 95) {
      progress += Math.random() * 0.3 + 0.05;
      if (progressText) {
        progressText.textContent =
          elapsed > 15
            ? `⏳ Server is waking up (free tier), please wait… ${Math.round(progress)}%`
            : `Finalising… ${Math.round(progress)}%`;
      }
    }

    progress = Math.min(progress, 95);
    if (progressFill) progressFill.style.width = `${progress}%`;
  }, 500);

  // ── Actual upload ──────────────────────────────────────────
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = '✓ Upload complete!';

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed (HTTP ${response.status})`);
    }

    const data = await response.json();

    // Show result card
    if (resultDiv) {
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `
        <div class="flex items-center gap-12 mt-16"
             style="padding:12px; background:var(--bg-glass);
                    border-radius:var(--radius-md);
                    border:1px solid var(--border-glass);">
          <span style="font-size:24px;">${_fileIcon(data.file_type)}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:13px; color:var(--text-primary);
                        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${data.filename}
            </div>
            <div class="text-xs text-muted">
              ${data.size_readable || formatSize(data.size_bytes)} · ${data.file_type}
            </div>
          </div>
          <span class="tag tag-accent">✓ Ready</span>
        </div>
      `;
    }

    if (onUpload) onUpload(data);
  } catch (error) {
    clearInterval(progressInterval);
    if (progressText) progressText.textContent = `✕ ${error.message}`;
    if (progressFill) {
      progressFill.style.width = '100%';
      progressFill.style.background = 'var(--danger)';
    }
    console.error('Upload error:', error);
  }
}

/* ── Helpers ───────────────────────────────────────────────────── */

function _prevent(e) {
  e.preventDefault();
}

function _fileIcon(type) {
  const map = {
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
    text: '📄',
    other: '📁',
    unknown: '📁',
  };
  return map[type] || '📁';
}
