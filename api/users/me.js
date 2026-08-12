/* GET /api/users/me + PATCH /api/users/me — read / update the profile. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, failCode, publicUser } = require('../_lib/respond');
const { isName, isPhone, cleanPhone } = require('../_lib/validate');
const events = require('../_lib/events');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    return ok(res, { user: auth.public });
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
};
