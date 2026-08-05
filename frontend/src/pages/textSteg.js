/**
 * StegX Text Steganography Page
 */
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';
export function renderTextSteg(container) {
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">📝 Text Steganography</h1><p class="page-subtitle">Hide secret messages within plain text using invisible encoding methods</p></div>
    <div class="tabs" id="text-mode-tabs"><button class="tab active" data-mode="hide">Hide Text</button><button class="tab" data-mode="extract">Extract Text</button></div>
    <div id="text-hide-section" class="glass-panel stagger-item">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group"><label class="input-label">Cover Text</label><textarea class="input-field" id="text-cover" placeholder="Enter the visible cover text here. This text will appear normal to readers but contain hidden data..." rows="8"></textarea></div>
        <div class="input-group"><label class="input-label">Secret Message</label><textarea class="input-field" id="text-secret" placeholder="Enter the secret message to hide..." rows="8"></textarea></div>
      </div>
      <div class="input-group mt-16"><label class="input-label">Method</label>
        <select class="input-field" id="text-method">
          <option value="zero_width">Zero-Width Characters (Most Invisible)</option>
          <option value="whitespace">Whitespace Encoding</option>
          <option value="unicode">Unicode Homoglyphs</option>
          <option value="char_encoding">Character Encoding (Full-Width)</option>
          <option value="synonym">Synonym Replacement</option>
        </select>
      </div>
      <button class="btn btn-primary btn-lg mt-16 w-full" id="text-hide-btn">🔒 Hide Message</button>
      <div id="text-hide-result" class="hidden mt-16">
        <label class="input-label">Stego Text (copy this)</label>
        <textarea class="input-field" id="text-stego-output" rows="6" readonly style="color:var(--accent);"></textarea>
        <button class="btn btn-accent btn-sm mt-8" id="copy-stego-btn">📋 Copy to Clipboard</button>
      </div>
    </div>
    <div id="text-extract-section" class="glass-panel hidden stagger-item">
      <div class="input-group"><label class="input-label">Stego Text</label><textarea class="input-field" id="text-stego-input" placeholder="Paste the stego text here..." rows="8"></textarea></div>
      <div class="input-group mt-16"><label class="input-label">Method</label>
        <select class="input-field" id="text-extract-method"><option value="">Auto Detect</option><option value="zero_width">Zero-Width Characters</option><option value="whitespace">Whitespace</option><option value="unicode">Unicode</option><option value="char_encoding">Character Encoding</option><option value="synonym">Synonym</option></select>
      </div>
      <button class="btn btn-primary btn-lg mt-16 w-full" id="text-extract-btn">🔓 Extract Message</button>
      <div id="text-extract-result" class="hidden mt-16">
        <label class="input-label">Extracted Secret</label>
        <textarea class="input-field" id="text-extracted-output" rows="4" readonly style="color:var(--accent);"></textarea>
      </div>
    </div>`;

  // Tab switching
  document.querySelectorAll('#text-mode-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#text-mode-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('text-hide-section').classList.toggle('hidden', tab.dataset.mode !== 'hide');
      document.getElementById('text-extract-section').classList.toggle('hidden', tab.dataset.mode !== 'extract');
    });
  });

  // Hide
  document.getElementById('text-hide-btn')?.addEventListener('click', async () => {
    const cover = document.getElementById('text-cover')?.value;
    const secret = document.getElementById('text-secret')?.value;
    const method = document.getElementById('text-method')?.value;
    if (!cover || !secret) { toast.warning('Missing', 'Enter both cover and secret text'); return; }
    try {
      const form = new FormData();
      form.append('cover_text', cover); form.append('secret_text', secret); form.append('method', method);
      const res = await fetch('/api/hide/text', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        document.getElementById('text-hide-result').classList.remove('hidden');
        document.getElementById('text-stego-output').value = data.stego_text;
        toast.success('Hidden!', data.message);
      } else throw new Error(data.detail || 'Failed');
    } catch (e) { toast.error('Error', e.message); }
  });

  // Extract
  document.getElementById('text-extract-btn')?.addEventListener('click', async () => {
    const stego = document.getElementById('text-stego-input')?.value;
    if (!stego) { toast.warning('Missing', 'Paste stego text'); return; }
    try {
      const form = new FormData();
      form.append('stego_text', stego);
      const method = document.getElementById('text-extract-method')?.value;
      if (method) form.append('method', method);
      const res = await fetch('/api/extract/text', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        document.getElementById('text-extract-result').classList.remove('hidden');
        document.getElementById('text-extracted-output').value = data.extracted_text;
        toast.success('Extracted!', data.message);
      } else throw new Error(data.detail || 'Failed');
    } catch (e) { toast.error('Error', e.message); }
  });

  // Copy
  document.getElementById('copy-stego-btn')?.addEventListener('click', () => {
    const text = document.getElementById('text-stego-output')?.value;
    if (text) { navigator.clipboard.writeText(text); toast.info('Copied', 'Stego text copied to clipboard'); }
  });

  staggerIn('.stagger-item');
}
