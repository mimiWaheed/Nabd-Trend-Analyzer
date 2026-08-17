/* NABD — admin page logic.
   Fetches platform stats + user list from /api/users?action=admin-* */

(function () {
  const page = document.body && document.body.dataset && document.body.dataset.page;
  if (page !== 'admin') return;

  const $ = (id) => document.getElementById(id);

  let currentOffset = 0;
  const PAGE_SIZE = 25;
  let allUsers = [];
  let filteredUsers = [];
  let selectedUserId = null;

  function formatDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return '—'; }
  }

  function toast(msg) {
    try { document.dispatchEvent(new CustomEvent('nabd-toast', { detail: { msg: msg } })); } catch (e) {}
  }

  function getInitials(first, last) {
    return ((first || '')[0] || '') + ((last || '')[0] || '');
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/users?action=admin-stats', { headers: { Accept: 'application/json' }, credentials: 'include' });
      const data = await res.json();
      if (!data.ok) return;
      const s = data.stats;
      const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
      set('adminStatUsers', s.totalUsers.toLocaleString());
      set('adminStatReports', s.totalSearches.toLocaleString());
      set('adminStatExports', s.totalDownloads.toLocaleString());
      set('adminStatRPM', s.estimatedRPM.toLocaleString());
      var totalAnalysesEl = $('adminStatAnalyses');
      if (totalAnalysesEl) totalAnalysesEl.textContent = (s.totalAnalyses || 0).toLocaleString();
    } catch (e) {}
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users?action=admin-list&limit=' + PAGE_SIZE + '&offset=' + currentOffset, {
        headers: { Accept: 'application/json' }, credentials: 'include'
      });
      const data = await res.json();
      if (!data.ok) return;
      allUsers = data.users || [];
      applyFilters();
      const total = data.total || 0;
      const cnt = $('adminCount');
      if (cnt) cnt.textContent = (currentOffset + 1) + '–' + Math.min(currentOffset + PAGE_SIZE, total) + ' of ' + total;
      const prev = $('adminPrev');
      const next = $('adminNext');
      if (prev) prev.disabled = currentOffset === 0;
      if (next) next.disabled = currentOffset + PAGE_SIZE >= total;
    } catch (e) {}
  }

  function applyFilters() {
    const q = (($('adminSearch') || {}).value || '').toLowerCase().trim();
    const roleFilterEl = $('adminRoleFilter');
    const dateFilterEl = $('adminDateFilter');
    const roleFilter = roleFilterEl ? roleFilterEl.dataset.value : 'all';
    const dateFilter = dateFilterEl ? dateFilterEl.dataset.value : 'all';
    const now = Date.now();

    filteredUsers = allUsers.filter((u) => {
      if (q) {
        const name = ((u.firstName || '') + ' ' + (u.lastName || '') + ' ' + (u.email || '')).toLowerCase();
        if (name.indexOf(q) === -1) return false;
      }
      if (roleFilter !== 'all') {
        const role = u.role || 'analyst';
        if (role !== roleFilter) return false;
      }
      if (dateFilter !== 'all' && u.createdAt) {
        const created = new Date(u.createdAt).getTime();
        if (dateFilter === 'today') {
          const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
          if (created < startOfDay.getTime()) return false;
        } else if (dateFilter === 'week') {
          if (created < now - 7 * 86400000) return false;
        } else if (dateFilter === 'month') {
          if (created < now - 30 * 86400000) return false;
        }
      }
      return true;
    });

    renderUsers();
  }

  function renderUsers() {
    const tbody = $('adminUserBody');
    const empty = $('adminEmpty');
    const tableWrap = tbody && tbody.closest('.admin-table-wrap');
    if (!tbody) return;
    tbody.innerHTML = '';
    const L = (typeof I18N !== 'undefined' && I18N[typeof lang !== 'undefined' ? lang : 'en']) || {};

    if (filteredUsers.length === 0) {
      if (empty) empty.hidden = false;
      if (tableWrap) tableWrap.querySelector('table').style.display = 'none';
    } else {
      if (empty) empty.hidden = true;
      if (tableWrap) tableWrap.querySelector('table').style.display = '';
    }

    filteredUsers.forEach((u) => {
      const role = u.role || 'analyst';
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="admin-user-name">' + (u.firstName || '') + ' ' + (u.lastName || '') + '</td>'
        + '<td class="admin-user-email">' + (u.email || '') + '</td>'
        + '<td><span class="role-chip ' + role + '">' + role + '</span></td>'
        + '<td style="font-size:.82rem;color:var(--text-muted)">' + formatDate(u.createdAt) + '</td>'
        + '<td>'
        + '<button class="btn btn-ghost btn-sm admin-view-btn" data-uid="' + u.id + '">' + (L['admin.action.view'] || 'View') + '</button>'
        + '</td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.admin-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => viewUser(btn.dataset.uid));
    });
  }

  async function viewUser(uid) {
    selectedUserId = uid;
    try {
      const res = await fetch('/api/users?action=admin-view&id=' + encodeURIComponent(uid), {
        headers: { Accept: 'application/json' }, credentials: 'include'
      });
      const data = await res.json();
      if (!data.ok) return;
      const u = data.user;
      const usage = data.usage || {};
      const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
      set('admName', (u.firstName || '') + ' ' + (u.lastName || ''));
      set('admEmail', u.email || '');
      set('admRole', (u.role || 'analyst').replace('_', ' '));
      set('admJoined', formatDate(u.createdAt));
      set('admAnalyses', (usage.analyses || 0).toLocaleString());
      set('admSearches', (usage.searches || 0).toLocaleString());
      set('admDownloads', (usage.downloads || 0).toLocaleString());

      const avatar = $('admAvatar');
      if (avatar) avatar.textContent = getInitials(u.firstName, u.lastName);

      const modalEmail = $('admModalEmail');
      if (modalEmail) modalEmail.textContent = u.email || '';

      const roleBadge = $('admRole');
      if (roleBadge) {
        const r = u.role || 'analyst';
        roleBadge.innerHTML = '<span class="role-chip ' + r + '">' + r + '</span>';
      }

      const sel = $('admRoleSelect');
      if (sel) {
        const r = u.role || 'analyst';
        sel.dataset.value = r;
        const label = sel.querySelector('.admin-dropdown-label');
        if (label) label.textContent = r;
        sel.querySelectorAll('.admin-dropdown-item').forEach((i) => {
          i.classList.toggle('active', i.dataset.value === r);
        });
      }

      const actions = $('admActions');
      if (actions) actions.style.display = (u.role === 'superadmin') ? 'none' : 'flex';

      const modal = $('adminModal');
      if (modal) modal.hidden = false;
    } catch (e) {}
  }

  async function changeRole() {
    if (!selectedUserId) return;
    const sel = $('admRoleSelect');
    const newRole = sel ? sel.dataset.value : 'analyst';
    try {
      const res = await fetch('/api/users?action=admin-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: selectedUserId, role: newRole })
      });
      const data = await res.json();
      if (data.ok) {
        toast('Role updated');
        const modal = $('adminModal');
        if (modal) modal.hidden = true;
        loadUsers();
      } else {
        toast(data.message || data.error || 'Failed');
      }
    } catch (e) { toast('Network error'); }
  }

  async function deleteUser() {
    if (!selectedUserId) return;
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch('/api/users?action=admin-delete&id=' + encodeURIComponent(selectedUserId), {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
        toast('User deleted');
        const modal = $('adminModal');
        if (modal) modal.hidden = true;
        loadUsers();
        loadStats();
      } else {
        toast(data.message || data.error || 'Failed');
      }
    } catch (e) { toast('Network error'); }
  }

  function initDropdown(el) {
    if (!el) return;
    const btn = el.querySelector('.admin-dropdown-btn');
    const panel = el.querySelector('.admin-dropdown-panel');
    const label = el.querySelector('.admin-dropdown-label');
    const items = panel ? panel.querySelectorAll('.admin-dropdown-item') : [];

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.admin-dropdown.open').forEach((d) => { if (d !== el) d.classList.remove('open'); });
        el.classList.toggle('open');
      });
    }

    items.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        el.dataset.value = item.dataset.value;
        if (label) label.textContent = item.textContent;
        items.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        el.classList.remove('open');
        applyFilters();
      });
    });
  }

  function init() {
    loadStats();
    loadUsers();

    const search = $('adminSearch');
    if (search) {
      search.addEventListener('input', () => { applyFilters(); });
    }

    initDropdown($('adminRoleFilter'));
    initDropdown($('adminDateFilter'));
    initDropdown($('admRoleSelect'));

    document.addEventListener('click', () => {
      document.querySelectorAll('.admin-dropdown.open').forEach((d) => d.classList.remove('open'));
    });

    const prev = $('adminPrev');
    const next = $('adminNext');
    if (prev) prev.addEventListener('click', () => { currentOffset = Math.max(0, currentOffset - PAGE_SIZE); loadUsers(); });
    if (next) next.addEventListener('click', () => { currentOffset += PAGE_SIZE; loadUsers(); });

    const close = $('adminModalClose');
    if (close) close.addEventListener('click', () => { $('adminModal').hidden = true; });
    const overlay = $('adminModal');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });

    const roleBtn = $('admRoleBtn');
    if (roleBtn) roleBtn.addEventListener('click', changeRole);

    const deleteBtn = $('admDeleteBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteUser);

    initConnectionsInline();
  }

  /* ── Embedded connections logic (moved from app.js) ── */
  function initConnectionsInline() {
    const cards = document.querySelectorAll('.conn-card');
    if (!cards.length) return;

    const state = { fb: 'off', rss: 'on', gnews: 'off', gtrends: 'off', newsapi: 'off', ig: 'soon', sp: 'soon', gq: 'soon' };

    function paint() {
      cards.forEach((c) => {
        const id = c.dataset.conn;
        const s = state[id];
        if (!s) return;
        c.classList.toggle('off', s === 'off');
        const chip = c.querySelector('.conn-chip');
        if (chip) {
          if (s === 'on') chip.innerHTML = '<span class="d"></span>' + L('conn.status.ok');
          else if (s === 'soon') chip.innerHTML = '<span class="d"></span>' + L('conn.status.soon');
          else chip.innerHTML = '<span class="d"></span>' + L('conn.status.off');
        }
        const ls = c.querySelector('.cm-last');
        if (ls) ls.textContent = s === 'on' ? 'now' : '—';
        const tools = c.querySelector('.conn-tools');
        if (tools) {
          tools.innerHTML = s === 'soon'
            ? '<span class="status-chip neu"><span class="d"></span>' + L('app.soon') + '</span>'
            : s === 'on'
              ? '<button class="btn btn-ghost btn-sm" data-ca="dis">' + L('conn.disconnect') + '</button><button class="btn btn-ghost btn-sm" data-ca="rec">' + L('conn.reconnect') + '</button>'
              : '<button class="btn btn-primary btn-sm" data-ca="con">' + L('conn.connect') + '</button>';
        }
      });
    }

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ca]');
      if (!b) return;
      const card = b.closest('.conn-card');
      const id = card && card.dataset.conn;
      if (!id || !(id in state)) return;
      if (b.dataset.ca === 'dis') state[id] = 'off';
      else if (b.dataset.ca === 'rec') state[id] = 'on';
      else state[id] = 'on';
      paint();
      toast('Connection updated');
    });

    paint();

    /* n8n resources */
    const N8N_KEY = 'nabd-n8n';
    const n8nList = $('n8nList');
    const n8nForm = $('n8nForm');
    const n8nName = $('n8nName');
    const n8nKey = $('n8nKey');
    const n8nRead = () => { try { return JSON.parse(localStorage.getItem(N8N_KEY) || '[]'); } catch (e) { return []; } };
    const n8nWrite = (list) => { try { localStorage.setItem(N8N_KEY, JSON.stringify(list)); } catch (e) {} };
    function renderN8n() {
      if (!n8nList) return;
      const list = n8nRead();
      if (!list.length) { n8nList.innerHTML = ''; return; }
      n8nList.innerHTML = list.map((it, i) =>
        '<div class="app-row key-row">'
        + '<span class="key-prefix" style="background:linear-gradient(135deg,#EA4B71,#7A5CFF)">n8n</span>'
        + '<div class="grow"><div class="row-title">' + esc(it.name || 'n8n') + '</div>'
        + '<div class="row-sub mono">••••••••' + esc(String(it.key || '').slice(-4)) + '</div></div>'
        + '<div class="key-actions"><button class="btn btn-ghost btn-sm" data-n8n="del" data-idx="' + i + '">Remove</button></div>'
        + '</div>'
      ).join('');
    }
    renderN8n();
    const n8nAdd = $('n8nAdd');
    if (n8nAdd) n8nAdd.addEventListener('click', () => { if (n8nForm) n8nForm.hidden = false; if (n8nName) n8nName.focus(); });
    const n8nCancel = $('n8nCancel');
    if (n8nCancel) n8nCancel.addEventListener('click', () => { if (n8nForm) n8nForm.hidden = true; });
    const n8nSave = $('n8nSave');
    if (n8nSave) n8nSave.addEventListener('click', () => {
      const name = n8nName ? n8nName.value.trim() : '';
      const key = n8nKey ? n8nKey.value.trim() : '';
      if (!key) { if (n8nKey) n8nKey.focus(); return; }
      const list = n8nRead();
      list.unshift({ id: 'n' + Date.now().toString(36), name: name || 'n8n', key: key, addedAt: Date.now() });
      n8nWrite(list);
      if (n8nForm) n8nForm.hidden = true;
      if (n8nName) n8nName.value = '';
      if (n8nKey) n8nKey.value = '';
      renderN8n();
      toast('API saved');
    });
    document.addEventListener('click', (e) => {
      const d = e.target.closest('[data-n8n="del"]');
      if (!d) return;
      const list = n8nRead();
      const ix = d.dataset.idx != null ? Number(d.dataset.idx) : -1;
      if (ix >= 0) list.splice(ix, 1);
      n8nWrite(list);
      renderN8n();
      toast('API removed');
    });
  }

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  function L(key) {
    const l = localStorage.getItem('nabd-lang') || 'en';
    try {
      const m = (typeof I18N !== 'undefined' && I18N[l]) || {};
      return m[key] || key;
    } catch (e) { return key; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
