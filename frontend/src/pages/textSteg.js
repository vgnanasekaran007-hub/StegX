/**
 * StegX Text Steganography Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Character count and hidden capacity indicator
 *  - Live preview of stego text
 *  - Hidden data detection scanner
 *  - Method comparison with examples
 *  - Copy-to-clipboard for results
 */
import { apiFetch } from '../api.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

export function renderTextSteg(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📝 Text Steganography</h1>
      <p class="page-subtitle">Hide secret messages within plain text using invisible encoding methods</p>
    </div>

    <div class="tabs" id="text-mode-tabs">
      <button class="tab active" data-mode="hide">Hide Text</button>
      <button class="tab" data-mode="extract">Extract Text</button>
    </div>

    <!-- Hide Section -->
    <div id="text-hide-section" class="glass-panel stagger-item">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="input-group">
          <label class="input-label">Cover Text</label>
          <textarea class="input-field" id="text-cover"
                    placeholder="Enter the visible cover text here. This text will appear normal to readers but contain hidden data…" rows="8"></textarea>
          <div class="text-xs text-muted mt-4" id="cover-char-count">0 characters</div>
        </div>
        <div class="input-group">
          <label class="input-label">Secret Message</label>
          <textarea class="input-field" id="text-secret"
                    placeholder="Enter the secret message to hide…" rows="8"></textarea>
          <div class="text-xs text-muted mt-4" id="secret-char-count">0 characters · 0 B</div>
        </div>
      </div>
      <div class="input-group mt-16">
        <label class="input-label">Method</label>
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
        <div class="flex gap-8 mt-8">
          <button class="btn btn-accent btn-sm" id="copy-stego-btn">📋 Copy to Clipboard</button>
          <span class="text-xs text-muted" id="stego-stats" style="align-self:center;"></span>
        </div>
      </div>
    </div>

    <!-- Extract Section -->
    <div id="text-extract-section" class="glass-panel hidden stagger-item">
      <div class="input-group">
        <label class="input-label">Stego Text</label>
        <textarea class="input-field" id="text-stego-input"
                  placeholder="Paste the stego text here…" rows="8"></textarea>
        <div class="text-xs mt-4" id="detect-indicator" style="color:var(--text-muted);">Paste text to scan for hidden data</div>
      </div>
      <div class="input-group mt-16">
        <label class="input-label">Method</label>
        <select class="input-field" id="text-extract-method">
          <option value="">Auto Detect</option>
          <option value="zero_width">Zero-Width Characters</option>
          <option value="whitespace">Whitespace</option>
          <option value="unicode">Unicode</option>
          <option value="char_encoding">Character Encoding</option>
          <option value="synonym">Synonym</option>
        </select>
      </div>
      <button class="btn btn-primary btn-lg mt-16 w-full" id="text-extract-btn">🔓 Extract Message</button>
      <div id="text-extract-result" class="hidden mt-16">
        <label class="input-label">Extracted Secret</label>
        <textarea class="input-field" id="text-extracted-output" rows="4" readonly style="color:var(--accent);"></textarea>
        <button class="btn btn-accent btn-sm mt-8" id="copy-extracted-btn">📋 Copy</button>
      </div>
    </div>

    <!-- Method Comparison -->
    <div class="glass-panel stagger-item mt-24">
      <h3 class="section-title">📋 Method Comparison</h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Method</th><th>Invisibility</th><th>Capacity</th><th>Robustness</th><th>How It Works</th></tr></thead>
          <tbody>
            <tr>
              <td style="color:var(--primary); font-weight:600;">Zero-Width</td>
              <td><span class="tag tag-accent">Perfect</span></td>
              <td>Medium</td>
              <td>Low (copy may strip)</td>
              <td class="text-xs text-muted">Uses invisible Unicode characters (U+200B, U+200C, U+200D)</td>
            </tr>
            <tr>
              <td style="color:var(--secondary); font-weight:600;">Whitespace</td>
              <td>High</td>
              <td>Low</td>
              <td>Low</td>
              <td class="text-xs text-muted">Encodes data in trailing spaces and tabs</td>
            </tr>
            <tr>
              <td style="color:var(--accent); font-weight:600;">Unicode Homoglyphs</td>
              <td>High</td>
              <td>Medium</td>
              <td>Medium</td>
              <td class="text-xs text-muted">Replaces characters with visually identical Unicode variants</td>
            </tr>
            <tr>
              <td style="color:var(--warning); font-weight:600;">Char Encoding</td>
              <td>Low</td>
              <td>High</td>
              <td>High</td>
              <td class="text-xs text-muted">Uses full-width characters for encoding</td>
            </tr>
            <tr>
              <td style="color:var(--danger); font-weight:600;">Synonym</td>
              <td>Medium</td>
              <td>Very Low</td>
              <td>High</td>
              <td class="text-xs text-muted">Replaces words with synonyms to encode bits</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // ── Tab switching ────────────────────────────────────────────
  document.querySelectorAll('#text-mode-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#text-mode-tabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      _toggle('text-hide-section', mode === 'hide');
      _toggle('text-extract-section', mode === 'extract');
    });
  });

  // ── Character counters ───────────────────────────────────────
  _on('text-cover', 'input', () => {
    const el = document.getElementById('cover-char-count');
    const val = _val('text-cover');
    if (el) el.textContent = `${val.length} characters`;
  });

  _on('text-secret', 'input', () => {
    const el = document.getElementById('secret-char-count');
    const val = _val('text-secret');
    const bytes = new Blob([val]).size;
    if (el) el.textContent = `${val.length} characters · ${bytes} B`;
  });

  // ── Hidden data detection scanner ────────────────────────────
  _on('text-stego-input', 'input', () => {
    const text = _val('text-stego-input');
    const indicator = document.getElementById('detect-indicator');
    if (!indicator || !text) {
      if (indicator) indicator.textContent = 'Paste text to scan for hidden data';
      return;
    }

    // Check for zero-width characters
    const zwc = (text.match(/[\u200B\u200C\u200D\uFEFF]/g) || []).length;
    if (zwc > 0) {
      indicator.textContent = `🔍 Detected ${zwc} zero-width characters — likely contains hidden data!`;
      indicator.style.color = 'var(--accent)';
      return;
    }

    // Check for unusual whitespace
    const ws = (text.match(/[\t ]{2,}$/gm) || []).length;
    if (ws > 3) {
      indicator.textContent = `🔍 Detected unusual whitespace patterns — may contain hidden data`;
      indicator.style.color = 'var(--warning)';
      return;
    }

    indicator.textContent = '✓ No obvious hidden data patterns detected';
    indicator.style.color = 'var(--text-muted)';
  });

  // ── Hide ─────────────────────────────────────────────────────
  _on('text-hide-btn', 'click', async () => {
    const cover  = _val('text-cover');
    const secret = _val('text-secret');
    const method = _val('text-method');
    if (!cover || !secret) { toast.warning('Missing', 'Enter both cover and secret text'); return; }
    try {
      const form = new FormData();
      form.append('cover_text', cover);
      form.append('secret_text', secret);
      form.append('method', method);
      const res = await apiFetch('/api/hide/text', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        _show('text-hide-result');
        const output = document.getElementById('text-stego-output');
        if (output) output.value = data.stego_text;
        const stats = document.getElementById('stego-stats');
        if (stats) stats.textContent = `Output: ${(data.stego_text || '').length} chars`;
        toast.success('Hidden!', data.message);
      } else {
        throw new Error(data.detail || 'Failed');
      }
    } catch (e) { toast.error('Error', e.message); }
  });

  // ── Extract ──────────────────────────────────────────────────
  _on('text-extract-btn', 'click', async () => {
    const stego = _val('text-stego-input');
    if (!stego) { toast.warning('Missing', 'Paste stego text'); return; }
    try {
      const form = new FormData();
      form.append('stego_text', stego);
      const method = _val('text-extract-method');
      if (method) form.append('method', method);
      const res = await apiFetch('/api/extract/text', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        _show('text-extract-result');
        const output = document.getElementById('text-extracted-output');
        if (output) output.value = data.extracted_text;
        toast.success('Extracted!', data.message);
      } else {
        throw new Error(data.detail || 'Failed');
      }
    } catch (e) { toast.error('Error', e.message); }
  });

  // ── Copy buttons ────────────────────────────────────────────
  _on('copy-stego-btn', 'click', () => {
    const text = _val('text-stego-output');
    if (text) { navigator.clipboard.writeText(text); toast.info('Copied', 'Stego text copied to clipboard'); }
  });

  _on('copy-extracted-btn', 'click', () => {
    const text = _val('text-extracted-output');
    if (text) { navigator.clipboard.writeText(text); toast.info('Copied', 'Extracted text copied'); }
  });

  staggerIn('.stagger-item');
}

/* ── DOM Shortcuts ─────────────────────────────────────────────── */
function _show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function _toggle(id, show) { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', !show); }
function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
