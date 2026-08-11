/**
 * StegX Video Steganography Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Algorithm comparison table with stats
 *  - Animated pipeline visualization
 *  - Processing time estimates
 *  - Frame count estimator info
 */
import { staggerIn } from '../three/animations.js';

export function renderVideoSteg(container) {
  const algos = [
    { n: 'LSB',           d: 'Frame-by-frame LSB embedding. Fast with massive capacity across hundreds of frames.',
      icon: '⚡', capacity: 95, quality: 70, speed: 85 },
    { n: 'DCT',           d: 'DCT coefficient modification per frame. Robust against compression artifacts.',
      icon: '🔧', capacity: 50, quality: 80, speed: 55 },
    { n: 'DWT',           d: 'Wavelet-based embedding per frame. Best quality preservation for video.',
      icon: '🌊', capacity: 55, quality: 90, speed: 50 },
    { n: 'Motion Vector', d: 'Hides data in inter-frame motion information. Most stealthy approach.',
      icon: '🎯', capacity: 30, quality: 95, speed: 40 },
    { n: 'Hybrid',        d: 'Combines spatial and frequency domain techniques across frames.',
      icon: '🔀', capacity: 70, quality: 85, speed: 30 },
  ];

  const steps = [
    { icon: '📽️', label: 'Extract Frames', desc: 'Video is split into individual frames using FFmpeg' },
    { icon: '💉', label: 'Embed per Frame', desc: 'Selected algorithm embeds data into each frame' },
    { icon: '🔀', label: 'Distribute Data', desc: 'Secret data is split and spread across frames' },
    { icon: '🎬', label: 'Reassemble Video', desc: 'Frames are recombined using FFV1 lossless codec' },
  ];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🎬 Video Steganography</h1>
      <p class="page-subtitle">Hide data across video frames using frame-level steganography with multiple algorithms</p>
    </div>

    <!-- Algorithm Cards -->
    <div class="cards-grid stagger-item" style="margin-bottom:32px;">
      ${algos.map((a) => `
        <div class="float-card" style="position:relative; overflow:hidden;">
          <div style="font-size:28px; margin-bottom:12px;">${a.icon}</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:8px;">${a.n}</h3>
          <p class="text-sm text-muted" style="margin-bottom:16px;">${a.d}</p>
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px;">
            ${[['Capacity', a.capacity], ['Quality', a.quality], ['Speed', a.speed]].map(([label, val]) => `
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="text-xs text-muted" style="width:60px;">${label}</span>
                <div class="progress-bar" style="flex:1; height:4px;">
                  <div class="progress-fill" style="width:${val}%; transition:none;"></div>
                </div>
                <span class="text-xs text-muted" style="width:28px; text-align:right;">${val}%</span>
              </div>`).join('')}
          </div>
          <a href="#/hide" class="btn btn-ghost btn-sm" style="width:100%;">Use →</a>
        </div>`).join('')}
    </div>

    <!-- Pipeline Visualization -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">📋 How Video Steganography Works</h3>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; text-align:center;">
        ${steps.map((s, i) => `
          <div style="position:relative;">
            <div style="padding:20px; background:var(--bg-glass); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
              <div style="font-size:24px; margin-bottom:8px; color:var(--primary);">${s.icon}</div>
              <div style="font-family:var(--font-display); font-size:12px; margin-bottom:6px; color:var(--text-primary);">Step ${i + 1}</div>
              <div class="text-sm font-mono" style="margin-bottom:6px;">${s.label}</div>
              <div class="text-xs text-muted">${s.desc}</div>
            </div>
            ${i < steps.length - 1 ? '<div style="position:absolute; right:-12px; top:50%; transform:translateY(-50%); color:var(--primary); font-size:18px;">→</div>' : ''}
          </div>`).join('')}
      </div>
    </div>

    <!-- Estimates & Info -->
    <div class="glass-panel stagger-item">
      <h3 class="section-title">⏱️ Processing Time Estimates</h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Video Duration</th><th>Est. Frames (30fps)</th><th>LSB Time</th><th>DCT/DWT Time</th><th>Capacity (LSB)</th></tr></thead>
          <tbody>
            <tr><td>10 seconds</td><td>~300</td><td>~5s</td><td>~15s</td><td>~50 MB</td></tr>
            <tr><td>30 seconds</td><td>~900</td><td>~15s</td><td>~45s</td><td>~150 MB</td></tr>
            <tr><td>1 minute</td><td>~1,800</td><td>~30s</td><td>~90s</td><td>~300 MB</td></tr>
            <tr><td>5 minutes</td><td>~9,000</td><td>~150s</td><td>~450s</td><td>~1.5 GB</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-muted mt-16">Output uses FFV1 lossless codec in AVI container for zero-loss frame preservation. Processing time depends on video resolution and selected algorithm.</p>
    </div>
  `;
  staggerIn('.stagger-item');
}
