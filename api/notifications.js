/* NABD — consolidated notifications endpoint.
   GET  /api/notifications                 list (default)
   POST /api/notifications                 create (default)
   /api/notifications?action=read&id=…     mark one read
   /api/notifications?action=read-all      mark every notification read */

const { requireAuth } = require('../lib/auth');
const storeApi = require('../lib/store');
const { asyncBody, fail, ok, created, queryOf } = require('../lib/respond');
const { randomToken, nowIso } = require('../lib/crypto');
const mailer = require('../lib/mailer');

const TYPES = ['ai', 'trend', 'system', 'reports', 'conn', 'export'];

/* GET list — the user's real notifications (newest first). */
async function actionList(req, res, q) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let limit = parseInt(String((q && q.limit) || '30'), 10);
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
}

/* POST create — record a notification for the current user. */
async function actionCreate(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

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

/* PATCH read — mark one notification read (own data only). */
async function actionRead(req, res, q) {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const id = String((q && q.id) || '');
  if (!id) return fail(res, 400, 'BAD_REQUEST', 'Notification id is required');

  const row = await store.markNotificationRead(id, auth.user.id);
  if (!row) return fail(res, 404, 'NOT_FOUND', 'Notification not found');

  return ok(res, { notification: { id: row.id, read: true } });
}

/* PATCH read-all — mark every notification read. */
async function actionReadAll(req, res) {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  await store.markAllNotificationsRead(auth.user.id);
  return ok(res, { updated: true });
}

/* POST send-reminder — email the user a nudge for a query (set via the
   dashboard reminder picker; the due alert is already in local storage). */
async function actionSendReminder(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }
  const query = String((body && body.query) || '').trim().slice(0, 300);
  if (!query) return fail(res, 422, 'VALIDATION_ERROR', 'query is required');

  const email = auth.user.email || String((body && body.email) || '').trim();
  if (!email) return fail(res, 422, 'VALIDATION_ERROR', 'email is required');

  const ar = String(auth.user.lang) === 'ar';
  const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const subject = ar ? 'تذكير — نبض: ' + query : 'NABD reminder — ' + query;
  const text = ar
    ? ('مرحبًا،\n\nهذا تذكيرك من نبض للمتابعة على:\n\n    ' + query + '\n\nافتح لوحة التحكم لاستكمال التحليل.\n\nفريق نبض')
    : ('Hello,\n\nThis is your NABD reminder to check on:\n\n    ' + query + '\n\nOpen the dashboard to continue the analysis.\n\nThe NABD team');
  const html = ar
    ? '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0B1B33">نبض</h2><p>تذكيرك من نبض:</p><p style="font-size:16px;font-weight:600;color:#2563EB">' + escHtml(query) + '</p><p style="color:#555">افتح لوحة التحكم لاستكمال التحليل.</p></div>'
    : '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0B1B33">NABD</h2><p>Your NABD reminder:</p><p style="font-size:16px;font-weight:600;color:#2563EB">' + escHtml(query) + '</p><p style="color:#555">Open the dashboard to continue the analysis.</p></div>';

  let emailStatus = 'pending';
  try {
    const out = await mailer.sendMail({ to: email, subject, text, html });
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
    if (typeof console !== 'undefined') console.log('[nabd-mail] reminder email to ' + email + ' failed: ' + (e && e.message));
  }

  return ok(res, { sent: true, emailStatus });
}

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  let action = String(q.action || '');
  if (!action) action = req.method === 'POST' ? 'create' : (req.method === 'GET' ? 'list' : '');
  switch (action) {
    case 'list': return actionList(req, res, q);
    case 'create': return actionCreate(req, res);
    case 'read': return actionRead(req, res, q);
    case 'read-all': return actionReadAll(req, res);
    case 'send-reminder': return actionSendReminder(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown notifications action: ' + (action || '(none)'));
  }
};
