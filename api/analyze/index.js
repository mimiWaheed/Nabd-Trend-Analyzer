/* POST /api/analyze — run an analysis through the n8n service and persist it.
   The n8n webhook is called server-side; stored Facebook tokens (decrypted
   at rest) are injected for private scope and never exposed to the browser. */

const { requireAuth } = require('../_lib/auth');
const { asyncBody, fail, ok, failCode } = require('../_lib/respond');
const { runAnalysis } = require('../_lib/analysis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const query = String((body && body.query) || '').trim();
  if (!query) return fail(res, 422, 'VALIDATION_ERROR', 'Query is required');
  if (query.length > 500) return fail(res, 422, 'VALIDATION_ERROR', 'Query is too long');

  try {
    const out = await runAnalysis(auth.user, { query, scope: body.scope });
    return ok(res, {
      search: out.search,
      analysis: out.analysis,
      results: out.results,
      data: out.data
    });
  } catch (e) {
    if (e && e.code === 'FACEBOOK_NOT_CONNECTED') return failCode(res, 'FORBIDDEN', 'Private analysis requires a connected Facebook account');
    if (e && e.code === 'FACEBOOK_TOKEN_MISSING') return failCode(res, 'FORBIDDEN', 'The connected account token is unavailable');
    if (e && e.code === 'VALIDATION_ERROR') return fail(res, 422, 'VALIDATION_ERROR', e.message);
    return fail(res, 502, 'ANALYSIS_FAILED', 'The analysis service could not complete this request');
  }
};
