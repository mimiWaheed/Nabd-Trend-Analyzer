/* POST /api/auth/verify-email — verify a 6-digit OTP.
   Requirements:
   - hashed OTP stored; timing-safe compare
   - 10 minute expiry
   - single use
   - max 5 attempts, then the code is invalidated
   - never returns or logs the OTP */

const { randomToken } = require('../_lib/crypto');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, failCode, publicUser } = require('../_lib/respond');
const { isEmail } = require('../_lib/validate');
const { verifyOtp } = require('../_lib/crypto');
const sessionLib = require('../_lib/session');
const events = require('../_lib/events');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  const otp = String((body && body.otp) || '').trim();

  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');
  if (!/^\d{6}$/.test(otp)) return fail(res, 422, 'VALIDATION_ERROR', 'OTP must be 6 digits');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  if (!user) return fail(res, 404, 'NOT_FOUND', 'No account found for this email');

  if (user.emailVerified) {
    const session = await sessionLib.createSession(req, user.id, true);
    res.setHeader('Set-Cookie', session.cookie);
    return ok(res, { verified: true, user: publicUser(user), token: session.token });
  }

  const verification = await store.findLatestVerificationByUser(user.id);
  if (!verification) return fail(res, 404, 'NOT_FOUND', 'No verification code was issued');

  if (verification.usedAt) return fail(res, 400, 'OTP_ALREADY_USED', 'This code has already been used');

  if (new Date(verification.expiresAt) < new Date()) {
    return fail(res, 400, 'OTP_EXPIRED', 'This code has expired. Request a new one.');
  }

  if ((verification.attempts || 0) >= (verification.maxAttempts || 5)) {
    return fail(res, 429, 'OTP_TOO_MANY_ATTEMPTS', 'Too many attempts. Request a new code.');
  }

  if (!verifyOtp(otp, email, verification.otpHash)) {
    await store.incrementVerificationAttempts(verification.id);
    const updated = await store.findLatestVerificationByUser(user.id);
    if ((updated.attempts || 0) >= (updated.maxAttempts || 5)) {
      return fail(res, 429, 'OTP_TOO_MANY_ATTEMPTS', 'Too many attempts. Request a new code.');
    }
    return fail(res, 400, 'OTP_INVALID', 'Incorrect code');
  }

  await store.markVerificationUsed(verification.id);
  await store.updateUser(user.id, { emailVerified: true });

  await events.logActivity(user.id, 'EMAIL_VERIFIED', {});
  await events.createNotification(user.id, 'system', 'Email verified', 'Your email address has been verified.');

  const session = await sessionLib.createSession(req, user.id, true);
  res.setHeader('Set-Cookie', session.cookie);
  return ok(res, { verified: true, user: publicUser(Object.assign({}, user, { emailVerified: true })), token: session.token });
};
