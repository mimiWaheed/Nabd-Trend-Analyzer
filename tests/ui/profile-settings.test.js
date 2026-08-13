const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const APP = path.resolve(__dirname, '..', '..');
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

function checkDuplicates(doc) {
  const seen = new Set();
  const errs = [];
  doc.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (seen.has(id)) errs.push('duplicate id: ' + id);
    seen.add(id);
  });
  return errs;
}

function checkI18n(doc, en, ar, file) {
  const errs = [];
  doc.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.getAttribute('data-i18n');
    if (en[k] === undefined) errs.push('unresolved data-i18n key (EN): ' + k);
    if (ar[k] === undefined) errs.push('unresolved data-i18n key (AR): ' + k);
  });
  return errs;
}

let failed = false;
function report(file, errs) {
  if (errs.length) { failed = true; console.log('FAIL ' + file + ':'); errs.forEach((e) => console.log('  - ' + e)); }
  else console.log('PASS ' + file);
}

/* ---- dictionaries ---- */
(function () {
  const errs = [];
  const dom = makeDom('privacy-policy.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); }
  else {
    const en = N.I18N.en, ar = N.I18N.ar;
    ['prof.city', 'set.appearance'].forEach((k) => {
      if (en[k] === undefined) errs.push('missing EN key: ' + k);
      if (ar[k] === undefined) errs.push('missing AR key: ' + k);
    });
    ['prof.country', 'prof.u1', 'prof.u2', 'set.general', 'set.g.name', 'set.g.org', 'set.g.email', 'set.g.save']
      .forEach((k) => {
        if (en[k] !== undefined) errs.push('obsolete EN key still present: ' + k);
        if (ar[k] !== undefined) errs.push('obsolete AR key still present: ' + k);
      });
  }
  report('dictionaries', errs);
})();

/* ---- profile page ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/profile.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('pages/profile.html', errs); return; }
  const en = N.I18N.en, ar = N.I18N.ar;
  const doc = dom.window.document;

  ['profAvatar', 'profModalAvatar'].forEach((id) => {
    const el = doc.getElementById(id);
    if (!el) errs.push('missing #' + id);
    else if (el.classList.contains('avatar-empty')) errs.push('#' + id + ' must not start as avatar-empty');
  });

  if (doc.getElementById('profCountry')) errs.push('#profCountry must be renamed to #profCity');
  if (!doc.getElementById('profCity')) errs.push('missing #profCity');
  if (doc.getElementById('profEditCountry')) errs.push('#profEditCountry must be replaced by a city select');
  if (doc.getElementById('profUseA')) errs.push('#profUseA (Analyses stat) must be removed');

  const sel = doc.getElementById('profEditCity');
  if (!sel) errs.push('missing #profEditCity select');
  else {
    const expected = ['', 'Cairo', 'Alexandria', 'Giza', 'Tanta', 'Mansoura', 'Zagazig', 'Ismailia', 'Port Said', 'Suez', 'Damietta', 'Damanhur', 'Kafr El Sheikh', 'Mahalla El Kubra', 'Shebin El Kom', 'Sadat City', 'Minya', 'Assiut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Fayoum', 'Beni Suef', '6th of October City', 'New Cairo', 'Other'];
    const actual = Array.from(sel.querySelectorAll('option')).map((o) => o.getAttribute('value'));
    expected.forEach((v) => {
      if (actual.indexOf(v) === -1) errs.push('#profEditCity missing option: ' + (v === '' ? '(empty)' : v));
    });
    if (sel.querySelector('option[value="Other"]') === null) errs.push('#profEditCity missing "Other" option');
    if (sel.querySelector('option[value=""]') === null) errs.push('#profEditCity missing empty option');
  }
  const other = doc.getElementById('profEditCityOther');
  if (!other) errs.push('missing #profEditCityOther');
  else if (!other.hasAttribute('hidden')) errs.push('#profEditCityOther must be hidden by default');

  const bodyHtml = doc.body.innerHTML;
  ['data-i18n="prof.country"', 'data-i18n="prof.u1"', 'data-i18n="prof.u2"', 'Nour Badea', 'Delta Digital Group']
    .forEach((s) => { if (bodyHtml.indexOf(s) !== -1) errs.push('unexpected content: ' + s); });

  errs.push.apply(errs, checkDuplicates(doc));
  errs.push.apply(errs, checkI18n(doc, en, ar, 'pages/profile.html'));
  report('pages/profile.html', errs);
})();

/* ---- settings page ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/settings.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('pages/settings.html', errs); return; }
  const en = N.I18N.en, ar = N.I18N.ar;
  const doc = dom.window.document;

  if (doc.getElementById('setGeneralSave')) errs.push('#setGeneralSave mock card must be removed from settings');
  const bodyHtml = doc.body.innerHTML;
  if (bodyHtml.indexOf('data-i18n="set.general"') !== -1) errs.push('settings still uses set.general');
  ['set.g.name', 'set.g.org', 'set.g.email', 'set.g.save'].forEach((k) => {
    if (bodyHtml.indexOf('data-i18n="' + k + '"') !== -1) errs.push('settings still uses ' + k);
  });
  ['Nour Badea', 'Delta Digital Group', 'nour@deltadigital.eg'].forEach((s) => {
    if (bodyHtml.indexOf(s) !== -1) errs.push('mock value still present in settings: ' + s);
  });

  const appearance = Array.prototype.find.call(doc.querySelectorAll('.set-card'), (c) => c.textContent.indexOf('Appearance') !== -1);
  if (appearance && appearance.className.indexOf('sp-12') === -1) errs.push('Appearance card should span full grid width (sp-12)');

  errs.push.apply(errs, checkDuplicates(doc));
  errs.push.apply(errs, checkI18n(doc, en, ar, 'pages/settings.html'));
  report('pages/settings.html', errs);
})();

process.exit(failed ? 1 : 0);
