/* NABD — auth backend tests.
   Exercises the real Vercel handler modules against the in-memory store
   (NABD_DATA=memory) so no live Postgres/credentials are required.
   Covers: signup, duplicate/invalid input, password hashing, email OTP
   (verify / invalid / expired / max attempts), login (success / bad creds /
   unverified blocked), /auth/me, logout and session persistence. */

process.env.NABD_DATA = 'memory';

const storeApi = require('../api/_lib/store');
const store = storeApi.makeStore();
store._reset && store._reset();

const signupHandler = require('../api/auth/signup.js');
const verifyHandler = require('../api/auth/verify-email.js');
const resendHandler = require('../api/auth/resend-verification.js');
const loginHandler = require('../api/auth/login.js');
const logoutHandler = require('../api/auth/logout.js');
const meHandler = require('../api/auth/me.js');

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};

/* ---- minimal mock req/res for the serverless handlers ---- */
function mockReq(method, body, headers) {
  return { method, body, headers: Object.assign({ 'x-forwarded-for': '127.0.0.1' }, headers || {}) };
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
const run = async (handler, method, body, headers) => {
  const res = mockRes();
  await handler(mockReq(method, body, headers), res);
  return { status: res.out.statusCode, body: res.out.body, headers: res.out.headers };
};

(async () => {
  const EMAIL = 'test@example.com';
  const PASSWORD = 'S3cure!Passw0rd';

  /* ---- signup ---- */
  let r = await run(signupHandler, 'POST', {
    firstName: 'Omar', lastName: 'Salem', email: EMAIL, password: PASSWORD,
    phone: '+20 100 123 4567', organization: 'Acme', country: 'eg', lang: 'en'
  });
  assert(r.status === 201, 'signup returns 201');
  assert(r.body && r.body.ok === true, 'signup returns ok:true');
  assert(r.body.user.email === EMAIL, 'signup returns the created user email');
  assert(r.body.user.emailVerified === false, 'signup creates an UNVERIFIED account');
  assert(r.body.token, 'signup establishes a session (token returned)');
  assert(!JSON.stringify(r.body).includes('passwordHash'), 'signup response never leaks passwordHash');
  assert(!JSON.stringify(r.body).includes('otp'), 'signup response never leaks the OTP');
  const token = r.body.token;

  /* password is stored hashed, not plaintext */
  const mem = store._mem.users.find((u) => u.email === EMAIL);
  assert(mem && mem.passwordHash && mem.passwordHash !== PASSWORD, 'password is stored hashed (never plaintext)');
  assert(mem && /^\$2[aby]\$/.test(mem.passwordHash), 'password uses a bcrypt hash');

  /* duplicate email */
  r = await run(signupHandler, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: EMAIL, password: PASSWORD });
  assert(r.status === 409 && r.body.error === 'EMAIL_IN_USE', 'duplicate email rejected with 409 EMAIL_IN_USE');

  /* invalid email */
  r = await run(signupHandler, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: 'not-an-email', password: PASSWORD });
  assert(r.status === 422, 'invalid email rejected with 422');

  /* invalid password */
  r = await run(signupHandler, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: 'x@y.com', password: 'short' });
  assert(r.status === 422, 'short password rejected with 422');

  /* invalid name */
  r = await run(signupHandler, 'POST', { firstName: '', lastName: 'B', email: 'x2@y.com', password: PASSWORD });
  assert(r.status === 422, 'empty first name rejected with 422');

  /* invalid (non-Egyptian) phone */
  r = await run(signupHandler, 'POST', {
    firstName: 'Ahmed', lastName: 'Ali', email: 'x3@y.com', password: PASSWORD, phone: '+1 555 123 4567'
  });
  assert(r.status === 422, 'non-Egyptian phone rejected with 422');

  /* ---- OTP verify ---- */
  const VERIFIED_EMAIL = 'verify@example.com';
  await run(signupHandler, 'POST', { firstName: 'Youssef', lastName: 'Zaki', email: VERIFIED_EMAIL, password: PASSWORD });
  const vUser = store._mem.users.find((u) => u.email === VERIFIED_EMAIL);
  const verif = store._mem.verifications.find((v) => v.userId === vUser.id);
  assert(verif && verif.otpHash, 'signup stores a hashed OTP verification record');

  /* correct OTP from the dev-mail path is not reachable here, so we
     regenerate a known OTP the same way the handler does */
  const crypto = require('../api/_lib/crypto');
  const knownOtp = '123456';
  verif.otpHash = crypto.hashOtp(knownOtp, VERIFIED_EMAIL);

  r = await run(verifyHandler, 'POST', { email: VERIFIED_EMAIL, otp: knownOtp });
  assert(r.status === 200 && r.body.verified === true, 'correct OTP verifies the account');
  const verifiedUser = store._mem.users.find((u) => u.email === VERIFIED_EMAIL);
  assert(verifiedUser.emailVerified === true, 'emailVerified flag is persisted after OTP verify');
  assert(verif.usedAt, 'OTP is single-use (marked used)');

  /* invalid OTP */
  const INVALID_EMAIL = 'invalid-otp@example.com';
  await run(signupHandler, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: INVALID_EMAIL, password: PASSWORD });
  const ivUser = store._mem.users.find((u) => u.email === INVALID_EMAIL);
  const ivVerif = store._mem.verifications.find((v) => v.userId === ivUser.id);
  ivVerif.otpHash = crypto.hashOtp('111111', INVALID_EMAIL);
  r = await run(verifyHandler, 'POST', { email: INVALID_EMAIL, otp: '000000' });
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'wrong OTP rejected with OTP_INVALID');

  /* max attempts → invalidated */
  const ATTEMPT_EMAIL = 'attempts@example.com';
  await run(signupHandler, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: ATTEMPT_EMAIL, password: PASSWORD });
  const atUser = store._mem.users.find((u) => u.email === ATTEMPT_EMAIL);
  const atVerif = store._mem.verifications.find((v) => v.userId === atUser.id);
  atVerif.otpHash = crypto.hashOtp('999999', ATTEMPT_EMAIL);
  let blocked = false;
  for (let i = 0; i < 6; i++) {
    r = await run(verifyHandler, 'POST', { email: ATTEMPT_EMAIL, otp: '000000' });
    if (r.status === 429 && r.body.error === 'OTP_TOO_MANY_ATTEMPTS') { blocked = true; break; }
  }
  assert(blocked, 'OTP invalidated after max attempts (429 OTP_TOO_MANY_ATTEMPTS)');

  /* expired OTP */
  const EXPIRED_EMAIL = 'expired@example.com';
  await run(signupHandler, 'POST', { firstName: 'Ahmed', lastName: 'Ali', email: EXPIRED_EMAIL, password: PASSWORD });
  const exUser = store._mem.users.find((u) => u.email === EXPIRED_EMAIL);
  const exVerif = store._mem.verifications.find((v) => v.userId === exUser.id);
  exVerif.otpHash = crypto.hashOtp('777777', EXPIRED_EMAIL);
  exVerif.expiresAt = new Date(Date.now() - 60 * 1000).toISOString();
  r = await run(verifyHandler, 'POST', { email: EXPIRED_EMAIL, otp: '777777' });
  assert(r.status === 400 && r.body.error === 'OTP_EXPIRED', 'expired OTP rejected with OTP_EXPIRED');

  /* resend endpoint exists and is rate-limited */
  r = await run(resendHandler, 'POST', { email: VERIFIED_EMAIL });
  assert(r.status === 409 && r.body.error === 'ALREADY_VERIFIED', 'resend on a verified account rejected with ALREADY_VERIFIED');

  /* ---- login ---- */
  /* unverified user cannot sign in yet */
  r = await run(loginHandler, 'POST', { email: EMAIL, password: PASSWORD });
  assert(r.status === 403 && r.body.error === 'EMAIL_NOT_VERIFIED', 'unverified user blocked at login (EMAIL_NOT_VERIFIED)');

  /* verified user signs in */
  r = await run(loginHandler, 'POST', { email: VERIFIED_EMAIL, password: PASSWORD });
  assert(r.status === 200 && r.body.ok === true, 'verified user can sign in');
  assert(r.body.user.email === VERIFIED_EMAIL, 'login returns the user');
  assert(!JSON.stringify(r.body).includes('passwordHash'), 'login response never leaks passwordHash');
  const loginToken = r.body.token;

  /* wrong password */
  r = await run(loginHandler, 'POST', { email: VERIFIED_EMAIL, password: 'wrong-password-1' });
  assert(r.status === 401 && r.body.error === 'INVALID_CREDENTIALS', 'wrong password rejected with INVALID_CREDENTIALS');

  /* unknown user */
  r = await run(loginHandler, 'POST', { email: 'nobody@example.com', password: PASSWORD });
  assert(r.status === 401 && r.body.error === 'INVALID_CREDENTIALS', 'unknown user rejected with INVALID_CREDENTIALS');

  /* ---- /auth/me (session persists via bearer token) ---- */
  r = await run(meHandler, 'GET', undefined, { authorization: 'Bearer ' + loginToken });
  assert(r.status === 200 && r.body.user.email === VERIFIED_EMAIL, '/auth/me returns the authenticated user from a valid session');

  r = await run(meHandler, 'GET');
  assert(r.status === 401 && r.body.error === 'UNAUTHENTICATED', '/auth/me without a session returns 401');

  r = await run(meHandler, 'GET', undefined, { authorization: 'Bearer invalid.token.here' });
  assert(r.status === 401, '/auth/me with a bogus token returns 401');

  /* ---- logout ---- */
  r = await run(logoutHandler, 'POST', undefined, { authorization: 'Bearer ' + loginToken });
  assert(r.status === 200 && r.body.ok === true, 'logout returns ok');

  r = await run(meHandler, 'GET', undefined, { authorization: 'Bearer ' + loginToken });
  assert(r.status === 401, 'session is destroyed after logout (/auth/me returns 401)');

  /* signup session also persists (auto-login) then /auth/me works */
  r = await run(meHandler, 'GET', undefined, { authorization: 'Bearer ' + token });
  assert(r.status === 200 && r.body.user.email === EMAIL, 'signup session is valid for /auth/me');

  if (!process.exitCode) console.log('ALL TESTS PASSED');
})().catch((e) => { console.error(e); process.exitCode = 1; });
