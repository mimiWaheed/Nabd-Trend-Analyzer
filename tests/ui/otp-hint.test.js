const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/* NABD — OTP email-delivery guidance ("Can't find your OTP?").
   Verifies the hint appears exactly once per OTP input screen, reuses the
   existing .field-hint component, is hidden on the forgot-password email
   stage, does not leak onto unrelated forms, and resolves in both languages. */

const APP = path.resolve(__dirname, '..', '..');
const scriptSrc = fs.readFileSync(path.join(APP, 'js', 'script.js'), 'utf8');
const HINT_ATTR = '[data-i18n-html="auth.otp.hint"]';

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

let failed = false;
function report(section, errs) {
  if (errs.length) { failed = true; console.log('FAIL ' + section + ':'); errs.forEach((e) => console.log('  - ' + e)); }
  else console.log('PASS ' + section);
}
const within = (el, sel) => el && el.closest(sel);

/* ---- dictionaries ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/signup.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('dictionaries', errs); return; }
  const en = N.I18N.en, ar = N.I18N.ar;
  if (en['auth.otp.hint'] === undefined) errs.push('missing EN key auth.otp.hint');
  if (ar['auth.otp.hint'] === undefined) errs.push('missing AR key auth.otp.hint');
  if (en['auth.otp.hint'] && en['auth.otp.hint'].indexOf('Spam') === -1) errs.push('EN hint must mention Spam');
  if (en['auth.otp.hint'] && en['auth.otp.hint'].indexOf('Junk') === -1) errs.push('EN hint must mention Junk');
  if (ar['auth.otp.hint'] && !ar['auth.otp.hint'].replace(/<[^>]+>/g, '').trim()) errs.push('AR hint must have visible text');
  report('dictionaries', errs);
})();

/* ---- signup: hint on the OTP step, nowhere else ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/signup.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('pages/signup.html', errs); return; }
  const doc = dom.window.document;

  const hints = doc.querySelectorAll(HINT_ATTR);
  if (hints.length !== 1) errs.push('expected exactly 1 hint on signup, found ' + hints.length);
  const hint = hints[0];
  if (hint && !within(hint, '#otpStep')) errs.push('signup hint must live inside #otpStep');
  if (hint && within(hint, '#signupForm')) errs.push('signup hint must not be inside the signup form');
  if (hint && !hint.classList.contains('field-hint')) errs.push('signup hint must reuse the .field-hint component');
  if (hint && hint.hasAttribute('hidden')) errs.push('signup hint must be visible on the OTP step');

  report('pages/signup.html', errs);
})();

/* ---- signin: forgot-password + OTP login, hidden until the OTP stage ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/signin.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('pages/signin.html', errs); return; }
  const doc = dom.window.document;

  const hints = doc.querySelectorAll(HINT_ATTR);
  if (hints.length !== 2) errs.push('expected exactly 2 hints on signin, found ' + hints.length);

  const fpHint = doc.getElementById('fpOtpHint');
  if (!fpHint) errs.push('missing #fpOtpHint (forgot-password hint)');
  else {
    if (!within(fpHint, '#forgotStep')) errs.push('forgot hint must live inside #forgotStep');
    if (!fpHint.hasAttribute('hidden')) errs.push('forgot hint must start hidden (email stage)');
    if (!fpHint.classList.contains('field-hint')) errs.push('forgot hint must reuse the .field-hint component');
  }

  const loginHint = doc.getElementById('otpLoginVerify') && doc.getElementById('otpLoginVerify').querySelector(HINT_ATTR);
  if (!loginHint) errs.push('OTP-login verify step must contain a hint');
  else {
    if (within(loginHint, '#otpLoginRequest')) errs.push('OTP-login hint must not be on the email-request screen');
    if (loginHint.hasAttribute('hidden')) errs.push('OTP-login hint must be visible on the verify screen');
  }

  ['#signinStep', '#otpLoginRequest', '#resetOk'].forEach((sel) => {
    if (doc.querySelector(sel + ' ' + HINT_ATTR)) errs.push('hint must not appear in ' + sel);
  });

  report('pages/signin.html', errs);
})();

/* ---- i18n application populates the hint in both languages ---- */
(function () {
  const errs = [];
  const dom = makeDom('pages/signup.html');
  const N = dom.window.NABD;
  if (!N) { errs.push('window.NABD missing'); report('i18n application', errs); return; }
  const doc = dom.window.document;
  const hint = doc.querySelector(HINT_ATTR);
  if (!hint) { errs.push('no hint to localize'); report('i18n application', errs); return; }

  N.applyLang('en');
  let text = hint.textContent.replace(/\s+/g, ' ').trim();
  if (!text || text.indexOf('Spam') === -1) errs.push('EN hint not applied');
  N.applyLang('ar');
  text = hint.textContent.replace(/\s+/g, ' ').trim();
  if (!text) errs.push('AR hint not applied');
  if (!/[\u0600-\u06FF]/.test(text)) errs.push('AR hint must contain Arabic text');

  report('i18n application', errs);
})();

process.exit(failed ? 1 : 0);
