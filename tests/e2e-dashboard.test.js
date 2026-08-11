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

// ---- mock the n8n webhook with the REAL response shape the workflow returns ----
N.analyze = () => Promise.resolve({
  output: {
    query: 'أسعار الذهب في مصر',
    stats: { totalPosts: 1, activeTopics: 1, sentimentScore: 60 },
    sentiment: { positive: 80, neutral: 10, negative: 10, label: 'NEUTRAL' },
    trendingTopics: [{ rank: 1, topic: 'أسعار الذهب', count: 1, severity: 'low' }],
    aiHighlights: [{ type: 'MARKET UPDATE', title: 'أسعار الذهب في مصر', detail: 'عوضت أسعار الذهب في مصر جزءًا من خسائرها', confidence: 90 }],
    topLocations: [{ name: 'مصر', count: 1 }]
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
  assert(txt('kpiMentions') === '1', 'KPI totalPosts rendered as 1');
  assert(txt('kpiActive') === '1', 'KPI activeTopics rendered as 1');
  assert(txt('kpiSentiment') === '60', 'KPI sentimentScore rendered as 60');
  assert(el('dbTrendList') && el('dbTrendList').children.length === 1, 'trendingTopics rendered 1 row');
  assert(el('dbHlList') && el('dbHlList').children.length === 1, 'aiHighlights rendered 1 card');
  assert(el('dbNational') && !el('dbNational').hidden, 'national Egypt coverage card shown (topLocations: مصر)');

  console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
  process.exit(process.exitCode || 0);
})().catch((e) => { console.error('E2E FAIL', e); process.exit(1); });
