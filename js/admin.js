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
    const roleFilter = (($('adminRoleFilter') || {}).value || 'all');
    const dateFilter = (($('adminDateFilter') || {}).value || 'all');
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
      if (sel) sel.value = u.role || 'analyst';

      const actions = $('admActions');
      if (actions) actions.style.display = (u.role === 'superadmin') ? 'none' : 'flex';

      const modal = $('adminModal');
      if (modal) modal.hidden = false;
    } catch (e) {}
  }

  async function changeRole() {
    if (!selectedUserId) return;
    const sel = $('admRoleSelect');
    const newRole = sel ? sel.value : 'analyst';
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

  function init() {
    loadStats();
    loadUsers();

    const search = $('adminSearch');
    if (search) {
      search.addEventListener('input', () => { applyFilters(); });
    }

    const roleFilter = $('adminRoleFilter');
    if (roleFilter) {
      roleFilter.addEventListener('change', () => { applyFilters(); });
    }

    const dateFilter = $('adminDateFilter');
    if (dateFilter) {
      dateFilter.addEventListener('change', () => { applyFilters(); });
    }

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
