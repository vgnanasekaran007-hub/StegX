/**
 * StegX Quality Analysis Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Quality rating badges (Excellent/Good/Fair/Poor)
 *  - Detailed metric explanations in tooltips
 *  - Export analysis report
 *  - Enhanced histogram chart
 *  - Color-coded metrics based on thresholds
 */
import { apiFetch } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { createHistogramChart } from '../components/charts.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

let origFile = null;
let stegoFile = null;

export function renderQualityAnalysis(container) {
  origFile = null;
  stegoFile = null;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📈 Quality Analysis</h1>
      <p class="page-subtitle">Compare original and stego files with PSNR, SSIM, MSE, BER, entropy, and histograms</p>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
      <div class="glass-panel stagger-item">
        <h3 class="section-title">📁 Original File</h3>
        ${createUploadZone('qa-orig', { label: 'Original cover file', icon: '📄', accept: 'image/*,audio/*,video/*' })}
      </div>
      <div class="glass-panel stagger-item">
        <h3 class="section-title">🔒 Stego File</h3>
        ${createUploadZone('qa-stego', { label: 'Stego file (with hidden data)', icon: '🔐', accept: 'image/*,audio/*,video/*' })}
      </div>
    </div>
    <div class="input-group stagger-item" style="max-width:300px; margin-bottom:16px;">
      <label class="input-label">Cover Type</label>
      <select class="input-field" id="qa-type">
        <option value="image">Image</option>
        <option value="audio">Audio</option>
        <option value="video">Video</option>
      </select>
    </div>
    <button class="btn btn-primary btn-lg w-full stagger-item" id="qa-btn">📈 Analyze Quality</button>
    <div id="qa-results" class="hidden mt-24"></div>

    <!-- Metric Guide -->
    <div class="glass-panel stagger-item mt-24" style="opacity:0.7;">
      <h3 class="section-title">📖 Metric Guide</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="text-sm"><strong style="color:var(--primary);">PSNR</strong> <span class="text-muted">— Peak Signal-to-Noise Ratio. Higher = better. >40 dB is excellent.</span></div>
        <div class="text-sm"><strong style="color:var(--secondary);">SSIM</strong> <span class="text-muted">— Structural Similarity. 1.0 = identical. >0.95 is excellent.</span></div>
        <div class="text-sm"><strong style="color:var(--accent);">MSE</strong> <span class="text-muted">— Mean Squared Error. Lower = better. <1.0 is excellent.</span></div>
        <div class="text-sm"><strong style="color:var(--warning);">BER</strong> <span class="text-muted">— Bit Error Rate. Lower = more accurate embedding.</span></div>
      </div>
    </div>`;

  initUploadZone('qa-orig',  (d) => { origFile  = d; toast.success('Original', d.filename); });
  initUploadZone('qa-stego', (d) => { stegoFile = d; toast.success('Stego',    d.filename); });

  _on('qa-btn', 'click', async () => {
    if (!origFile || !stegoFile) { toast.warning('Missing', 'Upload both files'); return; }

    const btn = document.getElementById('qa-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Analyzing…'; }

    try {
      const form = new FormData();
      form.append('original_file_id', origFile.file_id);
      form.append('stego_file_id', stegoFile.file_id);
      form.append('cover_type', _val('qa-type') || 'image');

      const res = await apiFetch('/api/analysis', { method: 'POST', body: form });
      const data = await res.json();
      const r = document.getElementById('qa-results');
      if (!r) return;
      r.classList.remove('hidden');

      const psnr = data.psnr || 0;
      const ssim = data.ssim || 0;

      const psnrColor = psnr > 40 ? 'var(--accent)' : psnr > 30 ? 'var(--warning)' : 'var(--danger)';
      const ssimColor = ssim > 0.95 ? 'var(--accent)' : ssim > 0.9 ? 'var(--warning)' : 'var(--danger)';

      // Overall quality rating
      const rating = psnr > 45 && ssim > 0.98 ? { label: 'Excellent', color: 'var(--accent)', icon: '🏆' }
                   : psnr > 35 && ssim > 0.95 ? { label: 'Good', color: 'var(--primary)', icon: '✓' }
                   : psnr > 25 && ssim > 0.9  ? { label: 'Fair', color: 'var(--warning)', icon: '⚠' }
                   : { label: 'Poor', color: 'var(--danger)', icon: '✕' };

      r.innerHTML = `
        <!-- Overall Rating Banner -->
        <div class="holo-panel stagger-item text-center" style="padding:24px; margin-bottom:24px;">
          <div style="font-size:36px; margin-bottom:8px;">${rating.icon}</div>
          <h3 style="font-family:var(--font-display); font-size:22px; color:${rating.color};">Quality: ${rating.label}</h3>
          <p class="text-sm text-muted mt-4">The stego file is ${ssim > 0.99 ? 'virtually indistinguishable' : ssim > 0.95 ? 'very similar' : 'noticeably different'} from the original</p>
        </div>

        <!-- Metric Cards -->
        <div class="cards-grid stagger-item" style="margin-bottom:24px;">
          <div class="stat-card"><div class="stat-card-label">PSNR</div><div class="stat-card-value" style="color:${psnrColor};">${data.psnr?.toFixed(2) || '∞'} <span class="metric-unit">dB</span></div></div>
          <div class="stat-card"><div class="stat-card-label">SSIM</div><div class="stat-card-value" style="color:${ssimColor};">${data.ssim?.toFixed(6) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">MSE</div><div class="stat-card-value">${data.mse?.toFixed(4) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">BER</div><div class="stat-card-value">${data.ber?.toFixed(6) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">Entropy (Orig)</div><div class="stat-card-value" style="font-size:18px;">${data.entropy_original?.toFixed(4) || 'N/A'}</div></div>
          <div class="stat-card"><div class="stat-card-label">Entropy (Stego)</div><div class="stat-card-value" style="font-size:18px;">${data.entropy_stego?.toFixed(4) || 'N/A'}</div></div>
        </div>

        <!-- Histogram -->
        ${data.histogram_original
          ? `<div class="glass-panel stagger-item" style="margin-bottom:24px;">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <h3 class="section-title" style="margin-bottom:0;">📊 Histogram Comparison</h3>
                <button class="btn btn-ghost btn-sm" id="qa-export-btn">📋 Export Report</button>
              </div>
              <div style="height:300px; margin-top:16px;"><canvas id="qa-histogram"></canvas></div>
            </div>`
          : ''}`;

      if (data.histogram_original?.length > 0 && data.histogram_stego?.length > 0) {
        setTimeout(() => createHistogramChart('qa-histogram', data.histogram_original[0], data.histogram_stego[0]), 100);
      }

      // Export button
      const exportBtn = document.getElementById('qa-export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          const report = [
            'StegX Quality Analysis Report',
            `Overall: ${rating.label}`,
            `PSNR: ${data.psnr?.toFixed(2) || 'N/A'} dB`,
            `SSIM: ${data.ssim?.toFixed(6) || 'N/A'}`,
            `MSE: ${data.mse?.toFixed(4) || 'N/A'}`,
            `BER: ${data.ber?.toFixed(6) || 'N/A'}`,
            `Entropy (Original): ${data.entropy_original?.toFixed(4) || 'N/A'}`,
            `Entropy (Stego): ${data.entropy_stego?.toFixed(4) || 'N/A'}`,
          ].join('\n');
          navigator.clipboard.writeText(report);
          toast.info('Exported', 'Quality report copied to clipboard');
        });
      }

      staggerIn('.stagger-item');
      toast.success('Analysis Complete', `PSNR: ${data.psnr?.toFixed(2)} dB, SSIM: ${data.ssim?.toFixed(4)}`);
    } catch (e) {
      toast.error('Error', e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📈 Analyze Quality'; }
    }
  });

  staggerIn('.stagger-item');
}

function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
