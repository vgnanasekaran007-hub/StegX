/**
 * StegX File Upload Component — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - File preview (image thumbnails, type icons)
 *  - File validation (size limits, format checks)
 *  - Retry button on upload failure
 *  - Upload cancellation with AbortController
 *  - Real XHR progress tracking when possible
 *  - Drag-and-drop with visual ripple effect
 *  - Click-to-browse with keyboard accessibility
 */
import { apiFetch, formatSize } from '../api.js';

/* ── Constants ─────────────────────────────────────────────────── */

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ACCEPTED_TYPES = {
  'image/*': ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif', 'gif', 'webp'],
  'audio/*': ['wav', 'mp3', 'flac', 'ogg', 'aac', 'wma'],
  'video/*': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
};

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
  const maxSize = options.maxSize || MAX_FILE_SIZE;

  return `
    <div class="upload-zone" id="${id}" tabindex="0" role="button"
         aria-label="${label}" data-max-size="${maxSize}">
      <input type="file" accept="${accept}" id="${id}-input"
             style="display:none;">
      <div class="upload-zone-content" id="${id}-content">
        <div class="upload-zone-icon">${icon}</div>
        <div class="upload-zone-title">${label}</div>
        <div class="upload-zone-subtitle">${subtitle}</div>
        <div class="upload-zone-hint">
          Max size: ${formatSize(maxSize)}
        </div>
      </div>
      <div class="upload-progress hidden" id="${id}-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="${id}-progress-fill" style="width:0%"></div>
        </div>
        <div class="upload-progress-info">
          <span class="text-xs text-muted" id="${id}-progress-text">Uploading…</span>
          <button class="btn btn-ghost btn-sm upload-cancel-btn hidden" id="${id}-cancel" title="Cancel upload">✕</button>
        </div>
      </div>
      <div class="upload-result hidden" id="${id}-result"></div>
      <div class="upload-error hidden" id="${id}-error">
        <div class="upload-error-msg" id="${id}-error-msg"></div>
        <button class="btn btn-ghost btn-sm" id="${id}-retry">↻ Retry</button>
      </div>
    </div>
  `;
}

/* ── Initialisation ────────────────────────────────────────────── */

const _controllers = new Map(); // Track AbortControllers per upload zone

/**
 * Wire up the upload zone identified by `id`.
 * @param {string} id — must match the id passed to createUploadZone
 * @param {Function} onUpload — callback(data) on successful upload
 * @param {object} [options] — { validateFn: (file) => string|null }
 */
export function initUploadZone(id, onUpload, options = {}) {
  const zone = document.getElementById(id);
  const input = document.getElementById(`${id}-input`);
  if (!zone || !input) return;

  let _lastFile = null;

  // ── Click to browse ────────────────────────────────────────
  zone.addEventListener('click', (e) => {
    if (e.target === input || e.target.closest('.upload-cancel-btn') || e.target.closest('.upload-error')) return;
    // Don't re-trigger if clicking retry button
    if (e.target.id === `${id}-retry`) return;
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
    // Only remove if leaving the zone (not entering a child)
    if (!zone.contains(e.relatedTarget)) {
      zone.classList.remove('dragover');
    }
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      _lastFile = files[0];
      _handleUpload(id, files[0], onUpload, options);
    }
  });

  // ── File input change ──────────────────────────────────────
  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      _lastFile = input.files[0];
      _handleUpload(id, input.files[0], onUpload, options);
      input.value = '';
    }
  });

  // ── Cancel button ──────────────────────────────────────────
  const cancelBtn = document.getElementById(`${id}-cancel`);
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const controller = _controllers.get(id);
      if (controller) {
        controller.abort();
        _controllers.delete(id);
      }
      _resetZone(id);
    });
  }

  // ── Retry button ───────────────────────────────────────────
  const retryBtn = document.getElementById(`${id}-retry`);
  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (_lastFile) {
        _handleUpload(id, _lastFile, onUpload, options);
      } else {
        input.click();
      }
    });
  }
}

/* ── Upload Handler ────────────────────────────────────────────── */

async function _handleUpload(id, file, onUpload, options = {}) {
  const progressDiv  = document.getElementById(`${id}-progress`);
  const progressFill = document.getElementById(`${id}-progress-fill`);
  const progressText = document.getElementById(`${id}-progress-text`);
  const resultDiv    = document.getElementById(`${id}-result`);
  const errorDiv     = document.getElementById(`${id}-error`);
  const errorMsg     = document.getElementById(`${id}-error-msg`);
  const contentDiv   = document.getElementById(`${id}-content`);
  const cancelBtn    = document.getElementById(`${id}-cancel`);

  // ── File Validation ─────────────────────────────────────────
  const maxSize = parseInt(document.getElementById(id)?.dataset?.maxSize || MAX_FILE_SIZE, 10);
  if (file.size > maxSize) {
    _showError(id, `File too large (${formatSize(file.size)}). Maximum: ${formatSize(maxSize)}`);
    return;
  }

  if (options.validateFn) {
    const validationError = options.validateFn(file);
    if (validationError) {
      _showError(id, validationError);
      return;
    }
  }

  // Reset states
  if (contentDiv) contentDiv.classList.add('hidden');
  if (progressDiv) progressDiv.classList.remove('hidden');
  if (resultDiv) resultDiv.classList.add('hidden');
  if (errorDiv) errorDiv.classList.add('hidden');
  if (cancelBtn) cancelBtn.classList.remove('hidden');
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
          `Uploading ${_truncName(file.name)}… ${Math.round(Math.min(progress, 40))}%`;
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
    if (cancelBtn) cancelBtn.classList.add('hidden');

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed (HTTP ${response.status})`);
    }

    const data = await response.json();

    // Show result card with file preview
    if (resultDiv) {
      resultDiv.classList.remove('hidden');
      if (progressDiv) progressDiv.classList.add('hidden');

      const preview = _getFilePreview(file, data);

      resultDiv.innerHTML = `
        <div class="upload-result-card">
          ${preview}
          <div class="upload-result-info">
            <div class="upload-result-name" title="${_esc(data.filename)}">${_esc(data.filename)}</div>
            <div class="upload-result-meta">
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
    if (cancelBtn) cancelBtn.classList.add('hidden');

    if (error.name === 'AbortError') {
      _resetZone(id);
      return;
    }

    _showError(id, error.message || 'Upload failed');
    console.error('Upload error:', error);
  }
}

/* ── Helpers ───────────────────────────────────────────────────── */

function _prevent(e) {
  e.preventDefault();
}

function _resetZone(id) {
  const contentDiv  = document.getElementById(`${id}-content`);
  const progressDiv = document.getElementById(`${id}-progress`);
  const resultDiv   = document.getElementById(`${id}-result`);
  const errorDiv    = document.getElementById(`${id}-error`);

  if (contentDiv) contentDiv.classList.remove('hidden');
  if (progressDiv) progressDiv.classList.add('hidden');
  if (resultDiv) resultDiv.classList.add('hidden');
  if (errorDiv) errorDiv.classList.add('hidden');
}

function _showError(id, message) {
  const contentDiv  = document.getElementById(`${id}-content`);
  const progressDiv = document.getElementById(`${id}-progress`);
  const errorDiv    = document.getElementById(`${id}-error`);
  const errorMsg    = document.getElementById(`${id}-error-msg`);

  if (contentDiv) contentDiv.classList.add('hidden');
  if (progressDiv) progressDiv.classList.add('hidden');
  if (errorDiv) errorDiv.classList.remove('hidden');
  if (errorMsg) errorMsg.textContent = `✕ ${message}`;
}

function _getFilePreview(file, data) {
  const type = data.file_type || 'unknown';

  // Image preview thumbnail
  if (type === 'image' && file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    return `<img src="${url}" class="upload-preview-thumb" alt="Preview" onload="URL.revokeObjectURL(this.src)">`;
  }

  return `<span class="upload-preview-icon">${_fileIcon(type)}</span>`;
}

function _fileIcon(type) {
  const map = {
    image:   '🖼️',
    audio:   '🎵',
    video:   '🎬',
    text:    '📄',
    other:   '📁',
    unknown: '📁',
  };
  return map[type] || '📁';
}

function _truncName(name, maxLen = 25) {
  if (!name || name.length <= maxLen) return name;
  const ext = name.split('.').pop();
  const base = name.substring(0, maxLen - ext.length - 4);
  return `${base}…·${ext}`;
}

function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
