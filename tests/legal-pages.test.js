const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const APP = path.resolve(__dirname, '..');
const scriptSrc = fs.readFileSync(path.join(APP, 'js', 'script.js'), 'utf8');

function makeDom(file) {
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
  return dom;
}

function check(file) {
  const dom = makeDom(file);
  const doc = dom.window.document;
  const errors = [];

  // 1. script.js loaded — window.NABD present (no auth guard, no crash)
  const N = dom.window.NABD;
  if (!N) { errors.push('window.NABD missing (script.js failed?)'); return errors; }

  // 2. i18n keys exist
  const en = N.I18N.en, ar = N.I18N.ar;
  ['nav.legal.eyebrow', 'nav.legal.privacy', 'nav.legal.terms', 'auth.terms', 'auth.legal'].forEach((k) => {
    if (en[k] === undefined) errors.push('missing EN key: ' + k);
    if (ar[k] === undefined) errors.push('missing AR key: ' + k);
  });

  // 3. TOC anchor targets exist as element ids
  const toc = doc.querySelector('.legal-toc');
  if (!toc) errors.push('no .legal-toc');
  else toc.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (!doc.getElementById(a.getAttribute('href').slice(1))) errors.push('TOC anchor missing: ' + a.getAttribute('href'));
  });

  // 4. bilingual blocks: one .legal-en, one .legal-ar, both present
  const enBlock = doc.querySelector('.legal-en');
  const arBlock = doc.querySelector('.legal-ar');
  if (!enBlock) errors.push('no .legal-en block');
  if (!arBlock) errors.push('no .legal-ar block');
  if (enBlock && arBlock) {
    if (enBlock.getAttribute('lang') !== 'en') errors.push('.legal-en missing lang="en"');
    if (arBlock.getAttribute('lang') !== 'ar') errors.push('.legal-ar missing lang="ar"');
  }

  // 5. no duplicate element ids anywhere (AR block uses ar- prefixed ids)
  const seen = new Set();
  doc.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (seen.has(id)) errors.push('duplicate id: ' + id);
    seen.add(id);
  });

  // 6. must NOT use the auth-guarded app shell
  if ((doc.body.className || '').indexOf('app-page') !== -1) errors.push('uses auth-guarded app-page shell');

  // 7. every data-i18n key on the page resolves in the EN dictionary
  doc.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.getAttribute('data-i18n');
    if (en[k] === undefined) errors.push('unresolved data-i18n key: ' + k);
  });

  // 8. internal links resolve to existing files
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
    const target = href.split(/[?#]/)[0];
    if (!target) return;
    if (!fs.existsSync(path.join(APP, target))) errors.push('broken link: ' + href);
  });

  // 9. the hero date key resolves in both dictionaries
  const eff = 'nav.legal.effective';
  if (en[eff] === undefined) errors.push('missing EN key: ' + eff);
  if (ar[eff] === undefined) errors.push('missing AR key: ' + eff);

  return errors;
}

let failed = false;
['privacy-policy.html', 'terms.html'].forEach((f) => {
  const errs = check(f);
  if (errs.length) { failed = true; console.log('FAIL ' + f + ':'); errs.forEach((e) => console.log('  - ' + e)); }
  else console.log('PASS ' + f);
});
process.exit(failed ? 1 : 0);
