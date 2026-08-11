const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '..');
const scriptSrc = fs.readFileSync(path.join(APP, 'js', 'script.js'), 'utf8');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://nabd.local/pages/dashboard.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;

// polyfills not present in jsdom
window.matchMedia = window.matchMedia || function (q) { return { matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }; };
window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = window.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id));
window.scrollTo = window.scrollTo || function () {};
window.screen = window.screen || { width: 1920, height: 1080 };
window.getComputedStyle = window.getComputedStyle || function () { return { getPropertyValue: () => '' }; };
window.Event = window.Event || dom.window.Event;
window.CustomEvent = window.CustomEvent || dom.window.CustomEvent;
if (!window.localStorage) {
  let store = {};
  window.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
}
if (!window.sessionStorage) {
  let store = {};
  window.sessionStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
}
if (!window.HTMLElement) window.HTMLElement = function () {};
window.Element.prototype.scrollIntoView = window.Element.prototype.scrollIntoView || function () {};

// evaluate script.js inside the window context
window.eval(scriptSrc);
const N = window.NABD;
if (!N) { console.error('NABD not exported'); process.exit(1); }

const assert = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else { console.log('PASS: ' + msg); } };

const realistic = {
  query: 'اسعار الذهب اليوم',
  stats: { totalPosts: 30, activeTopics: 1, sentimentScore: 60 },
  sentiment: { positive: 80, neutral: 10, negative: 10, label: 'Positive' },
  trendingTopics: [
    { rank: 1, topic: 'سعر الذهب اليوم', count: 30, severity: 'high' },
    { rank: 2, topic: 'سعر الذهب في مصر', count: 18, severity: 'medium' }
  ],
  aiHighlights: [
    { type: 'EMERGING INCIDENT', title: 'سعر الذهب اليوم في مصر', detail: 'سعر الذهب اليوم في مصر يرتفع إلى 6220 جنيهًا', confidence: 90 }
  ],
  topLocations: [{ name: 'Qalyubia', count: 1 }]
};

// 1) fenced wrapper
const fenced = { text: '```json\n' + JSON.stringify(realistic, null, 2) + '\n```' };
const r1 = N.extractAnalysisPayload(fenced);
assert(r1 && r1.query === 'اسعار الذهب اليوم', 'extract: fenced text wrapper unwrapped');

// 2) prose-prefixed fenced (like actual webhook)
const prose = { text: 'Since there are no posts or data available, here is the output:\n\n```\n' + JSON.stringify(realistic) + '\n```' };
const r2 = N.extractAnalysisPayload(prose);
assert(r2 && r2.stats && r2.stats.totalPosts === 30, 'extract: prose-prefixed fenced JSON unwrapped');

// 2b) n8n chainLlm structured-output wrapper (live server returns { output: {...} })
const wrapped = { output: realistic };
const r2b = N.extractAnalysisPayload(wrapped);
assert(r2b === realistic, 'extract: { output: {...} } wrapper unwrapped');

// 3) direct object passthrough
const r3 = N.extractAnalysisPayload(realistic);
assert(r3 === realistic, 'extract: direct object passthrough');

// 4) normalize full realistic payload
const norm = N.normalizeAnalysisResponse(fenced);
assert(norm.query === 'اسعار الذهب اليوم', 'normalize: query');
assert(norm.stats.totalPosts === 30 && norm.stats.activeTopics === 1 && norm.stats.sentimentScore === 60, 'normalize: stats');
assert(norm.sentiment.positive === 80 && norm.sentiment.neutral === 10 && norm.sentiment.negative === 10 && norm.sentiment.label === 'Positive', 'normalize: sentiment');
assert(norm.topics.length === 2 && norm.topics[0].label === 'سعر الذهب اليوم' && norm.topics[0].count === 30, 'normalize: trendingTopics');
assert(norm.topics[0].sev === 'sev-danger', 'normalize: severity high -> sev-danger');
assert(norm.highlights.length === 1 && norm.highlights[0].tag === 'EMERGING INCIDENT' && norm.highlights[0].conf === 90, 'normalize: aiHighlights');
assert(norm.locations.length === 1 && norm.locations[0].name === 'Qalyubia' && norm.locations[0].count === 1, 'normalize: topLocations');

// 5) zeros-with-label response (actual webhook behavior when empty)
const zeros = { text: JSON.stringify({ query: 'Cairo inflation', stats: { totalPosts: 0, activeTopics: 0, sentimentScore: 0 }, sentiment: { positive: 0, neutral: 0, negative: 0, label: 'Unknown' }, trendingTopics: [], aiHighlights: [], topLocations: [] }) };
const nz = N.normalizeAnalysisResponse(zeros);
assert(nz.stats.totalPosts === 0, 'normalize: real zero totalPosts preserved (0 != unavailable)');
assert(nz.sentiment.positive === 0 && nz.sentiment.negative === 0 && nz.sentiment.neutral === 0, 'normalize: zero sentiment split preserved');
assert(nz.topics.length === 0 && nz.locations.length === 0 && nz.highlights.length === 0, 'normalize: empty arrays stay empty');

// 6) missing fields -> unavailable (null), not 0
const missing = N.normalizeAnalysisResponse({ query: 'x' });
assert(missing.stats === null, 'normalize: missing stats -> null');
assert(missing.sentiment === null, 'normalize: missing sentiment -> null');

console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
process.exit(process.exitCode || 0);
