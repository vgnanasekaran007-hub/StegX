/**
 * StegX History Page — Rewritten from Scratch
 */
import { apiFetch } from '../api.js';
import { toast } from '../components/toast.js';
import { staggerIn } from '../three/animations.js';

export function renderHistory(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📋 Operation History</h1>
      <p class="page-subtitle">View and manage your steganography, extraction, and encryption history</p>
    </div>
    <div class="flex items-center gap-16 mb-24 stagger-item" style="flex-wrap:wrap;">
      <div class="tabs" id="hist-tabs" style="margin-bottom:0;">
        <button class="tab active" data-type="">All</button>
        <button class="tab" data-type="hide">Hide</button>
        <button class="tab" data-type="extract">Extract</button>
        <button class="tab" data-type="encrypt">Encrypt</button>
      </div>
      <input type="text" class="input-field" id="hist-search" placeholder="Search…" style="max-width:220px;">
    </div>
    <div class="glass-panel stagger-item"><div id="hist-table">Loading…</div></div>
    <div class="flex items-center justify-between mt-16 stagger-item">
      <button class="btn btn-ghost btn-sm" id="hist-prev">← Previous</button>
      <span id="hist-page-info" class="text-sm text-muted">Page 1</span>
      <button class="btn btn-ghost btn-sm" id="hist-next">Next →</button>
    </div>`;

  let page = 1;
  let type = '';
  let search = '';

  const load = async () => {
    try {
      const params = new URLSearchParams({ page, per_page: 15 });
      if (type) params.set('operation_type', type);
      if (search) params.set('search', search);

      const res = await apiFetch(`/api/history?${params}`);
      const data = await res.json();
      const table = document.getElementById('hist-table');
      if (!table) return;

      if (data.operations?.length > 0) {
        table.innerHTML = `
          <table class="data-table">
            <thead><tr><th>Type</th><th>Algorithm</th><th>Cover</th><th>Output</th><th>Encryption</th><th>Status</th><th>Time</th><th></th></tr></thead>
            <tbody>
              ${data.operations
                .map(
                  (op) => `
                <tr>
                  <td><span class="tag ${op.operation_type === 'hide' ? 'tag-primary' : op.operation_type === 'extract' ? 'tag-accent' : 'tag-secondary'}">${op.operation_type}</span></td>
                  <td class="font-mono text-xs">${op.algorithm || '-'}</td>
                  <td class="text-xs">${op.cover_file || '-'}</td>
                  <td class="text-xs">${op.output_file || '-'}</td>
                  <td class="text-xs">${op.encryption || '-'}</td>
                  <td><span class="tag tag-accent">${op.status}</span></td>
                  <td class="text-xs">${new Date(op.timestamp).toLocaleString()}</td>
                  <td><button class="btn btn-ghost btn-sm hist-del" data-id="${op.id}">🗑</button></td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>`;

        table.querySelectorAll('.hist-del').forEach((btn) => {
          btn.addEventListener('click', async () => {
            await apiFetch(`/api/history/${btn.dataset.id}`, { method: 'DELETE' });
            load();
            toast.info('Deleted', 'Entry removed');
          });
        });
      } else {
        table.innerHTML =
          '<div class="text-center text-muted" style="padding:32px;">No operations found</div>';
      }

      const pageInfo = document.getElementById('hist-page-info');
      if (pageInfo) pageInfo.textContent = `Page ${data.page} of ${data.total_pages || 1}`;

      const prevBtn = document.getElementById('hist-prev');
      const nextBtn = document.getElementById('hist-next');
      if (prevBtn) prevBtn.disabled = page <= 1;
      if (nextBtn) nextBtn.disabled = page >= (data.total_pages || 1);
    } catch (_) {
      const table = document.getElementById('hist-table');
      if (table) table.innerHTML = '<p class="text-muted text-center">Could not load history (backend not running?)</p>';
    }
  };

  // ── Event listeners ──────────────────────────────────────────
  document.querySelectorAll('#hist-tabs .tab').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('#hist-tabs .tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      type = t.dataset.type;
      page = 1;
      load();
    });
  });

  const searchInput = document.getElementById('hist-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => { search = e.target.value; page = 1; load(); });
  }

  _on('hist-prev', 'click', () => { if (page > 1) { page--; load(); } });
  _on('hist-next', 'click', () => { page++; load(); });

  load();
  staggerIn('.stagger-item');
}

function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
