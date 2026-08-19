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
  document.addEventListener('nabd-toast', (e) => { if (e && e.detail && e.detail.key) T(e.detail.key); });
  function userKey(base) { const u = N.getUser(); return (u && u.id) ? base + '-' + u.id : base; }

  /* ----------------------------------------------------------
     AUTH GUARD — protected application routes.
     The server session (/api/auth?action=me, httpOnly cookie) is the source
     of truth. A cached user boots the shell immediately; the session is
     re-validated in the background and stale sessions bounce to sign-in.
     Invoked at the bottom of this IIFE (after shared consts are defined).
     ---------------------------------------------------------- */
  function bootGuard() {
    const here = location.pathname.split('/').pop() + location.search;
    const cached = N.getUser();
    const bounce = () => location.replace('signin.html?next=' + encodeURIComponent(here));
    const bootWith = (u) => { if (u) { N.persistUser(u); boot(); } else bounce(); };
    if (cached && cached.email) {
      boot();
      N.authMe().then((u) => {
        if (u) N.persistUser(u);
        else { N.clearUser(); bounce(); }
      }).catch(() => { N.clearUser(); bounce(); });
    } else {
      N.authMe().then(bootWith, () => bounce());
    }
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
    copy: 'M8 8h12v12H8zM4 16V4h12',
    chev: 'M9 6l6 6-6 6'
  };
  const svg = (d, cls) => '<svg viewBox="0 0 24 24" class="' + (cls || '') + '"><path d="' + d + '"/></svg>';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const NAV = [
    { id: 'dashboard', href: 'dashboard.html', key: 'app.nav.dashboard', ic: IC.grid, sep: 'app.sep1' },
    { id: 'history', href: 'history.html', key: 'app.nav.history', ic: IC.clock },
    { id: 'reports', href: 'reports.html', key: 'app.nav.reports', ic: IC.file },
    { id: 'citizen-portal', href: 'citizen-portal.html', key: 'app.nav.citizen-portal', ic: 'M22 2 11 13M22 2 15 22l-4-9-9-4z', sep: 'app.sep3' },
    { id: 'private', href: 'social.html', key: 'app.nav.social', ic: IC.shield },
    { id: 'favorites', href: 'favorites.html', key: 'app.nav.favorites', ic: IC.star },
    { id: 'notifications', href: 'notifications.html', key: 'app.nav.notifications', ic: IC.bell, badge: true },
    { id: 'settings', href: 'settings.html', key: 'app.nav.settings', ic: IC.sliders },
    { id: 'profile', href: 'profile.html', key: 'app.nav.profile', ic: IC.user },
    { id: 'admin', href: 'admin.html', key: 'app.nav.admin', ic: IC.sliders, adminOnly: true }
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
      const n = u.name || ((u.firstName || u.first || '') + ' ' + (u.lastName || u.last || '')).trim();
      if (n) {
        const p = n.trim().split(/\s+/);
        return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
      }
    }
    return 'NB';
  }

  function unreadCount() {
    const notifs = N.notifGet ? N.notifGet() : [];
    if (!notifs.length) return 0;
    const read = new Set();
    try {
      const raw = JSON.parse(localStorage.getItem(userKey('nabd-read')) || '[]');
      if (Array.isArray(raw)) raw.forEach((id) => read.add(id));
    } catch (e) {}
    return notifs.filter((n) => n && !read.has(n.id)).length;
  }

  function injectShell() {
    const holder = $('appShell');
    if (!holder) return false;
    const u = N.getUser();
    const userRole = (u && u.role) || 'analyst';
    const isAdminUser = userRole === 'nabd_admin' || userRole === 'superadmin';
    const visibleNav = NAV.filter((it) => !it.adminOnly || isAdminUser);
    const navHtml = visibleNav.map((it) => {
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
      + '<a class="app-brand app-brand-side" href="../index.html" data-page="../index.html" aria-label="NABD home">'
      + '<span class="app-logo">' + (N.lang === 'ar' ? 'نبض' : 'N') + '</span>'
      + '<span class="app-brand-name" data-i18n="brand">' + L('brand') + '</span>'
      + '</a>'
      + '<button class="collapse-btn" id="sideCollapse" aria-label="' + (N.lang === 'ar' ? 'طي الشريط الجانبي' : 'Collapse sidebar') + '">‹</button>'
      + '</div>'
      + '<nav class="app-nav">' + navHtml + '</nav>'
      + '<div class="app-side-foot">'
      + '<div class="side-user"><span class="avatar" id="sideAvatar">' + initials() + '</span><div><div class="side-user-name" id="sideUserName"></div><div class="side-user-mail" id="sideUserMail"></div></div></div>'
      + '<div class="side-status"><span class="dot"></span><span data-i18n="app.status">' + L('app.status') + '</span></div>'
      + '</div>'
      + '</aside>'
      + '<div class="side-backdrop" id="sideBackdrop"></div>'
      + '<header class="app-top">'
      + '<button class="mobile-menu-btn" id="sideBurger" aria-label="' + (N.lang === 'ar' ? 'القائمة' : 'Menu') + '" aria-expanded="false" aria-controls="appSide">' + svg(IC.burger) + '</button>'
      + '<div class="app-top-left">'
      + '<span class="app-top-title" data-i18n="app.title.' + page + '">' + L('app.title.' + page) + '</span>'
      + '<span class="app-top-crumb"><span data-i18n="app.crumb.app"></span> / <span data-i18n="app.title.' + page + '"></span></span>'
      + '</div>'
      + '<div class="app-top-actions">'
      + '<div class="lang-seg" id="topLang" role="group" aria-label="Language">'
      + '<button type="button" class="lang-seg-btn" data-lang="en" aria-label="English">EN</button>'
      + '<button type="button" class="lang-seg-btn" data-lang="ar" aria-label="العربية">عربي</button>'
      + '</div>'
      + '<button class="icon-btn" id="topTheme" aria-label="theme">' + svg(IC.sun) + '</button>'
      + '<button class="avatar-btn" id="userMenuBtn" aria-label="' + (N.lang === 'ar' ? 'قائمة المستخدم' : 'Open user menu') + '" aria-haspopup="menu" aria-expanded="false" aria-controls="userMenu"><span class="avatar">' + initials() + '</span></button>'
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
    const display = u ? (u.name || ((u.firstName || u.first || '') + ' ' + (u.lastName || u.last || '')).trim() || null) : null;
    if (name) name.textContent = display || 'Guest Analyst';
    if (mail) mail.textContent = (u && u.email) || 'guest@nabd.ai';
    document.querySelectorAll('#sideAvatar, .avatar-btn .avatar').forEach((a) => {
      a.textContent = '';
      a.style.backgroundImage = '';
      const photo = (u && u.avatarUrl) || (N.avatarGet ? N.avatarGet() : null);
      if (photo) {
        a.classList.add('has-photo');
        a.style.backgroundImage = 'url("' + photo.replace(/"/g, '&quot;') + '")';
      } else {
        a.classList.remove('has-photo');
        a.textContent = initials();
      }
    });
  }

  function updateThemeBtn() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const b = $('topTheme');
    if (b) {
      b.innerHTML = svg(dark ? IC.sun : IC.moon);
      b.setAttribute('aria-label', dark ? L('app.theme.light') : L('app.theme.dark'));
    }
  }
  function updateLangBtn() {
    const seg = $('topLang');
    if (seg) {
      seg.querySelectorAll('.lang-seg-btn').forEach((b) => {
        const on = b.dataset.lang === N.lang;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    document.querySelectorAll('.app-logo').forEach((el) => { el.textContent = N.lang === 'ar' ? 'نبض' : 'N'; });
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
      const closeSide = () => { side.classList.remove('mobile-open'); backdrop.classList.remove('show'); burger.setAttribute('aria-expanded', 'false'); };
      burger.addEventListener('click', () => {
        side.classList.add('mobile-open');
        backdrop.classList.add('show');
        burger.setAttribute('aria-expanded', 'true');
      });
      backdrop.addEventListener('click', closeSide);
    }
    const btn = $('userMenuBtn');
    const menu = $('userMenu');
    if (btn && menu) {
      const setOpen = (on) => { menu.classList.toggle('open', on); btn.setAttribute('aria-expanded', String(on)); };
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!menu.classList.contains('open'));
      });
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== btn) setOpen(false);
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
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
          const done = () => {
            N.clearUser();
            T('app.toast.signedout');
            setTimeout(() => N.navigate('../index.html'), 700);
          };
          if (N.logout) N.logout().then(done, done); else done();
        }
        setOpen(false);
      });
    }
    const th = $('topTheme');
    if (th) th.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      N.applyTheme(next);
      updateThemeBtn();
    });
    const seg = $('topLang');
    if (seg) {
      seg.querySelectorAll('.lang-seg-btn').forEach((b) => {
        b.addEventListener('click', () => setLang(b.dataset.lang));
      });
    }
    document.addEventListener('nabd-theme', updateThemeBtn);
    updateThemeBtn();
    updateLangBtn();
  }

  function setLang(next) {
    N.applyLang(next);
    updateLangBtn();
    updateThemeBtn();
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
    const LOD = $('dbLoading');
    const RES = $('dbResults');
    const input = $('dbSearchInput');
    const runBtn = $('dbSearchBtn');
    const fbBtn = $('dbFbBtn');
    const fbChip = $('dbFbChip');
    const resetBtn = $('dbResetBtn');
    const exportBtn = $('dbExportBtn');
    const scanText = $('dbScanText');
    const scanSteps = $('dbScanSteps');
    const queryEl = $('dbQuery');
    const privBadge = $('dbPrivateBadge');
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
    let lastSearchId = null;
    let analysisState = 'idle';           /* idle | loading | success | error */
    const ERR = $('dbError');
    const retryBtn = $('dbRetryBtn');
    const loadQuery = $('dbLoadQuery');
    const progressFill = $('dbProgressFill');
    const progressPct = $('dbProgressPct');
    const STEPS = ['db.loading.1', 'db.loading.2', 'db.loading.3', 'db.loading.4', 'db.loading.5', 'db.loading.6'];

    /* ---------- embedded analysis state machine ---------- */
    const greetEl = $('dbGreet');
    const quickWrap = $('dbQuickWrap');
    const suggestRow = $('dbSuggestRow');
    const heroBrand = document.querySelector('.db-hero-brand');
    const rotateSugg = $('dbRotateSuggest');
    const appHead = $('dbAppHead');
    function setState(s) {
      analysisState = s;
      const preview = s === 'preview';
      if (greetEl) greetEl.hidden = !preview;
      if (quickWrap) quickWrap.hidden = !preview;
      if (suggestRow) suggestRow.hidden = !preview;
      if (heroBrand) heroBrand.hidden = !preview;
      if (appHead) appHead.hidden = !preview;
      if (rotateSugg) {
        if (preview && (!input || input.value.trim().length === 0)) {
          rotateSugg.classList.remove('hidden');
          rotateSugg.classList.add('on');
        } else {
          rotateSugg.classList.add('hidden');
          rotateSugg.classList.remove('on');
        }
      }
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
      /* record the completed analysis in the real history + notification feed */
      if (query && N.historyAdd && N.notifAdd) {
        const arts = lastResult && Array.isArray(lastResult.articles) ? lastResult.articles : [];
        const counts = {};
        arts.forEach((a) => { if (a && a.category) counts[a.category] = (counts[a.category] || 0) + 1; });
        let topCat = null, topN = 0;
        Object.keys(counts).forEach((k) => { if (counts[k] > topN) { topN = counts[k]; topCat = k; } });
        N.historyAdd({ query: query, status: 'done', vis: privMode === 'private' ? 'private' : 'public', cat: topCat, src: arts.length, ts: Date.now() });
        N.notifAdd({ title: 'notif.run.t', sub: 'notif.run.s', params: { q: query }, cat: 'ai', ts: Date.now() });
        notifyUnread();
      }
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
            if (i > 0) {
              steps[i - 1].classList.remove('on');
              steps[i - 1].classList.add('done');
            }
            steps[i].classList.add('on');
            if (scanText) scanText.textContent = L('db.loading.' + (i + 1));
            setProgress(Math.round(((i + 1) / steps.length) * 82));
            i += 1;
            loadTimer = setTimeout(tick, ms / steps.length);
          } else {
            setProgress(100);
            if (scanText) scanText.textContent = L('db.ready');
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
          lastSearchId = null;
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
          lastSearchId = (res && res._searchId) || null;
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
      if (rotateSugg) {
        rotateIdx = 0;
        var spans = rotateSugg.querySelectorAll('span');
        spans.forEach(function (s, i) {
          s.classList.remove('active', 'exit');
          if (i === 0) s.classList.add('active');
        });
        rotatePaused = false;
        rotateSugg.classList.remove('hidden');
        rotateSugg.classList.add('on');
        startRotate();
      }
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }

    /* ---------- report export → dedicated PDF-ready page ---------- */
    function startExport() {
      if (analysisState !== 'success' || !lastResult) { T('app.toast.noexport'); return; }
      const draft = {
        q: query,
        t: Date.now(),
        r: Object.assign({}, lastResult, {
          articles: (Array.isArray(lastResult.articles) ? lastResult.articles.slice(0, 30) : []),
          raw: undefined
        })
      };
      let saved = false;
      try { window.sessionStorage.setItem('nabd-export', JSON.stringify(draft)); saved = true; } catch (e) {}
      if (!saved) { T('app.toast.exported'); return; }
      N.navigate('export.html');
    }

    /* ---------- suggested actions (report actions) ---------- */
    function buildDraftPayload() {
      if (analysisState !== 'success' || !lastResult) return null;
      return {
        q: query,
        t: Date.now(),
        r: Object.assign({}, lastResult, {
          articles: (Array.isArray(lastResult.articles) ? lastResult.articles.slice(0, 30) : []),
          raw: undefined
        })
      };
    }
    function saveReportForLater() {
      const draft = buildDraftPayload();
      if (!draft) { T('app.toast.noexport'); return; }
      const writeDraft = (d) => {
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem(userKey('nabd-saved-reports')) || '[]'); if (!Array.isArray(saved)) saved = []; } catch (e) { saved = []; }
        saved.unshift(d);
        saved = saved.slice(0, 20);
        localStorage.setItem(userKey('nabd-saved-reports'), JSON.stringify(saved));
      };
      const compact = (d) => {
        const r = d.r || {};
        const c = {};
        ['stats', 'sentiment', 'overview', 'momentum', 'freshness', 'signalStrength'].forEach((k) => { if (r[k] !== undefined) c[k] = r[k]; });
        c.articles = Array.isArray(r.articles) ? r.articles.slice(0, 6) : [];
        c.briefMeta = r.briefMeta || r.aiBrief || null;
        return { q: d.q, t: d.t, r: c };
      };
      try {
        writeDraft(draft);
        if (N.activityAdd) N.activityAdd('save', { q: query });
        T('app.toast.savedReport');
      } catch (e) {
        try {
          writeDraft(compact(draft));
          if (N.activityAdd) N.activityAdd('save', { q: query });
          T('app.toast.savedReport');
        } catch (e2) {
          T('app.toast.savedFail');
        }
      }
    }
    function buildComplaintTemplate(draft) {
      const r = draft && draft.r ? draft.r : {};
      const brief = (r.briefMeta && r.briefMeta.headline) || (r.aiBrief && r.aiBrief.headline)
        || (Array.isArray(r.highlights) && r.highlights[0] && (r.highlights[0].title || r.highlights[0].detail)) || '';
      const q = (draft && draft.q) || query;
      return [
        N.fmt('ws.fac.email.line1', { q: q }),
        N.fmt('ws.fac.email.line2', { t: new Date((draft && draft.t) || Date.now()).toLocaleString() }),
        brief ? N.fmt('ws.fac.email.line3', { b: brief }) : '',
        N.fmt('ws.fac.email.line4', { u: window.location.href }),
        '',
        N.fmt('ws.fac.email.line5', { q: q }),
        '',
        N.fmt('ws.fac.email.sign')
      ].filter(Boolean).join('\n');
    }
    function facilityEmailModal(draft) {
      return new Promise((resolve) => {
        const wrap = document.createElement('div');
        wrap.className = 'c-modal';
        const facs = Array.isArray(N.facilities) ? N.facilities : [];
        const items = facs.map((f, i) =>
          '<button type="button" class="fac-btn" data-f="' + i + '">'
          + '<span class="fac-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></span>'
          + '<span><b>' + esc(L(f.key)) + '</b><span class="fac-mail">' + esc(f.email || '') + '</span></span>'
          + '</button>').join('');
        const body = buildComplaintTemplate(draft);
        wrap.innerHTML =
          '<div class="c-modal-mask"></div>'
          + '<div class="c-modal-card c-modal-card-scroll" role="dialog" aria-modal="true">'
          + '<div class="c-modal-t">' + esc(L('ws.actions.pick')) + '</div>'
          + '<div class="c-modal-s selectable">'
          + '<p class="fac-desc">' + esc(L('ws.actions.pick.s')) + '</p>'
          + '<div class="fac-grid">' + items + '</div>'
          + '<label class="fac-field"><span>' + esc(L('ws.actions.pick.to')) + '</span>'
          + '<input type="email" class="inp" id="facTo" data-i18n-ph="ws.actions.pick.to.ph" placeholder="' + esc(L('ws.actions.pick.to.ph')) + '"></label>'
          + '<label class="fac-field"><span>' + esc(L('ws.actions.pick.body')) + '</span>'
          + '<textarea class="inp" id="facBody" rows="9">' + esc(body) + '</textarea></label>'
          + '</div>'
          + '<div class="c-modal-actions">'
          + '<button type="button" class="btn btn-ghost btn-sm" data-c="cancel">' + esc(L('db.fb.conf.cancel')) + '</button>'
          + '<button type="button" class="btn btn-primary btn-sm" data-c="send">' + esc(L('ws.actions.pick.send')) + '</button>'
          + '</div>'
          + '</div>';
        const done = (val) => {
          try { document.removeEventListener('keydown', onKey); } catch (e) {}
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
          resolve(val);
        };
        const onKey = (e) => { if (e.key === 'Escape') done(null); };
        const toEl = wrap.querySelector('#facTo');
        const bodyEl = wrap.querySelector('#facBody');
        wrap.querySelector('.c-modal-mask').addEventListener('click', () => done(null));
        wrap.querySelector('[data-c="cancel"]').addEventListener('click', () => done(null));
        wrap.querySelector('[data-c="send"]').addEventListener('click', () => {
          const to = (toEl.value || '').trim();
          if (!to) { T('ws.actions.pick.err'); toEl.focus(); return; }
          done({ to: to, body: bodyEl.value });
        });
        wrap.querySelectorAll('.fac-btn').forEach((b) => b.addEventListener('click', () => {
          const f = facs[Number(b.dataset.f)];
          if (f && f.email) toEl.value = f.email;
          toEl.focus();
        }));
        document.addEventListener('keydown', onKey);
        document.body.appendChild(wrap);
      });
    }
    async function sendReportToFacility() {
      const draft = buildDraftPayload();
      if (!draft) { T('app.toast.noexport'); return; }
      const res = await facilityEmailModal(draft);
      if (!res) return;
      T('app.toast.email');
      const subject = N.fmt('ws.fac.email.line1', { q: query });
      try {
        window.location.href = 'mailto:' + res.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(res.body);
      } catch (e) {}
      T('app.toast.facility');
    }
    const REMINDER_MS = {
      '12h': 12 * 3600000, '24h': 24 * 3600000, '2d': 2 * 24 * 3600000,
      '3d': 3 * 24 * 3600000, '1w': 7 * 24 * 3600000, '2w': 14 * 24 * 3600000,
      '1mo': 30 * 24 * 3600000
    };
    function reminderModal() {
      return new Promise((resolve) => {
        const wrap = document.createElement('div');
        wrap.className = 'c-modal';
        const opts = [
          { value: '12h', label: L('ws.reminder.12h'), reco: true },
          { value: '24h', label: L('ws.reminder.24h'), reco: false },
          { value: '2d', label: L('ws.reminder.2d'), reco: false },
          { value: '3d', label: L('ws.reminder.3d'), reco: false },
          { value: '1w', label: L('ws.reminder.1w'), reco: false },
          { value: '2w', label: L('ws.reminder.2w'), reco: false },
          { value: '1mo', label: L('ws.reminder.1mo'), reco: false }
        ];
        const optHtml = opts.map((o) =>
          '<button type="button" class="rem-opt' + (o.reco ? ' reco' : '') + '" data-v="' + o.value + '">'
          + '<span>' + esc(o.label) + '</span>'
          + (o.reco ? '<span class="rem-meta">' + esc(L('ws.reminder.reco')) + '</span>' : '')
          + '</button>').join('');
        wrap.innerHTML =
          '<div class="c-modal-mask"></div>'
          + '<div class="c-modal-card c-modal-card-scroll" role="dialog" aria-modal="true">'
          + '<div class="c-modal-t">' + esc(L('ws.reminder.t')) + '</div>'
          + '<div class="c-modal-s selectable">' + esc(L('ws.reminder.s')) + optHtml
          + '<p class="rem-hint">' + esc(L('ws.reminder.will')) + '</p></div>'
          + '<div class="c-modal-actions"><button type="button" class="btn btn-ghost btn-sm" data-c="cancel">' + esc(L('db.fb.conf.cancel')) + '</button></div>'
          + '</div>';
        const done = (val) => {
          try { document.removeEventListener('keydown', onKey); } catch (e) {}
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
          resolve(val);
        };
        const onKey = (e) => { if (e.key === 'Escape') done(null); };
        wrap.querySelector('.c-modal-mask').addEventListener('click', () => done(null));
        wrap.querySelector('[data-c="cancel"]').addEventListener('click', () => done(null));
        wrap.querySelectorAll('.rem-opt').forEach((b) => b.addEventListener('click', () => done(b.dataset.v)));
        document.addEventListener('keydown', onKey);
        document.body.appendChild(wrap);
      });
    }
    async function setReminder() {
      const draft = buildDraftPayload();
      if (!draft) { T('app.toast.noexport'); return; }
      const choice = await reminderModal();
      if (!choice) return;
      const ms = REMINDER_MS[choice] || REMINDER_MS['12h'];
      if (N.alertsAdd) N.alertsAdd({ q: query, dueAt: Date.now() + ms });
      if (N.activityAdd) N.activityAdd('alert', { q: query });
      T('app.toast.reminder');
    }
    const actList = $('dbActList');
    if (actList) actList.addEventListener('click', (e) => {
      const b = e.target.closest('.act-btn');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'send') sendReportToFacility();
      else if (act === 'save') saveReportForLater();
      else if (act === 'share') startExport();
      else if (act === 'remind') setReminder();
    });

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
    if (exportBtn) exportBtn.addEventListener('click', startExport);

    /* ---------- favorites (real localStorage-backed stars) ---------- */
    const favBtn = $('dbFavBtn');
    function paintFav() {
      if (!favBtn) return;
      const on = N.favHas ? N.favHas(query) : false;
      favBtn.classList.toggle('active', on);
      const label = favBtn.querySelector('span');
      if (label) {
        label.dataset.i18n = on ? 'ws.actions.fav.on' : 'ws.actions.fav';
        label.textContent = on ? L('ws.actions.fav.on') : L('ws.actions.fav');
      }
      if (favBtn.title) favBtn.title = on ? L('ws.actions.fav.on') : L('ws.actions.fav');
    }
    if (favBtn) favBtn.addEventListener('click', () => {
      if (!query || analysisState !== 'success') { T('app.toast.noexport'); return; }
      if (N.favHas && N.favHas(query)) {
        if (N.favRemove) N.favRemove(query);
        T('app.toast.favOff');
      } else {
        const s = (lastResult && lastResult.stats) || {};
        const arts = (Array.isArray(lastResult.articles) ? lastResult.articles.length : 0) || s.totalPosts || null;
        const tone = lastResult && lastResult.sentiment && lastResult.sentiment.label ? String(lastResult.sentiment.label).toUpperCase() : '';
        if (N.favAdd) N.favAdd({ q: query, t: Date.now(), r: { query: query, src: arts, tone: tone } });
        if (N.activityAdd) N.activityAdd('fav', { q: query });
        T('app.toast.fav');
      }
      paintFav();
    });
    document.addEventListener('app-render', paintFav);

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
        else if (act === 'saved') N.navigate('social.html');
        else if (act === 'export') startExport();
        else if (act === 'alert') setReminder();
        else if (act === 'connections') N.navigate('connections.html');
        else if (act === 'settings') N.navigate('settings.html');
        else if (act === 'profile') N.navigate('profile.html');
        else if (act === 'history') N.navigate('history.html');
        else if (act === 'citizen-portal') N.navigate('citizen-portal.html');
        else if (act === 'admin') N.navigate('admin.html');
      });
    });
    document.querySelectorAll('[data-qa-suggest]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.dataset.qaSuggest;
        if (act === 'export') startExport();
        else if (act === 'alert') setReminder();
      });
    });

    /* ---------- preview suggestion chips (real queries, language-aware) ---------- */
    const suggestBox = $('dbSuggestions');
    function paintSuggestions() {
      if (!suggestBox) return;
      const items = Array.isArray(N.QUERIES && N.QUERIES[N.lang]) ? N.QUERIES[N.lang].slice(0, 4) : [];
      suggestBox.innerHTML = items.map((q, i) =>
        '<button type="button" class="sug-chip" data-q="' + esc(q) + '">'
        + '<span class="sug-ic mono">' + (i + 1) + '</span><span class="sug-txt">' + esc(q) + '</span>'
        + '<span class="sug-go mono">' + esc(L('ws.preview.go')) + '</span></button>'
      ).join('');
    }
    if (suggestBox) {
      suggestBox.addEventListener('click', (e) => {
        const c = e.target.closest('.sug-chip');
        if (!c) return;
        const q = c.dataset.q;
        if (input) input.value = q;
        runAnalysis(q);
      });
    }
    document.addEventListener('app-render', paintSuggestions);
    paintSuggestions();

    /* ---------- rotating suggestion inside the hero input ---------- */
    const ROTATE_INTERVAL = 3000;
    const ROTATE_FADE = 450;
    let rotateTimer = null;
    let rotateIdx = 0;
    let rotatePaused = false;
    const rotateEl = $('dbRotateSuggest');
    function buildRotatingSuggestions() {
      if (!rotateEl || !input) return;
      const items = Array.isArray(N.QUERIES && N.QUERIES[N.lang]) ? N.QUERIES[N.lang] : [];
      if (!items.length) { rotateEl.classList.remove('on'); return; }
      rotateEl.innerHTML = items.map((q, i) =>
        '<span' + (i === 0 ? ' class="active"' : '') + '>' + esc(q) + '</span>'
      ).join('');
      rotateEl.classList.add('on');
      rotateIdx = 0;
      startRotate();
    }
    function startRotate() {
      stopRotate();
      if (rotatePaused) return;
      rotateTimer = setInterval(rotateStep, ROTATE_INTERVAL);
    }
    function stopRotate() {
      if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null; }
    }
    function rotateStep() {
      if (!rotateEl || !input) return;
      if (input.value.trim().length > 0) return;
      const spans = rotateEl.querySelectorAll('span');
      if (spans.length < 2) return;
      var current = spans[rotateIdx];
      rotateIdx = (rotateIdx + 1) % spans.length;
      var next = spans[rotateIdx];
      current.classList.remove('active');
      current.classList.add('exit');
      next.classList.add('active');
      setTimeout(function () {
        current.classList.remove('exit');
      }, ROTATE_FADE + 50);
    }
    function pauseRotate() {
      rotatePaused = true;
      if (rotateEl) rotateEl.classList.remove('on');
      stopRotate();
    }
    function resumeRotate() {
      if (!input || input.value.trim().length > 0) return;
      rotatePaused = false;
      if (rotateEl) rotateEl.classList.add('on');
      startRotate();
    }
    function showRotateSuggestions() {
      if (!rotateEl || !input) return;
      if (input.value.trim().length === 0) {
        rotateEl.classList.remove('hidden');
        rotateEl.classList.add('on');
        resumeRotate();
      }
    }
    function hideRotateSuggestions() {
      if (!rotateEl) return;
      rotateEl.classList.add('hidden');
      rotateEl.classList.remove('on');
      stopRotate();
    }
    if (input) {
      input.addEventListener('focus', function () {
        pauseRotate();
      });
      input.addEventListener('blur', function () {
        setTimeout(function () {
          resumeRotate();
        }, 150);
      });
      input.addEventListener('input', function () {
        if (input.value.trim().length > 0) {
          hideRotateSuggestions();
        } else {
          showRotateSuggestions();
        }
      });
    }
    buildRotatingSuggestions();

    /* ---------- greeting message above query box ---------- */
    function paintGreeting() {
      const el = $('dbGreet');
      if (!el) return;
      const u = N.getUser();
      const fn = u ? ((u.firstName || u.first || '').trim() || (u.name || '').trim().split(/\s+/)[0] || '') : '';
      const name = fn || '';
      const greetings = N.lang === 'ar'
        ? (name
          ? [
              '\u0645\u0631\u062D\u0628\u0627\u064B <span class="db-greet-name">' + esc(name) + '</span> \u0641\u064A \u0646\u0628\u0636\u060C \u0645\u0627 \u0627\u0644\u0630\u064A \u062A\u0628\u062D\u062B \u0639\u0646\u0647 \u0627\u0644\u064A\u0648\u0645\u061F',
              '\u0623\u0647\u0644\u0627\u064B <span class="db-greet-name">' + esc(name) + '</span>! \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0633\u062A\u0643\u0634\u0641 \u0634\u062E\u0635 \u0645\u0635\u0631 \u0627\u0644\u064A\u0648\u0645\u061F',
              '\u064A\u0627 <span class="db-greet-name">' + esc(name) + '</span>! \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0623\u062E\u064A\u0631 \u0645\u0639\u0643 \u0627\u0644\u064A\u0648\u0645\u060C \u0645\u0646 \u0641\u0636\u0644 \u0645\u0635\u0631.'
            ]
          : [
              '\u0645\u0627 \u0627\u0644\u0630\u064A \u062A\u0628\u062D\u062B \u0639\u0646\u0647 \u0627\u0644\u064A\u0648\u0645\u061F',
              '\u0627\u0633\u0623\u0644 \u0646\u0628\u0636 \u0639\u0646 \u0623\u064A \u0634\u0624\u0648\u0646 \u0645\u0635\u0631\u061F'
            ])
        : (name
          ? [
              'Welcome back, <span class="db-greet-name">' + esc(name) + '</span>. What are we looking into today?',
              'Hey <span class="db-greet-name">' + esc(name) + '</span>! Ready to explore what\'s happening in Egypt?',
              'Good to see you, <span class="db-greet-name">' + esc(name) + '</span>. Let\'s uncover some insights.'
            ]
          : [
              'What would you like to explore today?',
              'Ask NABD anything about Egypt.'
            ]);
      const idx = Math.floor(Math.random() * greetings.length);
      el.innerHTML = greetings[idx];
    }
    document.addEventListener('app-render', paintGreeting);
    paintGreeting();

    /* ---------- sentiment donut (real response → existing component) ---------- */
    function renderDonut() {
      const s = lastResult && lastResult.sentiment;
      const stats = (lastResult && lastResult.stats) || (lastResult && lastResult.raw && lastResult.raw.stats) || {};
      const legendB = donutEl && donutEl.parentElement
        ? Array.prototype.slice.call(donutEl.parentElement.querySelectorAll('.donut-legend b'))
        : [];
      const emptyS = $('dbEmptySentiment');
      const spar = $('dbSparsityNote');
      const subEl = $('dbSentSub');
      if (subEl) {
        const scopeLbl = privMode === 'private' ? L('ws.scope.private') : L('ws.scope.public');
        subEl.textContent = L('ws.sent.sub').split('{q}').join(query || '—').split('{s}').join(scopeLbl);
      }
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
      const paintSegs = (segs) => {
        const tot = segs.reduce((a, x) => a + x.v, 0) || 1;
        segs.forEach((x) => { x.p = Math.round((x.v / tot) * 100); });
        if (tot <= 0) {
          if (emptyS) {
            emptyS.hidden = false;
            const p = emptyS.querySelector('p') || emptyS;
            p.textContent = L('ws.sent.na') + (s && s.label ? ' (' + s.label + ')' : '');
          }
          if (donutEl) donutEl.innerHTML = '';
          legendB.forEach((b) => { b.textContent = '—'; });
          return;
        }
        if (emptyS) emptyS.hidden = true;
        setSparsity();
        let dom = 0;
        for (let i = 1; i < segs.length; i++) if (segs[i].p > segs[dom].p) dom = i;
        N.buildDonut(donutEl, segs.map((x) => ({ v: x.p, color: x.color })), segs[dom].p + '%', String(segs[dom].label).toUpperCase());
        legendB.forEach((b, i) => { if (segs[i]) b.textContent = segs[i].p + '%'; });
      };
      const SEG_DEF = [
        { key: 'positive', label: L('ws.donut.pos'), color: '#35D07F' },
        { key: 'neutral', label: L('ws.donut.neu'), color: '#7A8BB5' },
        { key: 'negative', label: L('ws.donut.neg'), color: '#F45D5D' }
      ];
      if (s && Array.isArray(s) && s.length) {
        paintSegs(SEG_DEF.map((def, i) => {
          const item = s[i] || {};
          const raw = item.v != null ? item.v : item.value;
          return { v: Math.max(0, num(raw) || 0), label: def.label, color: def.color };
        }));
        return;
      }
      if (s && typeof s === 'object') {
        paintSegs(SEG_DEF.map((def) => ({
          v: Math.max(0, num(s[def.key]) || 0),
          label: def.label,
          color: def.color
        })));
        return;
      }
      if (emptyS) {
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
    function fmtDelta(d) {
      const n = num(d);
      if (n == null) return String(d == null ? '' : d);
      return (n >= 0 ? '+' : '') + n + '%';
    }
    const SEV = ['sev-danger', 'sev-warn', 'sev-blue', 'sev-pos', 'sev-purple'];
    const TAGS = ['tag-danger', 'tag-blue', 'tag-warn', 'tag-pos', 'tag-purple'];
    const SEV_MAP = { critical: 'sev-danger', high: 'sev-danger', emergency: 'sev-danger', breaking: 'sev-danger', medium: 'sev-warn', moderate: 'sev-warn', low: 'sev-blue', calm: 'sev-pos', positive: 'sev-pos', rising: 'sev-purple' };
    const TAG_TYPE = { 'breaking': 'tag-danger', 'breaking event': 'tag-danger', 'misinformation': 'tag-danger', 'misinformation risk': 'tag-danger', 'crisis': 'tag-danger', 'emergency': 'tag-danger', 'opportunity': 'tag-pos', 'emerging pattern': 'tag-blue', 'emerging': 'tag-blue', 'public reaction': 'tag-purple', 'reaction': 'tag-purple', 'watch': 'tag-warn' };
    const sevCls = (v) => {
      if (!v) return 'sev-blue';
      const k = String(v).toLowerCase().trim();
      if (SEV.indexOf(k) !== -1) return k;
      return SEV_MAP[k] || 'sev-blue';
    };
    const tagCls = (v) => {
      if (!v) return 'tag-blue';
      const k = String(v).toLowerCase().trim();
      if (TAGS.indexOf(k) !== -1) return k;
      return TAG_TYPE[k] || 'tag-blue';
    };

    function listWidget(listEl, emptyEl, items) {
      const has = items.length > 0;
      if (listEl) {
        listEl.style.display = has ? '' : 'none';
        listEl.innerHTML = items.join('');
      }
      if (emptyEl) { emptyEl.hidden = has; emptyEl.style.display = ''; }
    }

    function influencerRow(f) {
      const name = esc(pick(f, ['name', 'label', 'title'], '—'));
      const handle = esc(pick(f, ['handle'], ''));
      const cat = esc(pick(f, ['cat', 'desc', 'meta', 'category'], ''));
      const reach = num(pick(f, ['reach', 'score', 'value', 'rank'], null));
      const sub = (handle ? '@' + handle : cat);
      const score = reach != null ? N.formatNumber(reach, true) : '—';
      let hue = num(pick(f, ['hue', 'h'], null));
      if (hue == null || hue < 0 || hue > 360) hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
      let ini = String(pick(f, ['ini', 'initials'], '') || '').trim();
      if (!ini) {
        const p = name.split(/\s+/).filter(Boolean);
        ini = p.length ? (p[0][0] || '') + (p[1] ? p[1][0] || '' : '') : 'NA';
      }
      return '<div class="rank-row"><span class="rank-avatar" style="--h:' + hue + 'deg">' + esc(ini.toUpperCase()) + '</span>'
        + '<div class="rank-meta"><b>' + name + '</b><span class="mono">' + sub + '</span></div>'
        + '<span class="rank-score mono">' + score + '</span></div>';
    }
    function highlightCard(h) {
      const typeRaw = pick(h, ['type', 'tag', 'label'], L('ws.hl.t2'));
      const cls = tagCls(pick(h, ['severity', 'cls', 'class'], String(typeRaw).toLowerCase().trim()));
      const conf = num(pick(h, ['confidence', 'conf', 'score', 'pct'], null));
      const title = esc(pick(h, ['title'], ''));
      const detail = esc(pick(h, ['detail', 'text', 'summary', 'body'], ''));
      const body = title && detail ? '<strong>' + title + '</strong>' + (detail ? '<br>' + detail : '') : (title || detail);
      return '<div class="hl-card"><div class="hl-top"><span class="hl-tag ' + cls + '">' + esc(typeRaw) + '</span>'
        + (conf != null ? '<span class="hl-conf mono">' + esc(String(Math.round(conf))) + '%</span>' : '')
        + '</div><p class="hl-text">' + (body || '—') + '</p></div>';
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
      const author = esc(pick(f, ['author', 'publisher', 'handle', 'channel'], ''));
      const eng = num(pick(f, ['engagement', 'engagements', 'likes', 'shares'], null));
      const t = N.formatRelativeTime(pick(f, ['created', 'createdAt', 'publishedAt', 'published', 'date', 'datetime', 't', 'time', 'ts', 'age'], ''));
      const url = String(pick(f, ['url', 'link'], '') || '');
      const safeUrl = url && /^https?:\/\//i.test(url) ? url : '';
      const inner = '<div class="feed-item">'
        + '<span class="feed-src ' + cls + '">' + tag + '</span>'
        + '<p class="feed-text">' + text + (author ? '<span class="feed-author mono">' + author + (eng != null ? ' · ' + N.formatNumber(eng, true) : '') + '</span>' : '') + '</p>'
        + (t ? '<span class="feed-time mono">' + t + '</span>' : '') + '</div>';
      return safeUrl ? '<a class="feed-link" href="' + esc(safeUrl) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>' : inner;
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
    /* Sources: real publishers deduplicated from sampleSources */
    /* deterministic analytics widgets — fed by the backend's
       Generate Dashboard Metrics node, never fabricated on the client. */
    const SEV_HEX = { 'sev-danger': '#F45D5D', 'sev-warn': '#F5B84A', 'sev-blue': '#5EA2FF', 'sev-pos': '#35D07F', 'sev-purple': '#7A5CFF' };
    function vbarRow(label, count, max) {
      const n = num(count);
      const h = max > 0 && n != null ? Math.max(2, Math.min(100, Math.round((n / max) * 100))) : 0;
      return '<div class="vbar">'
        + '<b class="vbar-count">' + (n != null ? esc(N.formatNumber(n) + '×') : '—') + '</b>'
        + '<span class="vbar-track"><i class="vbar-fill" style="--h:' + h + '%"></i></span>'
        + '<span class="vbar-label" title="' + esc(label) + '">' + esc(label) + '</span></div>';
    }
    function heatTile(label, count, max) {
      const n = num(count);
      const int = max > 0 && n != null ? Math.max(0, Math.min(1, n / max)) : 0;
      const alpha = (0.06 + 0.52 * int).toFixed(3);
      return '<span class="heat-tile" style="background:rgba(246,173,60,' + alpha + ')">'
        + '<span class="heat-tile-txt">' + esc(label) + '</span>'
        + '<span class="heat-tile-count">' + (n != null ? esc(N.formatNumber(n) + '×') : L('ws.gov.detected')) + '</span></span>';
    }
    function topicPie(items) {
      if (!items || !items.length) return '';
      const palette = ['#5EA2FF', '#F5B84A', '#35D07F', '#7A5CFF', '#F45D5D'];
      const vals = items.map((t, i) => {
        const v = Math.max(0, num(pick(t, ['count', 'vol', 'volume', 'value'], null)) || 0);
        const color = palette[i % palette.length];
        const label = String(pick(t, ['label', 'name', 'topic', 'title'], '—'));
        return { v: v, color: color, label: label };
      });
      const total = vals.reduce((a, x) => a + x.v, 0);
      const legend = vals.map((x) => {
        const pct = total > 0 && x.v > 0 ? Math.round((x.v / total) * 100) + '%' : '';
        return '<div class="topic-pie-row"><span class="topic-pie-dot" style="background:' + x.color + '"></span>'
          + '<span class="topic-pie-name" title="' + esc(x.label) + '">' + esc(x.label) + '</span>'
          + '<span class="topic-pie-meta">' + (x.v > 0 ? esc(N.formatNumber(x.v)) : '—') + (pct ? ' · ' + pct : '') + '</span></div>';
      }).join('');
      if (!total) {
        return '<div class="topic-pie"><div class="topic-pie-legend">' + legend + '</div></div>';
      }
      const holder = document.createElement('div');
      holder.className = 'donut';
      N.buildDonut(holder, vals, N.formatNumber(total, true), L('ws.pie.c'));
      return '<div class="topic-pie">' + holder.outerHTML + '<div class="topic-pie-legend">' + legend + '</div></div>';
    }
    function renderTopicPie(listEl, emptyEl, items) {
      const html = topicPie(items);
      if (listEl) { listEl.style.display = html ? '' : 'none'; listEl.innerHTML = html; }
      if (emptyEl) { emptyEl.hidden = html.length > 0; emptyEl.style.display = ''; }
    }
    function regionHeat(locs, r) {
      const list = Array.isArray(locs) ? locs : [];
      const govs = Array.isArray(N.governorates) ? N.governorates : [];
      const counts = {};
      const meta = {};
      let national = !!(r && r.national);
      list.forEach((l) => {
        const norm = N.normalizeLocation(l && l.name);
        const n = num(l && l.count);
        if (norm) {
          if (norm.national) { national = true; return; }
          if (!meta[norm.name]) meta[norm.name] = norm;
          if (n != null) counts[norm.name] = (counts[norm.name] || 0) + n;
        }
      });
      if (!national && list.length && !Object.keys(counts).length) national = true;
      const max = Object.keys(counts).reduce((m, k) => Math.max(m, counts[k] || 0), 0);
      const tileName = (g) => (N.lang === 'ar' && g.ar ? g.ar : g.en);
      const tiles = govs.map((g) => {
        const n = counts[g.en] || 0;
        const int = max > 0 && n > 0 ? Math.max(0.15, Math.min(1, n / max)) : 0;
        const alpha = (0.04 + 0.5 * int).toFixed(3);
        return '<span class="region-tile' + (n > 0 ? '' : ' zero') + '" style="background:rgba(246,173,60,' + alpha + ')">'
          + '<b>' + esc(tileName(g)) + '</b><span>' + (n > 0 ? esc(N.formatNumber(n) + '×') : '0') + '</span></span>';
      }).join('');
      const nationalTile = national
        ? '<span class="region-tile national" style="background:rgba(246,173,60,.45)">'
          + '<b>' + esc(N.lang === 'ar' ? 'مصر' : 'Egypt') + '</b>'
          + '<span>' + esc(L('ws.national.s')) + '</span></span>'
        : '';
      const ranked = Object.keys(counts).filter((k) => (counts[k] || 0) > 0)
        .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
        .slice(0, 8);
      const rank = ranked.map((k, i) => {
        const g = meta[k] || {};
        const label = tileName(g);
        const n = counts[k] || 0;
        const w = max > 0 ? Math.max(4, Math.round((n / max) * 100)) : 4;
        return '<li><span class="rr-n">' + String(i + 1).padStart(2, '0') + '</span>'
          + '<span class="rr-name" title="' + esc(label) + '">' + esc(label) + '</span>'
          + '<span class="rr-bar"><i style="--w:' + w + '%"></i></span>'
          + '<span class="rr-count">' + esc(N.formatNumber(n) + '×') + '</span></li>';
      }).join('');
      return '<div class="region-heat"><div class="region-heat-grid">' + nationalTile + tiles + '</div>'
        + (rank ? '<ol class="region-rank">' + rank + '</ol>' : '') + '</div>';
    }
    function renderRegionHeat(container, locs, r) {
      if (!container) return;
      container.style.display = '';
      container.innerHTML = regionHeat(locs, r);
    }
    function healthCard(label, value, sub, tone) {
      return '<div class="health-item' + (tone ? ' health-' + tone : '') + '">'
        + '<span class="health-label mono">' + esc(label) + '</span>'
        + '<b class="health-value">' + esc(String(value == null ? '—' : value)) + '</b>'
        + (sub ? '<span class="health-sub mono">' + esc(sub) + '</span>' : '') + '</div>';
    }
    const HEALTH_TONE = { rising: 'pos', falling: 'neg', stable: 'neutral', insufficient_data: 'muted', high: 'pos', medium: 'warn', low: 'muted', 'Very Strong': 'pos', Strong: 'pos', Moderate: 'warn', Weak: 'muted', Fresh: 'pos', Mixed: 'warn', Historical: 'muted' };
    function healthRadar(D) {
      const H = D && typeof D === 'object' ? D : null;
      if (!H) return '';
      const v = (x) => { const n = num(x); if (n == null) return 0; return Math.max(0, Math.min(100, n > 0 && n <= 1 ? n * 100 : n)); };
      const mom = H.momentum || {}, ss = H.signalStrength || {}, sd = H.sourceDiversity || {}, fs = H.freshness || {}, rl = H.relevance || {}, cv = H.coverage || {};
      const covMap = { high: 90, medium: 60, moderate: 60, low: 30, weak: 30, strong: 90 };
      const covRaw = (String(cv.corroborationLevel || '').toLowerCase() in covMap)
        ? covMap[String(cv.corroborationLevel || '').toLowerCase()]
        : (cv.independentSourceRatio != null ? v(cv.independentSourceRatio * 100) : 0);
      const vals = [
        [L('export.h.momentum'), v(mom.score)],
        [L('export.h.signal'), v(ss.score)],
        [L('export.h.diversity'), v(sd.score)],
        [L('export.h.freshness'), fs.recentPercentage != null ? v(fs.recentPercentage) : (fs.averageDaysOld != null ? v(Math.max(0, 100 - fs.averageDaysOld * 20)) : 0)],
        [L('export.h.relevance'), v(rl.average)],
        [L('export.h.coverage'), covRaw]
      ];
      if (!vals.some((x) => x[1] > 0)) return '';
      const W = 220, C = 110, R = 76;
      const pt = (angleDeg, radius) => {
        const a = ((angleDeg - 90) * Math.PI) / 180;
        return [Number((C + radius * Math.cos(a)).toFixed(1)), Number((C + radius * Math.sin(a)).toFixed(1))];
      };
      const poly = (scale) => vals.map((x, i) => pt(i * 60, R * scale).join(',')).join(' ');
      const rings = [0.25, 0.5, 0.75, 1].map((s) => '<polygon class="radar-ring" points="' + poly(s) + '"/>').join('');
      const axes = vals.map((x, i) => {
        const p = pt(i * 60, R);
        return '<line class="radar-axis" x1="' + C + '" y1="' + C + '" x2="' + p[0] + '" y2="' + p[1] + '"/>';
      }).join('');
      const gridPts = vals.map((x, i) => pt(i * 60, Math.max(2, (x[1] / 100) * R)).join(',')).join(' ');
      const dots = vals.map((x, i) => {
        const p = pt(i * 60, Math.max(2, (x[1] / 100) * R));
        return '<circle class="radar-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="2.6"/>';
      }).join('');
      const labels = vals.map((x, i) => {
        const p = pt(i * 60, R + 15);
        const pd = pt(i * 60, Math.max(4, (x[1] / 100) * R));
        const cx = p[0];
        const anchor = cx < C - 12 ? 'end' : cx > C + 12 ? 'start' : 'middle';
        const top = pd[1] < C - 6;
        return '<text class="radar-label" x="' + p[0] + '" y="' + p[1] + '" text-anchor="' + anchor + '" dominant-baseline="' + (top ? 'auto' : 'hanging') + '">' + esc(x[0]) + '</text>'
          + '<text class="radar-val" x="' + pd[0] + '" y="' + pd[1] + '" dy="' + (top ? '-4' : '9') + '" text-anchor="' + anchor + '">' + Math.round(x[1]) + '</text>';
      }).join('');
      return '<svg class="radar-chart" viewBox="0 0 ' + W + ' ' + W + '" role="img" aria-label="Signal health radar">'
        + rings + axes + '<polygon class="radar-grid" points="' + gridPts + '"/>' + dots + labels + '</svg>';
    }
    function renderHealthChart(D) {
      const chart = $('dbHealthChart');
      const html = healthRadar(D);
      if (chart) { chart.hidden = !html; chart.innerHTML = html; }
      return html;
    }
    function renderDashboardMetrics(r) {
      const D = r.dashboard && typeof r.dashboard === 'object' ? r.dashboard : null;
      const setCardHidden = (anchorId, on) => {
        const el = $(anchorId);
        const card = el ? el.closest('.ws-card') : null;
        if (card) card.hidden = on;
      };
      if (!D) {
        listWidget($('dbKwList'), $('dbEmptyKeywords'), []);
        listWidget($('dbPhList'), $('dbEmptyPhrases'), []);
        listWidget($('dbHtList'), $('dbEmptyHashtags'), []);
        listWidget($('dbHealthGrid'), null, []);
        setCardHidden('dbHtList', true);
        renderHealthChart(null);
        return;
      }
      const kws = Array.isArray(D.keywords) ? D.keywords : [];
      const phs = Array.isArray(D.phrases) ? D.phrases : [];
      const hts = Array.isArray(D.hashtags) ? D.hashtags : [];
      const kwMax = kws.reduce((m, k) => Math.max(m, num(k.count) || 0), 0);
      const phMax = phs.reduce((m, p) => Math.max(m, num(p.count) || 0), 0);
      listWidget($('dbKwList'), $('dbEmptyKeywords'), kws.slice(0, 10).map((k) => vbarRow(k.keyword, k.count, kwMax, k.percentage)));
      listWidget($('dbPhList'), $('dbEmptyPhrases'), phs.slice(0, 8).map((p) => heatTile(p.phrase, p.count, phMax)));
      const htHtml = hts.slice(0, 16).map((h) => {
        const n = num(h.count);
        return '<span class="chip ht-chip"><span class="chip-pulse" aria-hidden="true"></span> <span>' + esc(h.tag || h.hashtag || '') + (n != null ? ' · ' + N.formatNumber(n, true) : '') + '</span></span>';
      });
      const htWrap = $('dbHtList');
      if (htWrap) { htWrap.style.display = htHtml.length ? '' : 'none'; htWrap.innerHTML = htHtml.join(''); }
      const htEmpty = $('dbEmptyHashtags');
      if (htEmpty) { htEmpty.hidden = htHtml.length > 0; htEmpty.style.display = ''; }
      setCardHidden('dbHtList', htHtml.length === 0);

      const items = [];
      const mom = D.momentum && typeof D.momentum === 'object' ? D.momentum : null;
      if (mom) items.push(healthCard(L('export.h.momentum'), mom.label || mom.direction || '—', (mom.score != null ? L('export.score') + ' ' + Math.round(mom.score) + ' · ' : '') + (mom.growthRate != null ? N.formatNumber(mom.growthRate) + '%' : ''), HEALTH_TONE[mom.direction]));
      const ss = D.signalStrength && typeof D.signalStrength === 'object' ? D.signalStrength : null;
      if (ss) items.push(healthCard(L('export.h.signal'), ss.label || '—', ss.score != null ? L('export.score') + ' ' + Math.round(ss.score) : '', HEALTH_TONE[ss.label]));
      const sd = D.sourceDiversity && typeof D.sourceDiversity === 'object' ? D.sourceDiversity : null;
      if (sd) items.push(healthCard(L('export.h.diversity'), sd.label || '—', (sd.uniqueSources != null ? sd.uniqueSources + ' ' + L('ws.src.count') : '') + (sd.topSourceShare != null ? ' · ' + L('export.top') + ' ' + sd.topSourceShare + '%' : ''), HEALTH_TONE[sd.label]));
      const fs = D.freshness && typeof D.freshness === 'object' ? D.freshness : null;
      if (fs) items.push(healthCard(L('export.h.freshness'), fs.label || '—', (fs.averageDaysOld != null ? 'avg ' + fs.averageDaysOld + 'd' : '') + (fs.recentPercentage != null ? ' · ' + Math.round(fs.recentPercentage) + '% ' + L('export.recent') : ''), HEALTH_TONE[fs.label]));
      const rl = D.relevance && typeof D.relevance === 'object' ? D.relevance : null;
      if (rl) items.push(healthCard(L('export.h.relevance'), rl.average != null ? Math.round(rl.average) : '—', 'H ' + rl.high + ' · M ' + rl.medium + ' · L ' + rl.low));
      const cv = D.coverage && typeof D.coverage === 'object' ? D.coverage : null;
      if (cv) items.push(healthCard(L('export.h.coverage'), cv.corroborationLevel || '—', cv.sourceCount + ' ' + L('ws.src.count') + ' / ' + cv.articleCount + ' ' + L('export.articles')));
      renderHealthChart(D);
      listWidget($('dbHealthGrid'), null, items);
    }
    function renderKpis(r) {
      const stats = (r.stats) || (r.raw && r.raw.stats) || {};
      const kpiM = $('kpiMentions');
      if (kpiM) kpiM.textContent = N.isAvailable(stats.totalPosts) ? N.formatNumber(stats.totalPosts, true) : '—';
      const kpiA = $('kpiActive');
      if (kpiA) {
        if (N.isAvailable(stats.activeTopics)) {
          kpiA.textContent = N.formatNumber(stats.activeTopics);
        } else if (N.isAvailable(stats.totalPosts)) {
          /* fallback: a quarter of the analyzed total, clearly marked as an
             estimate — only applied when the backend omits the figure */
          kpiA.textContent = '~' + N.formatNumber(Math.max(1, Math.round(stats.totalPosts / 4)));
        } else {
          kpiA.textContent = '—';
        }
      }
      const kpiS = $('kpiSentiment');
      if (kpiS) kpiS.textContent = N.isAvailable(stats.sentimentScore) ? N.formatNumber(stats.sentimentScore) : '—';
      const kpiC = $('kpiCrises');
      if (kpiC) kpiC.textContent = N.isAvailable(stats.emergencyAlerts) ? N.formatNumber(stats.emergencyAlerts) : '—';
      /* delta labels reflect the optional topic deltas from the response */
      const dPosts = $('kpiPostsDelta');
      const dActive = $('kpiActiveDelta');
      const dSent = $('kpiSentDelta');
      const dCrises = $('kpiCrisesDelta');
      const topics = Array.isArray(r.topics) ? r.topics : [];
      if (dPosts) {
        const d = topics.length ? topics[0].delta : null;
        dPosts.textContent = d != null && String(d).trim() ? String(d) : '—';
      }
      if (dActive) {
        const d = topics.length > 1 ? topics[1].delta : null;
        dActive.textContent = d != null && String(d).trim() ? String(d) : '—';
      }
      if (dSent && r.sentiment && r.sentiment.label) {
        const lbl = String(r.sentiment.label).toUpperCase();
        dSent.textContent = lbl.charAt(0) + lbl.slice(1).toLowerCase();
        dSent.classList.remove('pos', 'neg', 'neu');
        if (lbl.indexOf('POS') !== -1) dSent.classList.add('pos');
        else if (lbl.indexOf('NEG') !== -1) dSent.classList.add('neg');
        else dSent.classList.add('neu');
      } else if (dSent) { dSent.textContent = '—'; dSent.classList.remove('pos', 'neg', 'neu'); }
      if (dCrises) dCrises.textContent = '—';
    }
    function renderSummary(r) {
      const title = $('dbBriefTitle');
      if (title) {
        const briefTitle = r.briefMeta && String(r.briefMeta.title || '').trim();
        title.textContent = esc(briefTitle || query) + ' — ' + L('ws.brief');
      }
      const st = $('dbSummaryText');
      const es = $('dbEmptySummary');
      let paras = null;
      let structured = null;
      if (r.briefMeta) {
        const bm = r.briefMeta;
        const parts = [];
        if (bm.headline) parts.push('<p class="summary-lead">' + esc(bm.headline) + '</p>');
        if (bm.summary && String(bm.summary).trim()) {
          parts.push(String(bm.summary).split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => '<p>' + esc(p) + '</p>').join(''));
        }
        const listHtml = (arr) => arr.length ? '<ul class="summary-list">' + arr.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
        if (bm.keyFindings.length) parts.push('<h4 class="summary-h">' + esc(L('ws.brief.findings')) + '</h4>' + listHtml(bm.keyFindings));
        if (bm.keyDevelopments.length) parts.push('<h4 class="summary-h">' + esc(L('ws.brief.dev')) + '</h4>' + listHtml(bm.keyDevelopments));
        if (bm.whyItMatters) parts.push('<h4 class="summary-h">' + esc(L('ws.brief.why')) + '</h4><p>' + esc(bm.whyItMatters) + '</p>');
        if (parts.length) structured = parts;
      }
      if (!structured) {
        if (r.summary && String(r.summary).trim() && !(N.looksLikeJson && N.looksLikeJson(r.summary))) {
          paras = String(r.summary).split(/\n+/).map((p) => p.trim()).filter(Boolean);
        } else if (N.buildBrief) {
          paras = N.buildBrief(r, N.lang);
        }
      }
      if (structured && structured.length) {
        if (st) {
          st.hidden = false;
          st.innerHTML = structured.join('');
        }
        if (es) es.hidden = true;
      } else if (paras && paras.length) {
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
      const genNote = $('dbGenNote');
      if (genNote) {
        const ts = r.analyzedAt || r.generatedAt || (r.raw && r.raw.generatedAt);
        const rel = N.formatRelativeTime(ts);
        const arts = Array.isArray(r.articles) ? r.articles.length : 0;
        const n = arts || ((r.stats && r.stats.totalPosts) || 0);
        const note = rel ? L('ws.gen.note').split('{t}').join(rel).split('{n}').join(String(n)) : '';
        genNote.hidden = !note;
        if (note) genNote.innerHTML = note.replace(/\b\d+(?:[mhdw])?\b/g, (m) => '<b>' + m + '</b>');
      }

      const scope = r.scope || (r.raw && r.raw.scope);
      const scopeLbl = scope === 'private' ? L('ws.scope.private') : scope === 'public' ? L('ws.scope.public') : '';
      const scopeChip = $('dbScopeChip');
      const scopeChipTxt = $('dbScopeChipTxt');
      if (scopeChip && scopeChipTxt) {
        const hasScope = scopeLbl.length > 0;
        scopeChip.hidden = !hasScope;
        if (hasScope) scopeChipTxt.textContent = L('ws.meta.scope').split('{s}').join(scopeLbl);
      }
      const metaGen = $('dbMetaGen');
      if (metaGen) {
        const gt = (r.generatedAt || (r.raw && r.raw.generatedAt));
        const rel = N.formatRelativeTime(gt);
        metaGen.hidden = !rel;
        if (rel) metaGen.textContent = L('ws.meta.generated').split('{t}').join(rel);
      }
      const metaPosts = $('dbMetaPosts');
      if (metaPosts) {
        const n = r.stats && r.stats.totalPosts;
        const avail = N.isAvailable(n);
        metaPosts.hidden = !avail;
        if (avail) metaPosts.textContent = L('ws.meta.posts').split('{n}').join(N.formatNumber(n));
      }
      const scopeNote = $('dbScopeNote');
      if (scopeNote) {
        const noteKey = scope === 'private' ? 'ws.priv.note' : 'ws.pub.note';
        scopeNote.hidden = !scopeLbl;
        if (scopeLbl) scopeNote.textContent = L(noteKey);
      }
      const chips = $('dbChips');
      if (chips) {
        const topics = Array.isArray(r.topics) ? r.topics.slice(0, 4) : [];
        chips.hidden = !topics.length;
        chips.innerHTML = topics.map((c) => {
          const label = esc(c.topic || c.name || '');
          const n = num(c.count);
          return '<span class="chip"><span class="chip-pulse" aria-hidden="true"></span> <span>' + label + (n != null ? ' · ' + N.formatNumber(n, true) : '') + '</span></span>';
        }).join('');
      }
    }
    function renderWidgets() {
      const r = lastResult && typeof lastResult === 'object' && !Array.isArray(lastResult) ? lastResult : {};
      const has = (v) => Array.isArray(v) && v.length > 0;

      renderKpis(r);
      renderSummary(r);
      renderDashboardMetrics(r);

      const topics = has(r.topics) ? r.topics : (Array.isArray(r.trendingTopics) ? r.trendingTopics : []);
      const locs = has(r.locations) ? r.locations : (Array.isArray(r.topLocations) ? r.topLocations : []);
      const infs = has(r.influencers) ? r.influencers : (Array.isArray(r.topInfluencers) ? r.topInfluencers : []);
      const hls = has(r.highlights) ? r.highlights : (Array.isArray(r.aiHighlights) ? r.aiHighlights : []);
      const feed = has(r.articles) ? r.articles : (Array.isArray(r.sampleSources) ? r.sampleSources : []);

      renderTopicPie($('dbTrendList'), $('dbEmptyTopics'), topics);
      listWidget($('dbHlList'), $('dbEmptyHighlights'), hls.map(highlightCard));
      listWidget($('dbFeedTrack'), $('dbEmptyFeed'), feed.map(feedItem));

      renderRegionHeat($('regionGrid'), locs, r);
      listWidget($('dbRankList'), $('dbEmptyInfluencers'), infs.map(influencerRow));
      const infCard = $('dbRankList') ? $('dbRankList').closest('.ws-card') : null;
      if (infCard) infCard.hidden = infs.length === 0;

      /* overall analysis summary (numbers only, real contract values) */
      const tsEl = $('dbTotalSummary');
      if (tsEl) {
        const rows = totalSummaryRows(r);
        tsEl.hidden = rows.length === 0;
        tsEl.innerHTML = rows.length
          ? '<span class="ts-label">' + esc(L('ws.hl.total')) + '</span>' + rows.map((x) => '<p class="ts-text">' + x + '</p>').join('')
          : '';
      }

      /* sources: deterministic publisher analytics first, else the real
         publishers deduplicated from the actual returned signals */
      let srcs;
      if (has(r.sources)) {
        srcs = r.sources.slice(0, 12);
      } else {
        const countBy = {};
        feed.forEach((f) => {
          const label = N.getSourceLabel(f);
          if (label) countBy[label] = (countBy[label] || 0) + 1;
        });
        srcs = Object.keys(countBy)
          .map((label) => ({ label: label, count: countBy[label] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);
      }
      const srcMax = srcs.reduce((m, s) => Math.max(m, num(s.count) || 0), 0);
      const srcList = $('dbSrcList');
      const srcEmpty = $('dbEmptySources');
      const srcFoot = $('dbSrcFoot');
      const paintSrcs = (count) => {
        if (srcList) {
          srcList.style.display = srcs.length ? '' : 'none';
          srcList.innerHTML = srcs.slice(0, count).map((s) => vbarRow(s.label, s.count, srcMax, s.percentage)).join('');
        }
        if (srcEmpty) srcEmpty.hidden = srcs.length > 0;
      };
      if (srcList) { srcList.dataset.realCount = String(srcs.length); }
      paintSrcs(5);
      if (srcFoot) {
        srcFoot.innerHTML = '';
        if (srcs.length > 5) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'src-toggle';
          btn.dataset.expanded = 'false';
          btn.textContent = L('ws.src.more').split('{n}').join(String(srcs.length));
          btn.addEventListener('click', () => {
            const exp = btn.dataset.expanded === 'true';
            btn.dataset.expanded = String(!exp);
            btn.textContent = exp
              ? L('ws.src.more').split('{n}').join(String(srcs.length))
              : L('ws.src.fewer');
            paintSrcs(exp ? 5 : srcs.length);
          });
          srcFoot.appendChild(btn);
        }
      }
    }
    function totalSummaryRows(r) {
      const D = r.dashboard && typeof r.dashboard === 'object' ? r.dashboard : null;
      const stats = r.stats || (r.raw && r.raw.stats) || {};
      const rows = [];
      const mom = D && D.momentum ? D.momentum : null;
      if (mom) {
        const sc = num(mom.score);
        rows.push(L('ws.total.momentum')
          .split('{dir}').join(esc(String(mom.label || mom.direction || '—')))
          .split('{score}').join(sc != null ? '<b>' + Math.round(sc) + '</b>' : '<b>—</b>'));
      }
      const sent = r.sentiment && typeof r.sentiment === 'object' ? r.sentiment : null;
      if (sent && (num(sent.positive) != null || num(sent.neutral) != null || num(sent.negative) != null)) {
        const pos = num(sent.positive) != null ? Math.round(num(sent.positive)) : 0;
        const neu = num(sent.neutral) != null ? Math.round(num(sent.neutral)) : 0;
        const neg = num(sent.negative) != null ? Math.round(num(sent.negative)) : 0;
        rows.push(L('ws.total.sentiment')
          .split('{label}').join(esc(String(sent.label || '—')))
          .split('{pos}').join('<b>' + pos + '</b>')
          .split('{neu}').join('<b>' + neu + '</b>')
          .split('{neg}').join('<b>' + neg + '</b>'));
      }
      if (D && Array.isArray(D.keywords) && D.keywords.length) {
        const kw = D.keywords[0].keyword || D.keywords[0].label || '';
        if (kw) rows.push(L('ws.total.kw').split('{kw}').join('<b>' + esc(kw) + '</b>'));
      }
      const art = num(stats.totalPosts);
      const srcN = D && D.sourceDiversity && num(D.sourceDiversity.uniqueSources) != null
        ? num(D.sourceDiversity.uniqueSources)
        : (Array.isArray(r.sources) ? r.sources.length : null);
      if (art != null && srcN != null) {
        rows.push(L('ws.total.coverage')
          .split('{art}').join('<b>' + N.formatNumber(art) + '</b>')
          .split('{src}').join('<b>' + srcN + '</b>'));
      }
      const e = num(stats.emergencyAlerts);
      if (e != null && e > 0) rows.push(L('ws.total.crisis').split('{e}').join('<b>' + e + '</b>'));
      return rows;
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

    /* ---------- admin stats (visible only to nabd_admin / superadmin) ---------- */
    const u = N.getUser();
    const userRole = (u && u.role) || 'analyst';
    if (userRole === 'nabd_admin' || userRole === 'superadmin') {
      const adminStatsEl = $('dbAdminStats');
      if (adminStatsEl) adminStatsEl.hidden = false;
      const adminQa = $('dbQaAdmin');
      if (adminQa) adminQa.hidden = false;
      fetch('/api/users?action=admin-stats', { headers: { Accept: 'application/json' }, credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok || !d.stats) return;
          const s = d.stats;
          const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
          set('dbAdminUsers', s.totalUsers.toLocaleString());
          set('dbAdminReports', s.totalSearches.toLocaleString());
          set('dbAdminExports', s.totalDownloads.toLocaleString());
          set('dbAdminRPM', s.estimatedRPM.toLocaleString());
        })
        .catch(() => {});
    }
  }

  /* ---------------- history ---------------- */
  function initHistory() {
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
    const pins = (() => { try { return JSON.parse(localStorage.getItem(userKey('nabd-pins')) || '[]'); } catch (e) { return []; } })();

    function srcLabel(r) {
      const s = N.formatNumber ? N.formatNumber(r.src) : r.src;
      return r.src != null && s != null ? s + ' ' + L('ws.src.count') : '';
    }

    function rowHtml(r) {
      const pinned = pins.indexOf(r.id) !== -1;
      const when = N.formatRelativeTime ? N.formatRelativeTime(r.ts, N.lang) : '';
      return '<div class="app-row" data-id="' + r.id + '">'
        + '<span class="row-icon">' + svg(IC.pulse) + '</span>'
        + '<div class="grow"><div class="row-title">' + esc(r.query) + '</div><div class="row-sub">' + when + (r.cat && catLabel[r.cat] ? ' · ' + L(catLabel[r.cat]) : '') + (srcLabel(r) ? ' · ' + srcLabel(r) : '') + '</div></div>'
        + '<span class="status-chip ' + stCls[r.status] + '"><span class="d"></span>' + L(stLabel[r.status] || stLabel.done) + '</span>'
        + '<span class="status-chip ' + (r.vis === 'public' ? 'neu' : 'ok') + '"><span class="d"></span>' + (r.vis === 'public' ? L('hist.filter.public') : L('hist.filter.private')) + '</span>'
        + '<div class="row-actions">'
        + '<button class="icon-btn sm star-btn' + (pinned ? ' on' : '') + '" data-act="pin" title="' + L('hist.pin') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-act="rerun" title="' + L('hist.rerun') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-act="del" title="' + L('hist.delete') + '">✕</button>'
        + '</div></div>';
    }
    function cardHtml(r) {
      const pinned = pins.indexOf(r.id) !== -1;
      const when = N.formatRelativeTime ? N.formatRelativeTime(r.ts, N.lang) : '';
      return '<div class="hist-card" data-id="' + r.id + '">'
        + '<div class="row-title">' + esc(r.query) + '</div>'
        + '<div class="row-sub">' + when + (r.cat && catLabel[r.cat] ? ' · ' + L(catLabel[r.cat]) : '') + '</div>'
        + '<div><span class="status-chip ' + stCls[r.status] + '"><span class="d"></span>' + L(stLabel[r.status] || stLabel.done) + '</span></div>'
        + '<div class="row-actions">'
        + '<button class="icon-btn sm star-btn' + (pinned ? ' on' : '') + '" data-act="pin" title="' + L('hist.pin') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-act="rerun" title="' + L('hist.rerun') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-act="del" title="' + L('hist.delete') + '">✕</button>'
        + '</div></div>';
    }
    function tlHtml(r) {
      const pinned = pins.indexOf(r.id) !== -1;
      const when = N.formatRelativeTime ? N.formatRelativeTime(r.ts, N.lang) : '';
      return '<div class="tl-item" data-id="' + r.id + '"><div class="tl-title">' + esc(r.query) + '</div>'
        + '<div class="tl-sub">' + (r.cat && catLabel[r.cat] ? L(catLabel[r.cat]) : '') + (srcLabel(r) ? ' · ' + srcLabel(r) : '') + ' · <span class="status-chip ' + stCls[r.status] + '" style="padding:1px 8px;font-size:.68rem"><span class="d"></span>' + L(stLabel[r.status] || stLabel.done) + '</span></div>'
        + '<div class="tl-time">' + when + '</div>'
        + '<div class="row-actions" style="margin-top:8px">'
        + '<button class="icon-btn sm star-btn' + (pinned ? ' on' : '') + '" data-act="pin" title="' + L('hist.pin') + '">' + svg(IC.star) + '</button>'
        + '<button class="icon-btn sm" data-act="rerun" title="' + L('hist.rerun') + '">' + svg(IC.pulse) + '</button>'
        + '<button class="icon-btn sm" data-act="del" title="' + L('hist.delete') + '">✕</button>'
        + '</div></div>';
    }

    let mode = 'list';
    let filter = 'all';
    let query = '';

    function dataRows() {
      return N.historyGet ? N.historyGet() : [];
    }

    function visible(r) {
      if (query && String(r.query).toLowerCase().indexOf(query.toLowerCase()) === -1) return false;
      if (filter === 'public' && r.vis !== 'public') return false;
      if (filter === 'private' && r.vis !== 'private') return false;
      if (filter === 'exported' && !r.exp) return false;
      if (filter === 'fav' && pins.indexOf(r.id) === -1) return false;
      return true;
    }

    function render() {
      let data = dataRows().filter(visible);
      const htmls = { list: rowHtml, grid: cardHtml, timeline: tlHtml };
      const target = mode === 'list' ? list : mode === 'grid' ? grid : tl;
      target.innerHTML = data.map((r) => htmls[mode](r)).join('');
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
      const card = btn ? btn.closest('[data-id]') : e.target.closest('[data-id]');
      const r = dataRows().find((x) => x.id === (card && card.dataset.id));
      if (!r) return;
      if (!btn) {
        N.navigate('dashboard.html?view=analysis&q=' + encodeURIComponent(r.query));
        return;
      }
      if (btn.dataset.act === 'rerun') N.navigate('dashboard.html?view=analysis&q=' + encodeURIComponent(r.query));
      else if (btn.dataset.act === 'pin') {
        const ix = pins.indexOf(r.id);
        if (ix === -1) {
          pins.push(r.id);
          if (N.favAdd && !N.favHas(r.query)) {
            N.favAdd({ q: r.query, t: r.ts || Date.now(), r: { query: r.query, src: r.src || null, tone: r.tone || '' } });
          }
          T('app.toast.fav');
        } else {
          pins.splice(ix, 1);
          if (N.favRemove) N.favRemove(r.query);
          T('app.toast.favOff');
        }
        try { localStorage.setItem(userKey('nabd-pins'), JSON.stringify(pins)); } catch (err) {}
        render();
      } else if (btn.dataset.act === 'del') {
        if (N.historyRemove) N.historyRemove(r.id);
        render();
        T('app.toast.del');
      }
    });
    document.addEventListener('app-render', render);
    render();
  }

  /* ---------------- reports ---------------- */
  function initReports() {
    const escH = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const grid = $('repGrid');
    const empty = $('repEmpty');
    function savedReports() {
      try {
        const raw = localStorage.getItem(userKey('nabd-saved-reports')) || '[]';
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function writeSaved(list) {
      try { localStorage.setItem(userKey('nabd-saved-reports'), JSON.stringify(list.slice(0, 20))); } catch (e) {}
    }
    function renderGrid() {
      if (!grid) return;
      const list = savedReports();
      if (empty) empty.hidden = list.length > 0;
      grid.innerHTML = list.map((d, i) => {
        const r = (d && d.r) || {};
        const q = String(d.q || r.query || 'Untitled report');
        const when = d.t
          ? new Date(d.t).toLocaleDateString(N.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : '—';
        const srcCount = (Array.isArray(r.articles) ? r.articles.length : 0) || (r.stats && r.stats.totalPosts) || '—';
        const tone = r.sentiment && r.sentiment.label ? String(r.sentiment.label).toUpperCase() : '';
        return '<div class="doc-card">'
          + '<div class="doc-type" style="background:linear-gradient(135deg,#5EA2FF,#7A5CFF)">PDF</div>'
          + '<div class="doc-title" title="' + escH(q) + '">' + escH(q) + '</div>'
          + '<div class="doc-meta">' + escH(when) + (srcCount !== '—' ? ' · ' + escH(String(srcCount)) + ' ' + escH(L('export.articles')) : '') + '</div>'
          + '<div class="doc-tags">' + (tone ? '<span class="status-chip neu">' + escH(tone) + '</span>' : '<span class="status-chip neu" data-i18n="rep.type.pdf">PDF</span>') + '</div>'
          + '<div class="doc-actions">'
          + '<button class="btn btn-ghost btn-sm" data-rep="preview" data-idx="' + i + '" data-i18n="rep.open">Open</button>'
          + '<button class="btn btn-ghost btn-sm" data-rep="download" data-idx="' + i + '" data-i18n="rep.download">Download</button>'
          + '<button class="btn btn-ghost btn-sm" data-rep="share" data-idx="' + i + '">' + escH(L('rep.share')) + '</button>'
          + '<button class="btn btn-ghost btn-sm" data-rep="delete" data-idx="' + i + '">✕</button>'
          + '</div></div>';
      }).join('');
    }
    renderGrid();
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rep]');
      if (!b) return;
      const act = b.dataset.rep;
      const idx = b.dataset.idx != null ? Number(b.dataset.idx) : -1;
      if (idx >= 0) {
        const list = savedReports();
        const d = list[idx];
        if (act === 'delete') {
          list.splice(idx, 1);
          writeSaved(list);
          renderGrid();
          T('app.toast.del');
          return;
        }
        if (!d) return;
        if (act === 'preview' || act === 'download') {
          const q = String(d.q || (d.r && d.r.query) || '');
          if (N.notifAdd) N.notifAdd({ title: 'notif.saved.t', sub: 'notif.saved.s', params: { q: q }, cat: 'reports', ts: Date.now() });
          if (act === 'download') {
            if (N.recordDownload) N.recordDownload('report', lastSearchId);
            if (N.activityAdd) N.activityAdd('export', { q: q });
            T('rep.downloaded');
          } else {
            T('app.toast.savedNotif');
          }
          return;
        }
        if (act === 'share') {
          const q = String(d.q || (d.r && d.r.query) || '');
          const url = window.location.origin + window.location.pathname.replace('reports.html', 'dashboard.html') + '?q=' + encodeURIComponent(q);
          try { window.navigator.clipboard.writeText(url); T('app.toast.shared'); } catch (err) { T('app.toast.exported'); }
          return;
        }
      }
      if (act === 'share') T('app.toast.shared');
      else if (act === 'download') { if (N.recordDownload) N.recordDownload('report', lastSearchId); T('rep.downloaded'); }
      else if (act === 'delete') T('app.toast.del');
      else if (act === 'preview') T('app.toast.created');
    });
  }

  /* ---------------- profile ---------------- */
  function initProfile() {
    const escH = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const set = (id, v) => { const el = $(id); if (el) el.textContent = (v == null || v === '') ? '—' : String(v); };
    const fill = (id, v) => { const el = $(id); if (el) el.value = v == null ? '' : String(v); };
    const fmtDate = (v) => {
      const d = new Date(v);
      if (!v || isNaN(d.getTime())) return null;
      return d.toLocaleDateString(N.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });
    };
    const renderAvatar = (el, u, full) => {
      if (!el) return;
      const photo = (u.avatarUrl) || (N.avatarGet ? N.avatarGet() : null);
      if (photo) {
        el.classList.remove('avatar-empty');
        el.innerHTML = '<img src="' + escH(photo) + '" alt="">';
      } else if (full) {
        el.classList.remove('avatar-empty');
        const p = full.trim().split(/\s+/);
        el.textContent = ((p[0][0] || '') + (p[1] ? p[1][0] : '')).toUpperCase();
      } else {
        el.classList.add('avatar-empty');
        el.innerHTML = svg(IC.user);
      }
    };
    const renderVerified = (u) => {
      const pv = $('profVerified');
      if (!pv) return;
      const ok = !!(u && u.emailVerified);
      pv.innerHTML = '<span class="d"></span>' + escH(ok ? L('prof.verified') : L('prof.unverified'));
      pv.classList.toggle('ok', ok);
      pv.classList.toggle('neu', !ok);
    };
    const CITY_LIST = ['Cairo', 'Alexandria', 'Giza', 'Tanta', 'Mansoura', 'Zagazig', 'Ismailia', 'Port Said', 'Suez', 'Damietta', 'Damanhur', 'Kafr El Sheikh', 'Mahalla El Kubra', 'Shebin El Kom', 'Sadat City', 'Minya', 'Assiut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Fayoum', 'Beni Suef', '6th of October City', 'New Cairo'];

    let lastUsage = {};
    const renderProfile = (u) => {
      const first = (u.firstName || '').trim();
      const last = (u.lastName || '').trim();
      const full = (first + ' ' + last).trim();
      set('profName', full || u.email);
      renderAvatar($('profAvatar'), u, full);
      renderVerified(u);
      set('profRole', u.role);
      set('profOrg', u.organization);
      set('profCity', u.country || '—');
      set('profLang', u.lang === 'ar' ? L('lng.ar') : L('lng.en'));
      set('profEmail', u.email);
      set('profPhone', u.phone);
      set('profJoined', fmtDate(u.createdAt));
      set('profUseA', toNum(lastUsage.analyses));
      set('profUseE', Math.max(toNum(lastUsage.exports), N.dlCount ? N.dlCount() : 0));
      set('profUseS', Math.max(toNum(lastUsage.searches), N.historyGet ? N.historyGet().length : 0));

      set('profModalName', full || u.email);
      set('profModalEmail', u.email);
      renderAvatar($('profModalAvatar'), u, full);
      fill('profEditFirst', first);
      fill('profEditLast', last);
      fill('profEditRole', u.role);
      fill('profEditPhone', u.phone);
      fill('profEditOrg', u.organization);
      const cs = $('profEditCity');
      const co = $('profEditCityOther');
      if (cs) {
        const city = (u.country || '').trim();
        if (CITY_LIST.indexOf(city) !== -1) { cs.value = city; if (co) { co.hidden = true; co.value = ''; } }
        else { cs.value = 'Other'; if (co) { co.hidden = false; co.value = city; } }
      }
    };
    N.api('/api/users?action=me').then((d) => {
      const u = d && d.user;
      if (!u) return;
      lastUsage = d.usage || {};
      renderProfile(u);
    }).catch(() => renderVerified(null));

    const actKey = { analysis: 'act.analysis', export: 'act.export', save: 'act.save', fav: 'act.fav', alert: 'act.alert', reminder: 'act.reminder', profile: 'act.profile', avatar: 'act.avatar', conn: 'act.conn' };
    function renderActivity() {
      const empty = $('profTimelineEmpty');
      const tl = $('profTimeline');
      if (!tl) return;
      const feed = N.activityGet ? N.activityGet() : [];
      if (feed.length) {
        if (empty) empty.hidden = true;
        tl.innerHTML = feed.map((a) => {
          const key = actKey[a.type] || 'act.analysis';
          const raw = L(key);
          const text = a.q ? raw.split('{q}').join(a.q) : raw.split('{n}').join(a.n);
          const when = a.ts ? N.formatRelativeTime(a.ts, N.lang) : '';
          return '<div class="tl-item"><div class="tl-title">' + escH(text) + '</div>'
            + (when ? '<div class="tl-time">' + escH(when) + '</div>' : '') + '</div>';
        }).join('');
        return;
      }
      N.api('/api/users?action=recent-researches').then((d) => {
        const items = (d && d.researches) || [];
        if (empty) empty.hidden = items.length > 0;
        if (!items.length) return;
        tl.innerHTML = items.map((r) => {
          const scope = r.scope === 'private' ? 'PRIVATE' : r.scope ? String(r.scope).toUpperCase() : '';
          const when = r.createdAt ? N.formatRelativeTime(r.createdAt) : '';
          return '<div class="tl-item"><div class="tl-title">' + escH(r.query || '—') + '</div>'
            + (scope ? '<div class="tl-sub mono">' + escH(scope) + '</div>' : '')
            + (when ? '<div class="tl-time">' + escH(when) + '</div>' : '') + '</div>';
        }).join('');
      }).catch(() => {});
    }
    renderActivity();

    const modal = $('profModal');
    const openModal = () => {
      if (modal) modal.hidden = false;
      const f = $('profEditFirst');
      if (f) f.focus();
    };
    const closeModal = () => {
      if (modal) modal.hidden = true;
      const msg = $('profEditMsg'); if (msg) msg.textContent = '';
    };
    const ed = $('profEdit');
    if (ed) ed.addEventListener('click', openModal);
    const closeBtn = $('profModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const cancel = $('profEditCancel');
    if (cancel) cancel.addEventListener('click', closeModal);
    const mask = $('profModalMask');
    if (mask) mask.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
    });

    const form = $('profForm');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = $('profEditMsg');
      const cs = $('profEditCity');
      const co = $('profEditCityOther');
      let city = '';
      if (cs) {
        city = cs.value;
        if (city === 'Other') city = (co ? co.value : '').trim();
      }
      const patch = {
        firstName: ($('profEditFirst').value || '').trim(),
        lastName: ($('profEditLast').value || '').trim(),
        role: ($('profEditRole').value || '').trim(),
        phone: ($('profEditPhone').value || '').trim(),
        organization: ($('profEditOrg').value || '').trim(),
        country: city
      };
      if (!patch.firstName && !patch.lastName) {
        if (msg) msg.textContent = L('auth.err.name');
        return;
      }
      const save = $('profEditSave');
      if (save) save.disabled = true;
      N.api('/api/users?action=me', { method: 'PATCH', body: patch }).then((d) => {
        const u = d && d.user;
        if (u) { N.persistUser(u); renderProfile(u); }
        closeModal();
        T('app.toast.saved');
        fillUser();
      }).catch((err) => {
        if (msg) msg.textContent = (err && err.message) || L('prof.edit.err');
      }).then(() => { if (save) save.disabled = false; });
    });

    const photoBtn = $('profPhotoBtn');
    const photoInput = $('profPhotoInput');
    const loadAvatar = () => {
      const u = N.getUser ? N.getUser() : {};
      renderAvatar($('profAvatar'), u, ((u.firstName || '') + ' ' + (u.lastName || '')).trim());
      renderAvatar($('profModalAvatar'), u, ((u.firstName || '') + ' ' + (u.lastName || '')).trim());
    };

    const cropModal = $('cropModal');
    const cropStage = $('cropStage');
    const cropImg = $('cropImg');
    const cropFrame = $('cropFrame');
    let cropData = null;
    let dragState = null;
    function closeCrop() { if (cropModal) cropModal.hidden = true; cropData = null; dragState = null; }
    function openCrop() {
      if (cropModal) cropModal.hidden = false;
      const c = $('cropCancel');
      if (c) c.focus();
    }
    function setupCrop(img, naturalW, naturalH) {
      if (!cropStage || !cropImg || !cropFrame) return;
      const drawSource = img;
      const stageW = cropStage.clientWidth || 360;
      const stageH = cropStage.clientHeight || 300;
      const scale = Math.min(stageW / naturalW, stageH / naturalH, 1);
      const dispW = naturalW * scale;
      const dispH = naturalH * scale;
      const ix = (stageW - dispW) / 2;
      const iy = (stageH - dispH) / 2;
      cropImg.style.width = dispW + 'px';
      cropImg.style.height = dispH + 'px';
      cropImg.style.left = ix + 'px';
      cropImg.style.top = iy + 'px';
      let fs = Math.min(dispW, dispH);
      let fx = ix + (dispW - fs) / 2;
      let fy = iy + (dispH - fs) / 2;
      let mode = null;
      const clampFrame = () => {
        fx = Math.max(ix, Math.min(fx, ix + dispW - fs));
        fy = Math.max(iy, Math.min(fy, iy + dispH - fs));
        cropFrame.style.left = fx + 'px';
        cropFrame.style.top = fy + 'px';
        cropFrame.style.width = fs + 'px';
        cropFrame.style.height = fs + 'px';
      };
      const naturalOf = () => {
        const sx = naturalW / dispW;
        const sy = naturalH / dispH;
        const s = Math.min(fs * sx, fs * sy);
        return { sx: Math.max(0, Math.min(naturalW - s, (fx - ix) * sx)), sy: Math.max(0, Math.min(naturalH - s, (fy - iy) * sy)), s: s };
      };
      clampFrame();
      const onDown = (e) => {
        mode = e.target.classList.contains('crop-handle') ? 'resize' : 'move';
        const r = cropFrame.getBoundingClientRect();
        if (mode === 'move') {
          dragState = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        } else {
          dragState = { startX: e.clientX, startY: e.clientY, startS: fs };
        }
        e.preventDefault();
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      };
      const onMove = (e) => {
        if (!dragState) return;
        if (mode === 'move') {
          fx = e.clientX - dragState.dx;
          fy = e.clientY - dragState.dy;
        } else {
          const d = Math.max(e.clientX - dragState.startX, e.clientY - dragState.startY);
          fs = Math.max(40, Math.min(Math.min(dispW, dispH), dragState.startS + d));
        }
        clampFrame();
      };
      const onUp = () => {
        dragState = null;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };
      cropFrame.addEventListener('pointerdown', onDown);
      cropData = {
        save: () => {
          const r = naturalOf();
          const size = 320;
          const cv = document.createElement('canvas');
          cv.width = size;
          cv.height = size;
          const ctx = cv.getContext('2d');
          ctx.drawImage(drawSource, r.sx, r.sy, r.s, r.s, 0, 0, size, size);
          return cv.toDataURL('image/jpeg', 0.85);
        }
      };
    }

    if (photoBtn && photoInput) {
      photoBtn.addEventListener('click', () => {
        if (N.avatarGet && N.avatarGet()) {
          if (window.confirm(L('prof.photo.remove'))) {
            N.avatarSet('');
            if (N.activityAdd) N.activityAdd('avatar', {});
            loadAvatar();
            fillUser();
            T('app.toast.saved');
          }
          return;
        }
        photoInput.click();
      });
      photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        photoInput.value = '';
        if (!file) return;
        if (!/^image\//.test(file.type)) return;
        const rd = new FileReader();
        rd.onload = () => {
          const img = new Image();
          img.onload = () => {
            openCrop();
            cropImg.src = img.src;
            setupCrop(img, img.naturalWidth, img.naturalHeight);
          };
          img.onerror = () => {};
          img.src = rd.result;
        };
        rd.readAsDataURL(file);
      });
      const cropSave = $('cropSave');
      if (cropSave) cropSave.addEventListener('click', () => {
        if (!cropData || !cropData.save) return;
        const dataUrl = cropData.save();
        if (N.avatarSet) N.avatarSet(dataUrl);
        if (N.activityAdd) N.activityAdd('avatar', {});
        closeCrop();
        loadAvatar();
        fillUser();
        T('app.toast.avatar');
      });
      const cropCancel = $('cropCancel');
      if (cropCancel) cropCancel.addEventListener('click', closeCrop);
      const cropMask = $('cropModalMask');
      if (cropMask) cropMask.addEventListener('click', closeCrop);
    }

    const nav = $('profNav');
    if (nav) {
      const items = [
        { href: 'connections.html', ic: IC.link, tKey: 'prof.nav.connections', sKey: 'prof.nav.connections.d' },
        { href: 'history.html', ic: IC.clock, tKey: 'prof.nav.history', sKey: 'prof.nav.history.d' },
        { href: 'settings.html', ic: IC.sliders, tKey: 'prof.nav.settings', sKey: 'prof.nav.settings.d' }
      ];
      nav.innerHTML = items.map((it) => (
        '<a class="app-row prof-nav-row" href="' + it.href + '">'
        + '<span class="row-icon">' + svg(it.ic) + '</span>'
        + '<div class="grow"><div class="row-title">' + escH(L(it.tKey)) + '</div>'
        + '<div class="row-sub">' + escH(L(it.sKey)) + '</div></div>'
        + '<span class="row-chev">' + svg(IC.chev) + '</span>'
        + '</a>'
      )).join('');
    }
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
    const u = N.getUser();
    const userRole = (u && u.role) || 'analyst';
    const isAdminUser = userRole === 'nabd_admin' || userRole === 'superadmin';
    const socialOnly = !isAdminUser;

    /* Analysts: hide non-social cards + n8n section. Admins: see everything. */
    if (socialOnly) {
      cards.forEach((c) => {
        const id = c.dataset.conn;
        if (id !== 'fb' && id !== 'ig') { c.style.display = 'none'; }
      });
      const n8nSection = document.querySelector('.conn-n8n');
      if (n8nSection) n8nSection.style.display = 'none';
    }

    const fbSt = () => (N.fb ? N.fb.read() : { connected: false }).connected;
    const fbData = () => (N.fb ? N.fb.read() : {});
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
        if (ls) {
          const t = id === 'fb' ? fbData().connectedAt : null;
          ls.textContent = (s === 'on' && t != null && N.formatRelativeTime) ? N.formatRelativeTime(t) : '—';
        }
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

    /* ---------- n8n automation resources ---------- */
    const N8N_KEY = 'nabd-n8n';
    const n8nList = $('n8nList');
    const n8nForm = $('n8nForm');
    const n8nName = $('n8nName');
    const n8nKey = $('n8nKey');
    const n8nRead = () => { try { return JSON.parse(localStorage.getItem(N8N_KEY) || '[]'); } catch (e) { return []; } };
    const n8nWrite = (list) => { try { localStorage.setItem(N8N_KEY, JSON.stringify(list)); } catch (e) {} };
    function renderN8n() {
      if (!n8nList) return;
      const list = n8nRead();
      if (!list.length) { n8nList.innerHTML = ''; return; }
      n8nList.innerHTML = list.map((it, i) =>
        '<div class="app-row key-row">'
        + '<span class="key-prefix" style="background:linear-gradient(135deg,#EA4B71,#7A5CFF)">n8n</span>'
        + '<div class="grow"><div class="row-title">' + esc(it.name || 'n8n') + '</div>'
        + '<div class="row-sub mono">••••••••' + esc(String(it.key || '').slice(-4)) + '</div></div>'
        + '<div class="key-actions"><button class="btn btn-ghost btn-sm" data-n8n="del" data-idx="' + i + '">' + L('conn.remove') + '</button></div>'
        + '</div>'
      ).join('');
    }
    renderN8n();
    const n8nAdd = $('n8nAdd');
    if (n8nAdd) n8nAdd.addEventListener('click', () => {
      if (n8nForm) n8nForm.hidden = false;
      if (n8nName) n8nName.focus();
    });
    const n8nCancel = $('n8nCancel');
    if (n8nCancel) n8nCancel.addEventListener('click', () => { if (n8nForm) n8nForm.hidden = true; });
    const n8nSave = $('n8nSave');
    if (n8nSave) n8nSave.addEventListener('click', () => {
      const name = n8nName ? n8nName.value.trim() : '';
      const key = n8nKey ? n8nKey.value.trim() : '';
      if (!key) { if (n8nKey) n8nKey.focus(); return; }
      const list = n8nRead();
      list.unshift({ id: 'n' + Date.now().toString(36), name: name || 'n8n', key: key, addedAt: Date.now() });
      n8nWrite(list);
      if (n8nForm) n8nForm.hidden = true;
      if (n8nName) n8nName.value = '';
      if (n8nKey) n8nKey.value = '';
      renderN8n();
      T('conn.api.saved');
    });
    document.addEventListener('click', (e) => {
      const d = e.target.closest('[data-n8n="del"]');
      if (!d) return;
      const list = n8nRead();
      const ix = d.dataset.idx != null ? Number(d.dataset.idx) : -1;
      if (ix >= 0) list.splice(ix, 1);
      n8nWrite(list);
      renderN8n();
      T('conn.api.removed');
    });
  }

  /* ---------------- social ---------------- */
  function initSocial() {
    const fbBtn = $('socFbBtn');
    const fbChip = $('socFbChip');
    const fbMeta = $('socFbMeta');
    const fbLast = $('socFbLast');
    const fbTools = $('socFbTools');
    const card = document.querySelector('.conn-card[data-conn="fb"]');

    function paint() {
      const st = N.fb ? N.fb.read() : { connected: false };
      const chipText = fbChip ? fbChip.querySelector('[data-i18n]') : null;

      if (st.connected) {
        if (fbChip) {
          fbChip.className = 'status-chip conn-chip ok';
          if (chipText) chipText.textContent = L('social.fb.connected.title');
        }
        if (fbLast) {
          fbLast.textContent = st.connectedAt && N.formatRelativeTime ? N.formatRelativeTime(st.connectedAt) : '—';
        }
        if (fbTools) {
          fbTools.innerHTML = '<button class="btn btn-ghost btn-sm" id="socFbDisconnect" data-i18n="social.fb.disconnect">' + L('social.fb.disconnect') + '</button>';
          const disBtn = $('socFbDisconnect');
          if (disBtn) disBtn.addEventListener('click', () => { if (N.fb) N.fb.disconnect(); });
        }
        if (card) card.classList.remove('off');
      } else {
        if (fbChip) {
          fbChip.className = 'status-chip conn-chip neu';
          if (chipText) chipText.textContent = L('social.fb.idle.title');
        }
        if (fbLast) fbLast.textContent = '—';
        if (fbTools) {
          fbTools.innerHTML = '<button class="btn btn-primary btn-sm" id="socFbBtn" data-i18n="social.fb.connect">' + L('social.fb.connect') + '</button>';
          const conBtn = $('socFbBtn');
          if (conBtn) conBtn.addEventListener('click', () => { if (N.fb) N.fb.connect(); });
        }
      }
    }

    paint();
    document.addEventListener('nabd-fb-change', paint);
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
    const list = $('notifList');
    if (!list) return;
    const empty = $('notifEmpty');
    const unreadEl = $('notifUnread');
    const filters = document.querySelectorAll('[data-nf]');
    const read = (() => { try { return JSON.parse(localStorage.getItem(userKey('nabd-read')) || '[]'); } catch (e) { return []; } })();
    let cur = 'all';
    const ICONS = { ai: ['!', 'danger'], trend: ['▲', 'pos'], system: ['◷', 'warn'], reports: ['PDF', 'neu'], conn: ['f', 'neu'], export: ['CSV', 'pos'] };

    function dataRows() { return N.notifGet ? N.notifGet() : []; }
    function txt(key, params) {
      let s = key ? N.t(key) : '';
      if (params && typeof params === 'object') {
        Object.keys(params).forEach((k) => { s = s.split('{' + k + '}').join(String(params[k])); });
      }
      return s;
    }
    function paint() {
      const items = dataRows();
      const readSet = new Set(read);
      const unreadN = items.filter((n) => n && !readSet.has(n.id)).length;
      if (unreadEl) unreadEl.textContent = unreadN;
      const vis = items.filter((n) => cur === 'all' || n.cat === cur);
      list.innerHTML = vis.map((n) => {
        const ic = ICONS[n.cat] || ICONS.system;
        const when = N.formatRelativeTime ? N.formatRelativeTime(n.ts, N.lang) : '';
        return '<div class="notif-item' + (readSet.has(n.id) ? '' : ' unread') + '" data-nid="' + esc(n.id) + '" data-cat="' + esc(n.cat) + '">'
          + '<span class="n-dot"></span>'
          + '<span class="alert-ic ' + ic[1] + '">' + ic[0] + '</span>'
          + '<div class="alert-body"><div class="notif-title">' + esc(txt(n.title, n.params)) + '</div><div class="notif-sub">' + esc(txt(n.sub, n.params)) + '</div><div class="notif-time">' + when + '</div></div>'
          + '</div>';
      }).join('');
      if (empty) empty.hidden = items.length > 0;
      notifyUnread();
    }
    if (filters.length) {
      filters.forEach((f) => f.addEventListener('click', () => {
        filters.forEach((x) => x.classList.remove('active'));
        f.classList.add('active');
        cur = f.dataset.nf;
        paint();
      }));
    }
    list.addEventListener('click', (e) => {
      const it = e.target.closest('.notif-item');
      if (!it) return;
      const id = it.dataset.nid;
      if (read.indexOf(id) === -1) {
        read.push(id);
        try { localStorage.setItem(userKey('nabd-read'), JSON.stringify(read)); } catch (err) {}
        paint();
      }
    });
    const mark = $('notifMark');
    if (mark) mark.addEventListener('click', () => {
      dataRows().forEach((n) => { if (read.indexOf(n.id) === -1) read.push(n.id); });
      try { localStorage.setItem(userKey('nabd-read'), JSON.stringify(read)); } catch (err) {}
      paint();
    });
    document.addEventListener('app-render', paint);
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
    const escH = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function renderReports() {
      const wrap = $('favReports');
      const empty = $('favReportsEmpty');
      if (!wrap) return;
      const favs = N.favGet ? N.favGet() : [];
      if (empty) empty.hidden = favs.length > 0;
      wrap.innerHTML = favs.map((f, i) => {
        const q = String(f.q || (f.r && f.r.query) || '');
        const when = N.formatRelativeTime ? N.formatRelativeTime(f.t, N.lang) : '';
        const src = f.r && (f.r.src != null ? f.r.src : (Array.isArray(f.r.articles) ? f.r.articles.length : null));
        const tone = f.r && (f.r.tone || (f.r.sentiment && f.r.sentiment.label ? String(f.r.sentiment.label).toUpperCase() : ''));
        const meta = when + (src ? ' · ' + String(src) + ' ' + escH(L('ws.src.count')) : '');
        return '<div class="doc-card">'
          + '<div class="doc-type" style="background:linear-gradient(135deg,#5EA2FF,#7A5CFF)">' + escH(L('rep.type.pdf')) + '</div>'
          + '<div class="doc-title" title="' + escH(q) + '">' + escH(q) + '</div>'
          + '<div class="doc-meta">' + escH(meta) + '</div>'
          + '<div class="doc-tags">' + (tone ? '<span class="status-chip neu">' + escH(tone) + '</span>' : '') + '</div>'
          + '<div class="doc-actions">'
          + '<button class="btn btn-ghost btn-sm" data-fav="open" data-idx="' + i + '" data-i18n="rep.open">Open</button>'
          + '<button class="icon-btn sm star-btn on" data-fav="del" data-idx="' + i + '" title="' + escH(L('app.st.remove')) + '"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z"/></svg></button>'
          + '</div></div>';
      }).join('');
    }

    function renderSearches() {
      const wrap = $('favSearches');
      const empty = $('favSearchesEmpty');
      if (!wrap) return;
      const hist = N.historyGet ? N.historyGet() : [];
      let pins = [];
      try { pins = JSON.parse(localStorage.getItem(userKey('nabd-pins')) || '[]'); } catch (e) {}
      const items = hist.filter((r) => pins.indexOf(r.id) !== -1);
      if (empty) empty.hidden = items.length > 0;
      wrap.innerHTML = items.map((r) => {
        const when = N.formatRelativeTime ? N.formatRelativeTime(r.ts, N.lang) : '';
        return '<div class="app-row" data-id="' + escH(r.id) + '">'
          + '<span class="row-icon">' + svg(IC.clock) + '</span>'
          + '<div class="grow"><div class="row-title">' + escH(r.query) + '</div>'
          + '<div class="row-sub">' + escH(when) + '</div></div>'
          + '<button class="icon-btn sm star-btn on" data-sfav="unpin" title="' + escH(L('app.st.remove')) + '"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z"/></svg></button>'
          + '</div>';
      }).join('');
    }

    renderReports();
    renderSearches();

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fav]');
      if (b) {
        const idx = b.dataset.idx != null ? Number(b.dataset.idx) : -1;
        const favs = N.favGet ? N.favGet() : [];
        const f = favs[idx];
        if (b.dataset.fav === 'del') {
          if (f && N.favRemove) N.favRemove(f.q);
          renderReports();
          T('app.toast.favOff');
          return;
        }
        if (b.dataset.fav === 'open' && f) {
          const q = String(f.q || (f.r && f.r.query) || '');
          if (q) N.navigate('dashboard.html?view=analysis&q=' + encodeURIComponent(q));
          return;
        }
        return;
      }
      const ub = e.target.closest('[data-sfav]');
      if (ub) {
        const row = ub.closest('.app-row');
        const id = row && row.dataset.id;
        let pins = [];
        try { pins = JSON.parse(localStorage.getItem(userKey('nabd-pins')) || '[]'); } catch (err) {}
        const ix = pins.indexOf(id);
        if (ix !== -1) pins.splice(ix, 1);
        try { localStorage.setItem(userKey('nabd-pins'), JSON.stringify(pins)); } catch (err) {}
        renderSearches();
        T('app.toast.favOff');
      }
    });
    document.addEventListener('app-render', () => { renderReports(); renderSearches(); });
  }

  /* ---------------- saved searches ---------------- */
  function initSearches() {
    const wrap = $('searchRows');
    if (!wrap) return;
    const folderTpl = (name, on) => '<button class="filter-chip' + (on ? ' active' : '') + '" data-folder="' + name + '">' + name + '</button>';
    const chipsWrap = $('searchFolders');
    const folders = (() => { try { return JSON.parse(localStorage.getItem(userKey('nabd-folders')) || '["' + L('srch.f1') + '","' + L('srch.f2') + '"]'); } catch (e) { return [L('srch.f1'), L('srch.f2')]; } })();
    function saveFolders() { try { localStorage.setItem(userKey('nabd-folders'), JSON.stringify(folders)); } catch (e) {} }
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

  /* admin page self-initializes via admin.js */
  function initAdmin() {}

  /* ---------------- boot ---------------- */
  function boot() {
    if (!injectShell()) return;
    bindShell();
    if (page === 'dashboard') initDashboard();
    else if (page === 'history') initHistory();
    else if (page === 'reports') initReports();
    else if (page === 'profile') initProfile();
    else if (page === 'settings') initSettings();
    else if (page === 'social') initSocial();
    else if (page === 'api') initApi();
    else if (page === 'notifications') initNotifications();
    else if (page === 'favorites') initFavorites();
    else if (page === 'searches') initSearches();
    else if (page === 'admin') initAdmin();
    if (N.checkAlerts) N.checkAlerts();
    window.addEventListener('app-unread', updateBadge);
  }

  bootGuard();
})();
