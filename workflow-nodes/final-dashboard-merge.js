// ============================================================
// Final Dashboard Merge — combines the deterministic
// dashboardMetrics (from aggregation) with the AI intelligence
// into one clean contract for the dashboard.
//
// {
//   query,
//   dashboard: { overview, keywords, hashtags, phrases, sources,
//                sourceDiversity, providers, timeline, timelineSummary,
//                momentum, freshness, relevance, signalStrength,
//                locations, coverage, aiAnalysis },
//   intelligence: { stats, sentiment, trendingTopics, aiBrief,
//                   aiHighlights, topLocations },
//   meta: { aggregationResults, aiAnalyzedResults, generatedAt }
// }
//
// The dashboard renders fully even when the AI returns nothing.
// ============================================================

const asArr = (v) => (Array.isArray(v) ? v : []);

// --- Locate the two inputs regardless of connection order ---
let metrics = null;
let ai = null;

try {
  if ($input && typeof $input.all === 'function') {
    const items = $input.all();
    for (const it of items) {
      const j = it && it.json;
      if (!j || typeof j !== 'object') continue;
      if (j.dashboardMetrics && typeof j.dashboardMetrics === 'object') metrics = j;
      else if (j.trendingTopics || j.aiBrief || j.sentiment || j.topLocations || j.aiHighlights) ai = j;
    }
  }
} catch (_) { /* fall through to selectors */ }

try {
  if (!metrics && $('Generate Dashboard Metrics') && $('Generate Dashboard Metrics').first) {
    metrics = $('Generate Dashboard Metrics').first().json || null;
  }
  if (!ai && $('Post-AI Validation') && $('Post-AI Validation').first) {
    ai = $('Post-AI Validation').first().json || null;
  }
} catch (_) { /* best effort */ }

metrics = metrics || {};
ai = ai || {};

const dm = (metrics.dashboardMetrics && typeof metrics.dashboardMetrics === 'object') ? metrics.dashboardMetrics : {};
const overview = (dm.overview && typeof dm.overview === 'object' && !Array.isArray(dm.overview)) ? dm.overview : {};

const dashboard = {
  overview,
  keywords: asArr(dm.keywords),
  hashtags: asArr(dm.hashtags),
  phrases: asArr(dm.phrases),
  sources: asArr(dm.sources),
  sourceDiversity: dm.sourceDiversity || null,
  providers: asArr(dm.providers),
  timeline: asArr(dm.timeline),
  timelineSummary: dm.timelineSummary || null,
  momentum: dm.momentum || null,
  freshness: dm.freshness || null,
  relevance: dm.relevance || null,
  signalStrength: dm.signalStrength || null,
  locations: asArr(dm.locations),
  coverage: dm.coverage || null,
  aiAnalysis: dm.aiAnalysis || null,
  sampleSignals: asArr(dm.sampleSignals)
};

const intelligence = {
  stats: (ai.stats && typeof ai.stats === 'object') ? ai.stats : null,
  sentiment: (ai.sentiment && typeof ai.sentiment === 'object') ? ai.sentiment : null,
  trendingTopics: asArr(ai.trendingTopics),
  aiBrief: (ai.aiBrief && typeof ai.aiBrief === 'object') ? ai.aiBrief : null,
  aiHighlights: asArr(ai.aiHighlights),
  topLocations: asArr(ai.topLocations)
};

const meta = {
  aggregationResults: overview.totalResults != null ? overview.totalResults : 0,
  aiAnalyzedResults: overview.analyzedResults != null ? overview.analyzedResults : 0,
  generatedAt: new Date().toISOString()
};

return [{
  json: {
    query: String(ai.query || metrics.query || ''),
    dashboard,
    intelligence,
    meta
  }
}];
