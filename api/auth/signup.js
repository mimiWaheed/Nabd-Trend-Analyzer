/* POST /api/auth/signup — create an unverified account + email OTP. */

const { randomToken, OTP_TTL_MS } = require('../_lib/crypto');
const storeApi = require('../_lib/store');
const { nowIso } = storeApi;
const { asyncBody, fail, created, failCode } = require('../_lib/respond');
const { isEmail, isName, isPassword, isPhone, cleanPhone } = require('../_lib/validate');
const { hashPassword, hashOtp, generateOtp } = require('../_lib/crypto');
const sessionLib = require('../_lib/session');
const mailer = require('../_lib/mailer');
const events = require('../_lib/events');

const RESEND_COOLDOWN_MS = 60 * 1000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const firstName = String((body && body.firstName) || '').trim();
  const lastName = String((body && body.lastName) || '').trim();
  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');
  const phone = body && body.phone != null ? cleanPhone(body.phone) : '';
  const organization = String((body && body.organization) || '').trim();
  const country = String((body && body.country) || '').trim();
  const lang = body && (body.lang === 'ar' || body.lang === 'en') ? body.lang : 'en';

  if (!isName(firstName)) return fail(res, 422, 'VALIDATION_ERROR', 'First name is invalid');
  if (!isName(lastName)) return fail(res, 422, 'VALIDATION_ERROR', 'Last name is invalid');
  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');
  if (!isPassword(password)) return fail(res, 422, 'VALIDATION_ERROR', 'Password must be at least 8 characters');
  if (phone && !isPhone(phone)) return fail(res, 422, 'VALIDATION_ERROR', 'Phone is invalid');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const existing = await store.findUserByEmail(email);
  if (existing) return fail(res, 409, 'EMAIL_IN_USE', 'An account with this email already exists');

  const user = {
    id: randomToken(16),
    firstName,
    lastName,
    email,
    passwordHash: hashPassword(password),
    emailVerified: false,
    phone: phone || null,
    organization: organization || null,
    country: country || null,
    lang,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastLoginAt: null
  };
  await store.createUser(user);

  /* OTP for email verification */
  const otp = generateOtp();
  const verification = {
    id: randomToken(16),
    userId: user.id,
    otpHash: hashOtp(otp, email),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
    attempts: 0,
    maxAttempts: 5,
    usedAt: null,
    createdAt: nowIso()
  };
  await store.createVerification(verification);

  let emailStatus = 'pending';
  try {
    const out = await mailer.sendOtpEmail(email, otp, lang);
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
  }

  const session = await sessionLib.createSession(req, user.id, true);

  await events.logActivity(user.id, 'USER_REGISTERED', { email });
  await events.logActivity(user.id, 'EMAIL_VERIFICATION_SENT', {});

  res.setHeader('Set-Cookie', session.cookie);
  return created(res, {
    user: {
      id: user.id, firstName, lastName, email,
      emailVerified: false, phone: user.phone, organization: user.organization,
      country: user.country, lang, createdAt: user.createdAt
    },
    token: session.token,
    emailStatus,
    verified: false
  });
};

module.exports.testable = { RESEND_COOLDOWN_MS };
