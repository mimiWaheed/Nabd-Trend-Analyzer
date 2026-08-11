const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(APP, 'pages', 'dashboard.html'), 'utf8')
  .replace(/<link\b[^>]*>/gi, '')
  .replace(/<script\b[^>]*src="[^"]*"[^>]*><\/script>/gi, '')
  .replace(/<script>\s*\(function\s*\(\).*?<\/script>/s, '');

const scriptSrc = fs.readFileSync(path.join(APP, 'js', 'script.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(APP, 'js', 'app.js'), 'utf8');

const dom = new JSDOM(html, {
  url: 'https://nabd.local/pages/dashboard.html?view=analysis',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;

// ---- browser polyfills jsdom lacks ----
window.matchMedia = window.matchMedia || function (q) { return { matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }; };
window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id));
window.scrollTo = function () {};
window.screen = { width: 1920, height: 1080 };
window.getComputedStyle = window.getComputedStyle || function () { return { getPropertyValue: () => '' }; };
if (!window.localStorage) window.localStorage = (() => { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: k => { delete s[k]; } }; })();
if (!window.sessionStorage) window.sessionStorage = (() => { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: k => { delete s[k]; } }; })();
window.Element.prototype.scrollIntoView = window.Element.prototype.scrollIntoView || function () {};
if (window.HTMLCanvasElement && window.HTMLCanvasElement.prototype) {
  window.HTMLCanvasElement.prototype.getContext = function () {
    return {
      setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {},
      closePath() {}, fill() {}, stroke() {}, save() {}, restore() {}, clip() {}, rect() {}, arc() {},
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; },
      fillText() {}, measureText() { return { width: 0 }; }
    };
  };
}

// ---- fake logged-in user (app.js auth guard) ----
window.localStorage.setItem('nabd-user', JSON.stringify({ name: 'Test Analyst', email: 'test@nabd.ai' }));

// ---- load scripts ----
window.eval(scriptSrc);
const N = window.NABD;
window.eval(appSrc);
if (!N) { console.error('NABD missing'); process.exit(1); }

// ---- mock the n8n webhook with the REAL merged contract the workflow returns ----
N.analyze = () => Promise.resolve({
  output: {
    query: 'أسعار الذهب في مصر',
    dashboard: {
      overview: { totalResults: 100, uniqueResults: 100, relevantResults: 94, recentResults: 90, historicalResults: 4, analyzedResults: 25, uniqueSources: 18, uniqueProviders: 2, uniqueLocations: 1, uniqueKeywords: 2, uniqueHashtags: 1 },
      keywords: [{ keyword: 'الذهب', count: 12, percentage: 48 }, { keyword: 'البورصة', count: 6, percentage: 24 }],
      phrases: [{ phrase: 'أسعار الذهب', count: 9 }, { phrase: 'سعر الجرام', count: 5 }],
      hashtags: [{ tag: '#الذهب', count: 8, percentage: 32 }],
      sources: [{ source: 'اليوم السابع', count: 26, percentage: 27.66 }],
      sourceDiversity: { uniqueSources: 18, topSource: 'اليوم السابع', topSourceShare: 27.66, score: 0.91, label: 'High' },
      providers: [{ provider: 'NewsAPI', count: 50, percentage: 50 }],
      timeline: [{ date: '2026-08-09', count: 19 }, { date: '2026-08-10', count: 42 }],
      timelineSummary: { peakDate: '2026-08-10', peakCount: 42, firstSignal: '2026-08-09', lastSignal: '2026-08-10', totalSignalDays: 2 },
      momentum: { score: 75, direction: 'rising', label: 'Rising', recentSignalCount: 42, previousSignalCount: 19, growthRate: 1.21 },
      freshness: { averageDaysOld: 0.4, recentPercentage: 100, label: 'Fresh' },
      relevance: { average: 84, high: 12, medium: 8, low: 2 },
      signalStrength: { score: 88, label: 'Very Strong', components: { volume: 0.9, recency: 1, sourceDiversity: 0.91, relevance: 0.84 } },
      locations: [{ name: 'مصر', count: 94, percentage: 100 }],
      coverage: { articleCount: 94, sourceCount: 18, independentSourceRatio: 0.19, corroborationLevel: 'high' },
      aiAnalysis: { inputCount: 25, coveragePercentage: 26.6 },
      sampleSignals: [{ title: 'أسعار الذهب في مصر', description: 'عوضت أسعار الذهب جزءًا من خسائرها', url: 'https://example.com/1', source: 'اليوم السابع', publishedAt: '2026-08-10T10:00:00Z' }]
    },
    intelligence: {
      stats: { totalPosts: 8, activeTopics: 1, sentimentScore: 60 },
      sentiment: { positive: 80, neutral: 10, negative: 10, label: 'NEUTRAL' },
      trendingTopics: [{ rank: 1, topic: 'أسعار الذهب', count: 1, severity: 'low' }],
      aiBrief: { headline: 'أسعار الذهب في مصر', summary: 'عوضت أسعار الذهب في مصر جزءًا من خسائرها', keyDevelopments: [], whyItMatters: '', confidence: 90 },
      aiHighlights: [{ type: 'MARKET UPDATE', title: 'أسعار الذهب في مصر', detail: 'عوضت أسعار الذهب في مصر جزءًا من خسائرها', confidence: 90 }],
      topLocations: [{ name: 'مصر', count: 1 }]
    },
    meta: { aggregationResults: 100, aiAnalyzedResults: 25, generatedAt: '2026-08-10T12:00:00.000Z' }
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const resultsShown = () => !document.getElementById('dbResults').hidden;

(async () => {
  const input = document.getElementById('dbSearchInput');
  const btn = document.getElementById('dbSearchBtn');
  input.value = 'أسعار الذهب في مصر';
  btn.click();

  // wait for animateSteps (2400ms) + settle fades + render
  let waited = 0;
  while (!resultsShown() && waited < 10000) { await sleep(250); waited += 250; }
  await sleep(600);

  const el = (id) => document.getElementById(id);
  const txt = (id) => (el(id) ? (el(id).textContent || '').trim() : 'MISSING');
  const assert = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else { console.log('PASS: ' + msg); } };

  assert(resultsShown(), 'results section becomes visible');
  assert(txt('dbQuery') === 'أسعار الذهب في مصر', 'query header shows the query');
  assert(txt('kpiMentions') === '100', 'KPI totalPosts renders the deterministic total (100), not AI guess (8)');
  assert(txt('kpiActive') === '1', 'KPI activeTopics rendered as 1');
  assert(txt('kpiSentiment') === '60', 'KPI sentimentScore rendered as 60');
  assert(el('dbTrendList') && el('dbTrendList').children.length === 1, 'trendingTopics rendered 1 row');
  assert(el('dbHlList') && el('dbHlList').children.length === 1, 'aiHighlights rendered 1 card');
  assert(el('dbNational') && !el('dbNational').hidden, 'national Egypt coverage card shown (topLocations: مصر)');
  assert(el('dbKwList') && el('dbKwList').children.length === 2, 'top keywords rendered 2 rows');
  assert(txt('dbKwList').indexOf('الذهب') !== -1, 'keyword "الذهب" visible');
  assert(el('dbPhList') && el('dbPhList').children.length === 2, 'top phrases rendered 2 rows');
  assert(txt('dbPhList').indexOf('أسعار الذهب') !== -1, 'phrase "أسعار الذهب" visible');
  assert(el('dbHtList') && el('dbHtList').children.length === 1, 'hashtags rendered 1 chip');
  assert(txt('dbHtList').indexOf('#الذهب') !== -1, 'hashtag "#الذهب" visible');
  assert(el('dbHealthGrid') && el('dbHealthGrid').children.length === 6, 'signal health grid rendered 6 items');
  assert(txt('dbHealthGrid').indexOf('Very Strong') !== -1, 'signal strength label visible');
  assert(txt('dbHealthGrid').indexOf('Rising') !== -1, 'momentum direction visible');
  assert(el('dbSrcList') && el('dbSrcList').children.length === 1, 'deterministic sources rendered 1 row');
  assert(el('dbSrcList') && txt('dbSrcList').indexOf('اليوم السابع') !== -1, 'source اليوم السابع visible');
  assert(el('dbFeedTrack') && el('dbFeedTrack').children.length === 1, 'sample signals rendered in live feed');

  console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
  process.exit(process.exitCode || 0);
})().catch((e) => { console.error('E2E FAIL', e); process.exit(1); });
