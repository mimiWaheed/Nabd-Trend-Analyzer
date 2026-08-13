/* NABD — auth backend tests.
   Exercises the consolidated /api/auth handler (action-dispatched) against
   the in-memory store (NABD_DATA=memory) so no live Postgres/credentials are
   required. Signup creates an UNVERIFIED account and emails a 6-digit OTP
   (captured via a stubbed mailer — no real SMTP). Covers: signup + OTP issue,
   duplicate/invalid input, password hashing, email OTP (verify / invalid /
   expired / max attempts / resend), login (success / bad creds / unverified
   blocked), /auth/me, logout and session persistence. */

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

/* seed an UNVERIFIED user with a hashed verification record directly in the
   store, bypassing signup (used for the failure-path OTP tests) */
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
  /* ---- signup (unverified account + OTP email) ---- */
  let r = await run(auth, 'POST', {
    firstName: 'Omar', lastName: 'Salem', email: EMAIL, password: PASSWORD,
    phone: '+20 100 123 4567', organization: 'Acme', country: 'eg', lang: 'en'
  }, undefined, Q('signup'));
  assert(r.status === 201, 'signup returns 201');
  assert(r.body && r.body.ok === true, 'signup returns ok:true');
  assert(r.body.user.email === EMAIL, 'signup returns the created user email');
  assert(r.body.user.emailVerified === false, 'signup creates an UNVERIFIED account (emailVerified=false)');
  assert(r.body.verified !== true, 'signup does not auto-verify');
  assert(!r.body.token, 'signup does not auto-login (no session token returned)');
  assert(!('Set-Cookie' in r.headers), 'signup sets no session cookie');
  assert(!JSON.stringify(r.body).includes('passwordHash'), 'signup response never leaks passwordHash');
  assert(!JSON.stringify(r.body).includes('otp'), 'signup response never leaks the OTP');

  /* signup issued a hashed OTP verification record and emailed it once */
  const signupUser = store._mem.users.find((u) => u.email === EMAIL);
  const signupVRec = store._mem.verifications.find((v) => v.userId === signupUser.id);
  assert(signupVRec && /^[0-9a-f]{64}$/.test(signupVRec.otpHash), 'stored OTP is hashed (never plaintext)');
  assert(mailer.calls.length === 1 && mailer.calls[0].to === EMAIL, 'signup emails the OTP exactly once');
  const signupOtp = mailer.calls[0].otp;
  assert(/^\d{6}$/.test(signupOtp), 'emailed OTP is a 6-digit code');

  /* password is stored hashed, not plaintext */
  const mem = store._mem.users.find((u) => u.email === EMAIL);
  assert(mem && mem.passwordHash && mem.passwordHash !== PASSWORD, 'password is stored hashed (never plaintext)');
  assert(mem && /^\$2[aby]\$/.test(mem.passwordHash), 'password uses a bcrypt hash');

  /* duplicate email */
  r = await run(auth, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: EMAIL, password: PASSWORD }, undefined, Q('signup'));
  assert(r.status === 409 && r.body.error === 'EMAIL_IN_USE', 'duplicate email rejected with 409 EMAIL_IN_USE');

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

  /* ---- OTP verify (the code emailed at signup) ---- */
  const VERIFIED_EMAIL = EMAIL;
  const vUser = store._mem.users.find((u) => u.email === VERIFIED_EMAIL);
  const vRec = store._mem.verifications.find((v) => v.userId === vUser.id);
  assert(vRec && vRec.otpHash, 'signup user has a hashed OTP verification record');

  r = await run(auth, 'POST', { email: VERIFIED_EMAIL, otp: signupOtp }, undefined, Q('verify-email'));
  assert(r.status === 200 && r.body.verified === true, 'correct OTP verifies the account');
  assert(r.body.token, 'successful OTP verify establishes a session (token returned)');
  const verifyToken = r.body.token;
  const verifiedUser = store._mem.users.find((u) => u.email === VERIFIED_EMAIL);
  assert(verifiedUser.emailVerified === true, 'emailVerified flag is persisted after OTP verify');
  assert(vRec.usedAt, 'OTP is single-use (marked used)');

  /* invalid OTP */
  const INVALID_EMAIL = 'invalid-otp@example.com';
  await seedUnverified(INVALID_EMAIL, { otp: '111111' });
  r = await run(auth, 'POST', { email: INVALID_EMAIL, otp: '000000' }, undefined, Q('verify-email'));
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'wrong OTP rejected with OTP_INVALID');

  /* max attempts → invalidated */
  const ATTEMPT_EMAIL = 'attempts@example.com';
  await seedUnverified(ATTEMPT_EMAIL, { otp: '999999' });
  let blocked = false;
  for (let i = 0; i < 6; i++) {
    r = await run(auth, 'POST', { email: ATTEMPT_EMAIL, otp: '000000' }, undefined, Q('verify-email'));
    if (r.status === 429 && r.body.error === 'OTP_TOO_MANY_ATTEMPTS') { blocked = true; break; }
  }
  assert(blocked, 'OTP invalidated after max attempts (429 OTP_TOO_MANY_ATTEMPTS)');

  /* expired OTP */
  const EXPIRED_EMAIL = 'expired@example.com';
  await seedUnverified(EXPIRED_EMAIL, {
    otp: '777777',
    expiresAt: new Date(Date.now() - 60 * 1000).toISOString()
  });
  r = await run(auth, 'POST', { email: EXPIRED_EMAIL, otp: '777777' }, undefined, Q('verify-email'));
  assert(r.status === 400 && r.body.error === 'OTP_EXPIRED', 'expired OTP rejected with OTP_EXPIRED');

  /* resend action exists and is rate-limited / already-verified guarded */
  r = await run(auth, 'POST', { email: VERIFIED_EMAIL }, undefined, Q('resend-verification'));
  assert(r.status === 409 && r.body.error === 'ALREADY_VERIFIED', 'resend on a verified account rejected with ALREADY_VERIFIED');

  /* resend on an UNVERIFIED account issues a fresh OTP */
  const RESEND_EMAIL = 'resend@example.com';
  await seedUnverified(RESEND_EMAIL, { otp: '000000' });
  r = await run(auth, 'POST', { email: RESEND_EMAIL }, undefined, Q('resend-verification'));
  assert(r.status === 200 && r.body.emailStatus === 'smtp', 'resend on an unverified account returns ok with emailStatus');
  assert(mailer.calls.length === 2 && mailer.calls[1].to === RESEND_EMAIL, 'resend emails a fresh OTP');

  /* ---- login ---- */
  /* unverified user cannot sign in yet */
  const UNVERIFIED_EMAIL = 'unverified@example.com';
  await seedUnverified(UNVERIFIED_EMAIL, { otp: '654321' });
  r = await run(auth, 'POST', { email: UNVERIFIED_EMAIL, password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 403 && r.body.error === 'EMAIL_NOT_VERIFIED', 'unverified user blocked at login (EMAIL_NOT_VERIFIED)');

  /* verified user signs in */
  r = await run(auth, 'POST', { email: VERIFIED_EMAIL, password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 200 && r.body.ok === true, 'verified user can sign in');
  assert(r.body.user.email === VERIFIED_EMAIL, 'login returns the user');
  assert(!JSON.stringify(r.body).includes('passwordHash'), 'login response never leaks passwordHash');
  const loginToken = r.body.token;

  /* wrong password */
  r = await run(auth, 'POST', { email: VERIFIED_EMAIL, password: 'wrong-password-1' }, undefined, Q('login'));
  assert(r.status === 401 && r.body.error === 'INVALID_CREDENTIALS', 'wrong password rejected with INVALID_CREDENTIALS');

  /* unknown user */
  r = await run(auth, 'POST', { email: 'nobody@example.com', password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 401 && r.body.error === 'INVALID_CREDENTIALS', 'unknown user rejected with INVALID_CREDENTIALS');

  /* ---- /auth/me (session persists via bearer token) ---- */
  r = await run(auth, 'GET', undefined, { authorization: 'Bearer ' + loginToken }, Q('me'));
  assert(r.status === 200 && r.body.user.email === VERIFIED_EMAIL, '/auth/me returns the authenticated user from a valid session');

  r = await run(auth, 'GET', undefined, undefined, Q('me'));
  assert(r.status === 401 && r.body.error === 'UNAUTHENTICATED', '/auth/me without a session returns 401');

  r = await run(auth, 'GET', undefined, { authorization: 'Bearer invalid.token.here' }, Q('me'));
  assert(r.status === 401, '/auth/me with a bogus token returns 401');

  /* ---- logout ---- */
  r = await run(auth, 'POST', undefined, { authorization: 'Bearer ' + loginToken }, Q('logout'));
  assert(r.status === 200 && r.body.ok === true, 'logout returns ok');

  r = await run(auth, 'GET', undefined, { authorization: 'Bearer ' + loginToken }, Q('me'));
  assert(r.status === 401, 'session is destroyed after logout (/auth/me returns 401)');

  /* the session established by OTP verification persists (auto-login after verify) */
  r = await run(auth, 'GET', undefined, { authorization: 'Bearer ' + verifyToken }, Q('me'));
  assert(r.status === 200 && r.body.user.email === VERIFIED_EMAIL, 'session created on OTP verify is valid for /auth/me');

  if (!process.exitCode) console.log('ALL TESTS PASSED');
})().catch((e) => { console.error(e); process.exitCode = 1; });
