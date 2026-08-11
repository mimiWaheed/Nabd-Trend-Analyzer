// ============================================================
// Post-AI Validation — deterministic source of truth
// The AI may guess counters; the workflow does not trust them.
// ============================================================

const agg = $('Aggregate Signals1').first().json || {};
const aiInput = Array.isArray(agg.aiInput) ? agg.aiInput : [];
const actualCount = aiInput.length;

// --- Extract the AI payload from any chainLlm output shape ---
function findPayload(input) {
  if (!input || typeof input !== 'object') return null;
  if (input.output && typeof input.output === 'object') return input.output;
  const candidates = [];
  if (typeof input.text === 'string') candidates.push(input.text);
  if (typeof input.response === 'string') candidates.push(input.response);
  for (const candidate of candidates) {
    try {
      const cleaned = candidate.replace(/```(?:json)?/gi, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        if (parsed && typeof parsed === 'object') return parsed;
      }
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {
      // try next candidate
    }
  }
  return null;
}

const payload = findPayload($json);

// --- Empty-case defaults ---
const emptyCase = {
  query: agg.query || '',
  stats: { totalPosts: actualCount, activeTopics: 0, sentimentScore: 0 },
  sentiment: { positive: 0, neutral: 100, negative: 0, label: 'Neutral' },
  trendingTopics: [],
  aiBrief: { headline: '', summary: '', keyDevelopments: [], whyItMatters: '', confidence: 0 },
  aiHighlights: [],
  topLocations: []
};

if (!payload || actualCount === 0) {
  emptyCase.query = String((payload && payload.query) || agg.query || '');
  return [{ json: emptyCase }];
}

// --- Merge the AI's semantic fields over the safe defaults ---
const out = { ...emptyCase, ...payload };
out.query = String(payload.query || agg.query || '');

out.stats = { ...emptyCase.stats, ...(payload.stats || {}) };

// DETERMINISTIC OVERRIDES — the workflow is authoritative
out.stats.totalPosts = actualCount;
if (actualCount === 0) {
  out.stats.activeTopics = 0;
}

// --- Sentiment: clamp + normalize so percentages sum to exactly 100 ---
const src = { ...emptyCase.sentiment, ...(payload.sentiment || {}) };
let pos = Number(src.positive) || 0;
let neu = Number(src.neutral) || 0;
let neg = Number(src.negative) || 0;

const total = pos + neu + neg;
if (total > 0) {
  pos = Math.round((pos / total) * 100);
  neu = Math.round((neu / total) * 100);
  neg = Math.round((neg / total) * 100);
  const diff = 100 - (pos + neu + neg);
  if (diff !== 0) {
    if (neu + diff >= 0) neu += diff;
    else if (pos + diff >= 0) pos += diff;
    else neg += diff;
  }
} else {
  pos = 0;
  neu = 100;
  neg = 0;
}

const label = ['Positive', 'Neutral', 'Negative'].includes(src.label)
  ? src.label
  : pos > neg
    ? 'Positive'
    : neg > pos
      ? 'Negative'
      : 'Neutral';

out.sentiment = { positive: pos, neutral: neu, negative: neg, label };
out.stats.sentimentScore = pos - neg;

// --- Structural guards for semantic fields ---
if (!Array.isArray(out.trendingTopics)) out.trendingTopics = [];
if (!Array.isArray(out.aiHighlights)) out.aiHighlights = [];
if (!Array.isArray(out.topLocations)) out.topLocations = [];

if (!out.aiBrief || typeof out.aiBrief !== 'object') {
  out.aiBrief = { headline: '', summary: '', keyDevelopments: [], whyItMatters: '', confidence: 0 };
} else {
  out.aiBrief = {
    headline: String(out.aiBrief.headline || ''),
    summary: String(out.aiBrief.summary || ''),
    keyDevelopments: Array.isArray(out.aiBrief.keyDevelopments) ? out.aiBrief.keyDevelopments : [],
    whyItMatters: String(out.aiBrief.whyItMatters || ''),
    confidence: Number(out.aiBrief.confidence) || 0
  };
}

out.trendingTopics = out.trendingTopics.slice(0, 5);
out.aiHighlights = out.aiHighlights.slice(0, 5);
out.topLocations = out.topLocations.slice(0, 10);

return [{ json: out }];
