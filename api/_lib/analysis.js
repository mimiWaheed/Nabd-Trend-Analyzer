/* NABD — analysis runner. Creates a search, calls the n8n analysis webhook
   server-side (injecting the stored, decrypted Facebook token for private
   scope — tokens never reach the browser), validates + normalizes the
   response, persists results + analysis, and updates the search status.

   n8n is an external analysis service only — the backend owns persistence. */

const { randomToken, nowIso } = require('./crypto');
const storeApi = require('./store');
const { decryptSecret } = require('./crypto');
const { extractAnalysisPayload, extractResults, extractAnalysis } = require('./normalize');
const events = require('./events');

const DEFAULT_WEBHOOK = 'https://n8n.addme.solutions/webhook/trend-analysis';

function webhookUrl() {
  return process.env.NABD_WEBHOOK_URL || DEFAULT_WEBHOOK;
}

function buildError(e) {
  return Object.assign(new Error(e && e.message ? e.message : 'ANALYSIS_FAILED'), {
    code: (e && e.code) || 'ANALYSIS_FAILED'
  });
}

async function callWebhook(payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(webhookUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    if (!res.ok) throw buildError(Object.assign(new Error('trend-analysis http ' + res.status), { code: 'ANALYSIS_HTTP_' + res.status }));
    const txt = await res.text();
    if (!txt || !txt.trim()) throw buildError(new Error('trend-analysis empty response'));
    let json;
    try { json = JSON.parse(txt); } catch (e) { throw buildError(new Error('trend-analysis invalid json')); }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param user       authenticated user
 * @param opts       { query, scope }
 * @returns { search, results, analysis, data }
 */
async function runAnalysis(user, opts) {
  const store = storeApi.makeStore();
  const scope = opts && opts.scope === 'private' ? 'private' : 'public';
  const query = String((opts && opts.query) || '').trim();
  if (!query) throw buildError(Object.assign(new Error('query is required'), { code: 'VALIDATION_ERROR' }));

  const search = await store.createSearch({
    id: randomToken(16),
    userId: user.id,
    query,
    scope,
    status: 'processing',
    error: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });

  const payload = { query, scope, prompt: query };
  if (scope === 'private') {
    const fb = await store.getFb(user.id);
    if (!fb || fb.status !== 'connected') {
      await store.updateSearch(search.id, { status: 'failed', error: 'FACEBOOK_NOT_CONNECTED' });
      throw buildError(Object.assign(new Error('Private analysis requires a connected Facebook account'), { code: 'FACEBOOK_NOT_CONNECTED' }));
    }
    const token = decryptSecret(fb.pageAccessTokenEnc) || decryptSecret(fb.userTokenEnc);
    if (!token) {
      await store.updateSearch(search.id, { status: 'failed', error: 'FACEBOOK_TOKEN_MISSING' });
      throw buildError(Object.assign(new Error('Connected account token is unavailable'), { code: 'FACEBOOK_TOKEN_MISSING' }));
    }
    payload.accessToken = token;
    if (fb.accountId) payload.accountId = fb.accountId;
    if (fb.igUserId) payload.igUserId = fb.igUserId;
  }

  let raw;
  try {
    raw = await callWebhook(payload);
  } catch (e) {
    await store.updateSearch(search.id, { status: 'failed', error: e.code || 'ANALYSIS_FAILED' });
    await events.logActivity(user.id, 'SEARCH_FAILED', { query, error: e.code || 'ANALYSIS_FAILED' });
    throw e;
  }

  const data = extractAnalysisPayload(raw);

  let results = [];
  let analysisRec = null;
  try {
    results = extractResults(data).slice(0, 200);
    if (results.length) {
      await store.insertResults(results.map((r) => Object.assign({}, r, { id: randomToken(16), searchId: search.id, createdAt: nowIso() })));
    }
  } catch (e) { /* results persistence is best-effort */ }

  try {
    const fields = extractAnalysis(data);
    analysisRec = await store.createAnalysis({
      id: randomToken(16),
      searchId: search.id,
      userId: user.id,
      headline: fields.headline,
      summary: fields.summary,
      keyDevelopments: fields.keyDevelopments,
      whyItMatters: fields.whyItMatters,
      confidence: fields.confidence,
      sentiment: fields.sentiment,
      trendingTopics: fields.trendingTopics,
      aiHighlights: fields.aiHighlights,
      topLocations: fields.topLocations,
      raw: data,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  } catch (e) {
    if (typeof console !== 'undefined') console.error('[nabd-analysis] persist analysis:', e.message);
  }

  await store.updateSearch(search.id, { status: 'completed', error: null });
  await events.logActivity(user.id, 'SEARCH_COMPLETED', { query });
  await events.logActivity(user.id, 'ANALYSIS_CREATED', { query });
  await events.createNotification(user.id, 'ai', 'Analysis completed', 'Analysis for "' + query + '" is ready.');

  return { search: Object.assign({}, search, { status: 'completed' }), results, analysis: analysisRec, data };
}

module.exports = { runAnalysis, webhookUrl };
