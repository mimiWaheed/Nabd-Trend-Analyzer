/* GET/PATCH /api/users/me/settings — persistent user settings (JSONB). */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok } = require('../_lib/respond');
const events = require('../_lib/events');

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

module.exports = async function handler(req, res) {
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
};
