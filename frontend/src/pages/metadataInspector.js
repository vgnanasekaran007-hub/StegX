/**
 * StegX Metadata Inspector Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Copy metadata to clipboard
 *  - Steganography detection indicators
 *  - Enhanced metadata table formatting
 *  - Extended metadata with JSON tree display
 */
import { apiFetch } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

export function renderMetadataInspector(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔍 Metadata Inspector</h1>
      <p class="page-subtitle">Extract and analyze comprehensive file metadata including codec, resolution, hashing, and EXIF data</p>
    </div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      ${createUploadZone('meta-upload', { label: 'Upload file to inspect', icon: '🔍' })}
    </div>
    <div id="meta-results" class="hidden"></div>`;

  initUploadZone('meta-upload', async (data) => {
    try {
      const form = new FormData();
      form.append('file_id', data.file_id);
      const res = await apiFetch('/api/metadata', { method: 'POST', body: form });
      const meta = await res.json();

      const r = document.getElementById('meta-results');
      if (!r) return;
      r.classList.remove('hidden');

      const fields = [
        ['File Name',    meta.filename,    '📄'],
        ['File Type',    meta.file_type,   '📂'],
        ['MIME Type',    meta.mime_type,    '🏷️'],
        ['Size',         meta.size_readable,'📏'],
        ['SHA-256',      meta.hash_sha256 ? meta.hash_sha256.substring(0, 32) + '…' : null, '🔒'],
        ['Extension',    meta.extension,    '📎'],
        ['Codec',        meta.codec,        '🎞️'],
        ['Resolution',   meta.resolution,   '📐'],
        ['Duration',     meta.duration ? meta.duration + 's' : null, '⏱️'],
        ['Bitrate',      meta.bitrate ? Math.round(meta.bitrate / 1000) + ' kbps' : null, '📡'],
        ['Channels',     meta.channels,     '🔊'],
        ['Sample Rate',  meta.sample_rate ? meta.sample_rate + ' Hz' : null, '🎵'],
      ].filter(([, v]) => v != null);

      // Build full hash for clipboard
      const fullHash = meta.hash_sha256 || 'N/A';

      r.innerHTML = `
        <!-- Main Metadata -->
        <div class="holo-panel stagger-item" style="margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
            <h3 class="section-title" style="margin-bottom:0;">📋 File Metadata</h3>
            <button class="btn btn-ghost btn-sm" id="meta-copy-btn">📋 Copy All</button>
          </div>
          <table class="data-table"><tbody>
            ${fields.map(([k, v, icon]) => `
              <tr>
                <td style="font-weight:600; color:var(--text-muted); width:200px; font-family:var(--font-mono); font-size:12px; text-transform:uppercase;">
                  ${icon} ${k}
                </td>
                <td style="color:var(--text-primary); font-family:var(--font-mono); font-size:13px;">${v}</td>
              </tr>`).join('')}
          </tbody></table>
        </div>

        <!-- Full SHA-256 Hash -->
        ${meta.hash_sha256 ? `
        <div class="glass-panel stagger-item" style="margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <h3 class="section-title" style="margin-bottom:0;">🔒 Full SHA-256 Hash</h3>
            <button class="btn btn-ghost btn-sm" id="hash-copy-btn">📋 Copy</button>
          </div>
          <div style="padding:12px; background:var(--bg-glass); border-radius:var(--radius-sm); overflow-x:auto;">
            <code class="text-xs font-mono" style="color:var(--accent); word-break:break-all;">${fullHash}</code>
          </div>
        </div>` : ''}

        <!-- Stego Detection Hints -->
        <div class="glass-panel stagger-item" style="margin-bottom:24px;">
          <h3 class="section-title">🕵️ Steganography Indicators</h3>
          <div id="stego-indicators" style="display:flex; flex-direction:column; gap:8px;">
            ${_getStegIndicators(meta)}
          </div>
        </div>

        <!-- Extended Metadata -->
        ${meta.extra && Object.keys(meta.extra).length > 0 ? `
        <div class="glass-panel stagger-item">
          <h3 class="section-title">🔎 Extended Metadata</h3>
          <table class="data-table"><tbody>
            ${Object.entries(meta.extra)
              .filter(([k]) => k !== 'exif')
              .map(([k, v]) => `
                <tr>
                  <td style="font-weight:600; color:var(--text-muted); width:200px; font-family:var(--font-mono); font-size:12px;">${k}</td>
                  <td style="font-family:var(--font-mono); font-size:13px; word-break:break-all;">${typeof v === 'object' ? `<pre style="margin:0; white-space:pre-wrap; font-size:11px;">${JSON.stringify(v, null, 2)}</pre>` : v}</td>
                </tr>`)
              .join('')}
          </tbody></table>
        </div>` : ''}`;

      // Copy all metadata
      const copyAllBtn = document.getElementById('meta-copy-btn');
      if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
          const text = fields.map(([k, v]) => `${k}: ${v}`).join('\n');
          navigator.clipboard.writeText(text);
          toast.info('Copied', 'Metadata copied to clipboard');
        });
      }

      // Copy hash
      const hashCopyBtn = document.getElementById('hash-copy-btn');
      if (hashCopyBtn) {
        hashCopyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(fullHash);
          toast.info('Copied', 'SHA-256 hash copied');
        });
      }

      staggerIn('.stagger-item');
      toast.success('Metadata', 'File metadata extracted');
    } catch (e) {
      toast.error('Error', e.message);
    }
  });

  staggerIn('.stagger-item');
}

function _getStegIndicators(meta) {
  const indicators = [];
  const ext = (meta.extension || '').toLowerCase();
  const size = meta.size_bytes || 0;

  // PNG files can hold more hidden data
  if (ext === '.png' || ext === '.bmp') {
    indicators.push({ icon: '🟢', text: 'Lossless format — ideal for steganography', level: 'info' });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    indicators.push({ icon: '🟡', text: 'JPEG compression may have destroyed embedded data', level: 'warn' });
  } else if (ext === '.wav') {
    indicators.push({ icon: '🟢', text: 'Uncompressed audio — supports all steg methods', level: 'info' });
  } else if (ext === '.mp3') {
    indicators.push({ icon: '🟡', text: 'Lossy audio — only LSB on decoded samples may work', level: 'warn' });
  }

  // Large file = more capacity
  if (size > 5 * 1024 * 1024) {
    indicators.push({ icon: '🟢', text: `Large file (${(size / 1024 / 1024).toFixed(1)} MB) — high embedding capacity`, level: 'info' });
  } else if (size < 100 * 1024) {
    indicators.push({ icon: '🔴', text: 'Small file — very limited embedding capacity', level: 'error' });
  }

  if (indicators.length === 0) {
    indicators.push({ icon: '⚪', text: 'No specific steganography indicators found', level: 'neutral' });
  }

  return indicators.map(ind => `
    <div style="display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--bg-glass); border-radius:var(--radius-sm);">
      <span>${ind.icon}</span>
      <span class="text-sm" style="color:var(--text-secondary);">${ind.text}</span>
    </div>`).join('');
}
