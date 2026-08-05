/**
 * StegX Audio Steganography Page
 */
import { staggerIn } from '../three/animations.js';
export function renderAudioSteg(container) {
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">🎵 Audio Steganography</h1><p class="page-subtitle">Hide data in audio files using LSB, Phase Coding, Echo Hiding, and Spread Spectrum</p></div>
    <div class="cards-grid stagger-item" style="margin-bottom:32px;">
      ${[{n:'LSB',d:'Sample-level bit replacement in PCM audio. Highest capacity but least secure.',c:'var(--primary)'},{n:'Phase Coding',d:'Modifies phase angles of frequency components. High audio fidelity.',c:'var(--secondary)'},{n:'Echo Hiding',d:'Introduces controlled echoes to encode bits. Very subtle and natural.',c:'var(--accent)'},{n:'Spread Spectrum',d:'Spreads data across frequency spectrum. Highest security but lower capacity.',c:'var(--warning)'}].map(a => `
        <div class="float-card"><div style="font-size:28px; margin-bottom:12px; color:${a.c};">♪</div><h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:8px;">${a.n}</h3><p class="text-sm text-muted">${a.d}</p><a href="#/hide" class="btn btn-ghost btn-sm mt-16">Use ${a.n} →</a></div>
      `).join('')}
    </div>
    <div class="glass-panel stagger-item">
      <h3 class="section-title">🎯 Supported Formats</h3>
      <div class="flex gap-12" style="flex-wrap:wrap;">${['WAV','MP3','FLAC','OGG','AAC'].map(f => `<span class="tag tag-primary">${f}</span>`).join('')}</div>
      <p class="text-sm text-muted mt-16">Note: All audio is internally converted to WAV (PCM) for steganography processing. Output is always in WAV format for lossless preservation.</p>
    </div>`;
  staggerIn('.stagger-item');
}
