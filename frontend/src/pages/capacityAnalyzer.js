/**
 * StegX Capacity Analyzer Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Bar chart comparison of algorithm capacities
 *  - Capacity utilization progress bars
 *  - Enhanced file info display
 *  - Export analysis as text report
 */
import { apiFetch, formatSize } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { createBarChart } from '../components/charts.js';
import { toast } from '../components/toast.js';
import { staggerIn, animateProgress } from '../three/animations.js';

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

    const maxCapacity = Math.max(...results.map(r => r.max_capacity_bytes || 0));

    const r = document.getElementById('cap-results');
    if (!r) return;
    r.classList.remove('hidden');
    r.innerHTML = `
      <!-- Algorithm Capacity Cards -->
      <div class="cards-grid stagger-item" style="margin-bottom:24px;">
        ${results.map((item) => {
          const capBytes = item.max_capacity_bytes || 0;
          const pct = maxCapacity > 0 ? (capBytes / maxCapacity * 100) : 0;
          return `
          <div class="float-card">
            <h3 style="font-family:var(--font-display); font-size:14px; color:var(--primary); margin-bottom:12px;">${(item.algo || '').toUpperCase()}</h3>
            <div class="metric">
              <span class="metric-label">Max Capacity</span>
              <span class="metric-value" style="font-size:22px;">${item.max_capacity_readable || 'N/A'}</span>
            </div>
            ${capBytes > 0 ? `
              <div class="mt-8">
                <div class="progress-bar" style="height:6px;">
                  <div class="progress-fill cap-bar" style="width:0%; transition:none;" data-pct="${pct}"></div>
                </div>
                <span class="text-xs text-muted">${pct.toFixed(0)}% of max</span>
              </div>` : ''}
            ${item.estimated_psnr ? `<div class="mt-8"><span class="text-xs text-muted">Est. PSNR: ${item.estimated_psnr} dB · SSIM: ${item.estimated_ssim}</span></div>` : ''}
            ${item.error ? `<div class="mt-8"><span class="text-xs" style="color:var(--danger);">⚠ ${item.error}</span></div>` : ''}
          </div>`;
        }).join('')}
      </div>

      <!-- Bar Chart -->
      <div class="glass-panel stagger-item" style="margin-bottom:24px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <h3 class="section-title" style="margin-bottom:0;">📊 Capacity Comparison</h3>
          <button class="btn btn-ghost btn-sm" id="cap-export-btn" title="Export report">📋 Export</button>
        </div>
        <div style="height:250px; margin-top:16px;"><canvas id="cap-chart"></canvas></div>
      </div>

      <!-- File Info -->
      <div class="glass-panel stagger-item">
        <h3 class="section-title">📋 File Info</h3>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">
          <div class="metric"><span class="metric-label">File Size</span><span style="color:var(--text-primary); font-weight:600;">${data.size_readable || formatSize(data.size_bytes)}</span></div>
          <div class="metric"><span class="metric-label">File Type</span><span class="tag tag-primary">${data.file_type}</span></div>
          <div class="metric"><span class="metric-label">Format</span><span style="color:var(--text-primary);">${(data.filename || '').split('.').pop()?.toUpperCase() || 'N/A'}</span></div>
        </div>
      </div>`;

    // Create bar chart
    const chartLabels = results.map(r => (r.algo || '').toUpperCase());
    const chartValues = results.map(r => (r.max_capacity_bytes || 0) / 1024); // KB
    setTimeout(() => {
      createBarChart('cap-chart', chartLabels, chartValues, { label: 'Capacity (KB)' });
    }, 100);

    // Animate capacity bars
    setTimeout(() => {
      document.querySelectorAll('.cap-bar').forEach((bar) => {
        const pct = parseFloat(bar.dataset.pct || '0');
        animateProgress(bar, pct, { delay: 0, from: '0%' });
      });
    }, 200);

    // Export button
    const exportBtn = document.getElementById('cap-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const report = results.map(r =>
          `${(r.algo || '').toUpperCase()}: ${r.max_capacity_readable || 'N/A'}${r.estimated_psnr ? ` (PSNR: ${r.estimated_psnr} dB)` : ''}`
        ).join('\n');
        navigator.clipboard.writeText(
          `StegX Capacity Analysis Report\nFile: ${data.filename}\nType: ${data.file_type}\nSize: ${data.size_readable || formatSize(data.size_bytes)}\n\n${report}`
        );
        toast.info('Exported', 'Analysis report copied to clipboard');
      });
    }

    staggerIn('.stagger-item');
  });

  staggerIn('.stagger-item');
}
