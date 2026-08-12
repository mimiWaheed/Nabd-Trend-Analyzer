/* NABD — backend extraction + normalization of the n8n analysis response.
   Mirrors the client-side transport unwrap so persisted fields match what
   the dashboard renders. */

const ANALYSIS_KEYS = ['query', 'stats', 'sentiment', 'trendingTopics', 'aiBrief', 'aiHighlights', 'topLocations', 'topInfluencers', 'sampleSources', 'signalVolume', 'generatedAt', 'ok', 'dashboard', 'intelligence', 'meta'];

function hasAnalysisShape(o) {
  return o != null && typeof o === 'object' && ANALYSIS_KEYS.some((k) => o[k] != null);
}

function parseEmbeddedJson(s) {
  const t = String(s == null ? '' : s).trim();
  if (!t) return null;
  try { return JSON.parse(t); } catch (e) { /* brace scan below */ }
  const st = t.indexOf('{');
  const sa = t.indexOf('[');
  const s2 = st === -1 ? sa : (sa === -1 ? st : Math.min(st, sa));
  if (s2 === -1) return null;
  let depth = 0, quote = false, esc = false, end = -1;
  for (let i = s2; i < t.length; i++) {
    const c = t.charAt(i);
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') quote = false;
      continue;
    }
    if (c === '"') { quote = true; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end > s2) {
    try { return JSON.parse(t.slice(s2, end + 1)); } catch (e2) { return null; }
  }
  return null;
}

function extractAnalysisPayload(response) {
  let data = response;
  for (let guard = 0; guard < 4; guard++) {
    if (typeof data === 'string') {
      const inner = parseEmbeddedJson(data);
      if (inner && typeof inner === 'object') { data = inner; continue; }
      break;
    }
    if (Array.isArray(data)) { data = data[0] || null; continue; }
    if (data && typeof data === 'object') {
      if (hasAnalysisShape(data)) break;
      const s = data.text || data.response || data.result || data.body;
      if (typeof s === 'string' && s.trim()) {
        const inner = parseEmbeddedJson(s);
        if (inner && typeof inner === 'object') { data = inner; continue; }
      }
      if (data.output && typeof data.output === 'object') { data = data.output; continue; }
      break;
    }
    break;
  }
  return data;
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};
const str = (v, dflt) => (v == null || v === '' ? dflt : String(v));
const asArr = (v) => (Array.isArray(v) ? v : []);

/* real result records for persistence */
function extractResults(payload) {
  const out = [];
  const seen = new Set();
  const arrays = asArr(payload && (payload.articles || payload.resources || payload.results || payload.items || payload.posts || payload.news || payload.analysis_corpus || payload.sampleSources));
  const pick = (o, keys) => {
    for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k];
    return null;
  };
  arrays.forEach((it) => {
    if (!it || typeof it !== 'object') return;
    const title = str(pick(it, ['title', 'headline', 'name', 'text', 'content', 'post', 'message']), null);
    const url = str(pick(it, ['url', 'link', 'href']), null);
    const key = title || url;
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({
      title: title ? title.slice(0, 1000) : null,
      description: str(pick(it, ['description', 'summary', 'snippet', 'excerpt']), null),
      url,
      source: str(pick(it, ['source', 'sourceName', 'source_name', 'domain', 'publisher', 'author', 'channel']), null),
      publishedAt: str(pick(it, ['publishedAt', 'published_at', 'published', 'date', 'datetime', 'ts', 'timestamp', 'time', 'createdAt', 'observedAt']), null),
      relevance: num(pick(it, ['relevance', 'score']) || num(it && it.relevance) || num(it && it.score)),
      score: num(it && (it.score != null ? it.score : it.relevance)),
      raw: it
    });
    if (out.length >= 200) return out;
  });
  return out;
}

/* analysis fields for the analyses table */
function extractAnalysis(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const pick = (o, keys, dflt) => {
    for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k];
    return dflt;
  };
  const brief = (payload.aiBrief && typeof payload.aiBrief === 'object' && !Array.isArray(payload.aiBrief))
    ? payload.aiBrief
    : ((payload.brief && typeof payload.brief === 'object') ? payload.brief : null);
  let summary = pick(payload, ['summary', 'aiSummary', 'brief', 'aiBrief', 'answer', 'result', 'text'], null);
  if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
    summary = pick(summary, ['summary', 'text', 'content', 'brief'], null);
    if (summary && typeof summary === 'object') summary = null;
  }
  const confidence = brief && brief.confidence != null ? num(brief.confidence) : num(payload.confidence);
  return {
    headline: str(pick(brief, ['headline', 'title'], null), null),
    summary: summary ? String(summary).slice(0, 4000) : null,
    keyDevelopments: asArr(brief && brief.keyDevelopments).map((x) => String(x)).filter(Boolean).slice(0, 100),
    whyItMatters: str(brief && brief.whyItMatters, null),
    confidence: confidence != null ? confidence : null,
    sentiment: payload.sentiment && typeof payload.sentiment === 'object' ? payload.sentiment : null,
    trendingTopics: asArr(payload.trendingTopics),
    aiHighlights: asArr(payload.aiHighlights).slice(0, 50),
    topLocations: asArr(payload.topLocations).slice(0, 50)
  };
}

module.exports = { extractAnalysisPayload, extractResults, extractAnalysis };
