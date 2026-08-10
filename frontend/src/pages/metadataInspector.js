/**
 * StegX Metadata Inspector Page — Rewritten from Scratch
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
        ['File Name',    meta.filename],
        ['File Type',    meta.file_type],
        ['MIME Type',    meta.mime_type],
        ['Size',         meta.size_readable],
        ['SHA-256',      meta.hash_sha256 ? meta.hash_sha256.substring(0, 32) + '…' : null],
        ['Extension',    meta.extension],
        ['Codec',        meta.codec],
        ['Resolution',   meta.resolution],
        ['Duration',     meta.duration ? meta.duration + 's' : null],
        ['Bitrate',      meta.bitrate ? Math.round(meta.bitrate / 1000) + ' kbps' : null],
        ['Channels',     meta.channels],
        ['Sample Rate',  meta.sample_rate ? meta.sample_rate + ' Hz' : null],
      ].filter(([, v]) => v != null);

      r.innerHTML = `
        <div class="holo-panel stagger-item" style="margin-bottom:24px;">
          <h3 class="section-title">📋 File Metadata</h3>
          <table class="data-table"><tbody>
            ${fields
              .map(
                ([k, v]) =>
                  `<tr><td style="font-weight:600; color:var(--text-muted); width:200px; font-family:var(--font-mono); font-size:12px; text-transform:uppercase;">${k}</td><td style="color:var(--text-primary); font-family:var(--font-mono); font-size:13px;">${v}</td></tr>`
              )
              .join('')}
          </tbody></table>
        </div>
        ${
          meta.extra && Object.keys(meta.extra).length > 0
            ? `<div class="glass-panel stagger-item">
                <h3 class="section-title">🔎 Extended Metadata</h3>
                <table class="data-table"><tbody>
                  ${Object.entries(meta.extra)
                    .filter(([k]) => k !== 'exif')
                    .map(
                      ([k, v]) =>
                        `<tr><td style="font-weight:600; color:var(--text-muted); width:200px; font-family:var(--font-mono); font-size:12px;">${k}</td><td style="font-family:var(--font-mono); font-size:13px;">${typeof v === 'object' ? JSON.stringify(v) : v}</td></tr>`
                    )
                    .join('')}
                </tbody></table>
              </div>`
            : ''
        }`;
      staggerIn('.stagger-item');
      toast.success('Metadata', 'File metadata extracted');
    } catch (e) {
      toast.error('Error', e.message);
    }
  });

  staggerIn('.stagger-item');
}
