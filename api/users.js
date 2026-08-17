/* NABD — consolidated users endpoint.
   /api/users                  GET → profile (default action "me")
   /api/users?action=me        GET / PATCH → read / update the profile
   /api/users?action=settings  GET / PATCH → persistent user settings (JSONB)
   /api/users?action=recent-researches  GET → the user's actual recent searches
   Admin actions (require nabd_admin or superadmin):
   /api/users?action=admin-stats     GET → platform-wide statistics
   /api/users?action=admin-list      GET → all users (paginated)
   /api/users?action=admin-view      GET → view a specific user
   /api/users?action=admin-role      POST → change a user's role
   /api/users?action=admin-delete    DELETE → delete a user */

const { requireAuth, requireAdmin, ROLES, isSuperAdmin } = require('../lib/auth');
const storeApi = require('../lib/store');
const { asyncBody, fail, ok, failCode, publicUser, queryOf } = require('../lib/respond');
const { isName, isPhone, cleanPhone } = require('../lib/validate');
const events = require('../lib/events');

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/* GET/PATCH me — read / update the profile. */
async function actionMe(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    const [analyses, searches, exports] = await Promise.all([
      store.countAnalyses(auth.user.id),
      store.countSearches(auth.user.id),
      store.countDownloads(auth.user.id)
    ]);
    return ok(res, {
      user: auth.public,
      usage: { analyses, searches, exports }
    });
  }

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const patch = {};
  if (body.firstName !== undefined) {
    const v = String(body.firstName).trim();
    if (!isName(v)) return fail(res, 422, 'VALIDATION_ERROR', 'First name is invalid');
    patch.firstName = v;
  }
  if (body.lastName !== undefined) {
    const v = String(body.lastName).trim();
    if (!isName(v)) return fail(res, 422, 'VALIDATION_ERROR', 'Last name is invalid');
    patch.lastName = v;
  }
  if (body.phone !== undefined) {
    const v = cleanPhone(body.phone);
    if (v && !isPhone(v)) return fail(res, 422, 'VALIDATION_ERROR', 'Phone is invalid');
    patch.phone = v || null;
  }
  if (body.organization !== undefined) {
    patch.organization = String(body.organization).trim() || null;
  }
  if (body.role !== undefined) {
    /* Only superadmin can change their own role via profile PATCH */
    if (!isSuperAdmin(auth.user)) {
      return fail(res, 403, 'FORBIDDEN', 'Only superadmin can change roles via profile');
    }
    const v = String(body.role).trim();
    if (v.length > 80) return fail(res, 422, 'VALIDATION_ERROR', 'Role is too long');
    patch.role = v || null;
  }
  if (body.country !== undefined) {
    patch.country = String(body.country).trim() || null;
  }
  if (body.lang !== undefined) {
    if (body.lang !== 'ar' && body.lang !== 'en') return fail(res, 422, 'VALIDATION_ERROR', 'Lang must be en or ar');
    patch.lang = body.lang;
  }

  const updated = await store.updateUser(auth.user.id, patch);
  await events.logActivity(auth.user.id, 'PROFILE_UPDATED', { fields: Object.keys(patch) });
  await events.createNotification(auth.user.id, 'system', 'Profile updated', 'Your profile was updated.');

  return ok(res, { user: publicUser(updated) });
}

/* GET/PATCH settings — persistent user settings (JSONB). */
async function actionSettings(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    const s = await store.getSettings(auth.user.id);
    return ok(res, { settings: s && s.data ? s.data : {} });
  }

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const data = body && body.settings !== undefined ? body.settings : body;
  if (!isPlainObject(data)) return fail(res, 422, 'VALIDATION_ERROR', 'Settings must be an object');

  /* whitelist keys to avoid dumping arbitrary payloads */
  const allowed = ['n1', 'n2', 'n3', 'n4', 'n5', 'p1', 'p2', 'p3', 'sec2', 'e1', 'e2', 'e3', 'scope', 'sources', 'lang', 'notify', 'email'];
  const clean = {};
  Object.keys(data).forEach((k) => {
    if (allowed.indexOf(k) !== -1) clean[k] = data[k];
  });

  const existing = await store.getSettings(auth.user.id);
  const merged = Object.assign({}, existing && existing.data ? existing.data : {}, clean);
  await store.setSettings(auth.user.id, merged);
  await events.logActivity(auth.user.id, 'SETTINGS_UPDATED', { fields: Object.keys(clean) });

  return ok(res, { settings: merged });
}

/* GET recent-researches — the user's actual recent searches. */
async function actionRecentResearches(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const rows = await store.listSearches(auth.user.id, { limit: 10, offset: 0 });
  const items = rows.map((s) => ({
    id: s.id,
    query: s.query,
    scope: s.scope,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }));

  return ok(res, { researches: items });
}

/* ---- Admin actions ---- */

const VALID_ADMIN_ROLES = [ROLES.ANALYST, ROLES.ADMIN];

async function actionAdminStats(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const [totalUsers, totalSearches, totalAnalyses, totalDownloads] = await Promise.all([
    store.countAllUsers(),
    store.countAllSearches(),
    store.countAllAnalyses(),
    store.countAllDownloads()
  ]);

  const estimatedRPM = totalAnalyses > 0
    ? Math.round((totalAnalyses / Math.max(1, Math.floor((Date.now() - new Date(auth.user.createdAt).getTime()) / 60000))) * 100) / 100
    : 0;

  return ok(res, {
    stats: {
      totalUsers,
      totalSearches,
      totalAnalyses,
      totalDownloads,
      estimatedRPM
    }
  });
}

async function actionAdminList(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const q = queryOf(req);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 100);
  const offset = Math.max(parseInt(q.offset, 10) || 0, 0);

  const users = await store.listAllUsers({ limit, offset });
  const total = await store.countAllUsers();

  return ok(res, { users, total, limit, offset });
}

async function actionAdminView(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const q = queryOf(req);
  const targetId = String(q.id || '');
  if (!targetId) return fail(res, 422, 'VALIDATION_ERROR', 'User ID is required');

  const target = await store.findUserById(targetId);
  if (!target) return fail(res, 404, 'NOT_FOUND', 'User not found');

  const [analyses, searches, downloads] = await Promise.all([
    store.countAnalyses(targetId),
    store.countSearches(targetId),
    store.countDownloads(targetId)
  ]);

  return ok(res, {
    user: publicUser(target),
    usage: { analyses, searches, downloads }
  });
}

async function actionAdminRole(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const targetId = String((body && body.userId) || '');
  const newRole = String((body && body.role) || '').trim();

  if (!targetId) return fail(res, 422, 'VALIDATION_ERROR', 'userId is required');
  if (VALID_ADMIN_ROLES.indexOf(newRole) === -1) return fail(res, 422, 'VALIDATION_ERROR', 'Role must be analyst or nabd_admin');

  /* Cannot change your own role */
  if (targetId === auth.user.id) return fail(res, 422, 'VALIDATION_ERROR', 'Cannot change your own role');

  /* Only superadmin can promote to nabd_admin */
  if (newRole === ROLES.ADMIN && !isSuperAdmin(auth.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Only superadmin can promote to admin');
  }

  const target = await store.findUserById(targetId);
  if (!target) return fail(res, 404, 'NOT_FOUND', 'User not found');

  /* Cannot change superadmin's role */
  if (target.role === ROLES.SUPERADMIN) return fail(res, 403, 'FORBIDDEN', 'Cannot change superadmin role');

  const updated = await store.updateUser(targetId, { role: newRole });
  await events.logActivity(auth.user.id, 'ROLE_CHANGED', { targetId, newRole, previousRole: target.role || null });
  await events.createNotification(targetId, 'system', 'Role updated', 'Your role has been updated to ' + newRole);

  return ok(res, { user: publicUser(updated) });
}

async function actionAdminDelete(req, res) {
  if (req.method !== 'DELETE') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const q = queryOf(req);
  const targetId = String(q.id || '');
  if (!targetId) return fail(res, 422, 'VALIDATION_ERROR', 'User ID is required');

  /* Cannot delete yourself */
  if (targetId === auth.user.id) return fail(res, 422, 'VALIDATION_ERROR', 'Cannot delete your own account');

  const target = await store.findUserById(targetId);
  if (!target) return fail(res, 404, 'NOT_FOUND', 'User not found');

  /* Cannot delete superadmin */
  if (target.role === ROLES.SUPERADMIN) return fail(res, 403, 'FORBIDDEN', 'Cannot delete superadmin');

  /* Only superadmin can delete nabd_admin */
  if (target.role === ROLES.ADMIN && !isSuperAdmin(auth.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Only superadmin can delete an admin');
  }

  await store.deleteUser(targetId);
  await events.logActivity(auth.user.id, 'USER_DELETED', { targetId, email: target.email });

  return ok(res, { deleted: true });
}

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  const action = String(q.action || 'me');
  switch (action) {
    case 'me': return actionMe(req, res);
    case 'settings': return actionSettings(req, res);
    case 'recent-researches': return actionRecentResearches(req, res);
    case 'admin-stats': return actionAdminStats(req, res);
    case 'admin-list': return actionAdminList(req, res);
    case 'admin-view': return actionAdminView(req, res);
    case 'admin-role': return actionAdminRole(req, res);
    case 'admin-delete': return actionAdminDelete(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown users action: ' + action);
  }
};
