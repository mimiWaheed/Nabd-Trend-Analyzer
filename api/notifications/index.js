/* GET /api/notifications — the user's real notifications (newest first).
   POST /api/notifications — record a notification for the current user. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, created } = require('../_lib/respond');
const { randomToken, nowIso } = require('../_lib/crypto');

const TYPES = ['ai', 'trend', 'system', 'reports', 'conn', 'export'];

module.exports = async function handler(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'POST') {
    let body;
    try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }
    const title = String((body && body.title) || '').trim().slice(0, 300);
    if (!title) return fail(res, 422, 'VALIDATION_ERROR', 'Notification title is required');
    const type = TYPES.indexOf(String((body && body.type) || 'system').toLowerCase()) !== -1
      ? String(body.type).toLowerCase()
      : 'system';
    const message = body && body.message != null ? String(body.message).slice(0, 2000) : null;

    const row = await store.insertNotification({
      id: randomToken(16),
      userId: auth.user.id,
      type,
      title,
      message,
      read: false,
      createdAt: nowIso()
    });
    return created(res, {
      notification: {
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        read: !!row.read,
        createdAt: row.createdAt
      }
    });
  }

  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');

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
