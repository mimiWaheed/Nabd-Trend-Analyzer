/* POST /api/downloads — record a real download.
   GET  /api/downloads — list the user's download history. */

const { requireAuth } = require('../_lib/auth');
const storeApi = require('../_lib/store');
const { asyncBody, fail, ok, created } = require('../_lib/respond');
const { randomToken, nowIso } = require('../_lib/crypto');
const events = require('../_lib/events');

const FILE_TYPES = ['pdf', 'csv', 'xlsx', 'json', 'png', 'zip', 'report'];

module.exports = async function handler(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const store = storeApi.makeStore();

  if (req.method === 'GET') {
    let limit = parseInt(String((req.query && req.query.limit) || '20'), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const rows = await store.listDownloads(auth.user.id, { limit });
    return ok(res, {
      downloads: rows.map((d) => ({
        id: d.id,
        searchId: d.searchId || null,
        analysisId: d.analysisId || null,
        fileType: d.fileType,
        createdAt: d.createdAt
      }))
    });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

    const fileType = String((body && body.fileType) || '').toLowerCase();
    if (FILE_TYPES.indexOf(fileType) === -1) return fail(res, 422, 'VALIDATION_ERROR', 'Unsupported file type');
    const searchId = body && body.searchId ? String(body.searchId) : null;
    const analysisId = body && body.analysisId ? String(body.analysisId) : null;

    /* ownership: a provided search/analysis must belong to the user */
    if (searchId) {
      const s = await store.getSearch(searchId);
      if (!s) return fail(res, 404, 'NOT_FOUND', 'Search not found');
      if (s.userId !== auth.user.id) return fail(res, 403, 'FORBIDDEN', 'Access denied');
    }

    const download = await store.insertDownload({
      id: randomToken(16),
      userId: auth.user.id,
      searchId,
      analysisId,
      fileType,
      createdAt: nowIso()
    });

    await events.logActivity(auth.user.id, 'RESULT_DOWNLOADED', { fileType, searchId });

    return created(res, {
      download: {
        id: download.id,
        searchId: download.searchId || null,
        analysisId: download.analysisId || null,
        fileType: download.fileType,
        createdAt: download.createdAt
      }
    });
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED');
};
