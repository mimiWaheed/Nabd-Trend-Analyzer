/* ============================================================
   NABD (نبض) V3 — auth pages script (signin / signup)
   validation · password visibility · social mock · submit flow
   ============================================================ */
(function () {
  'use strict';

  const N = window.NABD;
  if (!N) return;

  const $ = (id) => document.getElementById(id);
  const toastEl = $('authToast');
  const errEl = $('authError');

  /* ----------------------------------------------------------
     SELECTS — country + language
     ---------------------------------------------------------- */
  const COUNTRIES = ['eg', 'sa', 'ae', 'us', 'gb', 'de', 'fr', 'qa'];

  function fillSelect(sel, values, tKey) {
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '';
    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = N.t(tKey(v));
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  }

  const countrySel = $('suCountry');
  const langSel = $('suLang');
  if (countrySel) fillSelect(countrySel, COUNTRIES, (v) => 'c.' + v);
  if (langSel) {
    fillSelect(langSel, ['en', 'ar'], (v) => 'lng.' + v);
    langSel.value = N.lang;
  }
  document.addEventListener('nabd-lang', () => {
    if (countrySel) fillSelect(countrySel, COUNTRIES, (v) => 'c.' + v);
    if (langSel) {
      fillSelect(langSel, ['en', 'ar'], (v) => 'lng.' + v);
      langSel.value = N.lang;
    }
    if (errEl) errEl.textContent = '';
  });

  /* ----------------------------------------------------------
     PASSWORD VISIBILITY TOGGLES
     ---------------------------------------------------------- */
  document.querySelectorAll('[data-pwd-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = $(btn.dataset.pwdToggle);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
    });
  });

  /* ----------------------------------------------------------
     HELPERS
     ---------------------------------------------------------- */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const setError = (msg) => { if (errEl) errEl.textContent = msg || ''; };

  const nextParam = (() => {
    try {
      const n = new URLSearchParams(location.search).get('next');
      if (n && /^[a-z0-9-_]+\.html(\?[^#]*)?$/.test(n)) return n;
    } catch (e) {}
    return null;
  })();

  function finishAuth(msg, remember) {
    setError('');
    N.toast(toastEl, msg);
    setTimeout(() => N.navigate(nextParam || 'dashboard.html'), 950);
  }
  function setPending(btn, on) {
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? N.t('auth.pending') : '';
  }

  /* ----------------------------------------------------------
     SIGN IN
     ---------------------------------------------------------- */
  const signinForm = $('signinForm');
  const siEmail = $('siEmail');
  const siPwd = $('siPwd');
  const siRemember = $('siRemember');
  const siSubmit = $('signinSubmit');

  if (signinForm) {
    const user = N.getUser();
    if (user && user.email && siEmail && !siEmail.value) siEmail.value = user.email;

    let busy = false;
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) return;
      if (!isEmail(siEmail.value.trim())) { setError(N.t('auth.err.email')); siEmail.focus(); return; }
      if (!siPwd.value || siPwd.value.length < 8) { setError(N.t('auth.err.pass')); siPwd.focus(); return; }
      busy = true;
      setPending(siSubmit, true);
      N.persistUser({ email: siEmail.value.trim() }, siRemember && siRemember.checked);
      finishAuth(N.t('auth.ok.signin'));
    });
  }

  /* ----------------------------------------------------------
     SIGN UP
     ---------------------------------------------------------- */
  const signupForm = $('signupForm');
  const suFirst = $('suFirst');
  const suLast = $('suLast');
  const suOrg = $('suOrg');
  const suEmail = $('suEmail');
  const suPwd = $('suPwd');
  const suPwd2 = $('suPwd2');
  const suTerms = $('suTerms');
  const suSubmit = $('signupSubmit');

  if (signupForm) {
    let busy = false;
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) return;
      if (!suFirst.value.trim() || !suLast.value.trim() || !suOrg.value.trim() || !suEmail.value.trim() || !suPwd.value || !suPwd2.value) {
        setError(N.t('auth.err.req'));
        return;
      }
      if (!isEmail(suEmail.value.trim())) { setError(N.t('auth.err.email')); suEmail.focus(); return; }
      if (suPwd.value.length < 8) { setError(N.t('auth.err.pass')); suPwd.focus(); return; }
      if (suPwd.value !== suPwd2.value) { setError(N.t('auth.err.match')); suPwd2.focus(); return; }
      if (!suTerms.checked) { setError(N.t('auth.err.terms')); return; }
      busy = true;
      setPending(suSubmit, true);
      N.persistUser({
        first: suFirst.value.trim(),
        last: suLast.value.trim(),
        org: suOrg.value.trim(),
        email: suEmail.value.trim(),
        country: countrySel ? countrySel.value : '',
        lang: langSel ? langSel.value : ''
      }, true);
      finishAuth(N.t('auth.ok.signup'));
    });
  }

  /* ----------------------------------------------------------
     SOCIAL BUTTONS (mock)
     ---------------------------------------------------------- */
  document.querySelectorAll('[data-social]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.done) return;
      btn.dataset.done = '1';
      setPending(btn, true);
      N.persistUser({ social: btn.dataset.social }, true);
      N.toast(toastEl, N.t('auth.social'));
      setTimeout(() => N.navigate(nextParam || 'dashboard.html'), 1200);
    });
  });
})();
