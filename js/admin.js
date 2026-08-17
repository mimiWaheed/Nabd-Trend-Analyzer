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
      filteredUsers = allUsers;
      renderUsers();
      const total = data.total || 0;
      const cnt = $('adminCount');
      if (cnt) cnt.textContent = (currentOffset + 1) + '–' + Math.min(currentOffset + PAGE_SIZE, total) + ' of ' + total;
      const prev = $('adminPrev');
      const next = $('adminNext');
      if (prev) prev.disabled = currentOffset === 0;
      if (next) next.disabled = currentOffset + PAGE_SIZE >= total;
    } catch (e) {}
  }

  function renderUsers() {
    const tbody = $('adminUserBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const L = (typeof I18N !== 'undefined' && I18N[typeof lang !== 'undefined' ? lang : 'en']) || {};
    filteredUsers.forEach((u) => {
      const role = u.role || 'analyst';
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (u.firstName || '') + ' ' + (u.lastName || '') + '</td>'
        + '<td class="mono" style="font-size:.8rem">' + (u.email || '') + '</td>'
        + '<td><span class="role-chip ' + role + '">' + role + '</span></td>'
        + '<td class="mono" style="font-size:.78rem">' + formatDate(u.createdAt) + '</td>'
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
      const L = (typeof I18N !== 'undefined' && I18N[typeof lang !== 'undefined' ? lang : 'en']) || {};
      const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
      set('admName', (u.firstName || '') + ' ' + (u.lastName || ''));
      set('admEmail', u.email || '');
      set('admRole', u.role || 'analyst');
      set('admJoined', formatDate(u.createdAt));
      set('admAnalyses', (usage.analyses || 0).toLocaleString());
      set('admSearches', (usage.searches || 0).toLocaleString());
      set('admDownloads', (usage.downloads || 0).toLocaleString());

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
      search.addEventListener('input', () => {
        const q = search.value.toLowerCase().trim();
        if (!q) { filteredUsers = allUsers; } else {
          filteredUsers = allUsers.filter((u) =>
            ((u.firstName || '') + ' ' + (u.lastName || '') + ' ' + (u.email || '')).toLowerCase().indexOf(q) !== -1
          );
        }
        renderUsers();
      });
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
