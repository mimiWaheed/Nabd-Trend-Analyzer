// ============================================================
// Generate Dashboard Metrics — deterministic analytics layer
// Runs AFTER the aggregation stage. The source of truth for every
// number here is the aggregation object — never the AI output.
// No LLM calls. No fabricated data. Missing fields -> [] / 0 / null.
// ============================================================

const agg =
  ($json && typeof $json === 'object' && !Array.isArray($json) && $json.query !== undefined)
    ? $json
    : (($('Aggregate Signals1') || {}).first ? $('Aggregate Signals1').first().json : $json || {});

// ------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------
const clean = (v) => (v === null || v === undefined ? '' : String(v));
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const int = (v, dflt) => { const n = num(v); return n == null ? dflt : Math.round(n); };
const round = (v, d) => { const n = num(v); if (n == null) return null; const f = Math.pow(10, d); return Math.round(n * f) / f; };
const round0 = (v) => round(v, 0);
const round2 = (v) => round(v, 2);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const mean = (arr) => { if (!arr.length) return null; const s = arr.reduce((a, b) => a + b, 0); return s / arr.length; };
const arr = (v) => (Array.isArray(v) ? v : []);
const asArr = (v) => (Array.isArray(v) ? v : []);

// ------------------------------------------------------------
// Result pool — union of every signal list the aggregation emits,
// deduplicated by URL / normalized title. The AI never touches this.
// ------------------------------------------------------------
const pool = [];
const seenKeys = new Set();
for (const list of [agg.results, agg.recentResults, agg.historicalResults, agg.aiInput]) {
  if (!Array.isArray(list)) continue;
  for (const it of list) {
    if (!it || typeof it !== 'object') continue;
    const key = clean(it.url || it.title || '').trim().toLowerCase() || null;
    if (key) {
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
    }
    pool.push(it);
  }
}

const st = (agg.stats && typeof agg.stats === 'object' && !Array.isArray(agg.stats)) ? agg.stats : {};

// ------------------------------------------------------------
// Overview — deterministic counts straight from aggregation stats
// ------------------------------------------------------------
const totalResults = int(st.rawResults, pool.length);
const uniqueResults = int(st.uniqueResults, pool.length);
const relevantResults = int(st.relevantResults, pool.length);
const recentResults = int(st.recentRelevantResults, pool.filter((r) => r && r.isRecent).length);
const historicalResults = int(st.historicalRelevantResults, pool.filter((r) => r && r.isHistorical).length);
const analyzedResults = int(st.analyzedResults, asArr(agg.aiInput).length || pool.length);

const relVals = pool.map((r) => num(r && r.relevance != null ? r.relevance : r && r.score)).filter((v) => v != null);
const freshVals = pool.map((r) => num(r && r.freshness)).filter((v) => v != null);
const scoreVals = pool.map((r) => num(r && r.score)).filter((v) => v != null);

// ------------------------------------------------------------
// Arabic-aware text mining
// ------------------------------------------------------------
function normalizeForMining(text) {
  return clean(text)
    .replace(/https?:\/\/\S+/gi, ' ')                 // URLs
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')       // diacritics + tatweel
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')        // أ إ آ -> ا
    .replace(/\u0649/g, '\u064A')                      // ى -> ي
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z\s]/g, ' ')            // emojis, digits, punct, #, @
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeMining(text) {
  return normalizeForMining(text).split(/\s+/).filter(Boolean);
}

const AR_STOP = new Set([
  'في','من','على','إلى','الى','عن','مع','هذا','هذه','ذلك','تلك','التي','الذي','هو','هي','هم',
  'كان','كانت','يكون','أن','ان','إن','ما','لا','لم','لن','بعد','قبل','ثم','قد','كما','و','ف','ب','ل','ك',
  'أو','او','أي','اي','إلا','الا','بين','حتى','عند','إذا','اذا','إذ','حيث','نحو','دون','مثل','أكثر',
  'اكثر','منذ','غير','ضمن','هناك','فقط','تكون','وهو','وهي','أمام','امام','خلال','بعض','كل','كلا',
  'عبر','إليه','اليها','معه','معها','له','لها','منها','منه','به','بها','لو','إنما','هنا','فيه','فيها',
  'عنه','عنها','لدى','عليها','عليه','وله','ولها','لأن','ولكن','لكن','إذن','سوف','سوى','بما','أما','اما'
]);

const EN_STOP = new Set([
  'the','a','an','and','or','of','in','on','at','to','for','with','from','by','is','are','was','were',
  'be','been','being','it','its','this','that','these','those','as','into','than','then','after','before',
  'over','under','out','about','not','no','but','also','his','her','their','they','them','he','she','we',
  'you','your','our','us','me','my','up','down','off','again','once','here','there','when','where','why',
  'how','all','any','both','each','few','more','most','other','some','such','only','own','same','so','too',
  'very','can','will','just','should','would','could','may','might','must','new','today','yesterday',
  'report','reports','update','updates','latest','minute','minutes','hour','hours','day','days','week',
  'weeks','said','says'
]);

// Generic news boilerplate — removed UNLESS the word is part of the query
// (then it is clearly meaningful to the story).
const AR_BOILER = new Set([
  'تفاصيل','اليوم','تصريحات','أخبار','اخبار','مصر','المصرية','المصريه','تقرير','عاجل','فيديو','صور',
  'الأن','الان','شاهد','مباشر','المزيد','المركزية','الإخبارية','الاخبارية','متابعة','خاص','أعلن','اعلن'
]);
const EN_BOILER = new Set(['egypt','cairo','breaking','breakingnews','live','liveblog','liveupdate','liveupdates','watch','video','videos','photo','photos','gallery','breakingnews']);

const queryTokens = new Set(tokenizeMining(agg.query || ''));

function filterTokens(tokens) {
  const out = [];
  for (const t of tokens) {
    if (!t) continue;
    if (t.length < 2) continue;
    if (AR_STOP.has(t) || EN_STOP.has(t)) continue;
    if (AR_BOILER.has(t) || EN_BOILER.has(t)) {
      if (queryTokens.has(t)) out.push(t);
      continue;
    }
    out.push(t);
  }
  return out;
}

// Raw + normalized text pairs for the full corpus (title + description + content).
const texts = pool.map((r) => {
  const raw = clean(r && (r.title || '') + ' ' + (r.description || '') + ' ' + (r.content || ''));
  return { raw, norm: normalizeForMining(raw) };
});
const corpus = texts.map((t) => t.norm);

// ------------------------------------------------------------
// Keywords — top 20, count + percentage of the corpus
// ------------------------------------------------------------
const kwCount = {};
for (const text of corpus) {
  const seenIn = new Set();
  for (const tok of filterTokens(tokenizeMining(text))) {
    if (seenIn.has(tok)) continue;
    seenIn.add(tok);
    kwCount[tok] = (kwCount[tok] || 0) + 1;
  }
}
const kwTotal = pool.length || 1;
const keywords = Object.keys(kwCount)
  .map((keyword) => ({ keyword, count: kwCount[keyword], percentage: round0((kwCount[keyword] / kwTotal) * 100) }))
  .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword, 'ar'))
  .slice(0, 20);

// ------------------------------------------------------------
// Hashtags — extracted from the RAW text, never invented
// ------------------------------------------------------------
const htCount = {};
for (const t of texts) {
  const matches = String(t.raw).match(/#([^\s#،,.;:!؟()\[\]]+)/g) || [];
  const seenIn = new Set();
  for (const m of matches) {
    const tag = m.replace(/[.,،:;!؟]+$/g, '');
    if (tag.length < 2) continue;
    const norm = tag.toLowerCase();
    if (seenIn.has(norm)) continue;
    seenIn.add(norm);
    htCount[norm] = (htCount[norm] || 0) + 1;
  }
}
const hashtags = Object.keys(htCount)
  .map((tag) => ({ tag, count: htCount[tag], percentage: round0((htCount[tag] / kwTotal) * 100) }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

// ------------------------------------------------------------
// Phrases — 2 & 3 word n-grams from filtered tokens
// ------------------------------------------------------------
const phraseCount = {};
for (const text of corpus) {
  const toks = filterTokens(tokenizeMining(text));
  for (const n of [2, 3]) {
    for (let i = 0; i <= toks.length - n; i++) {
      const phrase = toks.slice(i, i + n).join(' ');
      if (phrase.length < 3) continue;
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    }
  }
}
const phrases = Object.keys(phraseCount)
  .map((phrase) => ({ phrase, count: phraseCount[phrase] }))
  .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase, 'ar'))
  .slice(0, 20);

// ------------------------------------------------------------
// Sources — use sourceDistribution when present, else derive
// ------------------------------------------------------------
let srcList = [];
if (asArr(agg.sourceDistribution).length) {
  srcList = asArr(agg.sourceDistribution).map((s) => ({
    source: clean(s && (s.source || s.name || s.label)),
    count: int(s && (s.count || s.value), 0)
  })).filter((s) => s.source);
} else {
  const m = {};
  pool.forEach((r) => {
    const s = clean(r && (r.source && r.source.name ? r.source.name : r.source));
    if (!s) return;
    m[s] = (m[s] || 0) + 1;
  });
  srcList = Object.keys(m).map((source) => ({ source, count: m[source] }));
}
const srcTotal = srcList.reduce((a, s) => a + (s.count || 0), 0) || 1;
const sources = srcList
  .map((s) => ({ source: s.source, count: s.count, percentage: round2((s.count / srcTotal) * 100) }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

// Source diversity — normalized Herfindahl: equal distribution across
// many independent sources => high diversity. Republished copies of the
// same outlet are NOT counted as independent.
let diversity = { uniqueSources: 0, topSource: null, topSourceShare: 0, score: 0, label: 'None' };
{
  const counts = sources.map((s) => s.count).filter((c) => c > 0);
  const total = counts.reduce((a, b) => a + b, 0);
  const n = counts.length;
  if (total > 0 && n > 0) {
    const top = sources.slice().sort((a, b) => b.count - a.count)[0];
    let hhi = 0;
    counts.forEach((c) => { const p = c / total; hhi += p * p; });
    const score = n === 1 ? 0 : Math.min(1, (1 - hhi) / (1 - 1 / n));
    diversity = {
      uniqueSources: n,
      topSource: top.source,
      topSourceShare: round2((top.count / total) * 100),
      score: round2(score),
      label: score >= 0.7 ? 'High' : score >= 0.4 ? 'Medium' : 'Low'
    };
  }
}

// ------------------------------------------------------------
// Providers
// ------------------------------------------------------------
let provList = [];
if (asArr(agg.providerDistribution).length) {
  provList = asArr(agg.providerDistribution).map((p) => ({
    provider: clean(p && (p.provider || p.name || p.label)),
    count: int(p && (p.count || p.value), 0)
  })).filter((p) => p.provider);
} else {
  const m = {};
  pool.forEach((r) => {
    const p = clean(r && r.provider);
    if (!p) return;
    m[p] = (m[p] || 0) + 1;
  });
  provList = Object.keys(m).map((provider) => ({ provider, count: m[provider] }));
}
const provTotal = provList.reduce((a, p) => a + (p.count || 0), 0) || 1;
const providers = provList
  .map((p) => ({ provider: p.provider, count: p.count, percentage: round2((p.count / provTotal) * 100) }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

// ------------------------------------------------------------
// Timeline — signalVolume is the primary source. Never invented dates.
// ------------------------------------------------------------
let timeline = [];
{
  const sv = asArr(agg.signalVolume);
  if (sv.length) {
    timeline = sv
      .filter((p) => p && typeof p === 'object')
      .map((p) => {
        const date = clean(p.time != null ? p.time : (p.date != null ? p.date : p.period));
        const count = int(p.value != null ? p.value : p.count, 0);
        return { date, count };
      })
      .filter((p) => p.date && Number.isInteger(p.count))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  } else {
    const m = {};
    pool.forEach((r) => {
      const d = clean(r && r.publishedAt);
      if (!d) return;
      const day = new Date(d);
      if (Number.isNaN(day.getTime())) return;
      const key = day.toISOString().slice(0, 10);
      m[key] = (m[key] || 0) + 1;
    });
    timeline = Object.keys(m)
      .sort((a, b) => a.localeCompare(b))
      .map((date) => ({ date, count: m[date] }));
  }
}

let timelineSummary = { peakDate: null, peakCount: 0, firstSignal: null, lastSignal: null, totalSignalDays: 0 };
if (timeline.length) {
  const peak = timeline.slice().sort((a, b) => b.count - a.count)[0];
  timelineSummary = {
    peakDate: peak.date,
    peakCount: peak.count,
    firstSignal: timeline[0].date,
    lastSignal: timeline[timeline.length - 1].date,
    totalSignalDays: timeline.length
  };
}

// ------------------------------------------------------------
// Momentum — recent window vs the previous comparable window
// ------------------------------------------------------------
let momentum = { score: 0, direction: 'insufficient_data', label: 'Insufficient data', recentSignalCount: 0, previousSignalCount: 0, growthRate: null };
{
  const counts = timeline.map((p) => p.count).filter((c) => Number.isFinite(c));
  if (counts.length >= 4) {
    const N = Math.max(2, Math.min(7, Math.floor(counts.length / 2)));
    const recent = counts.slice(-N).reduce((a, b) => a + b, 0);
    const prevArr = counts.slice(-2 * N, -N);
    if (prevArr.length >= 1) {
      const prevAvg = prevArr.reduce((a, b) => a + b, 0) / prevArr.length;
      const prevScaled = prevArr.length < N ? prevAvg * N : prevArr.reduce((a, b) => a + b, 0);
      const growthRate = prevScaled > 0 ? (recent - prevScaled) / prevScaled : (recent > 0 ? 1 : 0);
      const direction = growthRate >= 0.25 ? 'rising' : growthRate <= -0.25 ? 'falling' : 'stable';
      const label = direction === 'rising' ? 'Rising' : direction === 'falling' ? 'Falling' : 'Stable';
      const score = Math.max(0, Math.min(100, Math.round(50 + growthRate * 100)));
      momentum = {
        score,
        direction,
        label,
        recentSignalCount: recent,
        previousSignalCount: round(prevScaled, 0),
        growthRate: round2(growthRate)
      };
    }
  }
}

// ------------------------------------------------------------
// Freshness — only when real dates exist
// ------------------------------------------------------------
let freshness = { averageDaysOld: null, recentPercentage: null, label: null };
{
  const days = pool.map((r) => num(r && r.daysOld)).filter((v) => v != null);
  if (days.length) {
    const avg = mean(days);
    const recent = days.filter((d) => d <= 14).length;
    const recentPct = round0((recent / days.length) * 100);
    freshness = {
      averageDaysOld: round(avg, 1),
      recentPercentage: recentPct,
      label: recentPct >= 60 ? 'Fresh' : recentPct <= 30 ? 'Historical' : 'Mixed'
    };
  }
}

// ------------------------------------------------------------
// Relevance distribution
// ------------------------------------------------------------
let relevance = { average: null, high: 0, medium: 0, low: 0 };
if (relVals.length) {
  relevance = {
    average: round(mean(relVals), 1),
    high: relVals.filter((v) => v >= 80).length,
    medium: relVals.filter((v) => v >= 50 && v < 80).length,
    low: relVals.filter((v) => v < 50).length
  };
}

// ------------------------------------------------------------
// Signal strength — normalized deterministic components, 0-100
// ------------------------------------------------------------
let signalStrength = { score: 0, label: 'Weak', components: { volume: 0, recency: 0, sourceDiversity: 0, relevance: 0 } };
{
  const volumeComp = clamp01(recentResults / 100);
  const recencyComp = freshness.recentPercentage != null ? clamp01(freshness.recentPercentage / 100) : 0;
  const divComp = diversity.score != null ? clamp01(diversity.score) : 0;
  const relComp = relevance.average != null ? clamp01(relevance.average / 100) : 0;
  const score = Math.round((volumeComp * 0.25 + recencyComp * 0.25 + divComp * 0.25 + relComp * 0.25) * 100);
  signalStrength = {
    score,
    label: score >= 80 ? 'Very Strong' : score >= 60 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak',
    components: {
      volume: round2(volumeComp),
      recency: round2(recencyComp),
      sourceDiversity: round2(divComp),
      relevance: round2(relComp)
    }
  };
}

// ------------------------------------------------------------
// Locations — straight from aggregation.topLocations (never inferred)
// ------------------------------------------------------------
const locations = asArr(agg.topLocations)
  .map((l) => ({
    name: clean(l && (l.name || l.label || l.city)),
    count: int(l && (l.count || l.value || l.vol), 0),
    percentage: round0((int(l && (l.count || l.value || l.vol), 0) / (relevantResults || 1)) * 100)
  }))
  .filter((l) => l.name)
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);

// ------------------------------------------------------------
// Coverage / corroboration — distinguishes "20 posts from 1 outlet"
// from "20 posts from 15 independent outlets"
// ------------------------------------------------------------
const coverageArticleCount = relevantResults || pool.length;
let coverage = {
  articleCount: coverageArticleCount,
  sourceCount: diversity.uniqueSources,
  independentSourceRatio: 0,
  corroborationLevel: 'low'
};
{
  const ratio = coverageArticleCount > 0 ? Math.min(1, diversity.uniqueSources / coverageArticleCount) : 0;
  const level = diversity.uniqueSources >= 8 ? 'high' : diversity.uniqueSources >= 3 ? 'medium' : 'low';
  coverage = {
    articleCount: coverageArticleCount,
    sourceCount: diversity.uniqueSources,
    independentSourceRatio: round2(ratio),
    corroborationLevel: level
  };
}

// ------------------------------------------------------------
// AI analysis metadata — the AI's subset stays clearly separate
// ------------------------------------------------------------
const aiInputCount = asArr(agg.aiInput).length;
const aiAnalysis = {
  inputCount: aiInputCount,
  coveragePercentage: relevantResults > 0 ? round2((aiInputCount / relevantResults) * 100) : 0
};

// ------------------------------------------------------------
// Overview — assembled last (needs the counts above)
// ------------------------------------------------------------
const overview = {
  totalResults,
  uniqueResults,
  relevantResults,
  recentResults,
  historicalResults,
  analyzedResults,
  uniqueSources: diversity.uniqueSources,
  uniqueProviders: providers.length,
  uniqueLocations: locations.length,
  uniqueKeywords: keywords.length,
  uniqueHashtags: hashtags.length,
  averageRelevance: relVals.length ? round(mean(relVals), 1) : null,
  averageFreshness: freshVals.length ? round(mean(freshVals), 1) : null,
  averageScore: scoreVals.length ? round(mean(scoreVals), 1) : null,
  recentPercentage: relevantResults > 0 ? round2((recentResults / relevantResults) * 100) : 0,
  historicalPercentage: relevantResults > 0 ? round2((historicalResults / relevantResults) * 100) : 0
};

// ------------------------------------------------------------
// Sample signals — a small deterministic slice of the real corpus
// for the live-feed widget (top scored results, up to 8)
// ------------------------------------------------------------
const sampleSignals = pool
  .slice()
  .sort((a, b) => (num(b && b.score) || 0) - (num(a && a.score) || 0))
  .slice(0, 8)
  .map((r) => ({
    title: clean(r && r.title),
    description: clean(r && (r.description || r.snippet || r.summary)),
    url: clean(r && r.url),
    source: clean(r && (r.source && r.source.name ? r.source.name : r.source)),
    publishedAt: clean(r && r.publishedAt),
    score: num(r && r.score)
  }));

// ------------------------------------------------------------
// Final output — aggregation passthrough + dashboardMetrics
// ------------------------------------------------------------
return [{
  json: {
    ...agg,
    dashboardMetrics: {
      overview,
      keywords,
      hashtags,
      phrases,
      sources,
      sourceDiversity: diversity,
      providers,
      timeline,
      timelineSummary,
      momentum,
      freshness,
      relevance,
      signalStrength,
      locations,
      coverage,
      aiAnalysis,
      sampleSignals
    }
  }
}];
