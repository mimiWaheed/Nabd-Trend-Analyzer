/* NABD — one-time report schedule reminders.
   GET  /api/schedules                  list the user's schedules
   POST /api/schedules                  create { query, dueAt } (future, ISO)
   DELETE /api/schedules?id=…           cancel own schedule
   POST /api/schedules?action=dispatch  send due reminders exactly once.
        Authorized either by the Vercel cron header (system-wide sweep)
        or by a normal session (sweeps only that user's due items — this
        keeps delivery near-exact even without a minute-level cron). */

const { requireAuth } = require('../../lib/auth');
const storeApi = require('../../lib/store');
const { asyncBody, fail, ok, created, queryOf } = require('../../lib/respond');
const { randomToken, nowIso } = require('../../lib/crypto');
const mailer = require('../../lib/mailer');

const MAX_ACTIVE_PER_USER = 20;
const MAX_QUERY_LEN = 300;

function isCron(req) {
  return !!req.headers['x-vercel-cron'];
}

async function sendDue(store, userIdFilter) {
  const due = await store.dueSchedules();
  let sent = 0;
  for (const s of due) {
    if (userIdFilter && s.userId !== userIdFilter) continue;
    /* claim first — guarantees exactly-once even under concurrent calls */
    const claimed = await store.markScheduleSent(s.id);
    if (!claimed) continue;
    try {
      const user = await store.findUserById(s.userId);
      if (!user || !user.email) continue;
      const ar = String(user.lang) === 'ar';
      const escHtml = (h) => String(h).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const subject = ar
        ? 'تقريرك المجدول جاهز — نبض: ' + s.query
        : 'Your scheduled report is ready — NABD: ' + s.query;
      const text = ar
        ? ('مرحبًا،\n\nالوقت اللي حددته لتقريرك عن:\n\n    ' + s.query + '\n\nافتح مركز التقارير في نبض للاطلاع عليه.\n\nفريق نبض')
        : ('Hello,\n\nThe time you set for your report on:\n\n    ' + s.query + '\n\nOpen the Reports Center in NABD to view it.\n\nThe NABD team');
      const html = ar
        ? '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0B1B33">نبض</h2><p>التقرير المجدول عن:</p><p style="font-size:16px;font-weight:600;color:#2563EB">' + escHtml(s.query) + '</p><p style="color:#555">افتح مركز التقارير في نبض للاطلاع عليه.</p></div>'
        : '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0B1B33">NABD</h2><p>Your scheduled report on:</p><p style="font-size:16px;font-weight:600;color:#2563EB">' + escHtml(s.query) + '</p><p style="color:#555">Open the Reports Center in NABD to view it.</p></div>';
      await mailer.sendMail({ to: user.email, subject, text, html });
      sent += 1;
    } catch (e) {
      if (typeof console !== 'undefined') console.log('[nabd-schedules] dispatch failed for ' + s.id + ': ' + (e && e.message));
    }
  }
  return sent;
}

async function actionList(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();
  const rows = await store.listSchedules(auth.user.id, { limit: 50 });
  return ok(res, {
    schedules: rows.map((s) => ({
      id: s.id,
      query: s.query,
      reportRef: s.reportRef || null,
      dueAt: s.dueAt,
      sentAt: s.sentAt || null,
      createdAt: s.createdAt
    }))
  });
}

async function actionCreate(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }
  const query = String((body && body.query) || '').trim().slice(0, MAX_QUERY_LEN);
  if (!query) return fail(res, 422, 'VALIDATION_ERROR', 'query is required');

  const dueRaw = String((body && body.dueAt) || '').trim();
  const dueMs = new Date(dueRaw).getTime();
  if (!dueRaw || Number.isNaN(dueMs)) return fail(res, 422, 'VALIDATION_ERROR', 'dueAt must be a valid date');
  if (dueMs <= Date.now()) return fail(res, 422, 'VALIDATION_ERROR', 'dueAt must be in the future');

  const active = await store.countActiveSchedules(auth.user.id);
  if (active >= MAX_ACTIVE_PER_USER) return fail(res, 429, 'TOO_MANY_SCHEDULES', 'Active schedule limit reached');

  const row = await store.insertSchedule({
    id: randomToken(16),
    userId: auth.user.id,
    query,
    reportRef: body && body.reportRef ? String(body.reportRef).slice(0, 100) : null,
    dueAt: new Date(dueMs).toISOString(),
    createdAt: nowIso()
  });

  return created(res, {
    schedule: {
      id: row.id,
      query: row.query,
      reportRef: row.reportRef || null,
      dueAt: row.dueAt,
      sentAt: row.sentAt || null,
      createdAt: row.createdAt
    }
  });
}

async function actionDelete(req, res, q) {
  if (req.method !== 'DELETE') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const id = String((q && q.id) || '');
  if (!id) return fail(res, 400, 'BAD_REQUEST', 'id is required');

  const removed = await store.deleteSchedule(id, auth.user.id);
  if (!removed) return fail(res, 404, 'NOT_FOUND', 'Schedule not found');
  return ok(res, { deleted: true });
}

async function actionDispatch(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const store = storeApi.makeStore();

  if (isCron(req)) {
    const sent = await sendDue(store, null);
    return ok(res, { dispatched: true, sent });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const sent = await sendDue(store, auth.user.id);
  return ok(res, { dispatched: true, sent });
}

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  const action = String(q.action || '');
  switch (action) {
    case '': {
      if (req.method === 'GET') return actionList(req, res);
      if (req.method === 'POST') return actionCreate(req, res);
      if (req.method === 'DELETE') return actionDelete(req, res, q);
      return fail(res, 405, 'METHOD_NOT_ALLOWED');
    }
    case 'dispatch': return actionDispatch(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown schedules action: ' + action);
  }
};
