/* ============================================================
   NABD (نبض) — Application shell + page modules
   dashboard · history · reports · profile · settings ·
   connections · api · notifications · favorites · searches
   Requires script.js (window.NABD) loaded first.
   ============================================================ */
(function () {
  'use strict';
  const N = window.NABD;
  if (!N) return;
  const L = (k) => N.t(k);
  const $ = (id) => document.getElementById(id);
  const page = document.body.dataset.page || '';
  const toastEl = () => $('appToast');
  const T = (key) => { if (toastEl()) N.toast(toastEl(), L(key)); };

  /* ----------------------------------------------------------
     AUTH GUARD — protected application routes
     ---------------------------------------------------------- */
  if (!N.getUser()) {
    const here = location.pathname.split('/').pop() + location.search;
    location.replace('signin.html?next=' + encodeURIComponent(here));
    return;
  }

  const IC = {
    grid: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
    pulse: 'M3 12h4l2-7 4 14 2-7h6',
    clock: 'M12 8v4l3 3M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
    file: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h7M9 17h5',
    shield: 'M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7zM9 12l2 2 4-4',
    link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
    star: 'M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z',
    bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0',
    sliders: 'M4 7h7M15 7h5M4 12h3M11 12h9M4 17h9M17 17h3',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
    sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z',
    logout: 'M9 4H5v16h4M13 8l4 4-4 4M17 12H9',
    burger: 'M4 7h16M4 12h16M4 17h16',
    plus: 'M12 5v14M5 12h14',
    copy: 'M8 8h12v12H8zM4 16V4h12'
  };
  const svg = (d, cls) => '<svg viewBox="0 0 24 24" class="' + (cls || '') + '"><path d="' + d + '"/></svg>';

  const NAV = [
    { id: 'dashboard', href: 'dashboard.html', key: 'app.nav.dashboard', ic: IC.grid, sep: 'app.sep1' },
    { id: 'analysis', href: 'dashboard.html?view=analysis', key: 'app.nav.analysis', ic: IC.pulse },
    { id: 'history', href: 'history.html', key: 'app.nav.history', ic: IC.clock },
    { id: 'reports', href: 'reports.html', key: 'app.nav.reports', ic: IC.file },
    { id: 'private', href: 'dashboard.html?view=analysis&p=1', key: 'app.nav.private', ic: IC.shield },
    { id: 'connections', href: 'connections.html', key: 'app.nav.connections', ic: IC.link, sep: 'app.sep2' },
    { id: 'favorites', href: 'favorites.html', key: 'app.nav.favorites', ic: IC.star },
    { id: 'notifications', href: 'notifications.html', key: 'app.nav.notifications', ic: IC.bell, badge: true },
    { id: 'settings', href: 'settings.html', key: 'app.nav.settings', ic: IC.sliders },
    { id: 'profile', href: 'profile.html', key: 'app.nav.profile', ic: IC.user }
  ];

  const MENU = [
    { href: 'profile.html', key: 'app.menu.profile', ic: IC.user },
    { href: 'dashboard.html?view=analysis', key: 'app.menu.workspace', ic: IC.pulse },
    { href: 'history.html', key: 'app.menu.history', ic: IC.clock },
    { href: 'settings.html', key: 'app.menu.settings', ic: IC.sliders },
    { action: 'theme', key: 'app.menu.theme', ic: IC.sun },
    { action: 'lang', key: 'app.menu.lang', ic: IC.globe }
  ];

  function initials() {
    const u = N.getUser();
    if (u) {
      const n = u.name || ((u.first ? u.first : '') + ' ' + (u.last || '')).trim();
      if (n) {
        const p = n.trim().split(/\s+/);
        return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
      }
    }
    return 'NB';
  }

  function unreadCount() {
    try { return Math.max(0, parseInt(localStorage.getItem('nabd-unread') || '4', 10)); } catch (e) { return 4; }
  }

  function injectShell() {
    const holder = $('appShell');
    if (!holder) return false;
    const navHtml = NAV.map((it) => {
      let h = '';
      if (it.sep) h += '<div class="app-nav-sep" data-i18n="' + it.sep + '"></div>';
      h += '<a class="app-nav-item' + (page === it.id ? ' active' : '') + '" href="' + it.href + '" data-page="' + it.href + '" data-nav="' + it.id + '" data-i18n-title="' + it.key + '" title="' + L(it.key) + '">'
        + svg(it.ic) + '<span data-i18n="' + it.key + '">' + L(it.key) + '</span>'
        + (it.badge ? '<span class="nav-badge" id="navBadge">' + unreadCount() + '</span>' : '')
        + '</a>';
      return h;
    }).join('');
    const menuHtml = MENU.map((it) => {
      if (it.href) {
        return '<a class="menu-item" href="' + it.href + '" data-page="' + it.href + '">' + svg(it.ic) + '<span data-i18n="' + it.key + '">' + L(it.key) + '</span></a>';
      }
      return '<button class="menu-item" data-menu="' + it.action + '">' + svg(it.ic) + '<span data-i18n="' + it.key + '">' + L(it.key) + '</span></button>';
    }).join('');
    holder.innerHTML =
      '<aside class="app-side" id="appSide">'
      + '<div class="app-side-head">'
      + '<a class="app-brand" href="index.html" data-page="index.html"><span class="app-logo">' + (N.lang === 'ar' ? 'نبض' : 'N') + '</span><span class="app-brand-name" data-i18n="brand"></span></a>'
      + '<button class="collapse-btn" id="sideCollapse" aria-label="collapse">‹</button>'
      + '</div>'
      + '<nav class="app-nav">' + navHtml + '</nav>'
      + '<div class="app-side-foot">'
      + '<div class="side-user"><span class="avatar" id="sideAvatar">' + initials() + '</span><div><div class="side-user-name" id="sideUserName"></div><div class="side-user-mail" id="sideUserMail"></div></div></div>'
      + '<div class="side-status"><span class="dot"></span><span data-i18n="app.status">' + L('app.status') + '</span></div>'
      + '</div>'
      + '</aside>'
      + '<div class="side-backdrop" id="sideBackdrop"></div>'
      + '<header class="app-top">'
      + '<button class="mobile-menu-btn" id="sideBurger" aria-label="menu">' + svg(IC.burger) + '</button>'
      + '<div class="app-top-left"><span class="app-top-title" data-i18n="app.title.' + page + '">' + L('app.title.' + page) + '</span><span class="app-top-crumb">' + L('app.crumb.app') + ' / ' + L('app.title.' + page) + '</span></div>'
      + '<div class="app-top-actions">'
      + '<button class="icon-btn" id="topTheme" aria-label="theme">' + svg(IC.sun) + '</button>'
      + '<button class="lang-toggle" id="topLang"></button>'
      + '<button class="avatar-btn" id="userMenuBtn" aria-label="menu"><span class="avatar">' + initials() + '</span></button>'
      + '<div class="user-menu" id="userMenu">' + menuHtml
      + '<div class="menu-sep"></div>'
      + '<button class="menu-item danger" data-menu="signout">' + svg(IC.logout) + '<span data-i18n="app.menu.signout">' + L('app.menu.signout') + '</span></button>'
      + '</div>'
      + '</div>'
      + '</header>'
      + '<div class="toast" id="appToast"></div>';
    N.applyLang(N.lang);
    fillUser();
    return true;
  }

  function fillUser() {
    const name = $('sideUserName');
    const mail = $('sideUserMail');
    const u = N.getUser();
    const display = u ? (u.name || ((u.first || '') + ' ' + (u.last || '')).trim() || null) : null;
    if (name) name.textContent = display || 'Guest Analyst';
    if (mail) mail.textContent = (u && u.email) || 'guest@nabd.ai';
  }

  function updateThemeBtn() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const b = $('topTheme');
    if (b) b.innerHTML = svg(dark ? IC.sun : IC.moon);
  }
  function updateLangBtn() {
    const b = $('topLang');
    if (b) b.textContent = N.lang === 'ar' ? 'EN' : 'العربية';
  }

  function bindShell() {
    const side = $('appSide');
    const collapse = $('sideCollapse');
    if (collapse) {
      collapse.addEventListener('click', () => {
        const on = side.classList.toggle('collapsed');
        try { localStorage.setItem('nabd-side', on ? '1' : '0'); } catch (e) {}
      });
      if (localStorage.getItem('nabd-side') === '1') side.classList.add('collapsed');
    }
    const burger = $('sideBurger');
    const backdrop = $('sideBackdrop');
    if (burger && backdrop) {
      const closeSide = () => { side.classList.remove('mobile-open'); backdrop.classList.remove('show'); };
      burger.addEventListener('click', () => {
        side.classList.add('mobile-open');
        backdrop.classList.add('show');
      });
      backdrop.addEventListener('click', closeSide);
    }
    const btn = $('userMenuBtn');
    const menu = $('userMenu');
    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== btn) menu.classList.remove('open');
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.classList.remove('open'); });
      menu.addEventListener('click', (e) => {
        const it = e.target.closest('[data-menu]');
        if (!it) return;
        if (it.dataset.menu === 'theme') {
          const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
          N.applyTheme(next);
          updateThemeBtn();
        } else if (it.dataset.menu === 'lang') {
          setLang(N.lang === 'ar' ? 'en' : 'ar');
        } else if (it.dataset.menu === 'signout') {
          N.clearUser();
          T('app.toast.signedout');
          setTimeout(() => N.navigate('../index.html'), 700);
        }
        menu.classList.remove('open');
      });
    }
    const th = $('topTheme');
    if (th) th.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      N.applyTheme(next);
      updateThemeBtn();
    });
    const tl = $('topLang');
    if (tl) tl.addEventListener('click', () => setLang(N.lang === 'ar' ? 'en' : 'ar'));
    updateThemeBtn();
    updateLangBtn();
  }

  function setLang(next) {
    N.applyLang(next);
    updateLangBtn();
    updateBadge();
    document.dispatchEvent(new window.CustomEvent('app-render'));
  }

  function updateBadge() {
    const b = $('navBadge');
    if (b) b.textContent = unreadCount();
  }
  function notifyUnread() {
    document.dispatchEvent(new window.CustomEvent('app-unread'));
    updateBadge();
  }

  /* ============================================================
     PAGE MODULES
     ============================================================ */
  function sizeCanvas(cv) {
    if (!cv || !cv.parentElement) return null;
    const r = cv.parentElement.getBoundingClientRect();
    if (!r || r.width < 20 || r.height < 20) return null;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    return { w: cv.width, h: cv.height };
  }

  /* ---------------- dashboard ---------------- */
  function initDashboard() {
    const PRV = $('dbPreview');
    const LOD = $('dbLoading');
    const RES = $('dbResults');
    const input = $('dbSearchInput');
    const runBtn = $('dbSearchBtn');
    const fbBtn = $('dbFbBtn');
    const fbChip = $('dbFbChip');
    const resetBtn = $('dbResetBtn');
    const scanText = $('dbScanText');
    const scanSteps = $('dbScanSteps');
    const queryEl = $('dbQuery');
    const privBadge = $('dbPrivateBadge');
    const filterBar = $('dbFilterBar');
    const trendList = $('dbTrendList');
    const donutEl = $('sentimentDonut');
    const trendCanvas = $('trendChart');
    const trendTip = $('trendTip');
    const params = new URLSearchParams(location.search);

    let loadTimer = null;
    let runToken = 0;
    let running = false;
    let query = '';
    let lastResult = null;
    let analysisState = 'idle';           /* idle | loading | success | error */
    const ERR = $('dbError');
    const retryBtn = $('dbRetryBtn');
    const loadQuery = $('dbLoadQuery');
    const progressFill = $('dbProgressFill');
    const progressPct = $('dbProgressPct');
    const STEPS = ['db.loading.1', 'db.loading.2', 'db.loading.3', 'db.loading.4', 'db.loading.5', 'db.loading.6'];

    /* ---------- embedded analysis state machine ---------- */
    function setState(s) {
      analysisState = s;
      if (PRV) PRV.hidden = s !== 'preview';
      if (LOD) {
        LOD.hidden = s !== 'loading';
        if (s === 'loading') LOD.classList.remove('db-exit');
      }
      if (RES) {
        RES.hidden = s !== 'success';
        if (s === 'success') {
          RES.classList.remove('db-fade');
          void RES.offsetWidth;
          RES.classList.add('db-fade');
          applyFilterDefault();
        }
      }
      if (ERR) ERR.hidden = s !== 'error';
    }

    function stopLoading() { clearTimeout(loadTimer); }

    function setBusy(busy) {
      running = busy;
      if (!runBtn) return;
      runBtn.disabled = busy;
      runBtn.classList.toggle('busy', busy);
      const lbl = runBtn.querySelector('.btn-search-label');
      if (lbl) lbl.textContent = busy ? L('db.analyzing') : L('search.btn');
    }

    function showResults() {
      setState('success');
      renderLive();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }

    function showError() {
      stopLoading();
      setBusy(false);
      setState('error');
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }

    function setProgress(p) {
      if (progressFill) progressFill.style.width = p + '%';
      if (progressPct) progressPct.textContent = p + '%';
    }

    function animateSteps(ms) {
      const steps = scanSteps ? Array.prototype.slice.call(scanSteps.querySelectorAll('.step')) : [];
      steps.forEach((s) => { s.classList.remove('on', 'done'); });
      if (scanText) scanText.textContent = L('db.loading.1');
      setProgress(0);
      return new Promise((res) => {
        let i = 0;
        const tick = () => {
          if (i < steps.length) {
            steps[i].classList.add('on');
            if (scanText) scanText.textContent = L('db.loading.' + (i + 1));
            setProgress(Math.round(((i + 1) / steps.length) * 82));
            i += 1;
            loadTimer = setTimeout(tick, ms / steps.length);
          } else {
            setProgress(100);
            res();
          }
        };
        tick();
      });
    }

    const sleep = (ms) => new Promise((r) => { loadTimer = setTimeout(r, ms); });

    function beginRun(q) {
      query = (q || '').trim() || '';
      /* stale-state guard: clear the previous normalized result immediately */
      lastResult = null;
      resetTrend();
      if (loadQuery) loadQuery.textContent = query;
      if (queryEl) queryEl.textContent = query;
      setBusy(true);
      setState('loading');
      const token = ++runToken;
      (async () => {
        try {
          /* real service — POST to the n8n webhook, wait for the response */
          const [res] = await Promise.all([
            N.analyze ? N.analyze(query, { scope: privMode }) : Promise.reject(new Error('analyze-missing')),
            animateSteps(2400)
          ]);
          if (token !== runToken) return;
          lastResult = N.normalizeAnalysisResponse ? N.normalizeAnalysisResponse(res) : res;
          stopLoading();
          if (scanText) scanText.textContent = L('db.ready');
          setProgress(100);
          await sleep(550);
          if (token !== runToken) return;
          if (LOD) LOD.classList.add('db-exit');           /* brief fade out */
          await sleep(320);
          if (token !== runToken) return;
          showResults();
          setBusy(false);
        } catch (e) {
          if (token === runToken) showError();
        }
      })();
    }

    function runAnalysis(q) {
      stopLoading();
      if (privMode === 'private' && !(N.fb && N.fb.read().connected)) {
        /* STEP 5 — no webhook call: existing connection UI + message */
        if (fbBtn) fbBtn.hidden = false;
        try { if (fbBtn && fbBtn.scrollIntoView) fbBtn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        T('db.fb.need');
        return;
      }
      beginRun(q);
    }

    function resetToPreview() {
      runToken += 1;
      stopLoading();
      setBusy(false);
      setProgress(0);
      if (input) input.value = '';
      setState('preview');
      curFilter = 'all';
      try { localStorage.removeItem('nabd-filter'); } catch (e) {}
      paintFilter('all');
      if (input) input.focus();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }

    function submit() {
      if (running) return;
      const q = (input ? input.value : '').trim();
      if (!q) { T('app.toast.empty'); if (input) input.focus(); return; }
      runAnalysis(q);
    }
    if (runBtn) runBtn.addEventListener('click', submit);
    if (retryBtn) retryBtn.addEventListener('click', () => { if (query) beginRun(query); });
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      });
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 110) + 'px';
      });
    }
    if (resetBtn) resetBtn.addEventListener('click', () => { resetToPreview(); T('ws.toast.new'); });

    /* ---------- Facebook connector (real state via N.fb layer) ---------- */
    const fbDis = $('dbFbDis');
    const fbAcct = $('dbFbAcct');
    const privSeg = $('dbPrivSeg');
    let privMode = 'public';
    function readPrivPref() {
      try { return localStorage.getItem('nabd-priv') === 'private' ? 'private' : 'public'; } catch (e) { return 'public'; }
    }
    function paintFb() {
      const st = N.fb ? N.fb.read() : { connected: false };
      if (fbBtn) fbBtn.hidden = st.connected;
      if (fbChip) {
        fbChip.hidden = !st.connected;
        if (fbAcct) fbAcct.textContent = st.connected && st.accountName ? '· ' + st.accountName : '';
      }
      if (fbDis) fbDis.hidden = !st.connected;
    }
    function paintPriv() {
      if (privBadge) privBadge.hidden = privMode !== 'private';
      if (privSeg) {
        privSeg.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.priv === privMode));
      }
      document.title = privMode === 'private' ? 'Private Analysis — NABD (نبض)' : 'Dashboard - NABD (نبض)';
    }
    function setPrivMode(p, persist) {
      privMode = p === 'private' ? 'private' : 'public';
      if (persist !== false) { try { localStorage.setItem('nabd-priv', privMode); } catch (e) {} }
      paintPriv();
    }
    if (fbBtn) fbBtn.addEventListener('click', () => {
      if (N.fb) N.fb.connect();
      paintFb();
      T('app.toast.conn');
    });
    if (fbDis) fbDis.addEventListener('click', async () => {
      const ok = N.confirmDialog
        ? await N.confirmDialog({ title: L('db.fb.conf.t'), text: L('db.fb.conf.s'), okLabel: L('db.fb.conf.ok'), cancelLabel: L('db.fb.conf.cancel') })
        : window.confirm(L('db.fb.conf.t'));
      if (!ok) return;
      if (N.fb) N.fb.disconnect();
      paintFb();
      T('app.toast.conn');
    });
    if (privSeg) privSeg.addEventListener('click', (e) => {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      setPrivMode(b.dataset.priv);
    });
    document.addEventListener('nabd-fb-change', paintFb);
    paintFb();
    privMode = readPrivPref();
    paintPriv();

    /* ---------- quick actions (stay on the dashboard) ---------- */
    document.querySelectorAll('.qa-card').forEach((c) => {
      c.addEventListener('click', () => {
        const act = c.dataset.qa;
        if (act === 'new') { resetToPreview(); T('ws.toast.new'); }
        else if (act === 'saved') runAnalysis(L('dash.fav.q1'));
        else if (act === 'export') T('app.toast.exported');
        else if (act === 'alert') T('app.toast.alert');
      });
    });

    /* ---------- filter chips · REAL category filtering over returned metadata ---------- */
    let curFilter = 'all';
    /* Categories follow the existing app convention (settings "default scope"
       + topic `cat` metadata): news | social | gov | sport | business */
    const CATS = ['news', 'social', 'gov', 'sport', 'business'];
    const SRC_CAT = {
      news: 'news', rss: 'news', google: 'news', trends: 'news', 'google trends': 'news',
      x: 'social', twitter: 'social', fb: 'social', facebook: 'social', ig: 'social',
      instagram: 'social', tiktok: 'social', youtube: 'social'
    };
    function normCat(v) {
      if (v == null) return null;
      const s = String(v).toLowerCase().trim();
      if (s === 'sports' || s === 'sport') return 'sport';
      if (s === 'government' || s === 'gov') return 'gov';
      if (s === 'society') return 'social';
      return CATS.indexOf(s) !== -1 ? s : null;
    }
    /* category of an item from its metadata; source-type only as a fallback
       for source/feed items (news platforms → News, social platforms → Social).
       Items without any usable metadata are only shown under "All". */
    function itemCat(o) {
      if (!o || typeof o !== 'object') return null;
      const c = normCat(pick(o, ['cat', 'category', 'section', 'group'], null));
      if (c) return c;
      const sr = String(pick(o, ['src', 'source', 'sourceType', 'type', 'platform'], '') || '').toLowerCase();
      return SRC_CAT[sr] || null;
    }
    function inCat(o) {
      return curFilter === 'all' || itemCat(o) === curFilter;
    }
    function readFilterPref() {
      try {
        const saved = localStorage.getItem('nabd-filter');
        if (saved === 'all' || CATS.indexOf(saved) !== -1) return saved;
      } catch (e) {}
      let f = 'all';
      try {
        const prefs = JSON.parse(localStorage.getItem('nabd-set') || '{}');
        if (prefs.scope) f = prefs.scope;
      } catch (e) {}
      return CATS.indexOf(f) !== -1 ? f : 'all';
    }
    function paintFilter(f) {
      if (filterBar) {
        filterBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.toggle('active', c.dataset.filter === f));
      }
    }
    function setFilter(f) {
      curFilter = CATS.indexOf(f) !== -1 ? f : 'all';
      try { localStorage.setItem('nabd-filter', curFilter); } catch (e) {}
      paintFilter(curFilter);
      /* re-render the real result widgets under the selected category */
      if (lastResult && analysisState === 'success') renderWidgets();
    }
    function applyFilterDefault() {
      curFilter = readFilterPref();
      paintFilter(curFilter);
    }
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (chip) setFilter(chip.dataset.filter);
      });
    }
    applyFilterDefault();

    /* ---------- sentiment donut (real response → existing component) ---------- */
    function renderDonut() {
      const s = lastResult && lastResult.sentiment;
      const stats = (lastResult && lastResult.raw && lastResult.raw.stats) || {};
      const legendB = donutEl && donutEl.parentElement
        ? Array.prototype.slice.call(donutEl.parentElement.querySelectorAll('.donut-legend b'))
        : [];
      const emptyS = $('dbEmptySentiment');
      const spar = $('dbSparsityNote');
      const postN = num(stats.totalPosts);
      const setSparsity = () => {
        if (!spar) return;
        if (postN != null && postN < 10) {
          spar.hidden = false;
          const p = spar.querySelector('p') || spar;
          p.textContent = L('ws.sent.sparse').split('{n}').join(postN);
        } else {
          spar.hidden = true;
        }
      };
      if (s && Array.isArray(s) && s.length) {
        if (emptyS) emptyS.hidden = true;
        setSparsity();
        N.buildDonut(donutEl, s, (s[0].v || 0) + '%', L('ws.donut.pos').toUpperCase());
        legendB.forEach((b, i) => { if (s[i]) b.textContent = (s[i].v || 0) + '%'; });
        return;
      }
      if (s && typeof s === 'object') {
        const pos = num(s.positive), neu = num(s.neutral), neg = num(s.negative);
        const anyVal = (pos || 0) + (neu || 0) + (neg || 0) > 0;
        if (anyVal) {
          if (emptyS) emptyS.hidden = true;
          setSparsity();
          const segs = [
            { v: Math.max(0, pos || 0), color: '#35D07F' },
            { v: Math.max(0, neu || 0), color: '#7A8BB5' },
            { v: Math.max(0, neg || 0), color: '#F45D5D' }
          ];
          const tot = segs.reduce((a, x) => a + x.v, 0) || 1;
          segs.forEach((x) => { x.v = Math.round((x.v / tot) * 100); });
          N.buildDonut(donutEl, segs, (segs[0].v || 0) + '%', L('ws.donut.pos').toUpperCase());
          legendB.forEach((b, i) => { if (segs[i]) b.textContent = segs[i].v + '%'; });
          return;
        }
        /* all values are 0 — the backend returned a label but no split */
        if (emptyS) {
          emptyS.hidden = false;
          const p = emptyS.querySelector('p') || emptyS;
          p.textContent = L('ws.sent.na') + (s.label ? ' (' + s.label + ')' : '');
        }
      } else if (emptyS) {
        emptyS.hidden = false;
        const p = emptyS.querySelector('p') || emptyS;
        p.textContent = L('ws.sent.na');
      }
      if (donutEl) donutEl.innerHTML = '';
      legendB.forEach((b) => { b.textContent = '—'; });
    }

    /* ---------- real response → existing dashboard widgets ---------- */
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function pick(o, keys, dflt) {
      for (let i = 0; i < keys.length; i++) if (o && o[keys[i]] != null && o[keys[i]] !== '') return o[keys[i]];
      return dflt;
    }
    function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
    function fmtKpi(v) {
      const n = num(v);
      if (n == null) return String(v);
      if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
      if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      return String(Math.round(n * 10) / 10);
    }
    function fmtDelta(d) {
      const n = num(d);
      if (n == null) return String(d == null ? '' : d);
      return (n >= 0 ? '+' : '') + n + '%';
    }
    const SEV = ['sev-danger', 'sev-warn', 'sev-blue', 'sev-pos', 'sev-purple'];
    const TAGS = ['tag-danger', 'tag-blue', 'tag-warn', 'tag-pos', 'tag-purple'];
    const sevCls = (v) => (SEV.indexOf(v) !== -1 ? v : 'sev-blue');
    const tagCls = (v) => (TAGS.indexOf(v) !== -1 ? v : 'tag-blue');

    function listWidget(listEl, emptyEl, items) {
      const has = items.length > 0;
      if (listEl) {
        listEl.style.display = has ? '' : 'none';
        listEl.innerHTML = items.join('');
      }
      if (emptyEl) { emptyEl.hidden = has; emptyEl.style.display = ''; }
    }

    function topicRow(t, i) {
      const label = esc(pick(t, ['label', 'name', 'topic', 'title'], '—'));
      const vol = esc(pick(t, ['vol', 'volume', 'count', 'value'], '—'));
      const dRaw = pick(t, ['delta', 'change'], '');
      const flat = /^(stable|flat|same|even|no change)/i.test(String(dRaw)) || String(pick(t, ['dir', 'up', 'trend'], '')).toLowerCase() === 'flat';
      const down = !flat && (/^-/.test(String(dRaw)) || String(pick(t, ['dir', 'up', 'trend'], '')).toLowerCase() === 'down');
      const w = Math.max(0, Math.min(100, num(pick(t, ['w', 'weight', 'intensity'], 50)) || 50));
      const sev = sevCls(pick(t, ['sev', 'severity', 'level'], 'sev-blue'));
      const cat = esc(pick(t, ['cat', 'category'], ''));
      return '<div class="trend-item"' + (cat ? ' data-cat="' + cat + '"' : '') + '>'
        + '<span class="trend-rank">' + String(i + 1).padStart(2, '0') + '</span>'
        + '<span class="trend-name">' + label + '</span>'
        + '<span class="trend-bar"><i class="' + sev + '" style="--w:' + w + '%"></i></span>'
        + '<span class="trend-vol mono">' + vol + '</span>'
        + '<span class="trend-delta ' + (flat ? 'flat' : down ? 'down' : 'up') + '">' + esc(fmtDelta(dRaw)) + '</span></div>';
    }
    function locationCard(l) {
      const name = esc(pick(l, ['name', 'label', 'city', 'region'], '—'));
      const score = num(pick(l, ['score'], null));
      const count = num(pick(l, ['count'], null));
      const wv = num(pick(l, ['w', 'weight', 'intensity'], null));
      const wBase = wv != null ? wv : (score != null ? score : (count != null ? Math.min(100, count) : null));
      const w = Math.max(0, Math.min(100, wBase || 0));
      const dRaw = pick(l, ['delta', 'change'], '');
      const vol = esc(pick(l, ['vol', 'volume', 'mentions', '24h', 'count', 'value'], '—'));
      return '<div class="region-card">'
        + '<div class="region-top"><span class="region-name">' + name + '</span><span class="region-score">' + (score == null ? '—' : String(Math.round(score))) + '</span></div>'
        + '<div class="region-bar"><i style="--w:' + w + '%"></i></div>'
        + '<div class="region-meta mono"><span class="' + (/^-/.test(String(dRaw)) ? 'down' : 'up') + '">' + esc(fmtDelta(dRaw)) + '</span><span>' + vol + '</span></div></div>';
    }
    function influencerRow(f) {
      const name = esc(pick(f, ['name', 'label', 'title', 'handle'], '—'));
      const cat = esc(pick(f, ['cat', 'desc', 'meta', 'category'], ''));
      const score = esc(pick(f, ['score', 'reach', 'value', 'rank'], '—'));
      let hue = num(pick(f, ['hue', 'h'], null));
      if (hue == null || hue < 0 || hue > 360) hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
      let ini = String(pick(f, ['ini', 'initials'], '') || '').trim();
      if (!ini) {
        const p = name.split(/\s+/).filter(Boolean);
        ini = p.length ? (p[0][0] || '') + (p[1] ? p[1][0] || '' : '') : 'NA';
      }
      return '<div class="rank-row"><span class="rank-avatar" style="--h:' + hue + 'deg">' + esc(ini.toUpperCase()) + '</span>'
        + '<div class="rank-meta"><b>' + name + '</b><span class="mono">' + cat + '</span></div>'
        + '<span class="rank-score mono">' + score + '</span></div>';
    }
    function highlightCard(h) {
      const tag = esc(pick(h, ['tag', 'type', 'label'], L('ws.hl.t2')));
      const cls = tagCls(pick(h, ['cls', 'class', 'severity'], 'tag-blue'));
      const conf = pick(h, ['conf', 'confidence', 'score', 'pct'], null);
      const text = esc(pick(h, ['text', 'summary', 'body', 'title'], '—'));
      const title = esc(pick(h, ['title'], ''));
      const time = esc(pick(h, ['time', 't', 'age', 'when'], ''));
      return '<div class="hl-card"><div class="hl-top"><span class="hl-tag ' + cls + '">' + tag + '</span>'
        + (conf != null ? '<span class="hl-conf mono">' + esc(/[^0-9.]/.test(String(conf)) ? conf : conf + '%') + '</span>' : '')
        + '</div><p class="hl-text">' + (title && title !== text ? '<strong>' + title + '</strong><br>' : '') + text + '</p>'
        + (time ? '<span class="hl-time mono">' + time + '</span>' : '') + '</div>';
    }
    const FEED_MAP = { news: 'feed-news', web: 'feed-news', x: 'feed-x', twitter: 'feed-x', rss: 'feed-rss', facebook: 'feed-fb', fb: 'feed-fb', instagram: 'feed-ig', ig: 'feed-ig', google: 'feed-news', trends: 'feed-news' };
    function feedItem(f) {
      const stRaw = String(pick(f, ['sourceType', 'type', 'medium', 'src'], '') || '').toLowerCase();
      const srcRaw = stRaw || String(pick(f, ['source', 'tag'], '') || '').toLowerCase();
      const cls = FEED_MAP[srcRaw] || 'feed-news';
      const tag = srcRaw === 'x' || srcRaw === 'twitter' ? 'X'
        : srcRaw === 'fb' || srcRaw === 'facebook' ? 'FB'
        : srcRaw === 'ig' || srcRaw === 'instagram' ? 'IG'
        : srcRaw === 'rss' ? 'RSS'
        : srcRaw === 'news' || srcRaw === 'newspaper' || srcRaw === 'article' || srcRaw === 'press' || srcRaw === 'web' || srcRaw === 'website' ? 'NEW'
        : srcRaw === 'google' || srcRaw === 'google trends' || srcRaw === 'trends' ? 'GGL'
        : esc(String(stRaw || pick(f, ['sourceType', 'src', 'source', 'tag', 'type'], 'NEW') || 'NEW').toUpperCase()).slice(0, 4);
      const text = esc(pick(f, ['title', 'text', 'content', 'post', 'message', 'description'], '—'));
      const t = timeAgo(pick(f, ['publishedAt', 'published', 'date', 'datetime', 't', 'time', 'ts', 'age'], ''));
      return '<div class="feed-item"><span class="feed-src ' + cls + '">' + tag + '</span>'
        + '<p class="feed-text">' + text + '</p>' + (t ? '<span class="feed-time mono">' + t + '</span>' : '') + '</div>';
    }
    function timeAgo(v) {
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(v == null ? '' : v);
      const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
      if (s < 60) return s + 's';
      if (s < 3600) return Math.floor(s / 60) + 'm';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      return Math.floor(s / 86400) + 'd';
    }
    function bucketLabel(ms) {
      const d = new Date(ms);
      if (isNaN(d.getTime())) return '';
      if (ms % 86400000 === 0 || d.getHours() === 0 && ms / 3600000 % 24 === 0) {
        return d.toLocaleDateString(N.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
      }
      return String(d.getHours()).padStart(2, '0') + ':00';
    }
    const NET_COLORS = ['#35D07F', '#5EA2FF', '#7A5CFF', '#F5B84A', '#F45D5D', '#5EC7D0', '#C05EFF', '#FF8A5E'];
    const SRC_MAP = { 'News desks': 'ws.src.r1', 'X (Twitter)': 'ws.src.r2', Facebook: 'ws.src.r3', 'RSS feeds': 'ws.src.r4', Instagram: 'ws.src.r5', 'Google Trends': 'ws.src.r6' };
    const MIX_MAP = { News: 'ws.mix.news', Social: 'ws.mix.social', Government: 'ws.mix.gov', Politics: 'ws.mix.gov', Sports: 'ws.mix.sports', Sport: 'ws.mix.sports', Business: 'ws.mix.business', Economy: 'ws.mix.business', Tech: 'ws.mix.r5', Technology: 'ws.mix.r5', Culture: 'ws.mix.r4', Weather: 'ws.mix.r6' };
    function srcRow(s) {
      const key = SRC_MAP[s.label];
      const pct = num(s.pct);
      const count = num(s.count);
      const hasRealPct = s.realPct != null;
      return '<div class="src-row"><span>' + (key ? esc(L(key)) : esc(s.label)) + '</span>'
        + '<span class="src-bar"><i style="--w:' + Math.max(0, Math.min(100, pct || 0)) + '%"></i></span>'
        + '<b class="mono">' + (hasRealPct ? pct + '%' : (count != null ? count + '×' : (pct == null ? '—' : pct + '%'))) + '</b></div>';
    }
    function mixRow(c) {
      const key = MIX_MAP[c.label];
      const pct = num(c.pct);
      return '<div class="src-row"><span>' + (key ? esc(L(key)) : esc(c.label)) + '</span>'
        + '<span class="src-bar"><i style="--w:' + Math.max(0, Math.min(100, pct || 0)) + '%"></i></span>'
        + '<b class="mono">' + (pct == null ? '—' : pct + '%') + '</b></div>';
    }
    /* Key data: generic, data-driven rows from the backend's optional
       dataPoints field. Nothing here is hardcoded per query type — the card
       renders whatever structured facts n8n actually returned. */
    function keyDataRow(p) {
      const val = String(p.value == null ? '' : p.value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const unit = p.unit ? ' / ' + esc(String(p.unit)) : '';
      const cur = p.currency ? ' ' + esc(String(p.currency)) : '';
      const cat = p.category ? esc(String(p.category).toUpperCase()) : '';
      const src = p.source ? esc(String(p.source)) + (p.timestamp ? ' · ' + esc(String(p.timestamp)) : '') : (p.timestamp ? esc(String(p.timestamp)) : '');
      return '<div class="kd-row"><span class="kd-name">' + esc(p.name) + '</span>'
        + '<span class="kd-value mono">' + val + cur + unit + '</span>'
        + (cat || src ? '<span class="kd-meta mono">' + (cat ? cat + (src ? ' · ' : '') : '') + src + '</span>' : '') + '</div>';
    }
    function renderKeyData(r) {
      const dps = Array.isArray(r.dataPoints) ? r.dataPoints : [];
      listWidget($('dbKeyDataList'), $('dbEmptyKeyData'), dps.map(keyDataRow));
    }
    function renderKpis(r) {
      const stats = (r.raw && r.raw.stats) || {};
      const kpiM = $('kpiMentions');
      if (kpiM) kpiM.textContent = stats.totalPosts != null && stats.totalPosts !== '' ? fmtKpi(stats.totalPosts) : '—';
      const kpiS = $('kpiCairoSent');
      if (kpiS) {
        const n = num(stats.sentimentScore);
        kpiS.textContent = n != null ? String(Math.round(n * 10) / 10) : (stats.sentimentScore != null && stats.sentimentScore !== '' ? String(stats.sentimentScore) : '—');
      }
      const kpiC = $('kpiCrises');
      if (kpiC) {
        const n = num(stats.emergencyAlerts);
        kpiC.textContent = n != null ? String(Math.round(n)) : (stats.emergencyAlerts != null && stats.emergencyAlerts !== '' ? String(stats.emergencyAlerts) : '—');
      }
      const kpiI = $('kpiInflation');
      const infl = (r.raw && r.raw.metrics) ? pick(r.raw.metrics, ['inflation', 'inflationRate', 'inflation_rate'], null) : null;
      if (kpiI) {
        const n = num(infl);
        kpiI.textContent = n != null ? String(n) + '%' : '—';
      }
      document.querySelectorAll('.kpi-card .delta').forEach((d) => {
        d.classList.remove('up', 'down');
        d.textContent = '—';
      });
    }
    function renderSummary(r) {
      const title = $('dbBriefTitle');
      if (title) title.textContent = esc(query) + ' — ' + L('ws.brief');
      const st = $('dbSummaryText');
      const es = $('dbEmptySummary');
      let paras = null;
      if (r.summary && String(r.summary).trim()) {
        paras = String(r.summary).split(/\n+/).map((p) => p.trim()).filter(Boolean);
      } else if (N.buildBrief) {
        paras = N.buildBrief(r, N.lang);
      }
      if (paras && paras.length) {
        if (st) {
          st.hidden = false;
          st.innerHTML = paras.map((p) => '<p>' + esc(p) + '</p>').join('');
        }
        if (es) es.hidden = true;
      } else if (st) {
        st.hidden = true;
        st.innerHTML = '';
        if (es) es.hidden = false;
      }
      const meta1 = $('dbMeta1');
      if (meta1) meta1.textContent = r.articles && r.articles.length ? r.articles.length + ' ' + L('ws.src.count') : '';
      const meta2 = $('dbMeta2');
      if (meta2) meta2.textContent = r.analyzedAt ? L('ws.updated') + ' ' + timeAgo(r.analyzedAt) : '';
      const meta3 = $('dbMeta3');
      if (meta3) meta3.textContent = r.confidence != null ? L('ws.conf') + ' ' + Math.round(r.confidence) + '%' : '';
      const chips = $('dbChips');
      if (chips) {
        const cats = r.categories && r.categories.length ? r.categories.slice(0, 4) : [];
        chips.hidden = !cats.length;
        chips.innerHTML = cats.map((c) => '<span class="chip"><span class="chip-pulse" aria-hidden="true"></span> <span>' + esc(MIX_MAP[c.label] ? L(MIX_MAP[c.label]) : c.label) + (num(c.pct) != null ? ' ' + num(c.pct) + '%' : '') + '</span></span>').join('');
      }
    }
    function renderGlobal(r) {
      let g = null;
      if (r.globalContext) {
        const gc = r.globalContext;
        if (Array.isArray(gc)) g = gc;
        else if (typeof gc === 'object') g = Array.isArray(gc.items) ? gc.items : Array.isArray(gc.topics) ? gc.topics : gc.rows || null;
      }
      listWidget($('dbGlobalList'), $('dbEmptyGlobal'), (g || []).map(topicRow));
    }
    function renderWidgets() {
      const r = lastResult && typeof lastResult === 'object' && !Array.isArray(lastResult) ? lastResult : {};
      const has = (v) => Array.isArray(v) && v.length > 0;

      renderKpis(r);
      renderSummary(r);
      renderGlobal(r);
      renderKeyData(r);

      const topics = has(r.topics) ? r.topics : (Array.isArray(r.trendingTopics) ? r.trendingTopics : []);
      const locs = has(r.locations) ? r.locations : (Array.isArray(r.topLocations) ? r.topLocations : []);
      const infs = has(r.influencers) ? r.influencers : (Array.isArray(r.topInfluencers) ? r.topInfluencers : []);
      const hls = has(r.highlights) ? r.highlights : (Array.isArray(r.aiHighlights) ? r.aiHighlights : []);
      const feed = has(r.articles) ? r.articles : (Array.isArray(r.sampleSources) ? r.sampleSources : []);
      const srcs = has(r.sources) ? r.sources : [];
      const cats = has(r.categories) ? r.categories : [];

      listWidget($('dbTrendList'), $('dbEmptyTopics'), topics.filter(inCat).map(topicRow));
      listWidget($('dbHlList'), $('dbEmptyHighlights'), hls.filter(inCat).map(highlightCard));
      listWidget($('dbFeedTrack'), $('dbEmptyFeed'), feed.filter(inCat).map(feedItem));

      const nl = $('dbNational');
      const el = $('dbEmptyLocations');
      if (locs.length) {
        listWidget($('regionGrid'), el, locs.map(locationCard));
        if (nl) nl.hidden = true;
      } else {
        listWidget($('regionGrid'), el, []);
        if (nl) nl.hidden = !r.national;
      }
      listWidget($('dbRankList'), $('dbEmptyInfluencers'), infs.map(influencerRow));
      listWidget($('dbSrcList'), $('dbEmptySources'), srcs.map(srcRow));
      listWidget($('dbMixList'), $('dbEmptyMix'), cats.map(mixRow));
    }
    function renderLive() {
      renderDonut();
      resetTrend();
      initTrend();
      renderWidgets();
    }
    /* keep dynamic widgets in sync when the language or theme changes */
    document.addEventListener('app-render', () => {
      if (analysisState === 'success' && lastResult) {
        renderDonut();
        renderWidgets();
      }
    });

    /* ---------- live trend timeline ---------- */
    let trendData = null, trendLabels = null, trendProgress = 0, trendRunning = false, trendLive = null;
    function resetTrend() {
      if (trendLive) { clearInterval(trendLive); trendLive = null; }
      trendRunning = false;
      trendProgress = 0;
      trendData = null;
    }
    function initTrend() {
      if (!trendCanvas || trendData) return;
      const tl = lastResult && (Array.isArray(lastResult.timeline) ? lastResult.timeline : null);
      let nums = tl ? tl.map((p) => { const n = Number(p && typeof p === 'object' ? p.count : p); return isNaN(n) ? null : n; }) : [];
      nums = nums.filter((n) => n != null);
      const isTs = tl && tl.length && tl[0] && typeof tl[0] === 'object' && tl[0].bucket > 1000000000;
      trendLabels = isTs ? tl.map((p) => bucketLabel(p.bucket)) : null;
      if (trendLabels && trendLabels.length > 7) {
        const step = Math.ceil(trendLabels.length / 7);
        trendLabels = trendLabels.map((ll, i) => (i % step === 0 ? ll : ''));
      }
      trendData = nums.length >= 1 ? nums : null;
      if (!trendData) {
        const emptyTrend = $('dbEmptyTrend');
        if (emptyTrend) { emptyTrend.hidden = false; emptyTrend.style.display = ''; }
        return;
      }
      const ctx = trendCanvas.getContext('2d');
      const sizeCanvas = () => {
        const rect = trendCanvas.parentElement.getBoundingClientRect();
        if (!rect || rect.width < 4 || rect.height < 4) return null;
        const dpr = window.devicePixelRatio || 1;
        trendCanvas.width = Math.round(rect.width * dpr);
        trendCanvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return rect;
      };
      const draw = (p) => {
        const rect = sizeCanvas();
        if (!rect) return;
        const w = rect.width, h = rect.height;
        const padL = 8, padR = 8, padT = 12, padB = 22;
        const iw = w - padL - padR, ih = h - padT - padB;
        const max = Math.max(...trendData), min = Math.min(...trendData);
        const range = max - min || 1;
        const X = (i) => padL + (i / (trendData.length - 1)) * iw;
        const Y = (v) => padT + ih - ((v - min) / range) * ih;

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(' + N.gridRGB().join(',') + ')';
        ctx.lineWidth = 1;
        ctx.font = '10px "IBM Plex Mono", monospace';
        for (let g = 0; g <= 4; g++) {
          const gy = padT + (ih / 4) * g;
          ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(w - padR, gy); ctx.stroke();
          ctx.fillStyle = 'rgba(' + N.labelRGB().join(',') + ')';
          ctx.textAlign = 'right';
          const kDiv = max >= 1000 ? 1000 : 1;
          ctx.fillText((Math.round((max - (range / 4) * g) / kDiv)) + (kDiv > 1 ? 'K' : ''), w - padR - 4, gy - 4);
        }
        ctx.textAlign = 'center';
        const nLab = trendLabels && trendLabels.length ? trendLabels : ['00', '04', '08', '12', '16', '20', '24'];
        nLab.forEach((ll, i) => ctx.fillText(ll, padL + (iw / Math.max(1, nLab.length - 1)) * i, h - 6));

        ctx.save();
        ctx.beginPath();
        ctx.rect(padL, padT, iw * p, ih);
        ctx.clip();

        const lastI = Math.max(1, Math.floor(p * (trendData.length - 1)));
        const seg = trendData.slice(0, lastI + 1);

        const grad = ctx.createLinearGradient(0, padT, 0, padT + ih);
        grad.addColorStop(0, 'rgba(' + N.accentRGB().slice(0, 3).join(',') + ',.32)');
        grad.addColorStop(1, 'rgba(' + N.accentRGB().slice(0, 3).join(',') + ',0)');
        ctx.beginPath();
        ctx.moveTo(X(0), Y(seg[0]));
        for (let i = 1; i < seg.length; i++) {
          const xm = (X(i - 1) + X(i)) / 2;
          ctx.quadraticCurveTo(X(i - 1), Y(seg[i - 1]), xm, Y((seg[i - 1] + seg[i]) / 2));
        }
        ctx.lineTo(X(seg.length - 1), padT + ih);
        ctx.lineTo(X(0), padT + ih);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < seg.length; i++) {
          if (i === 0) ctx.moveTo(X(0), Y(seg[0]));
          else ctx.quadraticCurveTo(X(i - 1), Y(seg[i - 1]), (X(i - 1) + X(i)) / 2, Y((seg[i - 1] + seg[i]) / 2));
        }
        ctx.strokeStyle = N.cssVar('--accent');
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(94,162,255,.75)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        const ex = X(lastI), ey = Y(seg[lastI]);
        const dg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 12);
        dg.addColorStop(0, 'rgba(255,255,255,.85)');
        dg.addColorStop(1, 'rgba(94,162,255,0)');
        ctx.beginPath(); ctx.arc(ex, ey, 12, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill();
        ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      };
      let animId = null;
      const animate = (from, to, dur, done) => {
        if (animId) cancelAnimationFrame(animId);
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          trendProgress = from + (to - from) * (1 - Math.pow(1 - p, 3));
          draw(trendProgress);
          if (p < 1) animId = requestAnimationFrame(step);
          else if (done) done();
        };
        animId = requestAnimationFrame(step);
      };
      N.viewObserver(trendCanvas, () => {
        if (trendRunning) return;
        trendRunning = true;
        animate(0, 1, 1500);
      });
      if (trendTip) {
        const body = trendCanvas.parentElement;
        body.addEventListener('mousemove', (e) => {
          const rect = body.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const iw = rect.width - 16;
          const idx = Math.max(0, Math.min(trendData.length - 1, Math.round(((px - 8) / iw) * (trendData.length - 1))));
          const label = trendLabels && trendLabels.length ? (trendLabels[idx] || '') : String(parseInt((idx / trendData.length) * 24, 10)).padStart(2, '0') + ':00';
          const tipDiv = Math.max.apply(null, trendData) >= 1000 ? 1000 : 1;
          const vv = Math.round(trendData[idx] / tipDiv);
          trendTip.textContent = label + ' · ' + vv + (tipDiv > 1 ? 'k ' : ' ') + L('ws.timeline.tip');
          trendTip.style.left = px + 'px';
          trendTip.style.top = '6px';
          trendTip.classList.add('visible');
        });
        body.addEventListener('mouseleave', () => trendTip.classList.remove('visible'));
      }
      window.addEventListener('resize', () => trendRunning && draw(trendProgress));
      document.addEventListener('nabd-theme', () => trendRunning && draw(trendProgress));
      document.addEventListener('nabd-lang', () => trendRunning && draw(trendProgress));
    }

    /* ---------- deep link · private · landing handoff ---------- */
    if (params.get('p') === '1') setPrivMode('private', false);
    else { privMode = readPrivPref(); paintPriv(); }
    const deepQ = (params.get('q') || '').trim();
    if (params.get('view') === 'analysis' || deepQ) {
      if (deepQ) {
        if (input) input.value = deepQ;
        runAnalysis(deepQ);
      } else if (input) {
        input.value = N.QUERIES[N.lang][0];
        input.focus();
      }
    }
  }

  /* ---------------- history ---------------- */
  function initHistory() {
    const rows = [
      { q: 'hist.q1', t: '09:42', cat: 'business', st: 'done', src: '14 sources', vis: 'public', exp: 1, fav: 1, pop: 1 },
      { q: 'hist.q2', t: '08:15', cat: 'news', st: 'done', src: '11 sources', vis: 'public', exp: 1, fav: 0, pop: 1 },
      { q: 'hist.q3', t: 'Yesterday', cat: 'business', st: 'done', src: '9 sources', vis: 'private', exp: 0, fav: 1, pop: 0 },
      { q: 'hist.q4', t: 'Yesterday', cat: 'gov', st: 'failed', src: '6 sources', vis: 'public', exp: 0, fav: 0, pop: 0 },
      { q: 'hist.q5', t: '2 days ago', cat: 'social', st: 'done', src: '12 sources', vis: 'private', exp: 1, fav: 0, pop: 1 },
      { q: 'hist.q6', t: '2 days ago', cat: 'sport', st: 'done', src: '7 sources', vis: 'public', exp: 0, fav: 0, pop: 1 },
      { q: 'hist.q7', t: '3 days ago', cat: 'news', st: 'running', src: '10 sources', vis: 'public', exp: 0, fav: 1, pop: 0 },
      { q: 'hist.q8', t: '4 days ago', cat: 'business', st: 'done', src: '8 sources', vis: 'private', exp: 0, fav: 0, pop: 0 }
    ];
    const list = $('histList');
    const grid = $('histGrid');
    const tl = $('histTimeline');
    const count = $('histCount');
    const empty = $('histEmpty');
    const search = $('histSearch');
    const sortSel = $('histSort');
    const filterBar = $('histFilters');
    const viewSeg = $('histView');
    if (!list) return;

    const stLabel = { done: 'app.st.done', running: 'app.st.running', failed: 'app.st.failed' };
    const catLabel = { news: 'app.cat.news', social: 'app.cat.social', gov: 'app.cat.gov', sport: 'app.cat.sport', business: 'app.cat.business' };
    const stCls = { done: 'ok', running: 'warn', failed: 'bad' };
    const pins = (() => { try { return JSON.parse(localStorage.getItem('nabd-pins') || '[]'); } catch (e) { return []; } })();

    function rowHtml(r, i) {
      const q = L(r.q);
      const pinned = pins.indexOf(r.q) !== -1;
      return '<div class="app-row" data-i="' + i + '">'
        + '<span class="row-icon">' + svg(IC.pulse) + '</span>'
        + '<div class="grow"><div class="row-title">' + q + '</div><div class="row-sub">' + r.t + ' · ' + L(catLabel[r.cat]) + ' · ' + r.src + '</div></div>'
        + '<span class="status-chip ' + stCls[r.st] + '"><span class="d"></span>' + L(stLabel[r.st]) + '</span>'
        + '<span class="status-chip ' + (r.vis === 'public' ? 'neu' : 'ok') + '"><span class="d"></span>' + (r.vis === 'public' ? L('hist.filter.public') : L('hist.filter.private')) + '</span>'
        + (r.exp ? '<span class="status-chip neu">CSV</span>' : '')
        + '<div class="row-actions">'
        + '<button class="icon-btn sm star-btn' + (pinned ? ' on' : '') + '" data-act="pin" title="' + L('hist.pin') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-act="rerun" title="' + L('hist.rerun') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-act="del" title="' + L('hist.delete') + '">✕</button>'
        + '</div></div>';
    }
    function cardHtml(r, i) {
      const pinned = pins.indexOf(r.q) !== -1;
      return '<div class="hist-card" data-i="' + i + '">'
        + '<div class="row-title">' + L(r.q) + '</div>'
        + '<div class="row-sub">' + r.t + ' · ' + L(catLabel[r.cat]) + '</div>'
        + '<div><span class="status-chip ' + stCls[r.st] + '"><span class="d"></span>' + L(stLabel[r.st]) + '</span></div>'
        + '<div class="row-actions">'
        + '<button class="icon-btn sm star-btn' + (pinned ? ' on' : '') + '" data-act="pin" title="' + L('hist.pin') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-act="rerun" title="' + L('hist.rerun') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-act="del" title="' + L('hist.delete') + '">✕</button>'
        + '</div></div>';
    }
    function tlHtml(r, i) {
      const pinned = pins.indexOf(r.q) !== -1;
      return '<div class="tl-item" data-i="' + i + '"><div class="tl-title">' + L(r.q) + '</div>'
        + '<div class="tl-sub">' + L(catLabel[r.cat]) + ' · ' + r.src + ' · <span class="status-chip ' + stCls[r.st] + '" style="padding:1px 8px;font-size:.68rem"><span class="d"></span>' + L(stLabel[r.st]) + '</span></div>'
        + '<div class="tl-time">' + r.t + '</div>'
        + '<div class="row-actions" style="margin-top:8px">'
        + '<button class="icon-btn sm star-btn' + (pinned ? ' on' : '') + '" data-act="pin" title="' + L('hist.pin') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-act="rerun" title="' + L('hist.rerun') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-act="del" title="' + L('hist.delete') + '">✕</button>'
        + '</div></div>';
    }

    let mode = 'list';
    let filter = 'all';
    let query = '';

    function visible(r) {
      if (query && L(r.q).toLowerCase().indexOf(query.toLowerCase()) === -1) return false;
      if (filter === 'public' && r.vis !== 'public') return false;
      if (filter === 'private' && r.vis !== 'private') return false;
      if (filter === 'exported' && !r.exp) return false;
      if (filter === 'fav' && pins.indexOf(r.q) === -1) return false;
      return true;
    }

    function render() {
      let data = rows.filter(visible);
      if (sortSel && sortSel.value === 'popular') data = data.filter((r) => r.pop);
      const htmls = { list: rowHtml, grid: cardHtml, timeline: tlHtml };
      const target = mode === 'list' ? list : mode === 'grid' ? grid : tl;
      target.innerHTML = data.map((r) => htmls[mode](r, rows.indexOf(r))).join('');
      list.style.display = mode === 'list' ? '' : 'none';
      grid.style.display = mode === 'grid' ? '' : 'none';
      tl.style.display = mode === 'timeline' ? '' : 'none';
      if (count) count.textContent = data.length + ' ' + L('hist.count');
      if (empty) empty.style.display = data.length ? 'none' : 'block';
    }

    if (viewSeg) {
      viewSeg.querySelectorAll('.seg-btn').forEach((b) => {
        b.addEventListener('click', () => {
          viewSeg.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          mode = b.dataset.view;
          render();
        });
      });
    }
    if (filterBar) {
      filterBar.querySelectorAll('.filter-chip').forEach((ch) => {
        ch.addEventListener('click', () => {
          filterBar.querySelectorAll('.filter-chip').forEach((x) => x.classList.remove('active'));
          ch.classList.add('active');
          filter = ch.dataset.f;
          render();
        });
      });
    }
    if (search) search.addEventListener('input', () => { query = search.value.trim(); render(); });
    if (sortSel) sortSel.addEventListener('change', render);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const card = btn.closest('[data-i]');
      const r = rows[parseInt(card && card.dataset.i, 10)];
      if (!r) return;
      if (btn.dataset.act === 'rerun') N.navigate('dashboard.html?view=analysis&q=' + encodeURIComponent(L(r.q)));
      else if (btn.dataset.act === 'pin') {
        const ix = pins.indexOf(r.q);
        if (ix === -1) pins.push(r.q); else pins.splice(ix, 1);
        try { localStorage.setItem('nabd-pins', JSON.stringify(pins)); } catch (err) {}
        render();
      } else if (btn.dataset.act === 'del') {
        rows.splice(rows.indexOf(r), 1);
        render();
        T('app.toast.del');
      }
    });
    document.addEventListener('app-render', render);
    render();
  }

  /* ---------------- reports ---------------- */
  function initReports() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rep]');
      if (!b) return;
      const card = b.closest('.doc-card');
      if (b.dataset.rep === 'delete') {
        if (card) card.remove();
        const empty = $('repEmpty');
        if (empty) empty.style.display = document.querySelectorAll('.doc-card').length ? 'none' : 'block';
        T('app.toast.del');
      } else if (b.dataset.rep === 'dup') T('app.toast.dup');
      else if (b.dataset.rep === 'share') T('app.toast.shared');
      else if (b.dataset.rep === 'download') T('app.toast.exported');
      else if (b.dataset.rep === 'preview') T('app.toast.created');
    });
  }

  /* ---------------- profile ---------------- */
  function initProfile() {
    const bars = document.querySelectorAll('[data-usage]');
    setTimeout(() => {
      bars.forEach((b) => {
        const w = b.dataset.usage;
        const fill = b.classList.contains('bar-fill') ? b : b.querySelector('.bar-fill');
        if (fill) fill.style.width = w + '%';
      });
    }, 150);
    const ed = $('profEdit');
    if (ed) ed.addEventListener('click', () => T('app.toast.saved'));
  }

  /* ---------------- settings ---------------- */
  function initSettings() {
    const store = (() => {
      try { return JSON.parse(localStorage.getItem('nabd-set') || '{}'); } catch (e) { return {}; }
    })();
    const defs = { n1: 1, n2: 1, n3: 0, n4: 1, n5: 1, p1: 1, p2: 0, p3: 0, sec2: 0, e1: 0, e2: 0, e3: 0 };
    const save = () => { try { localStorage.setItem('nabd-set', JSON.stringify(store)); } catch (e) {} };
    document.querySelectorAll('.switch[data-set]').forEach((sw) => {
      const key = sw.dataset.set;
      const inp = sw.querySelector('input');
      inp.checked = store[key] === undefined ? !!defs[key] : !!store[key];
      inp.addEventListener('change', () => { store[key] = inp.checked ? 1 : 0; save(); });
    });
    const themeButtons = document.querySelectorAll('[data-theme-set]');
    let curTheme = 'dark';
    try { curTheme = localStorage.getItem('nabd-theme') || 'dark'; } catch (e) {}
    themeButtons.forEach((b) => b.classList.toggle('active', b.dataset.themeSet === curTheme));
    themeButtons.forEach((b) => {
      b.addEventListener('click', () => {
        N.applyTheme(b.dataset.themeSet);
        themeButtons.forEach((x) => x.classList.toggle('active', x === b));
      });
    });
    const anScope = $('setAnScope');
    if (anScope) {
      anScope.value = store.scope || 'all';
      anScope.addEventListener('change', () => {
        store.scope = anScope.value;
        save();
        T('app.toast.saved');
      });
    }
    const anSrcs = document.querySelectorAll('[data-an-src]');
    const srcSel = (store.sources && store.sources.length) ? store.sources.slice() : ['news', 'social'];
    anSrcs.forEach((b) => {
      const v = b.dataset.anSrc;
      b.classList.toggle('active', srcSel.indexOf(v) !== -1);
      b.addEventListener('click', () => {
        const ix = srcSel.indexOf(v);
        if (ix === -1) srcSel.push(v); else srcSel.splice(ix, 1);
        store.sources = srcSel.slice();
        save();
        b.classList.toggle('active', ix === -1);
        T('app.toast.saved');
      });
    });
    const sel = $('setLang');
    if (sel) {
      sel.value = N.lang;
      sel.addEventListener('change', () => { N.applyLang(sel.value); });
    }
    const gs = $('setGeneralSave');
    if (gs) gs.addEventListener('click', () => T('app.toast.saved'));
    const dg = $('setDanger');
    if (dg) dg.addEventListener('click', () => {
      if (window.confirm(L('set.danger.sub'))) {
        N.clearUser();
        try { localStorage.removeItem('nabd-set'); } catch (e) {}
        N.navigate('../index.html');
      }
    });
  }

  /* ---------------- connections ---------------- */
  function initConnections() {
    const cards = document.querySelectorAll('.conn-card');
    const fbSt = () => (N.fb ? N.fb.read() : { connected: false }).connected;
    const state = { fb: fbSt() ? 'on' : 'off', rss: 'on', gnews: 'off', gtrends: 'off', newsapi: 'off', ig: 'soon', sp: 'soon', gq: 'soon' };
    function paint() {
      cards.forEach((c) => {
        const id = c.dataset.conn;
        const s = state[id];
        c.classList.toggle('off', s === 'off');
        const chip = c.querySelector('.conn-chip');
        if (chip) {
          if (s === 'on') { chip.className = 'status-chip conn-chip ok'; chip.innerHTML = '<span class="d"></span>' + L('conn.status.ok'); }
          else if (s === 'soon') { chip.className = 'status-chip conn-chip neu'; chip.innerHTML = '<span class="d"></span>' + L('conn.status.soon'); }
          else { chip.className = 'status-chip conn-chip neu'; chip.innerHTML = '<span class="d"></span>' + L('conn.status.off'); }
        }
        const ls = c.querySelector('.cm-last');
        if (ls) ls.textContent = s === 'on' ? '2m ago' : '—';
        const btns = c.querySelector('.conn-tools');
        if (btns) {
          btns.innerHTML = s === 'soon'
            ? '<span class="status-chip neu"><span class="d"></span>' + L('app.soon') + '</span>'
            : s === 'on'
              ? '<button class="btn btn-ghost btn-sm" data-ca="dis">' + L('conn.disconnect') + '</button><button class="btn btn-ghost btn-sm" data-ca="rec">' + L('conn.reconnect') + '</button>'
              : '<button class="btn btn-primary btn-sm" data-ca="con">' + L('conn.connect') + '</button>';
        }
      });
    }
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-ca]');
      if (!b) return;
      const card = b.closest('.conn-card');
      const id = card && card.dataset.conn;
      if (!id || !(id in state)) return;
      if (b.dataset.ca === 'dis') {
        if (id === 'fb') {
          const ok = N.confirmDialog
            ? await N.confirmDialog({ title: L('db.fb.conf.t'), text: L('db.fb.conf.s'), okLabel: L('db.fb.conf.ok'), cancelLabel: L('db.fb.conf.cancel') })
            : window.confirm(L('db.fb.conf.t'));
          if (!ok) return;
          if (N.fb) N.fb.disconnect();
        }
        state[id] = 'off';
      }
      else if (b.dataset.ca === 'rec') state[id] = 'on';
      else {
        state[id] = 'on';
        if (id === 'fb' && N.fb) N.fb.connect();
      }
      paint();
      T('app.toast.conn');
    });
    document.addEventListener('nabd-fb-change', () => { state.fb = fbSt() ? 'on' : 'off'; paint(); });
    paint();
  }

  /* ---------------- api ---------------- */
  function initApi() {
    const keyWrap = $('apiKeys');
    const keyTpl = (name, sub, pre) => '<div class="app-row key-row">'
      + '<span class="key-prefix">' + pre + '</span>'
      + '<div class="grow"><div class="row-title">' + name + '</div><div class="row-sub">' + sub + '</div></div>'
      + '<div class="key-actions">'
      + '<button class="icon-btn sm" data-key="copy" title="' + L('api.keys.copy') + '">' + svg(IC.copy) + '</button>'
      + '<button class="btn btn-ghost btn-sm" data-key="revoke">' + L('api.keys.revoke') + '</button>'
      + '</div></div>';
    const create = $('apiCreate');
    if (create) create.addEventListener('click', () => {
      if (!keyWrap) return;
      const n = keyWrap.querySelectorAll('.key-row').length + 1;
      keyWrap.insertAdjacentHTML('beforeend', keyTpl(L('api.keys.create') + ' #' + n, 'created just now', 'nbd_live_' + Math.random().toString(36).slice(2, 10)));
      T('app.toast.created');
    });
    document.addEventListener('click', (e) => {
      const k = e.target.closest('[data-key]');
      if (!k) return;
      if (k.dataset.key === 'copy') T('app.toast.copied');
      else if (k.dataset.key === 'revoke') {
        const row = k.closest('.key-row');
        if (row) row.remove();
        T('app.toast.revoked');
      }
    });
    const wh = $('apiWebhooks');
    const addWh = $('apiAddWh');
    if (addWh) addWh.addEventListener('click', () => {
      if (!wh) return;
      wh.insertAdjacentHTML('beforeend', '<div class="app-row webhook-row"><span class="row-icon">' + svg(IC.link) + '</span><div class="grow"><div class="row-title">https://hooks.nabd.ai/demo</div></div><button class="icon-btn sm" data-wh="del" title="' + L('api.wx') + '">✕</button></div>');
      T('app.toast.created');
    });
    document.addEventListener('click', (e) => {
      const w = e.target.closest('[data-wh="del"]');
      if (!w) return;
      const row = w.closest('.webhook-row');
      if (row) row.remove();
      T('app.toast.del');
    });
  }

  /* ---------------- notifications ---------------- */
  function initNotifications() {
    const items = Array.prototype.slice.call(document.querySelectorAll('.notif-item'));
    const read = (() => { try { return JSON.parse(localStorage.getItem('nabd-read') || '[]'); } catch (e) { return []; } })();
    const filters = document.querySelectorAll('[data-nf]');
    let unread = unreadCount();
    function setUnread(n) {
      unread = Math.max(0, n);
      try { localStorage.setItem('nabd-unread', String(unread)); } catch (e) {}
      const c = $('notifUnread');
      if (c) c.textContent = unread;
      notifyUnread();
    }
    function paint() {
      items.forEach((it) => {
        const id = it.dataset.nid;
        it.classList.toggle('unread', read.indexOf(id) === -1);
      });
      setUnread(items.length - read.length);
    }
    if (filters.length) {
      filters.forEach((f) => f.addEventListener('click', () => {
        filters.forEach((x) => x.classList.remove('active'));
        f.classList.add('active');
        const v = f.dataset.nf;
        items.forEach((it) => {
          const show = v === 'all' || it.dataset.cat === v;
          it.style.display = show ? '' : 'none';
        });
      }));
    }
    items.forEach((it) => {
      it.addEventListener('click', () => {
        const id = it.dataset.nid;
        if (read.indexOf(id) === -1) {
          read.push(id);
          try { localStorage.setItem('nabd-read', JSON.stringify(read)); } catch (e) {}
          paint();
        }
      });
    });
    const mark = $('notifMark');
    if (mark) mark.addEventListener('click', () => {
      items.forEach((it) => { if (read.indexOf(it.dataset.nid) === -1) read.push(it.dataset.nid); });
      try { localStorage.setItem('nabd-read', JSON.stringify(read)); } catch (e) {}
      paint();
    });
    paint();
  }

  /* ---------------- favorites ---------------- */
  function initFavorites() {
    const tabs = document.querySelectorAll('[data-ft]');
    if (tabs.length) {
      tabs.forEach((tb) => tb.addEventListener('click', () => {
        tabs.forEach((x) => x.classList.remove('active'));
        tb.classList.add('active');
        document.querySelectorAll('.fav-sec').forEach((s) => s.classList.toggle('on', s.dataset.fs === tb.dataset.ft));
      }));
    }
    document.querySelectorAll('.fav-sec').forEach((s) => {
      const star = s.querySelectorAll('.star-btn');
      star.forEach((st) => st.addEventListener('click', () => {
        const row = st.closest('.app-row') || st.closest('.doc-card');
        if (row) row.remove();
        T('app.toast.del');
      }));
    });
  }

  /* ---------------- saved searches ---------------- */
  function initSearches() {
    const wrap = $('searchRows');
    if (!wrap) return;
    const folderTpl = (name, on) => '<button class="filter-chip' + (on ? ' active' : '') + '" data-folder="' + name + '">' + name + '</button>';
    const chipsWrap = $('searchFolders');
    const folders = (() => { try { return JSON.parse(localStorage.getItem('nabd-folders') || '["' + L('srch.f1') + '","' + L('srch.f2') + '"]'); } catch (e) { return [L('srch.f1'), L('srch.f2')]; } })();
    function saveFolders() { try { localStorage.setItem('nabd-folders', JSON.stringify(folders)); } catch (e) {} }
    function paintChips() {
      if (!chipsWrap) return;
      chipsWrap.innerHTML = '<button class="filter-chip active" data-folder="all">' + L('srch.all') + '</button>'
        + folders.map((f, i) => '<button class="filter-chip" data-folder="' + i + '">' + f + '</button>').join('');
      chipsWrap.querySelectorAll('.filter-chip').forEach((c) => c.addEventListener('click', () => {
        chipsWrap.querySelectorAll('.filter-chip').forEach((x) => x.classList.remove('active'));
        c.classList.add('active');
        filterRows(c.dataset.folder);
      }));
    }
    function rowHtml(name, folder, fav, i) {
      return '<div class="app-row" data-i="' + i + '" data-folder="' + folder + '">'
        + '<span class="row-icon">' + svg(IC.clock) + '</span>'
        + '<div class="grow"><div class="row-title">' + name + '</div><div class="row-sub">' + (folder === 'none' ? '—' : folders[folder] || '—') + '</div></div>'
        + '<select class="select-soft" data-move title="folder"><option value="none">—</option>' + folders.map((f, j) => '<option value="' + j + '"' + (j === folder ? ' selected' : '') + '>' + f + '</option>').join('') + '</select>'
        + '<div class="row-actions">'
        + '<button class="icon-btn sm star-btn' + (fav ? ' on' : '') + '" data-s="fav" title="' + L('srch.fav') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-s="rename" title="' + L('srch.rename') + '">✎</button>'
        + '<button class="icon-btn sm" data-s="dup" title="' + L('srch.dup') + '">⧉</button>'
        + '<button class="icon-btn sm" data-s="run" title="' + L('srch.run') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-s="del" title="' + L('srch.del') + '">✕</button>'
        + '</div></div>';
    }
    let rows = [
      { n: 'srch.s1', f: 0, fav: 1 }, { n: 'srch.s2', f: 1, fav: 0 }, { n: 'srch.s3', f: 0, fav: 1 },
      { n: 'srch.s4', f: 'none', fav: 0 }, { n: 'srch.s5', f: 1, fav: 0 }
    ];
    let curFilter = 'all';
    function filterRows(f) {
      curFilter = f;
      render();
    }
    function render() {
      const data = curFilter === 'all' ? rows : rows.filter((r) => String(r.f) === String(curFilter));
      wrap.innerHTML = data.map((r) => rowHtml(L(r.n), r.f, r.fav, rows.indexOf(r))).join('');
      const empty = $('searchEmpty');
      if (empty) empty.style.display = data.length ? 'none' : 'block';
    }
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (!b || !wrap.contains(b)) return;
      const idx = parseInt(b.closest('[data-i]').dataset.i, 10);
      const r = rows[idx];
      if (!r) return;
      if (b.dataset.s === 'run') N.navigate('dashboard.html?view=analysis&q=' + encodeURIComponent(L(r.n)));
      else if (b.dataset.s === 'del') { rows.splice(idx, 1); render(); T('app.toast.del'); }
      else if (b.dataset.s === 'dup') { rows.splice(idx + 1, 0, { n: r.n, f: r.f, fav: r.fav }); render(); T('app.toast.dup'); }
      else if (b.dataset.s === 'fav') { r.fav = r.fav ? 0 : 1; render(); }
      else if (b.dataset.s === 'rename') {
        const title = b.closest('.app-row').querySelector('.row-title');
        const inp = document.createElement('input');
        inp.className = 'select-soft';
        inp.style.width = '70%';
        inp.value = title.textContent;
        title.replaceWith(inp);
        inp.focus();
        const done = () => {
          const v = inp.value.trim();
          if (v) { rows[idx].n = v; }
          render();
          T('app.toast.renamed');
        };
        inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') done(); else if (ev.key === 'Escape') render(); });
        inp.addEventListener('blur', done);
      }
    });
    document.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-move]');
      if (!sel || !wrap.contains(sel)) return;
      const idx = parseInt(sel.closest('[data-i]').dataset.i, 10);
      rows[idx].f = sel.value === 'none' ? 'none' : parseInt(sel.value, 10);
      render();
      T('app.toast.moved');
    });
    const nf = $('searchNewFolder');
    if (nf) nf.addEventListener('click', () => {
      folders.push('Folder ' + (folders.length + 1));
      saveFolders();
      paintChips();
      render();
      T('app.toast.folder');
    });
    document.addEventListener('app-render', () => { paintChips(); render(); });
    paintChips();
    render();
  }

  /* ---------------- boot ---------------- */
  if (!injectShell()) return;
  bindShell();
  if (page === 'dashboard') initDashboard();
  else if (page === 'history') initHistory();
  else if (page === 'reports') initReports();
  else if (page === 'profile') initProfile();
  else if (page === 'settings') initSettings();
  else if (page === 'connections') initConnections();
  else if (page === 'api') initApi();
  else if (page === 'notifications') initNotifications();
  else if (page === 'favorites') initFavorites();
  else if (page === 'searches') initSearches();
  window.addEventListener('app-unread', updateBadge);
})();
