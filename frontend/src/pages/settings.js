import { apiFetch } from '../api.js';
/**
 * StegX Settings Page
 */
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';
export function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">⚙ Settings</h1><p class="page-subtitle">Configure application preferences, performance, and visual effects</p></div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">🎨 Appearance</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group"><label class="input-label">Theme</label><select class="input-field setting-input" data-key="theme"><option value="cyberpunk">Cyberpunk (Default)</option><option value="midnight">Midnight</option><option value="neon">Neon</option></select></div>
        <div class="input-group"><label class="input-label">Animation Speed</label><select class="input-field setting-input" data-key="animation_speed"><option value="0.5">Slow</option><option value="1.0">Normal</option><option value="1.5">Fast</option><option value="0">Disabled</option></select></div>
      </div>
    </div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">⚡ Performance</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group"><label class="input-label">GPU Acceleration</label><select class="input-field setting-input" data-key="gpu_acceleration"><option value="true">Enabled</option><option value="false">Disabled</option></select></div>
        <div class="input-group"><label class="input-label">Performance Mode</label><select class="input-field setting-input" data-key="performance"><option value="high">High (More Effects)</option><option value="medium">Medium (Balanced)</option><option value="low">Low (Better Performance)</option></select></div>
      </div>
    </div>
    <div class="glass-panel stagger-item" style="margin-bottom:24px;">
      <h3 class="section-title">🌐 General</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group"><label class="input-label">Language</label><select class="input-field setting-input" data-key="language"><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option></select></div>
      </div>
    </div>
    <button class="btn btn-primary btn-lg" id="save-settings-btn">💾 Save Settings</button>
    <div class="glass-panel mt-32 stagger-item">
      <h3 class="section-title">ℹ About StegX</h3>
      <div class="text-sm text-muted">
        <p><strong style="color:var(--primary);">Designed & Developed by Gnanasekaran V</strong></p>
        <p>Mail: <a href="mailto:v.gnanasekaran007@gmail.com" style="color:var(--accent); text-decoration:none;">v.gnanasekaran007@gmail.com</a> | GitHub: <a href="https://github.com/vgnanasekaran007-hub" target="_blank" style="color:var(--accent); text-decoration:none;">github.com/vgnanasekaran007-hub</a></p>
        <p class="mt-8"><strong style="color:var(--primary);">StegX 3D Universal Steganography Studio</strong> v1.0.0</p>
        <p class="mt-8">AI-powered steganography platform supporting image, audio, video, and text steganography with advanced encryption, quality analysis, and immersive 3D visualization.</p>
        <p class="mt-8">Algorithms: LSB, DCT, DWT, Phase Coding, Echo Hiding, Spread Spectrum</p>
        <p>Encryption: AES-128/192/256, RSA, ECC, ChaCha20, Blowfish</p>
      </div>
    </div>`;

  // Load current settings
  apiFetch('/api/settings').then(r => r.json()).then(settings => {
    document.querySelectorAll('.setting-input').forEach(input => {
      const key = input.dataset.key;
      if (settings[key]) input.value = settings[key];
    });
  }).catch(() => {});

  document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const inputs = document.querySelectorAll('.setting-input');
    for (const input of inputs) {
      try {
        await apiFetch(`/api/settings?key=${input.dataset.key}&value=${input.value}`, { method: 'POST' });
      } catch (e) {}
    }
    toast.success('Settings Saved', 'Your preferences have been updated');
  });
  staggerIn('.stagger-item');
}
