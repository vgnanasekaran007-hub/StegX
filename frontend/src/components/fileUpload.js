/**
 * StegX File Upload Component
 * Drag-and-drop file uploader with realistic progress and server wake-up handling.
 */
import { apiFetch } from '../api.js';

export function createUploadZone(id, options = {}) {
  const accept = options.accept || '*/*';
  const label = options.label || 'Drop your file here or click to browse';
  const subtitle = options.subtitle || 'Supports all file formats';
  const icon = options.icon || '📁';

  return `
    <div class="upload-zone" id="${id}">
      <input type="file" accept="${accept}" id="${id}-input">
      <div class="upload-zone-icon">${icon}</div>
      <div class="upload-zone-title">${label}</div>
      <div class="upload-zone-subtitle">${subtitle}</div>
      <div class="upload-progress hidden" id="${id}-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="${id}-progress-fill" style="width:0%"></div>
        </div>
        <div class="text-xs text-muted mt-8" id="${id}-progress-text">Uploading...</div>
      </div>
      <div class="upload-result hidden" id="${id}-result"></div>
    </div>
  `;
}

export function initUploadZone(id, onUpload) {
  const zone = document.getElementById(id);
  const input = document.getElementById(`${id}-input`);
  if (!zone || !input) return;

  // Drag events
  ['dragenter', 'dragover'].forEach(event => {
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
    });
  });

  zone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(id, files[0], onUpload);
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) handleUpload(id, input.files[0], onUpload);
  });
}

async function handleUpload(id, file, onUpload) {
  const progressDiv = document.getElementById(`${id}-progress`);
  const progressFill = document.getElementById(`${id}-progress-fill`);
  const progressText = document.getElementById(`${id}-progress-text`);
  const resultDiv = document.getElementById(`${id}-result`);

  if (progressDiv) progressDiv.classList.remove('hidden');
  if (resultDiv) resultDiv.classList.add('hidden');

  // Reset styles
  if (progressFill) {
    progressFill.style.width = '0%';
    progressFill.style.background = '';
  }

  const formData = new FormData();
  formData.append('file', file);

  // Phase-based progress simulation:
  // Phase 1 (0-40%):  "Uploading..." — quick, first 2 seconds
  // Phase 2 (40-70%): "Processing..." — moderate speed
  // Phase 3 (70-90%): "Connecting to server..." — slower (Render cold start)
  // Phase 4 (90-95%): "Server is waking up, please wait..." — very slow
  let progress = 0;
  let startTime = Date.now();

  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000; // seconds

    if (progress < 40) {
      progress += Math.random() * 8 + 2;
      if (progressText) progressText.textContent = `Uploading ${file.name}... ${Math.round(Math.min(progress, 40))}%`;
    } else if (progress < 70) {
      progress += Math.random() * 3 + 0.5;
      if (progressText) progressText.textContent = `Processing... ${Math.round(Math.min(progress, 70))}%`;
    } else if (progress < 90) {
      progress += Math.random() * 1.5 + 0.2;
      if (progressText) progressText.textContent = `Connecting to server... ${Math.round(Math.min(progress, 90))}%`;
    } else if (progress < 95) {
      progress += Math.random() * 0.3 + 0.05;
      if (progressText) {
        if (elapsed > 15) {
          progressText.textContent = `⏳ Server is waking up (free tier), please wait... ${Math.round(progress)}%`;
        } else {
          progressText.textContent = `Finalizing... ${Math.round(progress)}%`;
        }
      }
    }

    progress = Math.min(progress, 95);
    if (progressFill) progressFill.style.width = `${progress}%`;
  }, 500);

  try {
    const response = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = '✓ Upload complete!';

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Upload failed');
    }

    const data = await response.json();

    // Show result
    if (resultDiv) {
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `
        <div class="flex items-center gap-12 mt-16" style="padding: 12px; background: var(--bg-glass); border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
          <span style="font-size: 24px;">${getFileIcon(data.file_type)}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:13px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${data.filename}</div>
            <div class="text-xs text-muted">${data.size_readable || formatSize(data.size_bytes)} · ${data.file_type}</div>
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

function getFileIcon(type) {
  const icons = {
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
    text: '📄',
    other: '📁',
    unknown: '📁',
  };
  return icons[type] || '📁';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
