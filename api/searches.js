/* NABD — consolidated searches endpoint.
   GET  /api/searches                 list the user's searches (default)
   POST /api/searches                 create a search record (default)
   /api/searches?action=item&id=…     GET / DELETE a single search
   (id passed as a query param instead of a URL segment so one function
   handles list + item without Vercel path rewrites.) */

const { requireAuth } = require('../lib/auth');
const storeApi = require('../lib/store');
const { asyncBody, fail, ok, created, failCode, queryOf } = require('../lib/respond');
const { pagination } = require('../lib/validate');
const { randomToken, nowIso } = require('../lib/crypto');
const events = require('../lib/events');

const CATEGORIES = ['news', 'social', 'gov', 'sport', 'business'];

function toClient(s) {
  return {
    id: s.id,
    query: s.query,
    scope: s.scope,
    status: s.status,
    error: s.error || null,
    category: CATEGORIES.indexOf(s.category) !== -1 ? s.category : null,
    sourceCount: s.sourceCount != null ? Number(s.sourceCount) : null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  };
}

/* GET list / POST create. */
async function actionIndex(req, res, q) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    const { limit, offset } = pagination(q);
    const [rows, total] = await Promise.all([
      store.listSearches(auth.user.id, { limit, offset }),
      store.countSearches(auth.user.id)
    ]);
    return ok(res, { searches: rows.map(toClient), pagination: { limit, offset, total } });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }
    const query = String((body && body.query) || '').trim();
    const scope = body && body.scope === 'private' ? 'private' : 'public';
    if (!query) return fail(res, 422, 'VALIDATION_ERROR', 'Query is required');
    if (query.length > 500) return fail(res, 422, 'VALIDATION_ERROR', 'Query is too long');

    const rawCat = body && body.category != null ? String(body.category).toLowerCase() : '';
    const category = CATEGORIES.indexOf(rawCat) !== -1 ? rawCat : null;
    let sourceCount = null;
    if (body && body.sourceCount != null && body.sourceCount !== '') {
      const n = parseInt(body.sourceCount, 10);
      if (Number.isNaN(n) || n < 0) return fail(res, 422, 'VALIDATION_ERROR', 'sourceCount must be a non-negative integer');
      sourceCount = Math.min(n, 1000000);
    }

    const VALID_STATUSES = ['pending', 'processing', 'completed', 'error'];
    const rawStatus = body && body.status ? String(body.status).toLowerCase() : 'pending';
    const status = VALID_STATUSES.indexOf(rawStatus) !== -1 ? rawStatus : 'pending';

    const search = await store.createSearch({
      id: randomToken(16),
      userId: auth.user.id,
      query,
      scope,
      status,
      error: null,
      category,
      sourceCount,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
    await events.logActivity(auth.user.id, 'SEARCH_CREATED', { query, category, sourceCount });
    return created(res, { search: toClient(search) });
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED');
}

/* GET/DELETE item — a single search with its results + analysis.
   User isolation: the search must belong to the authenticated user. */
async function actionItem(req, res, q) {
  if (req.method !== 'GET' && req.method !== 'DELETE') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  const id = String((q && q.id) || '');
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
}

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  let action = String(q.action || '');
  if (!action) action = req.method === 'POST' ? 'create' : 'list';
  switch (action) {
    case 'list':
    case 'create': return actionIndex(req, res, q);
    case 'item': return actionItem(req, res, q);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown searches action: ' + (action || '(none)'));
  }
};
