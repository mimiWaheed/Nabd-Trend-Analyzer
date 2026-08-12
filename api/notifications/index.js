/* GET /api/notifications — the user's real notifications (newest first). */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  let limit = parseInt(String((req.query && req.query.limit) || '30'), 10);
  if (Number.isNaN(limit) || limit < 1) limit = 30;
  if (limit > 100) limit = 100;

  const [rows, unread] = await Promise.all([
    store.listNotifications(auth.user.id, { limit }),
    store.countUnreadNotifications(auth.user.id)
  ]);

  return ok(res, {
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: !!n.read,
      createdAt: n.createdAt
    })),
    unread
  });
};
