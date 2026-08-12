/* GET /api/users/me/recent-researches — the user's actual recent searches. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const rows = await store.listSearches(auth.user.id, { limit: 10, offset: 0 });
  const items = rows.map((s) => ({
    id: s.id,
    query: s.query,
    scope: s.scope,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }));

  return ok(res, { researches: items });
};
