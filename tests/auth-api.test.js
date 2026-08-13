/* NABD — auth backend tests.
   Exercises the consolidated /api/auth handler (action-dispatched) against
   the in-memory store (NABD_DATA=memory) so no live Postgres/credentials are
   required. Signup now stores ONLY a pending registration (no `users` row is
   created until the OTP is verified) and emails a 6-digit OTP (captured via a
   stubbed mailer — no real SMTP). Covers: pending signup + OTP issue,
   deferred user creation, duplicate/invalid input, password hashing, email
   OTP (verify / invalid / expired / max attempts / resend), legacy unverified
   accounts, login (success / bad creds / unverified blocked), /auth/me,
   logout and session persistence. */

process.env.NABD_DATA = 'memory';

/* Stub the mailer so no test ever reaches a real SMTP server. The stub records
   every OTP email so tests can assert a send happened and read the exact code
   that would have been delivered. Installed in require.cache BEFORE
   api/auth.js loads so the handler receives the stubbed module. */
const mailer = {
  calls: [],
  sendOtpEmail(to, otp, lang) {
    this.calls.push({ to, otp, lang });
    return Promise.resolve({ ok: true, mode: 'smtp' });
  }
};
require.cache[require.resolve('../lib/mailer')] = {
  id: require.resolve('../lib/mailer'),
  filename: require.resolve('../lib/mailer'),
  loaded: true,
  exports: mailer
};

const storeApi = require('../lib/store');
const store = storeApi.makeStore();
store._reset && store._reset();

const crypto = require('../lib/crypto');
const auth = require('../api/auth.js');

const EMAIL = 'test@example.com';
const PASSWORD = 'S3cure!Passw0rd';
const Q = (action) => ({ action });

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};

/* ---- minimal mock req/res for the serverless handlers ---- */
function mockReq(method, body, headers, query) {
  return {
    method,
    body,
    headers: Object.assign({ 'x-forwarded-for': '127.0.0.1' }, headers || {}),
    query: query || {}
  };
}
function mockRes() {
  const out = { statusCode: 0, headers: {}, body: null };
  return {
    out,
    setHeader(k, v) { out.headers[k] = v; },
    statusCode: 0,
    status(code) { this.statusCode = code; return this; },
    json(payload) { out.statusCode = this.statusCode || 200; out.body = payload; },
    end(payload) {
      out.statusCode = this.statusCode || 200;
      if (payload) { try { out.body = JSON.parse(payload); } catch (e) { out.body = payload; } }
    }
  };
}
const run = async (handler, method, body, headers, query) => {
  const res = mockRes();
  await handler(mockReq(method, body, headers, query), res);
  return { status: res.out.statusCode, body: res.out.body, headers: res.out.headers };
};

const userByEmail = (email) => store._mem.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
const pendingByEmail = (email) => store._mem.pendingSignups.find((p) => p.email.toLowerCase() === email.toLowerCase());

/* seed an UNVERIFIED legacy account with a hashed verification record directly
   in the store, bypassing signup (used for the failure-path OTP tests) */
async function seedUnverified(email, opts) {
  const user = {
    id: crypto.randomToken(16),
    firstName: 'Ahmed',
    lastName: 'Ali',
    email,
    passwordHash: crypto.hashPassword(PASSWORD),
    emailVerified: false,
    phone: null,
    organization: null,
    country: null,
    lang: 'en',
    createdAt: crypto.nowIso(),
    updatedAt: crypto.nowIso(),
    lastLoginAt: null
  };
  await store.createUser(user);
  await store.createVerification({
    id: crypto.randomToken(16),
    userId: user.id,
    otpHash: crypto.hashOtp((opts && opts.otp) || '123456', email),
    expiresAt: (opts && opts.expiresAt) || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    resendAt: null,
    attempts: (opts && opts.attempts) || 0,
    maxAttempts: 5,
    usedAt: null,
    createdAt: crypto.nowIso()
  });
  return user;
}

(async () => {
  /* ---- signup (PENDING only — no users row yet) ---- */
  let r = await run(auth, 'POST', {
    firstName: 'Omar', lastName: 'Salem', email: EMAIL, password: PASSWORD,
    phone: '+20 100 123 4567', organization: 'Acme', country: 'eg', lang: 'en'
  }, undefined, Q('signup'));
  assert(r.status === 201, 'signup returns 201');
  assert(r.body && r.body.ok === true, 'signup returns ok:true');
  assert(r.body.pending && r.body.pending.email === EMAIL, 'signup returns the pending registration email');
  assert(r.body.pending.firstName === 'Omar' && r.body.pending.lastName === 'Salem', 'signup returns the pending first/last name');
  assert(r.body.pending.lang === 'en', 'signup returns the pending language');
  assert(r.body.verified === false, 'signup does not auto-verify');
  assert(!('user' in r.body), 'signup does NOT return a user object (no account yet)');
  assert(!r.body.token, 'signup does not auto-login (no session token returned)');
  assert(!('Set-Cookie' in r.headers), 'signup sets no session cookie');
  assert(!JSON.stringify(r.body).includes('passwordHash'), 'signup response never leaks passwordHash');
  assert(!JSON.stringify(r.body).includes('otp'), 'signup response never leaks the OTP');

  /* critical guarantee: no users row exists before OTP verification */
  assert(!userByEmail(EMAIL), 'NO users row exists for the email before OTP verification');

  /* pending signup holds the hashed password + hashed OTP */
  const pend = pendingByEmail(EMAIL);
  assert(pend && /^[0-9a-f]{64}$/.test(pend.otpHash), 'pending OTP is hashed (never plaintext)');
  assert(pend && pend.passwordHash && pend.passwordHash !== PASSWORD, 'pending password is stored hashed (never plaintext)');
  assert(pend && /^\$2[aby]\$/.test(pend.passwordHash), 'pending password uses a bcrypt hash');

  /* OTP emailed exactly once */
  assert(mailer.calls.length === 1 && mailer.calls[0].to === EMAIL, 'signup emails the OTP exactly once');
  const signupOtp = mailer.calls[0].otp;
  assert(/^\d{6}$/.test(signupOtp), 'emailed OTP is a 6-digit code');

  /* re-submitting while the resend cooldown is active is rate-limited */
  r = await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: EMAIL, password: PASSWORD }, undefined, Q('signup'));
  assert(r.status === 429 && r.body.error === 'RATE_LIMITED', 'duplicate signup during cooldown rejected with 429 RATE_LIMITED');

  /* invalid email */
  r = await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: 'not-an-email', password: PASSWORD }, undefined, Q('signup'));
  assert(r.status === 422, 'invalid email rejected with 422');

  /* invalid password */
  r = await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: 'x@y.com', password: 'short' }, undefined, Q('signup'));
  assert(r.status === 422, 'short password rejected with 422');

  /* invalid name */
  r = await run(auth, 'POST', { firstName: '', lastName: 'B', email: 'x2@y.com', password: PASSWORD }, undefined, Q('signup'));
  assert(r.status === 422, 'empty first name rejected with 422');

  /* invalid (non-Egyptian) phone */
  r = await run(auth, 'POST', {
    firstName: 'Ahmed', lastName: 'Ali', email: 'x3@y.com', password: PASSWORD, phone: '+1 555 123 4567'
  }, undefined, Q('signup'));
  assert(r.status === 422, 'non-Egyptian phone rejected with 422');

  /* unknown action rejected */
  r = await run(auth, 'GET', undefined, undefined, Q('bogus'));
  assert(r.status === 404 && r.body.error === 'NOT_FOUND', 'unknown auth action rejected with 404');

  /* ---- OTP verify (pending path) ---- */

  /* wrong OTP does not create a user */
  r = await run(auth, 'POST', { email: EMAIL, otp: '000000' }, undefined, Q('verify-email'));
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'wrong OTP rejected with OTP_INVALID');
  assert(!userByEmail(EMAIL), 'wrong OTP creates NO users row');

  /* correct OTP creates exactly one real user and cleans up the pending row */
  r = await run(auth, 'POST', { email: EMAIL, otp: signupOtp }, undefined, Q('verify-email'));
  assert(r.status === 200 && r.body.verified === true, 'correct OTP verifies the account');
  assert(r.body.user && r.body.user.email === EMAIL, 'verify returns the created user');
  assert(r.body.user.emailVerified === true, 'created user is emailVerified');
  assert(r.body.token, 'successful OTP verify establishes a session (token returned)');
  assert('Set-Cookie' in r.headers, 'verify sets a session cookie');
  const verifyToken = r.body.token;
  const createdUser = userByEmail(EMAIL);
  assert(createdUser, 'exactly one users row exists after successful verification');
  assert(createdUser.firstName === 'Omar' && createdUser.lastName === 'Salem', 'first/last name persisted from pending data');
  assert(createdUser.emailVerified === true, 'emailVerified flag is persisted');
  assert(createdUser.passwordHash && /^\$2[aby]\$/.test(createdUser.passwordHash), 'created user has a bcrypt password hash');
  assert(!pendingByEmail(EMAIL), 'pending signup data is cleaned up after verification');

  /* a second verify with the same OTP cannot re-create a pending row (already gone) */
  r = await run(auth, 'POST', { email: EMAIL, otp: signupOtp }, undefined, Q('verify-email'));
  assert(r.status === 200 && r.body.verified === true, 'verify on an already-verified account still returns the session');

  /* password from signup works at login */
  r = await run(auth, 'POST', { email: EMAIL, password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 200 && r.body.ok === true, 'signup password authenticates after verification');

  /* ---- OTP failure paths (fresh pending signups) ---- */
  const ATTEMPT_EMAIL = 'attempts@example.com';
  await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: ATTEMPT_EMAIL, password: PASSWORD }, undefined, Q('signup'));
  let blocked = false;
  for (let i = 0; i < 6; i++) {
    r = await run(auth, 'POST', { email: ATTEMPT_EMAIL, otp: '000000' }, undefined, Q('verify-email'));
    if (r.status === 429 && r.body.error === 'OTP_TOO_MANY_ATTEMPTS') { blocked = true; break; }
  }
  assert(blocked, 'OTP invalidated after max attempts (429 OTP_TOO_MANY_ATTEMPTS)');
  assert(!userByEmail(ATTEMPT_EMAIL), 'max-attempts failure creates NO users row');

  const EXPIRED_EMAIL = 'expired@example.com';
  await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: EXPIRED_EMAIL, password: PASSWORD }, undefined, Q('signup'));
  const expPend = pendingByEmail(EXPIRED_EMAIL);
  await store.updatePendingSignup(expPend.id, { expiresAt: new Date(Date.now() - 60 * 1000).toISOString() });
  r = await run(auth, 'POST', { email: EXPIRED_EMAIL, otp: mailer.calls[mailer.calls.length - 1].otp }, undefined, Q('verify-email'));
  assert(r.status === 400 && r.body.error === 'OTP_EXPIRED', 'expired OTP rejected with OTP_EXPIRED');
  assert(!userByEmail(EXPIRED_EMAIL), 'expired OTP creates NO users row');

  /* resend on an already-verified account is rejected */
  r = await run(auth, 'POST', { email: EMAIL }, undefined, Q('resend-verification'));
  assert(r.status === 409 && r.body.error === 'ALREADY_VERIFIED', 'resend on a verified account rejected with ALREADY_VERIFIED');

  /* resend on a PENDING signup issues a fresh OTP */
  const RESEND_EMAIL = 'resend@example.com';
  await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: RESEND_EMAIL, password: PASSWORD }, undefined, Q('signup'));
  const resendPend = pendingByEmail(RESEND_EMAIL);
  await store.updatePendingSignup(resendPend.id, { resendAt: new Date(Date.now() - 1000).toISOString() });
  const callsBefore = mailer.calls.length;
  r = await run(auth, 'POST', { email: RESEND_EMAIL }, undefined, Q('resend-verification'));
  assert(r.status === 200 && r.body.emailStatus === 'smtp', 'resend on a pending signup returns ok with emailStatus');
  assert(mailer.calls.length === callsBefore + 1 && mailer.calls[callsBefore].to === RESEND_EMAIL, 'resend emails a fresh OTP');

  /* ---- legacy unverified account (created before signup was deferred) ---- */
  const LEGACY_EMAIL = 'legacy@example.com';
  const legacyUser = await seedUnverified(LEGACY_EMAIL, { otp: '111111' });
  r = await run(auth, 'POST', { email: LEGACY_EMAIL, otp: '111111' }, undefined, Q('verify-email'));
  assert(r.status === 200 && r.body.verified === true, 'legacy unverified account verifies with its stored OTP');
  const legacyRec = store._mem.verifications.find((v) => v.userId === legacyUser.id);
  assert(legacyRec && legacyRec.usedAt, 'legacy OTP record is marked used (single-use enforced at the record)');

  /* ---- login ---- */
  /* unverified legacy user cannot sign in yet */
  const UNVERIFIED_EMAIL = 'unverified@example.com';
  await seedUnverified(UNVERIFIED_EMAIL, { otp: '654321' });
  r = await run(auth, 'POST', { email: UNVERIFIED_EMAIL, password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 403 && r.body.error === 'EMAIL_NOT_VERIFIED', 'unverified user blocked at login (EMAIL_NOT_VERIFIED)');

  /* wrong password */
  r = await run(auth, 'POST', { email: EMAIL, password: 'wrong-password-1' }, undefined, Q('login'));
  assert(r.status === 401 && r.body.error === 'INVALID_CREDENTIALS', 'wrong password rejected with INVALID_CREDENTIALS');

  /* unknown user */
  r = await run(auth, 'POST', { email: 'nobody@example.com', password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 401 && r.body.error === 'INVALID_CREDENTIALS', 'unknown user rejected with INVALID_CREDENTIALS');

  /* ---- /auth/me (session persists via bearer token) ---- */
  r = await run(auth, 'GET', undefined, { authorization: 'Bearer ' + verifyToken }, Q('me'));
  assert(r.status === 200 && r.body.user.email === EMAIL, '/auth/me returns the authenticated user from a valid session');

  r = await run(auth, 'GET', undefined, undefined, Q('me'));
  assert(r.status === 401 && r.body.error === 'UNAUTHENTICATED', '/auth/me without a session returns 401');

  r = await run(auth, 'GET', undefined, { authorization: 'Bearer invalid.token.here' }, Q('me'));
  assert(r.status === 401, '/auth/me with a bogus token returns 401');

  /* ---- logout ---- */
  r = await run(auth, 'POST', undefined, { authorization: 'Bearer ' + verifyToken }, Q('logout'));
  assert(r.status === 200 && r.body.ok === true, 'logout returns ok');

  r = await run(auth, 'GET', undefined, { authorization: 'Bearer ' + verifyToken }, Q('me'));
  assert(r.status === 401, 'session is destroyed after logout (/auth/me returns 401)');

  if (!process.exitCode) console.log('ALL TESTS PASSED');
})().catch((e) => { console.error(e); process.exitCode = 1; });
