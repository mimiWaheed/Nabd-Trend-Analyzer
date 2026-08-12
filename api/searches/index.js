/* POST /api/searches — create a search record.
   GET  /api/searches — list the user's searches (paginated). */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, created, failCode } = require('../_lib/respond');
const { pagination } = require('../_lib/validate');
const { randomToken, nowIso } = require('../_lib/crypto');
const events = require('../_lib/events');

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

module.exports = async function handler(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    const { limit, offset } = pagination(req.query);
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

    const search = await store.createSearch({
      id: randomToken(16),
      userId: auth.user.id,
      query,
      scope,
      status: 'pending',
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
};
