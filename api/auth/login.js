/* POST /api/auth/login — authenticate with email + password.
   DB-backed rate limiting: max 10 failed attempts per email+IP per 15 min. */

const { randomToken, nowIso } = require('../_lib/crypto');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, failCode, publicUser } = require('../_lib/respond');
const { isEmail } = require('../_lib/validate');
const { verifyPassword } = require('../_lib/crypto');
const sessionLib = require('../_lib/session');
const events = require('../_lib/events');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

function clientIp(req) {
  const h = req.headers && req.headers['x-forwarded-for'];
  return h ? String(h).split(',')[0].trim() : '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');
  const remember = !!(body && body.remember);
  const ip = clientIp(req);

  if (!isEmail(email) || !password) return fail(res, 422, 'VALIDATION_ERROR', 'Email and password are required');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const failed = await store.countRecentFailed(email, ip, new Date(Date.now() - WINDOW_MS).toISOString());
  if (failed >= MAX_FAILURES) {
    return failCode(res, 'RATE_LIMITED', 'Too many failed attempts. Try again later.');
  }

  const user = await store.findUserByEmail(email);
  const okPass = user ? verifyPassword(password, user.passwordHash) : false;
  if (!user || !okPass) {
    await store.recordLoginAttempt({
      id: randomToken(16), email, ip, success: false, createdAt: nowIso()
    });
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  if (!user.emailVerified) {
    return failCode(res, 'EMAIL_NOT_VERIFIED', 'Please verify your email before signing in.');
  }

  await store.recordLoginAttempt({
    id: randomToken(16), email, ip, success: true, createdAt: nowIso()
  });

  const session = await sessionLib.createSession(req, user.id, remember);
  await store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

  await events.logActivity(user.id, 'USER_LOGGED_IN', {});
  await events.createNotification(user.id, 'system', 'Signed in', 'You signed in successfully.');

  res.setHeader('Set-Cookie', session.cookie);
  return ok(res, { user: publicUser(Object.assign({}, user, { emailVerified: user.emailVerified, lastLoginAt: new Date().toISOString() })), token: session.token });
};
