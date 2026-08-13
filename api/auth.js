/* NABD — consolidated auth endpoint.
   /api/auth?action=login|signup|me|logout|verify-email|resend-verification|
                   forgot-password|verify-reset-otp|reset-password|login-otp|
                   login-otp-verify
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

/* Read-only OTP guard shared by every OTP flow. Returns a failure object when
   the record is missing, already used, expired, or exhausted; null otherwise.
   Callers increment the per-record attempt counter on an OTP mismatch. */
function otpFailure(rec) {
  if (!rec) return { status: 404, code: 'NOT_FOUND', message: 'No verification code was issued' };
  if (rec.usedAt) return { status: 400, code: 'OTP_ALREADY_USED', message: 'This code has already been used' };
  if (new Date(rec.expiresAt) < new Date()) {
    return { status: 400, code: 'OTP_EXPIRED', message: 'This code has expired. Request a new one.' };
  }
  if ((rec.attempts || 0) >= (rec.maxAttempts || 5)) {
    return { status: 429, code: 'OTP_TOO_MANY_ATTEMPTS', message: 'Too many attempts. Request a new code.' };
  }
  return null;
}

/* Verify a reset OTP against the user's latest reset record WITHOUT consuming
   it. Shares the attempt counter with reset-password, so brute-forcing either
   endpoint exhausts the same budget. Returns { ok:true, reset } on success or
   { ok:false, fail:{status,code,message} }. */
async function verifyResetOtpRecord(store, user, email, otp) {
  const reset = await store.findLatestPasswordResetByUser(user.id);
  const failRec = otpFailure(reset);
  if (failRec) return { ok: false, fail: failRec };

  if (!verifyOtp(otp, email, reset.otpHash)) {
    await store.incrementPasswordResetAttempts(reset.id);
    const updated = await store.findLatestPasswordResetByUser(user.id);
    if (updated && (updated.attempts || 0) >= (updated.maxAttempts || 5)) {
      return { ok: false, fail: { status: 429, code: 'OTP_TOO_MANY_ATTEMPTS', message: 'Too many attempts. Request a new code.' } };
    }
    return { ok: false, fail: { status: 400, code: 'OTP_INVALID', message: 'Incorrect code' } };
  }

  return { ok: true, reset };
}

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

/* POST signup — store ONLY a pending registration and email a one-time OTP.
   A real `users` row is NOT created here: it is created only after the OTP is
   successfully verified (actionVerifyEmail). Pending data lives in the
   `pending_signups` table (hashed password + hashed OTP) and is deleted on
   successful verification. */
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

  /* A pending signup with the same email is refreshed, not duplicated. The
     resend cooldown applies so a second submit cannot flood the inbox. */
  const stale = await store.findPendingSignupByEmail(email);
  if (stale && stale.resendAt && new Date(stale.resendAt) > new Date()) {
    return failCode(res, 'RATE_LIMITED', 'Please wait before requesting a new code.');
  }
  if (stale) await store.deletePendingSignup(stale.id);

  const otp = generateOtp();
  await store.createPendingSignup({
    id: randomToken(16),
    email,
    firstName,
    lastName,
    passwordHash: hashPassword(password),
    phone: phone || null,
    organization: organization || null,
    country: country || null,
    lang,
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
    const out = await mailer.sendOtpEmail(email, otp, lang);
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
  }

  return created(res, {
    pending: { email, firstName, lastName, lang },
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
   Handles two cases:
   - Pending signup (no `users` row yet): on success a real user is created
     from the stored pending data, the pending row is deleted, and an
     authenticated session is established.
   - Legacy UNVERIFIED account (created before signup was deferred): the
     existing email_verifications record is used to mark the account verified.
   Shared guarantees: hashed OTP at rest, timing-safe compare, 10-minute
   expiry, single use, max 5 attempts, never returns/logs the OTP. */
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
  const pending = await store.findPendingSignupByEmail(email);

  if (user && user.emailVerified) {
    const session = await sessionLib.createSession(req, user.id, true);
    res.setHeader('Set-Cookie', session.cookie);
    return ok(res, { verified: true, user: publicUser(user), token: session.token });
  }

  /* Legacy unverified account (no pending signup) — verify via its
     email_verifications record. A stale pending row (should not normally
     coexist) is cleaned up. */
  if (user && !pending) {
    const verification = await store.findLatestVerificationByUser(user.id);
    const failRec = otpFailure(verification);
    if (failRec) return fail(res, failRec.status, failRec.code, failRec.message);

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

  /* Pending signup — create the real user only now, then clean up. */
  if (pending) {
    const failRec = otpFailure(pending);
    if (failRec) return fail(res, failRec.status, failRec.code, failRec.message);

    if (!verifyOtp(otp, email, pending.otpHash)) {
      await store.incrementPendingSignupAttempts(pending.id);
      const updated = await store.findPendingSignupByEmail(email);
      if (updated && (updated.attempts || 0) >= (updated.maxAttempts || 5)) {
        return fail(res, 429, 'OTP_TOO_MANY_ATTEMPTS', 'Too many attempts. Request a new code.');
      }
      return fail(res, 400, 'OTP_INVALID', 'Incorrect code');
    }

    let created;
    try {
      created = await store.createUser({
        id: randomToken(16),
        firstName: pending.firstName,
        lastName: pending.lastName,
        email,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        phone: pending.phone || null,
        organization: pending.organization || null,
        country: pending.country || null,
        lang: pending.lang || 'en',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        lastLoginAt: null
      });
    } catch (e) {
      /* unique email race — the pending record stays so a retry can be attempted */
      return fail(res, 409, 'EMAIL_IN_USE', 'An account with this email already exists');
    }

    await store.deletePendingSignup(pending.id);

    await events.logActivity(created.id, 'USER_REGISTERED', { email });
    await events.logActivity(created.id, 'EMAIL_VERIFIED', {});
    await events.createNotification(created.id, 'system', 'Email verified', 'Your email address has been verified.');

    const session = await sessionLib.createSession(req, created.id, true);
    res.setHeader('Set-Cookie', session.cookie);
    return ok(res, { verified: true, user: publicUser(created), token: session.token });
  }

  return fail(res, 404, 'NOT_FOUND', 'No pending signup or account found for this email');
}

/* POST resend-verification — resend the signup OTP email with a 60s cooldown.
   Works for both pending signups (no user yet) and legacy unverified users. */
async function actionResendVerification(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  const pending = await store.findPendingSignupByEmail(email);

  if (user && user.emailVerified) return fail(res, 409, 'ALREADY_VERIFIED', 'This email is already verified');

  /* pending signup resend (no users row exists yet) */
  if (pending && !user) {
    if (pending.resendAt && new Date(pending.resendAt) > new Date()) {
      return failCode(res, 'RATE_LIMITED', 'Please wait before requesting a new code.');
    }
    const otp = generateOtp();
    await store.updatePendingSignup(pending.id, {
      otpHash: hashOtp(otp, email),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString()
    });
    let emailStatus = 'pending';
    try {
      const out = await mailer.sendOtpEmail(email, otp, pending.lang || 'en');
      emailStatus = out.mode;
    } catch (e) {
      emailStatus = 'failed';
    }
    return ok(res, { emailStatus, resendAfterSeconds: RESEND_COOLDOWN_MS / 1000 });
  }

  /* legacy unverified user resend */
  if (user) {
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

  return fail(res, 404, 'NOT_FOUND', 'No account found for this email');
}

/* POST forgot-password — email a reset OTP for an existing VERIFIED account.
   Unknown emails are rejected up front with EMAIL_NOT_FOUND (no OTP is issued,
   no password_resets row is created, so the UI never advances to the OTP step).
   Unverified accounts are rejected with EMAIL_NOT_VERIFIED. Reuses the existing
   OTP/mailer primitives in a dedicated password_resets table (never mixed with
   signup verification records). */
async function actionForgotPassword(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  if (!user) return failCode(res, 'EMAIL_NOT_FOUND', 'No account found for this email');
  if (!user.emailVerified) return failCode(res, 'EMAIL_NOT_VERIFIED', 'Please verify your email before resetting your password.');

  let emailStatus = 'pending';
  const resendAfterSeconds = RESEND_COOLDOWN_MS / 1000;

  let reset = await store.findLatestPasswordResetByUser(user.id);
  if (reset && reset.resendAt && new Date(reset.resendAt) > new Date()) {
    return ok(res, { emailStatus: 'cooldown', resendAfterSeconds });
  }

  const otp = generateOtp();
  const patch = {
    otpHash: hashOtp(otp, email),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
    userId: user.id
  };

  if (reset) {
    await store.replacePasswordReset(reset.id, patch);
  } else {
    await store.createPasswordReset({
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

  try {
    const out = await mailer.sendOtpEmail(email, otp, user.lang || 'en');
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
  }

  await events.logActivity(user.id, 'PASSWORD_RESET_REQUESTED', {});

  return ok(res, { emailStatus, resendAfterSeconds });
}

/* POST reset-password — validate the reset OTP and set a new hashed password.
   The reset code is single-use and invalidated here; all existing sessions are
   destroyed so old tokens cannot be used with the new credentials. */
async function actionResetPassword(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  const otp = String((body && body.otp) || '').trim();
  const password = String((body && body.password) || '');
  const confirm = String((body && body.confirm) || '');

  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');
  if (!/^\d{6}$/.test(otp)) return fail(res, 422, 'VALIDATION_ERROR', 'OTP must be 6 digits');
  if (!isPassword(password)) return fail(res, 422, 'VALIDATION_ERROR', 'Password must be at least 8 characters');
  if (!confirm || password !== confirm) return fail(res, 422, 'VALIDATION_ERROR', 'Passwords do not match');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  if (!user) return fail(res, 400, 'OTP_INVALID', 'Incorrect code');

  const check = await verifyResetOtpRecord(store, user, email, otp);
  if (!check.ok) return fail(res, check.fail.status, check.fail.code, check.fail.message);

  await store.markPasswordResetUsed(check.reset.id);
  await store.updateUser(user.id, { passwordHash: hashPassword(password) });
  await store.deleteSessionsByUser(user.id);

  await events.logActivity(user.id, 'PASSWORD_RESET', {});
  await events.createNotification(user.id, 'system', 'Password changed', 'Your password was updated successfully.');

  return ok(res, { passwordChanged: true });
}

/* POST verify-reset-otp — confirm a reset OTP WITHOUT consuming it so the UI
   reveals the new-password fields only after the backend validates the code.
   Consumption stays in reset-password (single-use, sessions destroyed). */
async function actionVerifyResetOtp(req, res) {
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
  if (!user) return fail(res, 400, 'OTP_INVALID', 'Incorrect code');

  const check = await verifyResetOtpRecord(store, user, email, otp);
  if (!check.ok) return fail(res, check.fail.status, check.fail.code, check.fail.message);

  return ok(res, { otpValid: true });
}

/* POST login-otp — request a one-time login code for an existing VERIFIED
   account. Unknown/unverified emails receive the same generic response (no
   account is created, no existence is disclosed). */
async function actionLoginOtp(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  let emailStatus = 'pending';
  const resendAfterSeconds = RESEND_COOLDOWN_MS / 1000;

  if (user && user.emailVerified) {
    let rec = await store.findLatestLoginOtpByUser(user.id);
    if (rec && rec.resendAt && new Date(rec.resendAt) > new Date()) {
      return ok(res, { emailStatus: 'cooldown', resendAfterSeconds });
    }

    const otp = generateOtp();
    const patch = {
      otpHash: hashOtp(otp, email),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
      userId: user.id
    };

    if (rec) {
      await store.replaceLoginOtp(rec.id, patch);
    } else {
      await store.createLoginOtp({
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

    try {
      const out = await mailer.sendOtpEmail(email, otp, user.lang || 'en');
      emailStatus = out.mode;
    } catch (e) {
      emailStatus = 'failed';
    }

    await events.logActivity(user.id, 'OTP_LOGIN_REQUESTED', {});
  }

  return ok(res, { emailStatus, resendAfterSeconds });
}

/* POST login-otp-verify — verify a login OTP and establish a session.
   Only existing verified accounts can authenticate this way; an unregistered
   email never creates an account (it fails as if the code were wrong). */
async function actionLoginOtpVerify(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const email = String((body && body.email) || '').trim().toLowerCase();
  const otp = String((body && body.otp) || '').trim();
  const remember = !!(body && body.remember);
  const ip = clientIp(req);

  if (!isEmail(email)) return fail(res, 422, 'VALIDATION_ERROR', 'Email is invalid');
  if (!/^\d{6}$/.test(otp)) return fail(res, 422, 'VALIDATION_ERROR', 'OTP must be 6 digits');

  const store = storeApi.makeStore();
  try { await store._ensureSchema && store._ensureSchema(); } catch (e) {}

  const user = await store.findUserByEmail(email);
  if (!user || !user.emailVerified) {
    return fail(res, 400, 'OTP_INVALID', 'Incorrect code');
  }

  const rec = await store.findLatestLoginOtpByUser(user.id);
  const failRec = otpFailure(rec);
  if (failRec) return fail(res, failRec.status, failRec.code, failRec.message);

  if (!verifyOtp(otp, email, rec.otpHash)) {
    await store.incrementLoginOtpAttempts(rec.id);
    const updated = await store.findLatestLoginOtpByUser(user.id);
    if (updated && (updated.attempts || 0) >= (updated.maxAttempts || 5)) {
      return fail(res, 429, 'OTP_TOO_MANY_ATTEMPTS', 'Too many attempts. Request a new code.');
    }
    return fail(res, 400, 'OTP_INVALID', 'Incorrect code');
  }

  await store.markLoginOtpUsed(rec.id);
  await store.recordLoginAttempt({
    id: randomToken(16), email, ip, success: true, createdAt: nowIso()
  });

  const session = await sessionLib.createSession(req, user.id, remember);
  await store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

  await events.logActivity(user.id, 'USER_LOGGED_IN', { method: 'otp' });
  await events.createNotification(user.id, 'system', 'Signed in', 'You signed in with a one-time code.');

  res.setHeader('Set-Cookie', session.cookie);
  return ok(res, { user: publicUser(Object.assign({}, user, { lastLoginAt: new Date().toISOString() })), token: session.token });
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
    case 'forgot-password': return actionForgotPassword(req, res);
    case 'verify-reset-otp': return actionVerifyResetOtp(req, res);
    case 'reset-password': return actionResetPassword(req, res);
    case 'login-otp': return actionLoginOtp(req, res);
    case 'login-otp-verify': return actionLoginOtpVerify(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown auth action: ' + (action || '(none)'));
  }
};
