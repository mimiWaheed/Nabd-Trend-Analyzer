const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/* NABD — report PDF export (pages/export.html + js/export.js).
   Verifies the page structure, the EN/AR dictionaries, that a seeded
   analysis draft renders every report section (KPIs, brief, topics,
   keywords, phrases, hashtags, trend, donut, feed, highlights,
   influencers, sources, health), and that the in-view language switch
   re-renders the report in Arabic. */

const APP = path.resolve(__dirname, '..', '..');
const scriptSrc = fs.readFileSync(path.join(APP, 'js', 'script.js'), 'utf8');
const exportSrc = fs.readFileSync(path.join(APP, 'js', 'export.js'), 'utf8');

function makeDom(file, seed) {
  const html = fs.readFileSync(path.join(APP, file), 'utf8')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<script\b[^>]*src="[^"]*"[^>]*><\/script>/gi, '')
    .replace(/<script>\s*\(function\s*\(\).*?<\/script>/s, '');

  const dom = new JSDOM(html, {
    url: 'http://localhost/' + file,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.matchMedia = window.matchMedia || function (q) { return { matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }; };
  window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
  window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id));
  window.scrollTo = function () {};
  window.screen = { width: 1920, height: 1080 };
  window.getComputedStyle = window.getComputedStyle || function () { return { getPropertyValue: () => '' }; };
  if (!window.localStorage) window.localStorage = (() => { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: k => { delete s[k]; } }; })();
  if (!window.sessionStorage) window.sessionStorage = (() => { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: k => { delete s[k]; } }; })();
  window.eval(scriptSrc);
  if (seed) seed(window);
  window.eval(exportSrc);
  return dom;
}

let failed = false;
function report(section, errs) {
  if (errs.length) { failed = true; console.log('FAIL ' + section + ':'); errs.forEach((e) => console.log('  - ' + e)); }
  else console.log('PASS ' + section);
}

/* ---- dictionaries ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/export.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('dictionaries', errs); return; }
  const en = N.I18N.en, ar = N.I18N.ar;
  const keys = ['app.toast.noexport', 'export.back', 'export.title', 'export.sub', 'export.print',
    'export.generated', 'export.lang', 'export.noData.t', 'export.noData.s', 'export.goDashboard',
    'export.printHint', 'export.h.momentum', 'export.h.signal', 'export.h.diversity',
    'export.h.freshness', 'export.h.relevance', 'export.h.coverage', 'export.score',
    'export.top', 'export.recent', 'export.articles'];
  keys.forEach((k) => {
    if (en[k] === undefined) errs.push('missing EN key ' + k);
    if (ar[k] === undefined) errs.push('missing AR key ' + k);
  });
  ['app.toast.noexport', 'export.noData.s', 'export.printHint'].forEach((k) => {
    if (en[k] && !en[k].replace(/<[^>]+>/g, '').trim()) errs.push('EN ' + k + ' must have visible text');
    if (ar[k] && !ar[k].replace(/<[^>]+>/g, '').trim()) errs.push('AR ' + k + ' must have visible text');
  });
  if (ar['export.title'] && !/[\u0600-\u06FF]/.test(ar['export.title'])) errs.push('AR export.title must be Arabic');
  report('dictionaries', errs);
})();

/* ---- structure: toolbar, empty state, report sections ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/export.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('structure', errs); return; }
  const doc = dom.window.document;

  if (!doc.querySelector('.lang-toggle')) errs.push('toolbar must contain a .lang-toggle');
  if (!doc.getElementById('expPrint')) errs.push('toolbar must contain #expPrint (Download PDF)');
  if (!doc.querySelector('#expToolbar a[data-page="dashboard.html"]')) errs.push('toolbar back link must go to the dashboard');
  if (!doc.getElementById('repQuery')) errs.push('report header must contain #repQuery');
  if (!doc.getElementById('repTrendChart')) errs.push('timeline card must contain #repTrendChart');
  if (!doc.getElementById('repDonut')) errs.push('sentiment card must contain #repDonut');
  ['repSummary', 'repHtList', 'repHealthGrid', 'repFeedList', 'repSrcList', 'repTrendList',
    'repHlList', 'repRankList', 'repRegions', 'repKwList', 'repPhList', 'repHealthChart', 'repActList'].forEach((id) => {
    if (!doc.getElementById(id)) errs.push('missing report section #' + id);
  });

  /* no draft → empty state visible, report hidden */
  const reportEl = doc.getElementById('report');
  const empty = doc.getElementById('expEmpty');
  if (!reportEl) errs.push('missing #report');
  else if (!reportEl.hasAttribute('hidden')) errs.push('#report must start hidden without a draft');
  if (!empty) errs.push('missing #expEmpty');
  else if (empty.hasAttribute('hidden')) errs.push('#expEmpty must be visible without a draft');

  /* toggling the language with no draft must not crash */
  try { N.applyLang('ar'); N.applyLang('en'); } catch (e) { errs.push('applyLang without draft threw: ' + e.message); }
  if (doc.documentElement.dir !== 'ltr') errs.push('document dir must be ltr after applyLang(en)');

  report('structure', errs);
})();

/* ---- full render from a seeded draft ---- */
(function () {
  const errs = [];
  const draft = {
    q: 'أسعار الذهب في مصر',
    t: Date.parse('2026-08-10T12:00:00Z'),
    r: {
      query: 'أسعار الذهب في مصر',
      scope: 'public',
      stats: { totalPosts: 100, activeTopics: 1, sentimentScore: 60, emergencyAlerts: 0 },
      sentiment: { positive: 80, neutral: 10, negative: 10, label: 'NEUTRAL' },
      confidence: 90,
      analyzedAt: '2026-08-10T12:00:00.000Z',
      national: true,
      briefMeta: null,
      summary: null,
      topics: [{ topic: 'أسعار الذهب', count: 5, severity: 'low', delta: '+12%' }],
      locations: [{ name: 'مصر', count: 94 }],
      influencers: [{ name: 'خبير اقتصادي', handle: 'economist', reach: 1200 }],
      highlights: [{ type: 'MARKET UPDATE', title: 'أسعار الذهب في مصر', detail: 'عوضت أسعار الذهب جزءًا من خسائرها', confidence: 90 }],
      articles: [{ title: 'أسعار الذهب في مصر', description: 'عوضت أسعار الذهب جزءًا من خسائرها', source: 'اليوم السابع', sourceType: 'news', publishedAt: '2026-08-10T10:00:00Z', url: 'https://example.com/1', category: 'news' }],
      timeline: [{ time: '2026-08-09', value: 19 }, { time: '2026-08-10', value: 42 }],
      sources: [{ label: 'اليوم السابع', count: 26 }],
      dashboard: {
        keywords: [{ keyword: 'الذهب', count: 12 }, { keyword: 'البورصة', count: 6 }],
        phrases: [{ phrase: 'أسعار الذهب', count: 9 }, { phrase: 'سعر الجرام', count: 5 }],
        hashtags: [{ tag: '#الذهب', count: 8 }],
        momentum: { score: 75, direction: 'rising', label: 'Rising', growthRate: 1.21 },
        signalStrength: { score: 88, label: 'Very Strong' },
        sourceDiversity: { uniqueSources: 18, topSourceShare: 27.66, label: 'High' },
        freshness: { averageDaysOld: 0.4, recentPercentage: 100, label: 'Fresh' },
        relevance: { average: 84, high: 12, medium: 8, low: 2 },
        coverage: { articleCount: 94, sourceCount: 18, corroborationLevel: 'high' }
      }
    }
  };

  const dom = makeDom('pages/export.html', (w) => {
    w.sessionStorage.setItem('nabd-export', JSON.stringify(draft));
  });
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('full render', errs); return; }
  const doc = dom.window.document;
  const el = (id) => doc.getElementById(id);
  const txt = (id) => (el(id) ? (el(id).textContent || '').trim() : 'MISSING');

  const reportEl = el('report');
  const empty = el('expEmpty');
  if (!reportEl || reportEl.hasAttribute('hidden')) errs.push('report must be visible with a draft');
  if (!empty || !empty.hasAttribute('hidden')) errs.push('empty state must be hidden with a draft');

  if (txt('repQuery') !== 'أسعار الذهب في مصر') errs.push('query header must show the query');
  if (txt('repKpiPosts') !== '100') errs.push('KPI resources analyzed must be 100, got ' + txt('repKpiPosts'));
  if (txt('repKpiActive') !== '1') errs.push('KPI active topics must be 1, got ' + txt('repKpiActive'));
  if (txt('repKpiSentiment') !== '60') errs.push('KPI sentiment must be 60, got ' + txt('repKpiSentiment'));
  if (txt('repKpiCrises') !== '0') errs.push('KPI emergency alerts must be 0, got ' + txt('repKpiCrises'));

  const summ = el('repSummary');
  if (!summ || summ.hasAttribute('hidden') || !txt('repSummary')) errs.push('AI brief must render text');

  if (!el('repTrendList') || el('repTrendList').children.length !== 1) errs.push('trending topics must render 1 row');
  if (txt('repTrendList').indexOf('أسعار الذهب') === -1) errs.push('topic label missing from trend list');
  const trendPie = el('repTrendList').querySelector('.topic-pie');
  if (!trendPie) errs.push('trending topics must render a topic pie');
  if (!trendPie.querySelector('.donut')) errs.push('topic pie must include the share donut');
  if (trendPie.querySelectorAll('.topic-pie-row').length !== 1) errs.push('topic pie must render 1 legend row');
  if (!el('repKwList') || el('repKwList').children.length !== 2) errs.push('keywords must render 2 rows');
  if (el('repKwList').querySelectorAll('.vbar').length !== 2) errs.push('keywords must render as vertical bars');
  if (txt('repKwList').indexOf('الذهب') === -1) errs.push('keyword الذهب missing');
  if (!el('repPhList') || el('repPhList').children.length !== 2) errs.push('phrases must render 2 rows');
  if (el('repPhList').querySelectorAll('.heat-tile').length !== 2) errs.push('phrases must render as a heatmap grid');
  if (txt('repPhList').indexOf('أسعار الذهب') === -1) errs.push('phrase أسعار الذهب missing');
  if (txt('repHtList').indexOf('#الذهب') === -1) errs.push('hashtag #الذهب missing');

  const donut = el('repDonut');
  if (!donut || donut.querySelectorAll('.d-seg').length !== 3) errs.push('sentiment donut must render 3 segments');
  const legend = donut && donut.parentElement.querySelectorAll('.donut-legend b');
  if (legend && (!legend[0] || legend[0].textContent !== '80%')) errs.push('donut legend positive must be 80%');

  const regions = el('repRegions');
  if (!regions.querySelector('.region-tile.national')) errs.push('national heatmap tile must render for Egypt');
  if (regions.querySelectorAll('.region-tile').length < 20) errs.push('city heatmap must render the full Egyptian city grid');
  if (txt('repRegions').indexOf('القاهرة') === -1 && txt('repRegions').indexOf('Cairo') === -1) errs.push('Cairo tile must be part of the city grid');

  const healthChart = el('repHealthChart');
  if (!healthChart || !healthChart.querySelector('.radar-chart')) errs.push('signal health must render as a radar chart');
  const health = el('repHealthGrid');
  if (!health || health.children.length !== 6) errs.push('signal health grid must render 6 items, got ' + (health ? health.children.length : 'none'));
  if (txt('repHealthGrid').indexOf('Very Strong') === -1) errs.push('signal strength label missing');

  const srcs = el('repSrcList');
  if (!srcs || srcs.children.length !== 1 || txt('repSrcList').indexOf('اليوم السابع') === -1) errs.push('sources must render 1 row for اليوم السابع');
  if (!srcs || srcs.querySelectorAll('.vbar').length !== 1) errs.push('sources must render as vertical bars');

  const feed = el('repFeedList');
  if (!feed || feed.querySelectorAll('.feed-item').length !== 1) errs.push('feed must render 1 signal');
  if (!feed || !feed.querySelector('a.feed-link')) errs.push('feed item must link to its source URL');

  const trendSvg = el('repTrendChart').querySelector('svg');
  if (!trendSvg || !trendSvg.querySelector('.tr-line')) errs.push('trend chart must render an SVG line');
  if (!trendSvg || trendSvg.querySelectorAll('.tr-dot').length !== 2) errs.push('trend chart must plot 2 points');

  const metaNote = txt('repGenNote');
  if (metaNote.indexOf('resources') === -1) errs.push('summary gen-note must include resource count');

  report('full render', errs);
})();

/* ---- in-view language switch re-renders the report ---- */
(function () {
  const errs = [];
  const draft = {
    q: 'أسعار الذهب في مصر',
    t: Date.parse('2026-08-10T12:00:00Z'),
    r: {
      query: 'أسعار الذهب في مصر', scope: 'public',
      stats: { totalPosts: 100, activeTopics: 1, sentimentScore: 60, emergencyAlerts: 0 },
      sentiment: { positive: 80, neutral: 10, negative: 10, label: 'NEUTRAL' },
      briefMeta: null, summary: null,
      topics: [{ topic: 'أسعار الذهب', count: 5, severity: 'low' }],
      locations: [], national: false,
      influencers: [], highlights: [], articles: [], timeline: [], sources: [],
      dashboard: { keywords: [], phrases: [], hashtags: [] }
    }
  };
  const dom = makeDom('pages/export.html', (w) => {
    w.sessionStorage.setItem('nabd-export', JSON.stringify(draft));
  });
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('language switch', errs); return; }
  const doc = dom.window.document;

  N.applyLang('ar');
  if (doc.documentElement.dir !== 'rtl') errs.push('document must switch to rtl for Arabic');
  const gen = doc.getElementById('repGenerated');
  if (gen && !/[\u0600-\u06FF]/.test(gen.textContent || '')) errs.push('generated line must be localised in Arabic');
  const summary = doc.getElementById('repSummary');
  if (summary && summary.getAttribute('hidden')) errs.push('summary must stay rendered after language switch');

  N.applyLang('en');
  if (doc.documentElement.dir !== 'ltr') errs.push('document must switch back to ltr for English');
  report('language switch', errs);
})();

process.exit(failed ? 1 : 0);
