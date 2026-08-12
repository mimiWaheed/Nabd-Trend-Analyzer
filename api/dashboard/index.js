/* GET /api/dashboard — aggregate the user's real data.
   Everything here is computed from the database — no random numbers. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();
  const uid = auth.user.id;

  const [totalSearches, completedAnalyses, fb, recentDownloads, activity, notifications, unread, recent] = await Promise.all([
    store.countSearches(uid),
    store.countAnalyses(uid),
    store.getFb(uid),
    store.listDownloads(uid, { limit: 5 }),
    store.listActivity(uid, { limit: 10 }),
    store.listNotifications(uid, { limit: 10 }),
    store.countUnreadNotifications(uid),
    store.listSearches(uid, { limit: 5, offset: 0 })
  ]);

  const connectedAccounts = [];
  if (fb && fb.status === 'connected') {
    connectedAccounts.push({
      id: 'facebook',
      name: 'Facebook',
      accountName: fb.accountName || null,
      accountId: fb.accountId || null,
      connectedAt: fb.connectedAt,
      lastSyncedAt: fb.lastSyncedAt || null,
      status: fb.status
    });
  }

  return ok(res, {
    stats: {
      totalSearches,
      completedAnalyses,
      connectedIntegrations: connectedAccounts.length,
      recentDownloads: recentDownloads.length
    },
    recentResearches: recent.map((s) => ({
      id: s.id,
      query: s.query,
      scope: s.scope,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    })),
    recentActivity: activity.map((a) => ({
      id: a.id,
      type: a.type,
      metadata: a.metadata || {},
      createdAt: a.createdAt
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: !!n.read,
      createdAt: n.createdAt
    })),
    unread,
    connectedAccounts
  });
};
