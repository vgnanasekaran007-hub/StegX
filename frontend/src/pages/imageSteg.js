/**
 * StegX Image Steganography Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Interactive algorithm comparison with radar-style visual
 *  - Visual indicators of algorithm characteristics
 *  - Direct "Try it now" buttons that navigate to Hide page
 *  - Detailed comparison table with enhanced formatting
 */
import { staggerIn } from '../three/animations.js';

export function renderImageSteg(container) {
  const algos = [
    { name: 'LSB',    desc: 'Spatial domain — highest capacity, fastest speed',  color: 'var(--primary)',   icon: '⚡',
      capacity: 95, quality: 70, speed: 95, robustness: 20, security: 30 },
    { name: 'DCT',    desc: 'Frequency domain — robust against compression',     color: 'var(--secondary)', icon: '🔧',
      capacity: 50, quality: 75, speed: 60, robustness: 85, security: 70 },
    { name: 'DWT',    desc: 'Wavelet transform — excellent quality preservation', color: 'var(--accent)',    icon: '🌊',
      capacity: 55, quality: 90, speed: 55, robustness: 80, security: 75 },
    { name: 'Hybrid', desc: 'Combined approach — balanced security and capacity', color: 'var(--warning)',   icon: '🔀',
      capacity: 70, quality: 80, speed: 35, robustness: 85, security: 90 },
  ];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🖼️ Image Steganography</h1>
      <p class="page-subtitle">Hide and extract data in images using LSB, DCT, DWT, and Hybrid algorithms</p>
    </div>

    <!-- Algorithm Cards -->
    <div class="cards-grid stagger-item" style="margin-bottom:32px;">
      ${algos.map((a) => `
        <div class="float-card" style="position:relative; overflow:hidden;">
          <div style="position:absolute; top:0; left:0; right:0; height:3px; background:${a.color};"></div>
          <div style="font-size:28px; margin-bottom:12px; color:${a.color};">${a.icon}</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:8px;">${a.name}</h3>
          <p class="text-sm text-muted" style="margin-bottom:16px;">${a.desc}</p>
          <!-- Mini stat bars -->
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px;">
            ${['Capacity', 'Quality', 'Speed', 'Security'].map((label, i) => {
              const val = [a.capacity, a.quality, a.speed, a.security][i];
              return `
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="text-xs text-muted" style="width:60px;">${label}</span>
                  <div class="progress-bar" style="flex:1; height:4px;">
                    <div class="progress-fill" style="width:${val}%; background:${a.color}; transition:none;"></div>
                  </div>
                  <span class="text-xs text-muted" style="width:28px; text-align:right;">${val}%</span>
                </div>`;
            }).join('')}
          </div>
          <a href="#/hide" class="btn btn-ghost btn-sm" style="width:100%;">Use ${a.name} →</a>
        </div>`).join('')}
    </div>

    <!-- Detailed Comparison Table -->
    <div class="glass-panel stagger-item">
      <h3 class="section-title">📋 Algorithm Comparison</h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Algorithm</th><th>Capacity</th><th>Quality</th><th>Speed</th><th>Robustness</th><th>Security</th><th>Best For</th></tr></thead>
          <tbody>
            <tr>
              <td style="color:var(--primary); font-weight:600;">LSB</td>
              <td><span class="tag tag-accent">Highest</span></td>
              <td>Good (51 dB PSNR)</td>
              <td><span class="tag tag-accent">Fast</span></td>
              <td>Low</td>
              <td>Low-Medium</td>
              <td class="text-xs text-muted">Quick embedding of large files</td>
            </tr>
            <tr>
              <td style="color:var(--secondary); font-weight:600;">DCT</td>
              <td><span class="tag tag-primary">Medium</span></td>
              <td>Good (42 dB PSNR)</td>
              <td>Moderate</td>
              <td><span class="tag tag-accent">High</span></td>
              <td>Medium-High</td>
              <td class="text-xs text-muted">Files shared on social media</td>
            </tr>
            <tr>
              <td style="color:var(--accent); font-weight:600;">DWT</td>
              <td><span class="tag tag-primary">Medium</span></td>
              <td><span class="tag tag-accent">Excellent</span> (45 dB)</td>
              <td>Moderate</td>
              <td><span class="tag tag-accent">High</span></td>
              <td>High</td>
              <td class="text-xs text-muted">Quality-critical images</td>
            </tr>
            <tr>
              <td style="color:var(--warning); font-weight:600;">Hybrid</td>
              <td>High</td>
              <td>Very Good</td>
              <td>Slower</td>
              <td>Very High</td>
              <td><span class="tag tag-accent">Highest</span></td>
              <td class="text-xs text-muted">Maximum security scenarios</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Supported Formats -->
    <div class="glass-panel stagger-item mt-24">
      <h3 class="section-title">📂 Supported Formats</h3>
      <div class="flex gap-12" style="flex-wrap:wrap;">
        ${['PNG', 'BMP', 'TIFF', 'GIF', 'WEBP'].map((f) => `<span class="tag tag-primary">${f}</span>`).join('')}
      </div>
      <p class="text-sm text-muted mt-12">Note: JPEG is not recommended for LSB steganography due to lossy compression. Use PNG or BMP for best results.</p>
    </div>
  `;
  staggerIn('.stagger-item');
}
