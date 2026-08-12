/* PATCH /api/notifications/read-all — mark every notification read. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  await store.markAllNotificationsRead(auth.user.id);
  return ok(res, { updated: true });
};
