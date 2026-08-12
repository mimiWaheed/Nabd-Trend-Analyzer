/* PATCH /api/notifications/:id/read — mark one notification read (own data only). */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const id = String((req.query && req.query.id) || '');
  if (!id) return fail(res, 400, 'BAD_REQUEST', 'Notification id is required');

  const row = await store.markNotificationRead(id, auth.user.id);
  if (!row) return fail(res, 404, 'NOT_FOUND', 'Notification not found');

  return ok(res, { notification: { id: row.id, read: true } });
};
