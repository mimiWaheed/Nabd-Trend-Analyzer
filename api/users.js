/* NABD — consolidated users endpoint.
   /api/users                  GET → profile (default action "me")
   /api/users?action=me        GET / PATCH → read / update the profile
   /api/users?action=settings  GET / PATCH → persistent user settings (JSONB)
   /api/users?action=recent-researches  GET → the user's actual recent searches */

const { requireAuth } = require('../lib/auth');
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

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  const action = String(q.action || 'me');
  switch (action) {
    case 'me': return actionMe(req, res);
    case 'settings': return actionSettings(req, res);
    case 'recent-researches': return actionRecentResearches(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown users action: ' + action);
  }
};
