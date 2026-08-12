/* ============================================================
   NABD (نبض) V3 — auth pages script (signin / signup)
   client-side validation · password strength · social (soon) ·
   submit flow
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
     VALIDATION HELPERS
     ---------------------------------------------------------- */
  const NAME_RE = /^[\p{L}\p{M}'’\s.-]+$/u;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* common disposable / throwaway domains rejected at sign-up */
  const DISPOSABLE_DOMAINS = [
    'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'tempmail.com',
    '10minutemail.com', 'throwaway.com', 'trashmail.com', 'sharklasers.com',
    'getnada.com', 'temp-mail.org', 'maildrop.cc', 'mohmal.com',
    'emailnator.com', 'fakeinbox.com', 'dropmail.me', 'inboxkitten.com',
    'tmpmail.org', 'spam4.me', 'mailnesia.com', 'dispostable.com', 'burnermail.io'
  ];

  const cleanName = (v) => (v || '').trim().replace(/\s+/g, ' ');
  const cleanPhone = (v) => (v || '').replace(/[\s().-]/g, '');

  function isValidName(v) {
    const s = cleanName(v);
    if (!s) return false;
    if (s.length < 2) return false;
    if (!NAME_RE.test(s)) return false;
    if ((s.match(/\p{L}/gu) || []).length < 2) return false;
    return true;
  }

  function isValidEmail(v) {
    const s = (v || '').trim();
    if (!EMAIL_RE.test(s)) return false;
    const at = s.lastIndexOf('@');
    const domain = s.slice(at + 1).toLowerCase();
    const parts = domain.split('.');
    const host = parts[parts.length - 2] || '';
    const tld = parts[parts.length - 1] || '';
    if (!host || !/^[a-z]{2,}$/.test(tld)) return false;
    if (DISPOSABLE_DOMAINS.indexOf(domain) !== -1) return false;
    return true;
  }

  /* Egyptian mobile numbers: 010/011/012/015 followed by 8 digits.
     Accepts local (0), local-without-0, +20 and 0020 prefixes. */
  function isValidPhone(v) {
    let n = cleanPhone(v);
    if (!n) return false;
    if (n.charAt(0) === '+') n = n.slice(1);
    if (n.indexOf('0020') === 0) n = n.slice(3);
    else if (n.indexOf('20') === 0) n = n.slice(2);
    if (n.length === 11 && n.charAt(0) === '0') n = n.slice(1);
    return /^1[0125]\d{8}$/.test(n);
  }

  function passwordScore(v) {
    let s = 0;
    if (!v) return 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  }

  function passwordLevel(score) {
    if (score <= 1) return 'weak';
    if (score <= 3) return 'fair';
    return 'strong';
  }

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
    if (!btn.dataset.origText) btn.dataset.origText = btn.textContent;
    btn.disabled = on;
    btn.textContent = on ? N.t('auth.pending') : btn.dataset.origText;
  }

  /* ----------------------------------------------------------
     INLINE FIELD STATE
     ---------------------------------------------------------- */
  function setFieldState(input, msgEl, msg, ok) {
    if (input) {
      input.classList.toggle('field-invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }
    if (msgEl) msgEl.textContent = ok ? '' : msg || '';
    return ok;
  }

  function wireField(input, msgEl, validator) {
    if (!input || !msgEl) return;
    let touched = false;
    const check = () => validator(input.value);
    input.addEventListener('blur', () => { touched = true; check(); });
    input.addEventListener('input', () => { if (touched) check(); });
    return () => { touched = true; return check(); };
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

    const msgEmail = $('siEmailMsg');
    const msgPwd = $('siPwdMsg');

    const checkSiEmail = wireField(siEmail, msgEmail, (v) => {
      const empty = !(v || '').trim();
      const ok = !empty && isValidEmail(v);
      if (!ok) setFieldState(siEmail, msgEmail, empty ? N.t('auth.err.email') : N.t('auth.err.email.bad'), ok);
      return ok;
    });
    const checkSiPwd = wireField(siPwd, msgPwd, (v) => {
      const ok = !!(v || '');
      setFieldState(siPwd, msgPwd, ok ? '' : N.t('auth.err.pass.required'), ok);
      return ok;
    });

    let busy = false;
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) return;
      const okEmail = checkSiEmail();
      const okPwd = checkSiPwd();
      if (!okEmail || !okPwd) {
        setError(N.t('auth.err.req'));
        if (!okEmail && siEmail) siEmail.focus();
        else if (!okPwd && siPwd) siPwd.focus();
        return;
      }
      busy = true;
      setPending(siSubmit, true);
      const remember = !!(siRemember && siRemember.checked);
      N.api('/api/auth/login', {
        method: 'POST',
        body: { email: siEmail.value.trim(), password: siPwd.value, remember }
      }).then((d) => {
        N.persistUser(d.user, remember);
        N.notifAdd({ title: 'notif.auth.in.t', sub: 'notif.auth.in.s', cat: 'system', ts: Date.now() });
        finishAuth(N.t('auth.ok.signin'));
      }).catch((err) => {
        busy = false;
        setPending(siSubmit, false);
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          location.replace('signup.html?verify=' + encodeURIComponent(siEmail.value.trim()));
          return;
        }
        setError(err.message || N.t('auth.err.req'));
      });
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
  const suPhone = $('suPhone');
  const suPwd = $('suPwd');
  const suPwd2 = $('suPwd2');
  const suTerms = $('suTerms');
  const suSubmit = $('signupSubmit');
  let renderStrength = null;

  if (signupForm) {
    const mFirst = $('suFirstMsg');
    const mLast = $('suLastMsg');
    const mEmail = $('suEmailMsg');
    const mPhone = $('suPhoneMsg');
    const mPwd = $('suPwdMsg');
    const mPwd2 = $('suPwd2Msg');
    const mTerms = $('suTermsMsg');

    const nameValidator = (input, msgEl) => (v) => {
      const empty = !cleanName(v);
      const ok = isValidName(v);
      const msg = empty ? N.t('auth.err.name') : (ok ? '' : N.t('auth.err.name.invalid'));
      setFieldState(input, msgEl, msg, ok);
      return ok;
    };

    const checkFirst = wireField(suFirst, mFirst, nameValidator(suFirst, mFirst));
    const checkLast = wireField(suLast, mLast, nameValidator(suLast, mLast));

    const checkEmail = wireField(suEmail, mEmail, (v) => {
      const empty = !(v || '').trim();
      const ok = !empty && isValidEmail(v);
      setFieldState(suEmail, mEmail, ok ? '' : (empty ? N.t('auth.err.email') : N.t('auth.err.email.bad')), ok);
      return ok;
    });

    const checkPhone = wireField(suPhone, mPhone, (v) => {
      const empty = !(v || '').trim();
      const ok = !empty && isValidPhone(v);
      setFieldState(suPhone, mPhone, ok ? '' : N.t('auth.err.phone'), ok);
      return ok;
    });

    /* password strength meter */
    const meter = $('suPwdMeter');
    const levelEl = $('suPwdLevel');
    renderStrength = function () {
      const score = passwordScore(suPwd ? suPwd.value : '');
      if (!score) {
        if (meter) { meter.style.width = '0%'; meter.className = ''; }
        if (levelEl) levelEl.textContent = '';
        return;
      }
      const lvl = passwordLevel(score);
      const pct = { weak: 33, fair: 66, strong: 100 }[lvl];
      if (meter) { meter.style.width = pct + '%'; meter.className = 'lvl-' + lvl; }
      if (levelEl) levelEl.textContent = N.t('auth.pwd.' + lvl);
    }

    const checkPwd = wireField(suPwd, mPwd, (v) => {
      const empty = !(v || '');
      const ok = !empty && v.length >= 8;
      setFieldState(suPwd, mPwd, empty ? N.t('auth.err.pass.required') : (ok ? '' : N.t('auth.err.pass')), ok);
      return ok;
    });
    if (suPwd) suPwd.addEventListener('input', renderStrength);

    const checkPwd2 = wireField(suPwd2, mPwd2, (v) => {
      const empty = !(v || '');
      const ok = !empty && suPwd && v === suPwd.value;
      setFieldState(suPwd2, mPwd2, empty ? N.t('auth.err.confirm.req') : (ok ? '' : N.t('auth.err.match')), ok);
      return ok;
    });

    let busy = false;
    let otpBusy = false;
    let pendingEmail = null;

    /* ---- email OTP verification step ---- */
    const otpWrap = $('otpStep');
    const otpErrEl = $('otpError');
    const setOtpError = (m) => { if (otpErrEl) otpErrEl.textContent = m || ''; };

    function showOtp(email) {
      pendingEmail = email;
      if (signupForm) signupForm.style.display = 'none';
      if (otpWrap) {
        const em = $('otpEmail');
        if (em) em.textContent = email;
        otpWrap.hidden = false;
        const inp = $('suOtp');
        if (inp) inp.focus();
      }
    }

    const otpForm = $('otpForm');
    const otpResend = $('otpResend');

    function verifyOtpDone(d) {
      otpBusy = false;
      busy = false;
      if (d && d.user) N.persistUser(d.user, true);
      N.notifAdd({ title: 'notif.auth.up.t', sub: 'notif.auth.up.s', cat: 'system', ts: Date.now() });
      if (N.getUser()) finishAuth(N.t('auth.ok.signup'));
      else N.navigate('signin.html');
    }

    if (otpForm) otpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (otpBusy) return;
      const inp = $('suOtp');
      const val = (inp && inp.value || '').trim();
      if (!/^\d{6}$/.test(val)) {
        setOtpError(N.t('auth.verify.err.digits'));
        if (inp) inp.focus();
        return;
      }
      otpBusy = true;
      setOtpError('');
      N.api('/api/auth/verify-email', { method: 'POST', body: { email: pendingEmail, otp: val } })
        .then(verifyOtpDone)
        .catch((err) => {
          otpBusy = false;
          setOtpError(err.message || N.t('auth.verify.err'));
          if (inp) inp.select();
        });
    });

    if (otpResend) otpResend.addEventListener('click', () => {
      if (otpResend.disabled) return;
      otpResend.disabled = true;
      N.api('/api/auth/resend-verification', { method: 'POST', body: { email: pendingEmail } })
        .then(() => {
          otpResend.disabled = false;
          N.toast(toastEl, N.t('auth.verify.sent'));
        })
        .catch((err) => {
          otpResend.disabled = false;
          setOtpError(err.message || N.t('auth.verify.err'));
        });
    });

    /* open the OTP step directly when arriving with ?verify=<email> */
    (function () {
      try {
        const v = new URLSearchParams(location.search).get('verify');
        if (v && v.indexOf('@') !== -1) showOtp(decodeURIComponent(v));
      } catch (e) {}
    })();

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) return;

      const okFirst = checkFirst();
      const okLast = checkLast();
      const okEmail = checkEmail();
      const okPhone = checkPhone();
      const okPwd = checkPwd();
      const okPwd2 = checkPwd2();
      const okTerms = !!(suTerms && suTerms.checked);
      if (mTerms) setFieldState(suTerms, mTerms, okTerms ? '' : N.t('auth.err.terms'), okTerms);

      if (!okFirst || !okLast || !okEmail || !okPhone || !okPwd || !okPwd2 || !okTerms) {
        setError(N.t('auth.err.req'));
        const firstBad = suFirst;
        if (!okFirst && firstBad) firstBad.focus();
        else if (!okLast && suLast) suLast.focus();
        else if (!okEmail && suEmail) suEmail.focus();
        else if (!okPhone && suPhone) suPhone.focus();
        else if (!okPwd && suPwd) suPwd.focus();
        else if (!okPwd2 && suPwd2) suPwd2.focus();
        else if (!okTerms && suTerms) suTerms.focus();
        return;
      }

      busy = true;
      setPending(suSubmit, true);
      N.api('/api/auth/signup', {
        method: 'POST',
        body: {
          firstName: cleanName(suFirst.value),
          lastName: cleanName(suLast.value),
          email: suEmail.value.trim(),
          password: suPwd.value,
          phone: suPhone.value,
          organization: (suOrg ? suOrg.value : '').trim(),
          country: countrySel ? countrySel.value : '',
          lang: langSel ? langSel.value : ''
        }
      }).then(() => {
        showOtp(suEmail.value.trim());
      }).catch((err) => {
        busy = false;
        setPending(suSubmit, false);
        setError(err.message || N.t('auth.err.req'));
      });
    });
  }

  /* ----------------------------------------------------------
     SOCIAL BUTTONS — UI only, no auth backend yet
     ---------------------------------------------------------- */
  document.querySelectorAll('[data-social]').forEach((btn) => {
    btn.addEventListener('click', () => {
      N.toast(toastEl, N.t('auth.social'));
    });
  });

  /* ----------------------------------------------------------
     LANGUAGE SWITCH — keep inline validation state consistent
     ---------------------------------------------------------- */
  document.addEventListener('nabd-lang', () => {
    if (countrySel) fillSelect(countrySel, COUNTRIES, (v) => 'c.' + v);
    if (langSel) {
      fillSelect(langSel, ['en', 'ar'], (v) => 'lng.' + v);
      langSel.value = N.lang;
    }
    if (errEl) errEl.textContent = '';
    renderStrength && renderStrength();
  });
})();
