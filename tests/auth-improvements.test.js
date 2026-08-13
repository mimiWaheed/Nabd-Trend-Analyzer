/* NABD — auth improvement tests (password reset, remember-me, OTP login,
   real profile).
   Runs against the in-memory store (NABD_DATA=memory) with a stubbed mailer.
   Covers:
   - forgot-password: generic (no-enumeration) response, OTP emailed
   - reset-password: wrong/expired/reused OTP, password changed + old rejected,
     all existing sessions destroyed
   - remember-me: short (12h) vs persistent (30d) session TTL + cookie Max-Age,
     logout invalidation
   - OTP login: code sent for verified accounts, verify creates a session,
     invalid OTP rejected, unknown email creates no account
   - profile: real stored data returned with usage counts, PATCH persists,
     refresh returns updated data, email cannot be changed via PATCH */

process.env.NABD_DATA = 'memory';

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
const sessionLib = require('../lib/session');
const auth = require('../api/auth.js');
const users = require('../api/users.js');

const PASSWORD = 'S3cure!Passw0rd';
const Q = (action) => ({ action });

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};

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
const bear = (t) => ({ authorization: 'Bearer ' + t });
const lastOtp = () => mailer.calls[mailer.calls.length - 1].otp;

async function seedVerified(email, password) {
  const user = {
    id: crypto.randomToken(16),
    firstName: 'Nour',
    lastName: 'Badea',
    email,
    passwordHash: crypto.hashPassword(password || PASSWORD),
    emailVerified: true,
    phone: '+201001112222',
    organization: 'Delta Digital Group',
    country: 'eg',
    lang: 'en',
    createdAt: crypto.nowIso(),
    updatedAt: crypto.nowIso(),
    lastLoginAt: null
  };
  await store.createUser(user);
  return user;
}

(async () => {
  /* ================= PASSWORD RESET ================= */
  const A = 'reset-a@example.com';
  await seedVerified(A);

  /* forgot-password emits a generic 200 and emails a 6-digit OTP */
  let r = await run(auth, 'POST', { email: A }, undefined, Q('forgot-password'));
  assert(r.status === 200, 'forgot-password returns 200 for an existing account');
  assert(r.body.emailStatus === 'smtp', 'forgot-password reports the email was sent');
  const resetOtp = lastOtp();
  assert(/^\d{6}$/.test(resetOtp), 'forgot-password emails a 6-digit OTP');

  /* unknown email gets the SAME generic response (no enumeration) */
  const callsBefore = mailer.calls.length;
  r = await run(auth, 'POST', { email: 'nobody@example.com' }, undefined, Q('forgot-password'));
  assert(r.status === 200 && r.body.emailStatus !== undefined, 'forgot-password returns a generic 200 for an unknown email');
  assert(mailer.calls.length === callsBefore, 'forgot-password does NOT email an unknown email');
  assert(!store._mem.users.find((u) => u.email === 'nobody@example.com'), 'forgot-password does NOT create an account');

  /* wrong OTP */
  r = await run(auth, 'POST', { email: A, otp: '000000', password: 'New!Passw0rd1', confirm: 'New!Passw0rd1' }, undefined, Q('reset-password'));
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'reset-password rejects a wrong OTP with OTP_INVALID');

  /* mismatched confirm */
  r = await run(auth, 'POST', { email: A, otp: resetOtp, password: 'New!Passw0rd1', confirm: 'Different1!' }, undefined, Q('reset-password'));
  assert(r.status === 422, 'reset-password rejects mismatched confirmation with 422');

  /* a session established before the reset is destroyed */
  const preLogin = await run(auth, 'POST', { email: A, password: PASSWORD }, undefined, Q('login'));
  assert(preLogin.status === 200, 'old password works before the reset');

  /* correct OTP + matching passwords changes the password */
  r = await run(auth, 'POST', { email: A, otp: resetOtp, password: 'New!Passw0rd1', confirm: 'New!Passw0rd1' }, undefined, Q('reset-password'));
  assert(r.status === 200 && r.body.passwordChanged === true, 'reset-password succeeds with the correct OTP');

  /* old password rejected, new password accepted */
  r = await run(auth, 'POST', { email: A, password: PASSWORD }, undefined, Q('login'));
  assert(r.status === 401, 'old password is rejected after the reset');
  r = await run(auth, 'POST', { email: A, password: 'New!Passw0rd1' }, undefined, Q('login'));
  assert(r.status === 200, 'new password is accepted after the reset');

  /* sessions created before the reset are gone */
  r = await run(auth, 'GET', undefined, bear(preLogin.body.token), Q('me'));
  assert(r.status === 401, 'pre-reset sessions are destroyed');

  /* OTP cannot be reused */
  r = await run(auth, 'POST', { email: A, otp: resetOtp, password: 'Another!Pass1', confirm: 'Another!Pass1' }, undefined, Q('reset-password'));
  assert(r.status === 400 && r.body.error === 'OTP_ALREADY_USED', 'reset OTP is single-use (reuse rejected)');

  /* expired reset OTP */
  const B = 'reset-b@example.com';
  const userB = await seedVerified(B);
  await store.createPasswordReset({
    id: crypto.randomToken(16),
    userId: userB.id,
    otpHash: crypto.hashOtp('654321', B),
    expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
    resendAt: null,
    attempts: 0,
    maxAttempts: 5,
    usedAt: null,
    createdAt: crypto.nowIso()
  });
  r = await run(auth, 'POST', { email: B, otp: '654321', password: 'New!Passw0rd1', confirm: 'New!Passw0rd1' }, undefined, Q('reset-password'));
  assert(r.status === 400 && r.body.error === 'OTP_EXPIRED', 'expired reset OTP rejected with OTP_EXPIRED');

  /* ================= REMEMBER ME ================= */
  const C = 'remember@example.com';
  await seedVerified(C);

  /* remember OFF → ~12h session TTL and cookie Max-Age */
  r = await run(auth, 'POST', { email: C, password: PASSWORD, remember: false }, undefined, Q('login'));
  assert(r.status === 200, 'login (remember off) succeeds');
  const shortToken = r.body.token;
  const shortSess = store._mem.sessions.find((s) => s.tokenHash === sessionLib.hashToken(shortToken));
  const shortTtl = new Date(shortSess.expiresAt) - Date.now();
  assert(shortTtl > 11 * 3600 * 1000 && shortTtl <= 13 * 3600 * 1000, 'remember-off session TTL is ~12h');
  const shortCookie = r.headers['Set-Cookie'] || '';
  assert(shortCookie.indexOf('Max-Age=' + Math.round(sessionLib.TTL_SHORT / 1000)) !== -1, 'remember-off cookie Max-Age is the short TTL');

  /* remember ON → ~30d session TTL and cookie Max-Age */
  r = await run(auth, 'POST', { email: C, password: PASSWORD, remember: true }, undefined, Q('login'));
  assert(r.status === 200, 'login (remember on) succeeds');
  const longToken = r.body.token;
  const longSess = store._mem.sessions.find((s) => s.tokenHash === sessionLib.hashToken(longToken));
  const longTtl = new Date(longSess.expiresAt) - Date.now();
  assert(longTtl > 29 * 24 * 3600 * 1000 && longTtl <= 31 * 24 * 3600 * 1000, 'remember-on session TTL is ~30 days');
  const longCookie = r.headers['Set-Cookie'] || '';
  assert(longCookie.indexOf('Max-Age=' + Math.round(sessionLib.TTL_REMEMBER / 1000)) !== -1, 'remember-on cookie Max-Age is the persistent TTL');

  /* the persistent session is recognized by /auth/me */
  r = await run(auth, 'GET', undefined, bear(longToken), Q('me'));
  assert(r.status === 200 && r.body.user.email === C, 'persistent session resolves for /auth/me');

  /* logout invalidates it */
  r = await run(auth, 'POST', undefined, bear(longToken), Q('logout'));
  assert(r.status === 200, 'logout succeeds for a remember-on session');
  r = await run(auth, 'GET', undefined, bear(longToken), Q('me'));
  assert(r.status === 401, 'logout invalidates the persistent session');

  /* ================= OTP LOGIN ================= */
  const D = 'otp-login@example.com';
  await seedVerified(D);

  /* verified account requests a code */
  r = await run(auth, 'POST', { email: D }, undefined, Q('login-otp'));
  assert(r.status === 200 && r.body.emailStatus === 'smtp', 'login-otp sends a code for a verified account');
  const loginOtp = lastOtp();
  assert(/^\d{6}$/.test(loginOtp), 'login-otp emails a 6-digit code');

  /* wrong code rejected (before the code is used) */
  r = await run(auth, 'POST', { email: D, otp: '000000', remember: false }, undefined, Q('login-otp-verify'));
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'login-otp-verify rejects a wrong code');

  /* correct code establishes a session */
  r = await run(auth, 'POST', { email: D, otp: loginOtp, remember: true }, undefined, Q('login-otp-verify'));
  assert(r.status === 200 && r.body.user.email === D, 'login-otp-verify logs the verified user in');
  const otpToken = r.body.token;
  assert(r.headers['Set-Cookie'] && r.headers['Set-Cookie'].indexOf('Max-Age=' + Math.round(sessionLib.TTL_REMEMBER / 1000)) !== -1, 'remember flag on OTP login produces a persistent cookie');
  r = await run(auth, 'GET', undefined, bear(otpToken), Q('me'));
  assert(r.status === 200, 'OTP login session resolves for /auth/me');

  /* used code is rejected */
  r = await run(auth, 'POST', { email: D, otp: loginOtp, remember: false }, undefined, Q('login-otp-verify'));
  assert(r.status === 400 && r.body.error === 'OTP_ALREADY_USED', 'login OTP is single-use (reuse rejected)');

  /* unknown email: generic request response + no account created */
  r = await run(auth, 'POST', { email: 'ghost@example.com' }, undefined, Q('login-otp'));
  assert(r.status === 200 && r.body.emailStatus !== undefined, 'login-otp gives a generic response for an unknown email');
  assert(!store._mem.users.find((u) => u.email === 'ghost@example.com'), 'login-otp does NOT create an account');
  r = await run(auth, 'POST', { email: 'ghost@example.com', otp: '123456', remember: false }, undefined, Q('login-otp-verify'));
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'login-otp-verify fails for an unknown email');

  /* unverified account does not receive a code */
  const UNV = 'otp-unverified@example.com';
  await store.createUser({
    id: crypto.randomToken(16), firstName: 'A', lastName: 'B', email: UNV,
    passwordHash: crypto.hashPassword(PASSWORD), emailVerified: false,
    phone: null, organization: null, country: null, lang: 'en',
    createdAt: crypto.nowIso(), updatedAt: crypto.nowIso(), lastLoginAt: null
  });
  const beforeUnv = mailer.calls.length;
  r = await run(auth, 'POST', { email: UNV }, undefined, Q('login-otp'));
  assert(r.status === 200, 'login-otp returns a generic response for an unverified account');
  assert(mailer.calls.length === beforeUnv, 'login-otp does NOT email an unverified account');
  r = await run(auth, 'POST', { email: UNV, otp: '123456', remember: false }, undefined, Q('login-otp-verify'));
  assert(r.status === 400 && r.body.error === 'OTP_INVALID', 'unverified account cannot log in via OTP');

  /* ================= PROFILE (real data + PATCH) ================= */
  const E = 'profile@example.com';
  const userE = await seedVerified(E);
  for (let i = 0; i < 3; i++) {
    await store.createAnalysis({ id: crypto.randomToken(16), userId: userE.id, searchId: crypto.randomToken(16), createdAt: crypto.nowIso() });
  }
  for (let i = 0; i < 2; i++) {
    await store.createSearch({ id: crypto.randomToken(16), userId: userE.id, query: 'q' + i, scope: 'public', status: 'done', createdAt: crypto.nowIso() });
  }
  await store.insertDownload({ id: crypto.randomToken(16), userId: userE.id, searchId: null, analysisId: null, fileType: 'csv', createdAt: crypto.nowIso() });

  r = await run(auth, 'POST', { email: E, password: PASSWORD }, undefined, Q('login'));
  const profToken = r.body.token;

  /* GET returns the REAL stored profile + usage counts */
  r = await run(users, 'GET', undefined, bear(profToken), Q('me'));
  assert(r.status === 200 && r.body.user.email === E, 'profile GET returns the authenticated user');
  assert(r.body.user.firstName === 'Nour' && r.body.user.lastName === 'Badea', 'profile returns the stored first/last name');
  assert(r.body.user.organization === 'Delta Digital Group' && r.body.user.country === 'eg', 'profile returns stored organization/country');
  assert(r.body.user.phone === '+201001112222', 'profile returns the stored phone');
  assert(r.body.user.emailVerified === true, 'profile returns the verification status');
  assert(r.body.usage && r.body.usage.analyses === 3 && r.body.usage.searches === 2 && r.body.usage.exports === 1, 'profile usage counts come from real data');

  /* unauthenticated profile request → 401 */
  r = await run(users, 'GET', undefined, undefined, Q('me'));
  assert(r.status === 401 && r.body.error === 'UNAUTHENTICATED', 'profile without a session returns 401');

  /* PATCH persists changes to the store */
  r = await run(users, 'PATCH', { firstName: 'Layla', lastName: 'Hassan', phone: '+201114445566', organization: 'Nile Data', country: 'ae' }, bear(profToken), Q('me'));
  assert(r.status === 200 && r.body.user.firstName === 'Layla' && r.body.user.lastName === 'Hassan', 'PATCH updates first/last name');
  assert(r.body.user.phone === '+201114445566' && r.body.user.organization === 'Nile Data' && r.body.user.country === 'ae', 'PATCH updates phone/org/country');

  /* refresh (GET again) returns the persisted values */
  r = await run(users, 'GET', undefined, bear(profToken), Q('me'));
  assert(r.body.user.firstName === 'Layla' && r.body.user.lastName === 'Hassan' && r.body.user.organization === 'Nile Data', 'GET after PATCH returns the saved values');
  assert(r.body.user.email === E, 'email stays tied to the authenticated account after PATCH');

  /* PATCH cannot change the email */
  r = await run(users, 'PATCH', { email: 'evil@example.com', lang: 'ar' }, bear(profToken), Q('me'));
  assert(r.body.user.email === E, 'PATCH ignores an email field (email immutable)');
  assert(r.body.user.lang === 'ar', 'PATCH persists a valid lang change');

  /* invalid lang rejected */
  r = await run(users, 'PATCH', { lang: 'xx' }, bear(profToken), Q('me'));
  assert(r.status === 422, 'PATCH rejects an invalid lang with 422');

  /* invalid name rejected */
  r = await run(users, 'PATCH', { firstName: '' }, bear(profToken), Q('me'));
  assert(r.status === 422, 'PATCH rejects an empty first name with 422');

  if (!process.exitCode) console.log('ALL TESTS PASSED');
})().catch((e) => { console.error(e); process.exitCode = 1; });
