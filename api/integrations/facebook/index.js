/* GET /api/integrations/facebook — connection status (never exposes tokens).
   DELETE /api/integrations/facebook — disconnect + revoke (best-effort). */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');
const fbLib = require('../../_lib/facebook');
const events = require('../_lib/events');

module.exports = async function handler(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    const fb = await store.getFb(auth.user.id);
    if (!fb || fb.status !== 'connected') {
      return ok(res, { connected: false });
    }
    return ok(res, {
      connected: true,
      connection: {
        id: fb.id,
        accountName: fb.accountName || null,
        accountId: fb.accountId || null,
        igUserId: fb.igUserId || null,
        status: fb.status,
        connectedAt: fb.connectedAt,
        lastSyncedAt: fb.lastSyncedAt || null
      }
    });
  }

  if (req.method === 'DELETE') {
    await store.deleteFb(auth.user.id);
    await fbLib.revokeUserToken(auth.user.id);
    await events.logActivity(auth.user.id, 'FACEBOOK_DISCONNECTED', {});
    await events.createNotification(auth.user.id, 'conn', 'Facebook disconnected', 'Your Facebook account was disconnected.');
    return ok(res, { connected: false });
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED');
};
