/* POST /api/auth/logout — destroy the current session and clear the cookie. */

const sessionLib = require('../_lib/session');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const store = storeApi.makeStore();
  const session = await sessionLib.resolveSession(req);
  if (session) {
    await store.deleteSessionByTokenHash(session.tokenHash);
    await events_activity(session.userId);
  }
  sessionLib.clearCookie(req, res);
  return ok(res, {});
};

async function events_activity(userId) {
  try {
    const events = require('../_lib/events');
    await events.logActivity(userId, 'USER_LOGGED_OUT', {});
  } catch (e) {}
}
