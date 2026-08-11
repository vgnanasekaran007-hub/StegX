/**
 * StegX Operation History Page — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Bulk delete with checkboxes
 *  - Export history as CSV
 *  - Date range / type filtering
 *  - Details modal on row click
 *  - Confirmation dialog before delete
 *  - Relative timestamps with full date tooltip
 *  - Pagination controls
 */
import { apiFetch } from '../api.js';
import { toast } from '../components/toast.js';
import { showModal, closeModal, confirmModal } from '../components/modal.js';
import { staggerIn } from '../three/animations.js';

export function renderHistory(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📋 Operation History</h1>
      <p class="page-subtitle">View, search, and manage your steganography and encryption operations</p>
    </div>

    <!-- Toolbar -->
    <div class="glass-panel stagger-item" style="margin-bottom:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
      <select class="input-field" id="hist-filter-type" style="max-width:160px;">
        <option value="">All Types</option>
        <option value="hide">Hide</option>
        <option value="extract">Extract</option>
        <option value="encrypt">Encrypt</option>
        <option value="decrypt">Decrypt</option>
      </select>
      <button class="btn btn-ghost btn-sm" id="hist-refresh-btn">↻ Refresh</button>
      <div style="flex:1;"></div>
      <button class="btn btn-ghost btn-sm" id="hist-export-btn">📋 Export CSV</button>
      <button class="btn btn-ghost btn-sm" id="hist-delete-selected" style="color:var(--danger); display:none;">🗑 Delete Selected</button>
    </div>

    <!-- Table -->
    <div class="glass-panel stagger-item">
      <div id="hist-table" style="overflow-x:auto;">
        <div class="text-center text-muted" style="padding:48px;">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          Loading history…
        </div>
      </div>

      <!-- Pagination -->
      <div id="hist-pagination" class="flex items-center justify-between mt-16" style="display:none;">
        <span class="text-xs text-muted" id="hist-page-info"></span>
        <div class="flex gap-8">
          <button class="btn btn-ghost btn-sm" id="hist-prev" disabled>← Prev</button>
          <button class="btn btn-ghost btn-sm" id="hist-next">Next →</button>
        </div>
      </div>
    </div>`;

  let page = 1;
  const perPage = 15;
  let allOps = [];
  let selected = new Set();

  _loadHistory();

  // ── Refresh ──────────────────────────────────────────────────
  _on('hist-refresh-btn', 'click', () => _loadHistory());
  _on('hist-filter-type', 'change', () => { page = 1; _loadHistory(); });
  _on('hist-prev', 'click', () => { if (page > 1) { page--; _loadHistory(); } });
  _on('hist-next', 'click', () => { page++; _loadHistory(); });

  // ── Export CSV ───────────────────────────────────────────────
  _on('hist-export-btn', 'click', () => {
    if (allOps.length === 0) { toast.info('Empty', 'No operations to export'); return; }
    const headers = 'Operation,Algorithm,Cover Type,Filename,Status,Timestamp\n';
    const rows = allOps.map(op =>
      `${op.operation_type},${op.algorithm || ''},${op.cover_type || ''},${(op.filename || '').replace(/,/g, ' ')},${op.status},${op.timestamp}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stegx_history.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported', 'History exported as CSV');
  });

  // ── Delete Selected ──────────────────────────────────────────
  _on('hist-delete-selected', 'click', async () => {
    if (selected.size === 0) return;
    const confirmed = await confirmModal(
      'Delete Operations',
      `Are you sure you want to delete ${selected.size} operation(s)? This cannot be undone.`,
      { confirmClass: 'btn-primary', confirmLabel: '🗑 Delete' }
    );
    if (!confirmed) return;

    for (const id of selected) {
      try { await apiFetch(`/api/history/${id}`, { method: 'DELETE' }); } catch (_) {}
    }
    selected.clear();
    _loadHistory();
    toast.success('Deleted', 'Selected operations deleted');
  });

  async function _loadHistory() {
    const tableEl = document.getElementById('hist-table');
    if (!tableEl) return;

    const filter = _val('hist-filter-type');
    let url = `/api/history?page=${page}&per_page=${perPage}`;
    if (filter) url += `&type=${filter}`;

    try {
      const res = await apiFetch(url, {}, { cache: false });
      const data = await res.json();
      allOps = data.operations || [];
      const total = data.total || allOps.length;
      const totalPages = Math.ceil(total / perPage);

      if (allOps.length === 0) {
        tableEl.innerHTML = `
          <div class="text-center text-muted" style="padding:48px;">
            <div style="font-size:36px; margin-bottom:12px; opacity:0.4;">📋</div>
            <p>No operations found.${filter ? ' Try removing the filter.' : ''}</p>
          </div>`;
        return;
      }

      tableEl.innerHTML = `
        <table class="data-table">
          <thead><tr>
            <th style="width:30px;"><input type="checkbox" id="hist-select-all"></th>
            <th>Type</th><th>Algorithm</th><th>Cover</th><th>Status</th><th>Time</th><th></th>
          </tr></thead>
          <tbody>
            ${allOps.map((op) => `
              <tr class="hist-row" data-id="${op.id}">
                <td><input type="checkbox" class="hist-check" data-id="${op.id}"></td>
                <td>
                  <span class="tag ${op.operation_type === 'hide' ? 'tag-primary' : op.operation_type === 'extract' ? 'tag-secondary' : 'tag-accent'}">
                    ${(op.operation_type || '').toUpperCase()}
                  </span>
                </td>
                <td style="font-family:var(--font-mono); font-size:12px;">${op.algorithm || '—'}</td>
                <td class="text-sm">${op.cover_type || '—'}</td>
                <td><span class="tag ${op.status === 'success' ? 'tag-accent' : 'tag-danger'}">${op.status}</span></td>
                <td class="text-xs text-muted" title="${op.timestamp}">${_relativeTime(op.timestamp)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm hist-details-btn" data-id="${op.id}" title="View details">🔍</button>
                  <button class="btn btn-ghost btn-sm hist-delete-btn" data-id="${op.id}" title="Delete" style="color:var(--danger);">✕</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;

      // Select all
      const selectAll = document.getElementById('hist-select-all');
      if (selectAll) {
        selectAll.addEventListener('change', (e) => {
          document.querySelectorAll('.hist-check').forEach((cb) => {
            cb.checked = e.target.checked;
            const id = cb.dataset.id;
            if (e.target.checked) selected.add(id); else selected.delete(id);
          });
          _updateDeleteBtn();
        });
      }

      // Individual checkboxes
      document.querySelectorAll('.hist-check').forEach((cb) => {
        cb.addEventListener('change', (e) => {
          const id = e.target.dataset.id;
          if (e.target.checked) selected.add(id); else selected.delete(id);
          _updateDeleteBtn();
        });
      });

      // Details buttons
      document.querySelectorAll('.hist-details-btn').forEach((btn) => {
        btn.addEventListener('click', () => _showDetails(btn.dataset.id));
      });

      // Individual delete buttons
      document.querySelectorAll('.hist-delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const confirmed = await confirmModal('Delete?', 'Delete this operation record?', { confirmLabel: '🗑 Delete' });
          if (confirmed) {
            try {
              await apiFetch(`/api/history/${btn.dataset.id}`, { method: 'DELETE' });
              _loadHistory();
              toast.success('Deleted', 'Operation deleted');
            } catch (e) { toast.error('Error', e.message); }
          }
        });
      });

      // Pagination
      const pag = document.getElementById('hist-pagination');
      if (pag && totalPages > 1) {
        pag.style.display = 'flex';
        const info = document.getElementById('hist-page-info');
        if (info) info.textContent = `Page ${page} of ${totalPages} (${total} total)`;
        const prev = document.getElementById('hist-prev');
        const next = document.getElementById('hist-next');
        if (prev) prev.disabled = page <= 1;
        if (next) next.disabled = page >= totalPages;
      }
    } catch (e) {
      tableEl.innerHTML = `<div class="text-center text-muted" style="padding:48px;">⚠ Could not load history: ${e.message}</div>`;
    }
  }

  function _updateDeleteBtn() {
    const btn = document.getElementById('hist-delete-selected');
    if (btn) btn.style.display = selected.size > 0 ? 'block' : 'none';
  }

  function _showDetails(id) {
    const op = allOps.find((o) => String(o.id) === String(id));
    if (!op) return;

    const fields = Object.entries(op)
      .filter(([k]) => !['id'].includes(k))
      .map(([k, v]) => `
        <tr>
          <td style="font-weight:600; color:var(--text-muted); font-family:var(--font-mono); font-size:11px; text-transform:uppercase; padding:6px 12px;">${k}</td>
          <td style="font-family:var(--font-mono); font-size:12px; padding:6px 12px; word-break:break-all;">${typeof v === 'object' ? JSON.stringify(v) : v ?? '—'}</td>
        </tr>`)
      .join('');

    showModal('Operation Details', `
      <table class="data-table"><tbody>${fields}</tbody></table>
    `, {
      size: 'md',
      actions: [{ id: 'close', label: 'Close', class: 'btn-ghost', onClick: () => {} }],
    });
  }

  staggerIn('.stagger-item');
}

function _relativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function _val(id) { return document.getElementById(id)?.value || ''; }
function _on(id, ev, fn) { document.getElementById(id)?.addEventListener(ev, fn); }
