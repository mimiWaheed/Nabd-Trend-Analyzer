const fs = require('fs');

const WF = process.env.NABD_WORKFLOW_PATH || 'C:/Users/lunal/Downloads/توب علينا بقى.json';

if (!fs.existsSync(WF)) {
  console.log('SKIP: workflow file not found at ' + WF);
  process.exit(0);
}

const wf = JSON.parse(fs.readFileSync(WF, 'utf8'));
const node = (name) => wf.nodes.find((n) => n.name === name);
const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};

const metricsCode = node('Generate Dashboard Metrics').parameters.jsCode;
const mergeCode = node('Final Dashboard Merge').parameters.jsCode;

function runMetricsNode(agg) {
  const $ = () => ({ first: () => ({ json: agg }) });
  const fn = new Function('$input', '$', '$json', metricsCode);
  const result = fn({ all: () => [{ json: agg }] }, $, agg);
  return result[0].json;
}

function runMergeNode(metricsOut, aiOut) {
  const selectors = {
    'Generate Dashboard Metrics': () => ({ first: () => ({ json: metricsOut }) }),
    'Post-AI Validation': () => ({ first: () => ({ json: aiOut }) })
  };
  const $ = (name) => (selectors[name] ? selectors[name]() : null);
  const fn = new Function('$input', '$', mergeCode);
  const result = fn({ all: () => [{ json: metricsOut }, { json: aiOut }] }, $);
  return result[0].json;
}

// ---- realistic sample aggregation: 100 raw / 94 relevant / 25 analyzed ----
const SOURCES = ['اليوم السابع','المصري اليوم','الأهرام','الوطن','الشروق','مصراوي','الوفد','بوابة أخبار اليوم','الجمهورية','روز اليوسف','النهار','الدستور','القاهرة 24','مبتدا','صدى البلد'];
const SRCOUNTS = [10, 9, 8, 8, 7, 7, 6, 6, 6, 6, 5, 5, 4, 4, 3];
const TITLES = [
  'قتل أسرة في التجمع الخامس وسط حالة من الصدمة',
  'اعترافات المتهم الجديد في واقعة التجمع',
  'النيابة تأمر بحبس المتهم في حادث التجمع الخامس',
  'أهالي التجمع يطالبون بتشديد الأمن بعد الحادث',
  'تفاصيل جديدة حول جريمة قتل أسرة التجمع'
];
const DAYS = ['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07','2026-08-08','2026-08-09','2026-08-10'];

const articles = Array.from({ length: 94 }, (_, i) => ({
  id: i + 1,
  title: TITLES[i % TITLES.length] + ' ' + (i + 1),
  description: 'مصدر مطلع قال إن الحادث وقع في القاهرة الجديدة #التجمع #مصر',
  url: 'https://example.com/' + i,
  source: SOURCES[i % SOURCES.length],
  provider: i % 2 ? 'NewsAPI' : 'Google News',
  publishedAt: DAYS[i % 10] + 'T10:00:00Z',
  relevance: 70 + (i % 30),
  freshness: 90,
  daysOld: i % 8,
  score: 80 + (i % 15),
  egyptRelated: true,
  isRecent: true,
  isHistorical: false
}));

const sourceDistribution = SOURCES.map((source, i) => ({ source, count: SRCOUNTS[i] }));
const providerDistribution = [
  { provider: 'NewsAPI', count: 47 },
  { provider: 'Google News', count: 47 }
];
const signalVolume = DAYS.map((time, i) => ({ time, value: [5, 8, 12, 10, 18, 25, 30, 42, 55, 70][i] }));

const buildAgg = (overrides) => Object.assign({
  query: 'حادثة التجمع',
  stats: {
    rawResults: 100,
    uniqueResults: 100,
    relevantResults: 94,
    recentRelevantResults: 90,
    historicalRelevantResults: 4,
    analyzedResults: 25
  },
  sourceDistribution,
  providerDistribution,
  signalVolume,
  topLocations: [{ name: 'New Cairo', count: 60 }, { name: 'Cairo', count: 30 }],
  results: articles.slice(0, 40),
  recentResults: articles.slice(0, 30),
  historicalResults: articles.slice(90, 94),
  aiInput: articles.slice(0, 25)
}, overrides || {});

// ---------------------------------------------------------------
// Scenario 1: full aggregation — the deterministic source of truth
// ---------------------------------------------------------------
{
  const out = runMetricsNode(buildAgg());
  const dm = out.dashboardMetrics;
  const ov = dm.overview;

  assert(out.query === 'حادثة التجمع', 'metrics keeps query');
  assert(ov.totalResults === 100, 'overview.totalResults = 100 (rawResults), not 8');
  assert(ov.uniqueResults === 100, 'overview.uniqueResults = 100');
  assert(ov.relevantResults === 94, 'overview.relevantResults = 94');
  assert(ov.recentResults === 90, 'overview.recentResults = 90');
  assert(ov.historicalResults === 4, 'overview.historicalResults = 4');
  assert(ov.analyzedResults === 25, 'overview.analyzedResults = 25');
  assert(ov.analyzedResults !== ov.totalResults, 'analyzedResults is separate from totalResults');

  assert(Array.isArray(dm.keywords) && dm.keywords.length > 0, 'keywords extracted');
  const kw = dm.keywords.find((k) => k.keyword === 'التجمع');
  assert(!!kw && kw.count >= 5, 'keyword "التجمع" present with real count');
  assert(dm.keywords.every((k) => typeof k.count === 'number' && typeof k.percentage === 'number'), 'keywords carry count + percentage');
  assert(dm.keywords.every((k) => k.keyword !== 'في' && k.keyword !== 'من'), 'Arabic stopwords removed from keywords');

  assert(Array.isArray(dm.hashtags) && dm.hashtags.length >= 2, 'hashtags extracted');
  assert(!!dm.hashtags.find((h) => h.tag === '#التجمع') && !!dm.hashtags.find((h) => h.tag === '#مصر'), 'known hashtags present');

  assert(Array.isArray(dm.phrases) && dm.phrases.length > 0, 'phrases extracted');
  assert(dm.phrases.every((p) => p.phrase && p.count >= 1), 'phrases carry count');
  assert(dm.phrases.some((p) => p.phrase.indexOf('التجمع') !== -1), 'top phrases are query-relevant');

  assert(dm.sources.length === 15, 'sources from sourceDistribution (15)');
  assert(dm.sources[0].source === 'اليوم السابع' && dm.sources[0].count === 10, 'top source is اليوم السابع ×10');
  assert(Math.abs(dm.sources.reduce((a, s) => a + s.count, 0) - 94) === 0, 'source counts sum to 94');

  assert(dm.sourceDiversity.uniqueSources === 15, 'sourceDiversity counts 15 unique sources');
  assert(dm.sourceDiversity.label === 'High' && dm.sourceDiversity.score >= 0.7, 'distributed coverage => High diversity');

  assert(dm.providers.length === 2, 'provider distribution present');

  assert(dm.timeline.length === 10 && dm.timeline[0].date === '2026-08-01' && dm.timeline[9].date === '2026-08-10', 'timeline chronological from signalVolume');
  assert(dm.timelineSummary.peakDate === '2026-08-10' && dm.timelineSummary.peakCount === 70 && dm.timelineSummary.totalSignalDays === 10, 'timelineSummary peak/first/last correct');

  assert(dm.momentum.direction === 'rising' && dm.momentum.growthRate > 0, 'momentum rising on increasing volume');
  assert(dm.momentum.recentSignalCount === 222, 'momentum recentSignalCount = sum of last 5 days (222)');

  assert(dm.freshness.label === 'Fresh' && dm.freshness.recentPercentage === 100, 'freshness = Fresh (all <=14 days)');

  assert(dm.relevance.high === 20 && dm.relevance.medium === 24 && dm.relevance.low === 0, 'relevance distribution 20/24/0 over the 44-result pool');

  assert(dm.signalStrength.score >= 90 && dm.signalStrength.label === 'Very Strong', 'signalStrength high with strong components');
  assert(typeof dm.signalStrength.components.volume === 'number', 'signalStrength exposes components');

  assert(dm.locations.length === 2 && dm.locations[0].name === 'New Cairo' && dm.locations[0].count === 60, 'locations from topLocations, not inferred');

  assert(dm.coverage.articleCount === 94 && dm.coverage.sourceCount === 15 && dm.coverage.corroborationLevel === 'high', 'coverage distinguishes 94 articles / 15 sources');

  assert(dm.aiAnalysis.inputCount === 25 && Math.abs(dm.aiAnalysis.coveragePercentage - 26.6) < 0.1, 'aiAnalysis keeps AI subset separate (25 / ~26.6%)');
  assert(Array.isArray(dm.sampleSignals) && dm.sampleSignals.length === 8 && dm.sampleSignals[0].title.length > 0, 'sampleSignals derived from the real corpus (top 8)');
}

// ---------------------------------------------------------------
// Scenario 2: merge node combines metrics + AI intelligence
// ---------------------------------------------------------------
{
  const metricsOut = runMetricsNode(buildAgg());
  const aiOut = {
    query: 'حادثة التجمع',
    stats: { totalPosts: 25, activeTopics: 1, sentimentScore: -10 },
    sentiment: { positive: 20, neutral: 30, negative: 50, label: 'Negative' },
    trendingTopics: [{ rank: 1, topic: 'قتل أسرة التجمع الخامس', count: 20, severity: 'high' }],
    aiBrief: { headline: 'قتل أسرة في التجمع الخامس', summary: 'ملخص', keyDevelopments: ['تطور'], whyItMatters: 'أهمية', confidence: 85 },
    aiHighlights: [{ type: 'MAJOR DEVELOPMENT', title: 'عنوان', detail: 'تفاصيل', confidence: 90 }],
    topLocations: [{ name: 'New Cairo', count: 60 }]
  };
  const out = runMergeNode(metricsOut, aiOut);

  assert(out.query === 'حادثة التجمع', 'merge keeps query');
  assert(out.dashboard && out.dashboard.overview, 'merge exposes dashboard.overview');
  assert(out.dashboard.overview.totalResults === 100, 'dashboard.overview.totalResults = 100 (not AI totalPosts 25)');
  assert(out.dashboard.overview.analyzedResults === 25, 'dashboard.overview.analyzedResults = 25');
  assert(Array.isArray(out.dashboard.keywords) && out.dashboard.keywords.length > 0, 'merge carries dashboard.keywords');
  assert(Array.isArray(out.dashboard.timeline) && out.dashboard.timeline.length === 10, 'merge carries dashboard.timeline');
  assert(out.dashboard.momentum && out.dashboard.momentum.direction === 'rising', 'merge carries dashboard.momentum');

  assert(out.intelligence && out.intelligence.stats.totalPosts === 25, 'intelligence.stats preserved (AI analyzed count, separated)');
  assert(out.intelligence.trendingTopics[0].topic === 'قتل أسرة التجمع الخامس', 'intelligence.trendingTopics preserved');
  assert(out.intelligence.aiBrief.headline === 'قتل أسرة في التجمع الخامس', 'intelligence.aiBrief preserved');
  assert(out.intelligence.sentiment.label === 'Negative', 'intelligence.sentiment preserved');

  assert(out.meta.aggregationResults === 100, 'meta.aggregationResults = 100');
  assert(out.meta.aiAnalyzedResults === 25, 'meta.aiAnalyzedResults = 25');
  assert(typeof out.meta.generatedAt === 'string' && out.meta.generatedAt.length > 0, 'meta.generatedAt timestamp present');
}

// ---------------------------------------------------------------
// Scenario 3: empty aggregation — no throw, clean empty dashboard
// ---------------------------------------------------------------
{
  const out = runMetricsNode({ query: '' });
  const ov = out.dashboardMetrics.overview;
  assert(ov.totalResults === 0 && ov.analyzedResults === 0, 'empty agg -> zeroed overview');
  assert(out.dashboardMetrics.keywords.length === 0 && out.dashboardMetrics.hashtags.length === 0 && out.dashboardMetrics.phrases.length === 0, 'empty agg -> no invented keywords/hashtags/phrases');
  assert(out.dashboardMetrics.locations.length === 0, 'empty agg -> no invented locations');
  assert(out.dashboardMetrics.momentum.direction === 'insufficient_data', 'empty agg -> momentum insufficient_data');
  assert(out.dashboardMetrics.freshness.averageDaysOld === null, 'empty agg -> no fabricated freshness');

  const merged = runMergeNode(out, { query: '', stats: { totalPosts: 0 }, sentiment: { positive: 0, neutral: 100, negative: 0, label: 'Neutral' }, trendingTopics: [], aiBrief: null, aiHighlights: [], topLocations: [] });
  assert(merged.dashboard.overview.totalResults === 0, 'merge works with empty metrics (0 results)');
  assert(Array.isArray(merged.intelligence.trendingTopics) && merged.intelligence.trendingTopics.length === 0, 'merge tolerates empty AI arrays');
}

// ---------------------------------------------------------------
// Scenario 4: minimal aggregation — missing optional fields
// ---------------------------------------------------------------
{
  const out = runMetricsNode({ query: 'اختبار', stats: { rawResults: 8 } });
  const ov = out.dashboardMetrics.overview;
  assert(ov.totalResults === 8 && ov.relevantResults === 0, 'partial stats tolerated (rawResults=8, rest zeroed)');
  assert(ov.analyzedResults === 0, 'missing aiInput -> analyzedResults 0, never replaced by total');
  assert(out.dashboardMetrics.sources.length === 0 && out.dashboardMetrics.timeline.length === 0, 'missing distributions -> empty arrays, no throw');
}

console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
