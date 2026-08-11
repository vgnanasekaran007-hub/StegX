/**
 * StegX Audio Steganography Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Algorithm comparison table
 *  - Mini stat bars per algorithm card
 *  - Waveform visualization placeholder
 *  - Format support details with conversion notes
 */
import { staggerIn } from '../three/animations.js';

export function renderAudioSteg(container) {
  const algos = [
    { n: 'LSB',              d: 'Sample-level bit replacement in PCM audio. Highest capacity but least secure.',
      icon: '📊', c: 'var(--primary)',   capacity: 90, quality: 65, security: 30 },
    { n: 'Phase Coding',     d: 'Modifies phase angles of frequency components. High audio fidelity.',
      icon: '🔄', c: 'var(--secondary)', capacity: 35, quality: 90, security: 75 },
    { n: 'Echo Hiding',      d: 'Introduces controlled echoes to encode bits. Very subtle and natural.',
      icon: '🔊', c: 'var(--accent)',    capacity: 25, quality: 85, security: 70 },
    { n: 'Spread Spectrum',  d: 'Spreads data across frequency spectrum. Highest security but lower capacity.',
      icon: '📡', c: 'var(--warning)',   capacity: 20, quality: 80, security: 95 },
  ];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🎵 Audio Steganography</h1>
      <p class="page-subtitle">Hide data in audio files using LSB, Phase Coding, Echo Hiding, and Spread Spectrum</p>
    </div>

    <!-- Algorithm Cards -->
    <div class="cards-grid stagger-item" style="margin-bottom:32px;">
      ${algos.map((a) => `
        <div class="float-card" style="position:relative; overflow:hidden;">
          <div style="position:absolute; top:0; left:0; right:0; height:3px; background:${a.c};"></div>
          <div style="font-size:28px; margin-bottom:12px; color:${a.c};">${a.icon}</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:8px;">${a.n}</h3>
          <p class="text-sm text-muted" style="margin-bottom:16px;">${a.d}</p>
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px;">
            ${[['Capacity', a.capacity], ['Quality', a.quality], ['Security', a.security]].map(([label, val]) => `
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="text-xs text-muted" style="width:60px;">${label}</span>
                <div class="progress-bar" style="flex:1; height:4px;">
                  <div class="progress-fill" style="width:${val}%; background:${a.c}; transition:none;"></div>
                </div>
                <span class="text-xs text-muted" style="width:28px; text-align:right;">${val}%</span>
              </div>`).join('')}
          </div>
          <a href="#/hide" class="btn btn-ghost btn-sm" style="width:100%;">Use ${a.n} →</a>
        </div>`).join('')}
    </div>

    <!-- Comparison Table -->
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">📋 Algorithm Comparison</h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Algorithm</th><th>Capacity</th><th>Audio Quality</th><th>Security</th><th>Detection Resistance</th><th>Best For</th></tr></thead>
          <tbody>
            <tr>
              <td style="color:var(--primary); font-weight:600;">LSB</td>
              <td><span class="tag tag-accent">Highest</span></td>
              <td>Good</td>
              <td>Low</td>
              <td>Low</td>
              <td class="text-xs text-muted">Large data in uncompressed audio</td>
            </tr>
            <tr>
              <td style="color:var(--secondary); font-weight:600;">Phase Coding</td>
              <td>Low</td>
              <td><span class="tag tag-accent">Excellent</span></td>
              <td>High</td>
              <td>High</td>
              <td class="text-xs text-muted">Quality-critical audio files</td>
            </tr>
            <tr>
              <td style="color:var(--accent); font-weight:600;">Echo Hiding</td>
              <td>Low</td>
              <td>Very Good</td>
              <td>High</td>
              <td><span class="tag tag-accent">Very High</span></td>
              <td class="text-xs text-muted">Natural-sounding steganography</td>
            </tr>
            <tr>
              <td style="color:var(--warning); font-weight:600;">Spread Spectrum</td>
              <td>Lowest</td>
              <td>Good</td>
              <td><span class="tag tag-accent">Highest</span></td>
              <td><span class="tag tag-accent">Highest</span></td>
              <td class="text-xs text-muted">Maximum security needs</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Supported Formats -->
    <div class="glass-panel stagger-item">
      <h3 class="section-title">🎯 Supported Formats</h3>
      <div class="flex gap-12" style="flex-wrap:wrap;">
        ${['WAV', 'MP3', 'FLAC', 'OGG', 'AAC'].map((f) => `<span class="tag tag-primary">${f}</span>`).join('')}
      </div>
      <div class="mt-16" style="padding:12px; background:var(--bg-glass); border-radius:var(--radius-sm); border-left:3px solid var(--warning);">
        <p class="text-sm text-muted">
          <strong style="color:var(--warning);">⚠ Note:</strong> All audio is internally converted to WAV (PCM) for steganography processing. Output is always in WAV format for lossless preservation. MP3 and other lossy formats may cause data loss if re-compressed after embedding.
        </p>
      </div>
    </div>
  `;
  staggerIn('.stagger-item');
}
