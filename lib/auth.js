/* NABD — auth middleware + current-user resolution + role helpers. */

const storeApi = require('./store');
const sessionLib = require('./session');
const { failCode, publicUser } = require('./respond');

const ROLES = { ANALYST: 'analyst', ADMIN: 'nabd_admin', SUPERADMIN: 'superadmin' };
const SUPERADMIN_EMAIL = 'bizzlingmari@gmail.com';

function roleOf(user) {
  return (user && user.role) || ROLES.ANALYST;
}

function isAdmin(user) {
  const r = roleOf(user);
  return r === ROLES.ADMIN || r === ROLES.SUPERADMIN;
}

function isSuperAdmin(user) {
  return roleOf(user) === ROLES.SUPERADMIN;
}

async function requireAuth(req, res) {
  const session = await sessionLib.resolveSession(req);
  if (!session) {
    failCode(res, 'UNAUTHENTICATED', 'Authentication required');
    return null;
  }
  const store = storeApi.makeStore();
  const user = await store.findUserById(session.userId);
  if (!user) {
    await store.deleteSessionByTokenHash(session.tokenHash);
    failCode(res, 'UNAUTHENTICATED', 'Session is no longer valid');
    return null;
  }
  if (!user.emailVerified) {
    await store.deleteSessionByTokenHash(session.tokenHash);
    failCode(res, 'EMAIL_NOT_VERIFIED', 'Please verify your email before continuing.');
    return null;
  }
  return { session, user, public: publicUser(user) };
}

async function requireAdmin(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return null;
  if (!isAdmin(auth.user)) {
    failCode(res, 'FORBIDDEN', 'Admin access required');
    return null;
  }
  return auth;
}

module.exports = { requireAuth, requireAdmin, ROLES, SUPERADMIN_EMAIL, roleOf, isAdmin, isSuperAdmin };
