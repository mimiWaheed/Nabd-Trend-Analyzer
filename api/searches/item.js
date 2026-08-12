/* GET/DELETE /api/searches/:id — a single search with its results + analysis.
   User isolation: the search must belong to the authenticated user. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { fail, ok } = require('../_lib/respond');
const events = require('../_lib/events');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'DELETE') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const id = String((req.query && req.query.id) || '');
  if (!id) return fail(res, 400, 'BAD_REQUEST', 'Search id is required');

  const search = await store.getSearch(id);
  if (!search) return fail(res, 404, 'NOT_FOUND', 'Search not found');
  if (search.userId !== auth.user.id) return fail(res, 403, 'FORBIDDEN', 'You do not have access to this search');

  if (req.method === 'DELETE') {
    await store.deleteSearch(id);
    await events.logActivity(auth.user.id, 'SEARCH_DELETED', { query: search.query });
    return ok(res, { deleted: true });
  }

  const [results, analysis] = await Promise.all([
    store.listResultsBySearch(id),
    store.getAnalysisBySearch(id)
  ]);

  return ok(res, {
    search: {
      id: search.id,
      query: search.query,
      scope: search.scope,
      status: search.status,
      error: search.error || null,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt
    },
    results,
    analysis
  });
};
