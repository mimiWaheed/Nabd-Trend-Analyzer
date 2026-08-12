/* POST /api/auth/resend-verification — resend the OTP email with a 60s cooldown. */

const { randomToken } = require('../_lib/crypto');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, failCode } = require('../_lib/respond');
const { isEmail } = require('../_lib/validate');
const { hashOtp, generateOtp, OTP_TTL_MS } = require('../_lib/crypto');
const mailer = require('../_lib/mailer');
const events = require('../_lib/events');

const RESEND_COOLDOWN_MS = 60 * 1000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  if (!user) return fail(res, 404, 'NOT_FOUND', 'No account found for this email');
  if (user.emailVerified) return fail(res, 409, 'ALREADY_VERIFIED', 'This email is already verified');

  let verification = await store.findLatestVerificationByUser(user.id);
  if (verification && verification.resendAt && new Date(verification.resendAt) > new Date()) {
    return failCode(res, 'RATE_LIMITED', 'Please wait before requesting a new code.');
  }

  const otp = generateOtp();
  const patch = {
    otpHash: hashOtp(otp, email),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
    userId: user.id
  };

  if (verification) {
    await store.replaceVerification(verification.id, patch);
  } else {
    await store.createVerification({
      id: randomToken(16),
      userId: user.id,
      otpHash: patch.otpHash,
      expiresAt: patch.expiresAt,
      resendAt: patch.resendAt,
      attempts: 0,
      maxAttempts: 5,
      usedAt: null,
      createdAt: new Date().toISOString()
    });
  }

  let emailStatus = 'pending';
  try {
    const out = await mailer.sendOtpEmail(email, otp, user.lang || 'en');
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
  }

  await events.logActivity(user.id, 'EMAIL_VERIFICATION_RESENT', {});

  return ok(res, { emailStatus, resendAfterSeconds: RESEND_COOLDOWN_MS / 1000 });
};
