/* NABD — session management.
   Opaque random token stored as a DB-backed session. The token itself is
   delivered to the browser as an HttpOnly cookie (and optionally echoed in
   the JSON body so non-cookie clients/tests can use `Authorization: Bearer`).
   Only the SHA-256 hash of the token is persisted. */

const crypto = require('crypto');
const { randomToken } = require('./crypto');
const storeApi = require('./store');

const COOKIE = 'nabd_session';
const TTL_REMEMBER = 30 * 24 * 3600 * 1000;
const TTL_SHORT = 12 * 3600 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cookieValue(token, remember, secure) {
  const maxAge = Math.round((remember ? TTL_REMEMBER : TTL_SHORT) / 1000);
  const parts = [
    COOKIE + '=' + encodeURIComponent(token),
    'Path=/',
    'Max-Age=' + maxAge,
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function tokenFromRequest(req) {
  const header = req.headers && req.headers.authorization;
  if (header && /^Bearer\s+/i.test(header)) {
    return header.replace(/^Bearer\s+/i, '').trim();
  }
  const cookieHeader = req.headers && req.headers.cookie;
  if (cookieHeader) {
    const m = cookieHeader.split(';').map((s) => s.trim()).find((s) => s.indexOf(COOKIE + '=') === 0);
    if (m) return decodeURIComponent(m.slice(COOKIE.length + 1));
  }
  return '';
}

async function createSession(req, userId, remember) {
  const store = storeApi.makeStore();
  const token = randomToken(32);
  const now = Date.now();
  const ttl = remember ? TTL_REMEMBER : TTL_SHORT;
  const session = {
    id: randomToken(16),
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(now + ttl).toISOString(),
    ip: req.headers && (req.headers['x-forwarded-for'] || '').split(',')[0] || '',
    userAgent: req.headers && req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 512) : ''
  };
  await store.createSession(session);
  const secure = !!(req.headers && (req.headers['x-forwarded-proto'] === 'https' || req.secure));
  return { token, cookie: cookieValue(token, remember, secure), expiresAt: session.expiresAt };
}

async function resolveSession(req) {
  const store = storeApi.makeStore();
  const token = tokenFromRequest(req);
  if (!token) return null;
  const session = await store.findSessionByTokenHash(hashToken(token));
  if (!session) return null;
  return session;
}

function clearCookie(req, res) {
  res.setHeader('Set-Cookie', COOKIE + '=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
}

module.exports = { COOKIE, createSession, resolveSession, clearCookie, hashToken, TTL_REMEMBER, TTL_SHORT };
