/* NABD — auth middleware + current-user resolution. */

const storeApi = require('./store');
const sessionLib = require('./session');
const { failCode, publicUser } = require('./respond');

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

module.exports = { requireAuth };
