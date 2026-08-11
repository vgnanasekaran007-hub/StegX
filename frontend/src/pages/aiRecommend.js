/**
 * StegX AI Recommendation Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Animated "analyzing" state with progress steps
 *  - Confidence score visualization
 *  - "Apply recommendation" button to auto-navigate to Hide page
 *  - Enhanced capacity comparison table
 *  - Recommendation cards with detailed explanations
 */
import { apiFetch } from '../api.js';
import { createUploadZone, initUploadZone } from '../components/fileUpload.js';
import { createRadarChart } from '../components/charts.js';
import { toast } from '../components/toast.js';
import { staggerIn, animateCounter } from '../three/animations.js';

let coverData = null;
let secretData = null;

export function renderAIRecommend(container) {
  coverData = null;
  secretData = null;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🤖 AI Recommendation Engine</h1>
      <p class="page-subtitle">Get intelligent algorithm recommendations based on your files and requirements</p>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
      <div class="glass-panel stagger-item">
        <h3 class="section-title">📁 Cover File</h3>
        ${createUploadZone('ai-cover', { label: 'Cover file', icon: '🖼️', accept: 'image/*,audio/*,video/*' })}
      </div>
      <div class="glass-panel stagger-item">
        <h3 class="section-title">🔒 Secret File (Optional)</h3>
        ${createUploadZone('ai-secret', { label: 'Secret file (optional)', icon: '📄' })}
      </div>
    </div>
    <button class="btn btn-primary btn-lg w-full stagger-item" id="ai-analyze-btn">🤖 Get AI Recommendations</button>
    <div id="ai-loading" class="hidden mt-24"></div>
    <div id="ai-results" class="hidden mt-24"></div>`;

  initUploadZone('ai-cover',  (d) => { coverData = d;  toast.success('Cover',  d.filename + ' uploaded'); });
  initUploadZone('ai-secret', (d) => { secretData = d; toast.success('Secret', d.filename + ' uploaded'); });

  _on('ai-analyze-btn', 'click', async () => {
    if (!coverData) { toast.warning('Missing', 'Upload a cover file'); return; }

    // Show analyzing state
    const loading = document.getElementById('ai-loading');
    const results = document.getElementById('ai-results');
    if (results) results.classList.add('hidden');
    if (loading) {
      loading.classList.remove('hidden');
      loading.innerHTML = `
        <div class="holo-panel text-center" style="padding:32px;">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          <h3 style="font-family:var(--font-display); font-size:16px; color:var(--primary); margin-bottom:12px;">Analyzing…</h3>
          <div id="ai-progress-steps" style="text-align:left; max-width:300px; margin:0 auto;">
            <div class="text-sm" style="color:var(--accent);">✓ Analyzing file properties</div>
            <div class="text-sm text-muted" id="ai-step-2">⏳ Computing capacities…</div>
            <div class="text-sm text-muted" id="ai-step-3">○ Generating recommendations…</div>
          </div>
        </div>`;
    }

    // Animate progress steps
    setTimeout(() => {
      const s2 = document.getElementById('ai-step-2');
      if (s2) { s2.textContent = '✓ Computing capacities'; s2.style.color = 'var(--accent)'; }
      const s3 = document.getElementById('ai-step-3');
      if (s3) { s3.textContent = '⏳ Generating recommendations…'; s3.style.color = 'var(--text-secondary)'; }
    }, 1500);

    const form = new FormData();
    form.append('cover_file_id', coverData.file_id);
    form.append('cover_type', coverData.file_type);
    if (secretData) form.append('secret_file_id', secretData.file_id);

    try {
      const res = await apiFetch('/api/recommend', { method: 'POST', body: form });
      const data = await res.json();
      if (loading) loading.classList.add('hidden');
      const r = document.getElementById('ai-results');
      if (!r) return;
      r.classList.remove('hidden');

      const secScore = data.security_score || 0;
      const secColor = secScore >= 80 ? 'var(--accent)' : secScore >= 50 ? 'var(--warning)' : 'var(--danger)';

      r.innerHTML = `
        <!-- Best Algorithm Banner -->
        <div class="holo-panel stagger-item" style="margin-bottom:24px; text-align:center; padding:32px;">
          <div style="font-size:48px; margin-bottom:12px;">🤖</div>
          <h3 style="font-family:var(--font-display); font-size:22px; color:var(--accent);">Best Algorithm: ${(data.best_algorithm || '').toUpperCase()}</h3>
          <p class="text-sm text-muted mt-8">${data.algorithm_reason || ''}</p>
          <div class="mt-16" style="display:flex; align-items:center; justify-content:center; gap:24px;">
            <div>
              <div class="text-xs text-muted">Security Score</div>
              <div style="font-family:var(--font-display); font-size:28px; color:${secColor};" id="ai-sec-score">0</div>
              <div class="text-xs text-muted">/100</div>
            </div>
            <a href="#/hide" class="btn btn-accent btn-lg">⊕ Apply & Hide Data</a>
          </div>
        </div>

        <!-- Quality + Recommendations Grid -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;" class="stagger-item">
          <div class="glass-panel">
            <h3 class="section-title">📊 Quality Prediction</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="metric"><span class="metric-label">Est. PSNR</span><span class="metric-value">${data.quality_prediction?.estimated_psnr?.toFixed(1) || 'N/A'} <span class="metric-unit">dB</span></span></div>
              <div class="metric"><span class="metric-label">Est. SSIM</span><span class="metric-value">${data.quality_prediction?.estimated_ssim?.toFixed(3) || 'N/A'}</span></div>
            </div>
            <div class="mt-16"><span class="tag tag-accent">${data.quality_prediction?.quality_rating || 'N/A'}</span></div>
          </div>
          <div class="glass-panel">
            <h3 class="section-title">💡 Recommendations</h3>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:8px;">
              ${(data.recommendations || [])
                .map(
                  (rec) =>
                    `<li style="font-size:13px; color:var(--text-secondary); padding:8px 12px; background:var(--bg-glass); border-radius:var(--radius-sm); border-left:3px solid var(--primary);">💡 ${rec}</li>`
                )
                .join('')}
            </ul>
          </div>
        </div>

        <!-- Capacity Comparison -->
        <div class="glass-panel mt-24 stagger-item">
          <h3 class="section-title">📈 Algorithm Capacity Comparison</h3>
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>Algorithm</th><th>Capacity</th><th>Fits?</th><th>Utilization</th></tr></thead>
              <tbody>
                ${Object.entries(data.capacity_prediction || {})
                  .map(
                    ([algo, info]) => `
                  <tr style="${algo === data.best_algorithm ? 'background:rgba(0,255,136,0.05);' : ''}">
                    <td style="font-weight:600; color:${algo === data.best_algorithm ? 'var(--accent)' : 'var(--text-primary)'};">
                      ${algo.toUpperCase()} ${algo === data.best_algorithm ? '⭐' : ''}
                    </td>
                    <td>${info.capacity}</td>
                    <td>${info.fits ? '<span class="tag tag-accent">✓</span>' : '<span class="tag tag-danger">✕</span>'}</td>
                    <td>${info.utilization}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compression -->
        <div class="glass-panel mt-24 stagger-item">
          <h3 class="section-title">📦 Compression</h3>
          <p class="text-sm" style="color:var(--text-secondary);">${data.compression_recommendation || ''}</p>
        </div>`;

      // Animate security score counter
      const secScoreEl = document.getElementById('ai-sec-score');
      if (secScoreEl) animateCounter(secScoreEl, secScore);

      staggerIn('.stagger-item');
    } catch (e) {
      if (loading) loading.classList.add('hidden');
      toast.error('Error', e.message);
    }
  });

  staggerIn('.stagger-item');
}

function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
