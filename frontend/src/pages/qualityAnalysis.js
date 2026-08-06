import { apiFetch } from '../api.js';
/**
 * StegX Quality Analysis Page
 */
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { createHistogramChart, createBarChart } from '../components/charts.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';
let origFile = null, stegoFile = null;
export function renderQualityAnalysis(container) {
  origFile = null; stegoFile = null;
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">📈 Quality Analysis</h1><p class="page-subtitle">Compare original and stego files with PSNR, SSIM, MSE, BER, entropy, and histograms</p></div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
      <div class="glass-panel stagger-item"><h3 class="section-title">📁 Original File</h3>${createUploadZone('qa-orig', { label: 'Original cover file', icon: '📄', accept: 'image/*,audio/*,video/*' })}</div>
      <div class="glass-panel stagger-item"><h3 class="section-title">🔒 Stego File</h3>${createUploadZone('qa-stego', { label: 'Stego file (with hidden data)', icon: '🔐', accept: 'image/*,audio/*,video/*' })}</div>
    </div>
    <div class="input-group stagger-item" style="max-width:300px; margin-bottom:16px;"><label class="input-label">Cover Type</label>
      <select class="input-field" id="qa-type"><option value="image">Image</option><option value="audio">Audio</option><option value="video">Video</option></select>
    </div>
    <button class="btn btn-primary btn-lg w-full stagger-item" id="qa-btn">📈 Analyze Quality</button>
    <div id="qa-results" class="hidden mt-24"></div>`;

  initUploadZone('qa-orig', (d) => { origFile = d; toast.success('Original', d.filename); });
  initUploadZone('qa-stego', (d) => { stegoFile = d; toast.success('Stego', d.filename); });

  document.getElementById('qa-btn')?.addEventListener('click', async () => {
    if (!origFile || !stegoFile) { toast.warning('Missing', 'Upload both files'); return; }
    try {
      const form = new FormData();
      form.append('original_file_id', origFile.file_id);
      form.append('stego_file_id', stegoFile.file_id);
      form.append('cover_type', document.getElementById('qa-type')?.value || 'image');
      const res = await apiFetch('/api/analysis', { method: 'POST', body: form });
      const data = await res.json();
      const r = document.getElementById('qa-results');
      r.classList.remove('hidden');
      const psnrColor = (data.psnr || 0) > 40 ? 'var(--accent)' : (data.psnr || 0) > 30 ? 'var(--warning)' : 'var(--danger)';
      const ssimColor = (data.ssim || 0) > 0.95 ? 'var(--accent)' : (data.ssim || 0) > 0.9 ? 'var(--warning)' : 'var(--danger)';
      r.innerHTML = `
        <div class="cards-grid stagger-item" style="margin-bottom:24px;">
          <div class="stat-card"><div class="stat-card-label">PSNR</div><div class="stat-card-value" style="color:${psnrColor};">${data.psnr?.toFixed(2) || '∞'} <span class="metric-unit">dB</span></div></div>
          <div class="stat-card"><div class="stat-card-label">SSIM</div><div class="stat-card-value" style="color:${ssimColor};">${data.ssim?.toFixed(6) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">MSE</div><div class="stat-card-value">${data.mse?.toFixed(4) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">BER</div><div class="stat-card-value">${data.ber?.toFixed(6) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">Entropy (Orig)</div><div class="stat-card-value" style="font-size:18px;">${data.entropy_original?.toFixed(4) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">Entropy (Stego)</div><div class="stat-card-value" style="font-size:18px;">${data.entropy_stego?.toFixed(4) || 'N/A'}</div></div>
        </div>
        ${data.histogram_original ? `<div class="glass-panel stagger-item"><h3 class="section-title">📊 Histogram Comparison</h3><div style="height:300px;"><canvas id="qa-histogram"></canvas></div></div>` : ''}`;
      if (data.histogram_original?.length > 0 && data.histogram_stego?.length > 0) {
        setTimeout(() => createHistogramChart('qa-histogram', data.histogram_original[0], data.histogram_stego[0]), 100);
      }
      staggerIn('.stagger-item');
      toast.success('Analysis Complete', `PSNR: ${data.psnr?.toFixed(2)} dB, SSIM: ${data.ssim?.toFixed(4)}`);
    } catch (e) { toast.error('Error', e.message); }
  });
  staggerIn('.stagger-item');
}
