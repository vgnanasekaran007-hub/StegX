import { apiFetch } from '../api.js';
/**
 * StegX Capacity Analyzer Page
 */
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { toast } from '../components/toast.js';
import { staggerIn, animateProgress } from '../three/animations.js';
let capFileData = null;
export function renderCapacityAnalyzer(container) {
  capFileData = null;
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">📊 Capacity Analyzer</h1><p class="page-subtitle">Analyze the maximum embedding capacity of cover files across all algorithms</p></div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      ${createUploadZone('cap-upload', { label: 'Upload cover file for analysis', icon: '📊', accept: 'image/*,audio/*,video/*' })}
    </div>
    <div id="cap-results" class="hidden"></div>`;

  initUploadZone('cap-upload', async (data) => {
    capFileData = data;
    toast.info('Analyzing', 'Computing capacity for all algorithms...');
    const algos = data.file_type === 'image' ? ['lsb','dct','dwt','hybrid'] : data.file_type === 'audio' ? ['lsb','phase_coding','echo_hiding','spread_spectrum'] : ['lsb','dct','dwt'];
    const results = [];
    for (const algo of algos) {
      try {
        const form = new FormData();
        form.append('file_id', data.file_id); form.append('cover_type', data.file_type); form.append('algorithm', algo);
        const res = await apiFetch('/api/capacity', { method: 'POST', body: form });
        if (res.ok) results.push({ algo, ...(await res.json()) });
      } catch (e) { results.push({ algo, error: e.message }); }
    }
    const r = document.getElementById('cap-results');
    r.classList.remove('hidden');
    r.innerHTML = `
      <div class="cards-grid stagger-item" style="margin-bottom:24px;">
        ${results.map(r => `
          <div class="float-card">
            <h3 style="font-family:var(--font-display); font-size:14px; color:var(--primary); margin-bottom:12px;">${r.algo?.toUpperCase()}</h3>
            <div class="metric"><span class="metric-label">Max Capacity</span><span class="metric-value" style="font-size:22px;">${r.max_capacity_readable || 'N/A'}</span></div>
            ${r.estimated_psnr ? `<div class="mt-8"><span class="text-xs text-muted">Est. PSNR: ${r.estimated_psnr} dB · SSIM: ${r.estimated_ssim}</span></div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="glass-panel stagger-item">
        <h3 class="section-title">📋 File Info</h3>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">
          <div class="metric"><span class="metric-label">File Size</span><span style="color:var(--text-primary); font-weight:600;">${data.size_readable || data.size_bytes + ' B'}</span></div>
          <div class="metric"><span class="metric-label">File Type</span><span class="tag tag-primary">${data.file_type}</span></div>
          <div class="metric"><span class="metric-label">Format</span><span style="color:var(--text-primary);">${data.filename?.split('.').pop()?.toUpperCase()}</span></div>
        </div>
      </div>`;
    staggerIn('.stagger-item');
  });
  staggerIn('.stagger-item');
}
