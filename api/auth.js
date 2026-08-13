/* NABD — consolidated auth endpoint.
   /api/auth?action=login|signup|me|logout|verify-email|resend-verification
   Single Vercel function for all auth routes so the project stays within the
   Hobby plan's 12-function deployment limit. */

const { randomToken, nowIso, verifyPassword, hashPassword, verifyOtp, hashOtp, generateOtp, OTP_TTL_MS } = require('../lib/crypto');
const storeApi = require('../lib/store');
const { asyncBody, fail, ok, failCode, created, publicUser, queryOf } = require('../lib/respond');
const { isEmail, isName, isPassword, isPhone, cleanPhone } = require('../lib/validate');
const sessionLib = require('../lib/session');
const events = require('../lib/events');
const mailer = require('../lib/mailer');
const { requireAuth } = require('../lib/auth');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const RESEND_COOLDOWN_MS = 60 * 1000;

function clientIp(req) {
  const h = req.headers && req.headers['x-forwarded-for'];
  return h ? String(h).split(',')[0].trim() : '';
}

/* POST login — authenticate with email + password.
   DB-backed rate limiting: max 10 failed attempts per email+IP per 15 min. */
async function actionLogin(req, res) {
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
}

/* POST signup — create an UNVERIFIED account and email a one-time OTP.
   No session is established here: the account must pass email verification
   (actionVerifyEmail) before it can sign in, matching the OTP flow already
   used by actionResendVerification. */
async function actionSignup(req, res) {
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

  /* Generate, persist and email a 6-digit OTP for email verification,
     mirroring actionResendVerification exactly. The user stays unverified
     and gets no session until the OTP is confirmed. */
  const otp = generateOtp();
  await store.createVerification({
    id: randomToken(16),
    userId: user.id,
    otpHash: hashOtp(otp, email),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
    attempts: 0,
    maxAttempts: 5,
    usedAt: null,
    createdAt: new Date().toISOString()
  });

  let emailStatus = 'pending';
  try {
    const out = await mailer.sendOtpEmail(email, otp, user.lang || 'en');
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
  }

  await events.logActivity(user.id, 'USER_REGISTERED', { email });

  return created(res, {
    user: {
      id: user.id, firstName, lastName, email,
      emailVerified: false, phone: user.phone, organization: user.organization,
      country: user.country, lang, createdAt: user.createdAt
    },
    emailStatus,
    verified: false
  });
}

/* GET me — current session user. */
async function actionMe(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  return ok(res, { user: auth.public });
}

/* POST logout — destroy the current session and clear the cookie. */
async function actionLogout(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const store = storeApi.makeStore();
  const session = await sessionLib.resolveSession(req);
  if (session) {
    await store.deleteSessionByTokenHash(session.tokenHash);
    try {
      await events.logActivity(session.userId, 'USER_LOGGED_OUT', {});
    } catch (e) {}
  }
  sessionLib.clearCookie(req, res);
  return ok(res, {});
}

/* POST verify-email — verify a 6-digit OTP.
   Requirements:
   - hashed OTP stored; timing-safe compare
   - 10 minute expiry
   - single use
   - max 5 attempts, then the code is invalidated
   - never returns or logs the OTP */
async function actionVerifyEmail(req, res) {
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
}

/* POST resend-verification — resend the OTP email with a 60s cooldown. */
async function actionResendVerification(req, res) {
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
}

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  const action = String(q.action || '');
  switch (action) {
    case 'login': return actionLogin(req, res);
    case 'signup': return actionSignup(req, res);
    case 'me': return actionMe(req, res);
    case 'logout': return actionLogout(req, res);
    case 'verify-email': return actionVerifyEmail(req, res);
    case 'resend-verification': return actionResendVerification(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown auth action: ' + (action || '(none)'));
  }
};
