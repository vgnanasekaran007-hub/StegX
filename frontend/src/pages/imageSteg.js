/**
 * StegX Image Steganography Page — Rewritten from Scratch
 */
import { staggerIn } from '../three/animations.js';

export function renderImageSteg(container) {
  const algos = [
    { name: 'LSB',    desc: 'Spatial domain — highest capacity, fastest speed',            color: 'var(--primary)' },
    { name: 'DCT',    desc: 'Frequency domain — robust against compression',               color: 'var(--secondary)' },
    { name: 'DWT',    desc: 'Wavelet transform — excellent quality preservation',           color: 'var(--accent)' },
    { name: 'Hybrid', desc: 'Combined approach — balanced security and capacity',           color: 'var(--warning)' },
  ];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🖼️ Image Steganography</h1>
      <p class="page-subtitle">Hide and extract data in images using LSB, DCT, DWT, and Hybrid algorithms</p>
    </div>
    <div class="cards-grid stagger-item" style="margin-bottom:32px;">
      ${algos
        .map(
          (a) => `
        <div class="float-card">
          <div style="font-size:28px; margin-bottom:12px; color:${a.color};">◈</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:8px;">${a.name}</h3>
          <p class="text-sm text-muted">${a.desc}</p>
          <div class="mt-16"><a href="#/hide" class="btn btn-ghost btn-sm">Use ${a.name} →</a></div>
        </div>`
        )
        .join('')}
    </div>
    <div class="glass-panel stagger-item">
      <h3 class="section-title">📋 Algorithm Comparison</h3>
      <table class="data-table">
        <thead><tr><th>Algorithm</th><th>Capacity</th><th>Quality</th><th>Speed</th><th>Robustness</th><th>Security</th></tr></thead>
        <tbody>
          <tr><td style="color:var(--primary); font-weight:600;">LSB</td><td><span class="tag tag-accent">Highest</span></td><td>Good (51 dB PSNR)</td><td><span class="tag tag-accent">Fast</span></td><td>Low</td><td>Low-Medium</td></tr>
          <tr><td style="color:var(--secondary); font-weight:600;">DCT</td><td><span class="tag tag-primary">Medium</span></td><td>Good (42 dB PSNR)</td><td>Moderate</td><td><span class="tag tag-accent">High</span></td><td>Medium-High</td></tr>
          <tr><td style="color:var(--accent); font-weight:600;">DWT</td><td><span class="tag tag-primary">Medium</span></td><td><span class="tag tag-accent">Excellent</span> (45 dB)</td><td>Moderate</td><td><span class="tag tag-accent">High</span></td><td>High</td></tr>
          <tr><td style="color:var(--warning); font-weight:600;">Hybrid</td><td>High</td><td>Very Good</td><td>Slower</td><td>Very High</td><td><span class="tag tag-accent">Highest</span></td></tr>
        </tbody>
      </table>
    </div>`;
  staggerIn('.stagger-item');
}
