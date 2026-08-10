/**
 * StegX Capacity Analyzer Page — Rewritten from Scratch
 */
import { apiFetch } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

let capFileData = null;

export function renderCapacityAnalyzer(container) {
  capFileData = null;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📊 Capacity Analyzer</h1>
      <p class="page-subtitle">Analyze the maximum embedding capacity of cover files across all algorithms</p>
    </div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      ${createUploadZone('cap-upload', { label: 'Upload cover file for analysis', icon: '📊', accept: 'image/*,audio/*,video/*' })}
    </div>
    <div id="cap-results" class="hidden"></div>`;

  initUploadZone('cap-upload', async (data) => {
    capFileData = data;
    toast.info('Analyzing', 'Computing capacity for all algorithms…');

    const algoMap = {
      image: ['lsb', 'dct', 'dwt', 'hybrid'],
      audio: ['lsb', 'phase_coding', 'echo_hiding', 'spread_spectrum'],
      video: ['lsb', 'dct', 'dwt'],
    };
    const algos = algoMap[data.file_type] || algoMap.image;

    const results = [];
    for (const algo of algos) {
      try {
        const form = new FormData();
        form.append('file_id', data.file_id);
        form.append('cover_type', data.file_type);
        form.append('algorithm', algo);
        const res = await apiFetch('/api/capacity', { method: 'POST', body: form });
        if (res.ok) results.push({ algo, ...(await res.json()) });
        else results.push({ algo, error: 'Request failed' });
      } catch (e) {
        results.push({ algo, error: e.message });
      }
    }

    const r = document.getElementById('cap-results');
    if (!r) return;
    r.classList.remove('hidden');
    r.innerHTML = `
      <div class="cards-grid stagger-item" style="margin-bottom:24px;">
        ${results
          .map(
            (item) => `
          <div class="float-card">
            <h3 style="font-family:var(--font-display); font-size:14px; color:var(--primary); margin-bottom:12px;">${(item.algo || '').toUpperCase()}</h3>
            <div class="metric">
              <span class="metric-label">Max Capacity</span>
              <span class="metric-value" style="font-size:22px;">${item.max_capacity_readable || 'N/A'}</span>
            </div>
            ${
              item.estimated_psnr
                ? `<div class="mt-8"><span class="text-xs text-muted">Est. PSNR: ${item.estimated_psnr} dB · SSIM: ${item.estimated_ssim}</span></div>`
                : ''
            }
          </div>`
          )
          .join('')}
      </div>
      <div class="glass-panel stagger-item">
        <h3 class="section-title">📋 File Info</h3>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">
          <div class="metric"><span class="metric-label">File Size</span><span style="color:var(--text-primary); font-weight:600;">${data.size_readable || data.size_bytes + ' B'}</span></div>
          <div class="metric"><span class="metric-label">File Type</span><span class="tag tag-primary">${data.file_type}</span></div>
          <div class="metric"><span class="metric-label">Format</span><span style="color:var(--text-primary);">${(data.filename || '').split('.').pop()?.toUpperCase() || 'N/A'}</span></div>
        </div>
      </div>`;
    staggerIn('.stagger-item');
  });

  staggerIn('.stagger-item');
}
