/**
 * StegX Video Steganography Page
 */
import { staggerIn } from '../three/animations.js';
export function renderVideoSteg(container) {
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">🎬 Video Steganography</h1><p class="page-subtitle">Hide data across video frames using frame-level steganography with multiple algorithms</p></div>
    <div class="cards-grid stagger-item" style="margin-bottom:32px;">
      ${[{n:'LSB',d:'Frame-by-frame LSB embedding. Fast with massive capacity across hundreds of frames.'},{n:'DCT',d:'DCT coefficient modification per frame. Robust against compression artifacts.'},{n:'DWT',d:'Wavelet-based embedding per frame. Best quality preservation for video.'},{n:'Motion Vector',d:'Hides data in inter-frame motion information. Most stealthy approach.'},{n:'Hybrid',d:'Combines spatial and frequency domain techniques across frames.'}].map((a,i) => `
        <div class="float-card"><div style="font-size:28px; margin-bottom:12px;">🎞️</div><h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:8px;">${a.n}</h3><p class="text-sm text-muted">${a.d}</p><a href="#/hide" class="btn btn-ghost btn-sm mt-16">Use →</a></div>
      `).join('')}
    </div>
    <div class="glass-panel stagger-item">
      <h3 class="section-title">📋 How Video Steganography Works</h3>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; text-align:center;">
        ${['1. Extract Frames','2. Embed per Frame','3. Distribute Data','4. Reassemble Video'].map((s,i) => `
          <div style="padding:20px; background:var(--bg-glass); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
            <div style="font-size:24px; margin-bottom:8px; color:var(--primary);">${['📽️','💉','🔀','🎬'][i]}</div>
            <div class="text-sm font-mono">${s}</div>
          </div>
        `).join('')}
      </div>
      <p class="text-sm text-muted mt-16">Video steganography extracts individual frames, applies per-frame image steganography, then reassembles. Output uses FFV1 lossless codec in AVI container.</p>
    </div>`;
  staggerIn('.stagger-item');
}
