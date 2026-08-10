/* ============================================================
   NABD (نبض) V3 — analysis workspace page script
   query prefill · filters · live timeline chart · sentiment ·
   progressive load
   ============================================================ */
(function () {
  'use strict';

  const N = window.NABD;
  if (!N) return;

  /* ----------------------------------------------------------
     AUTH GUARD — protected application route
     ---------------------------------------------------------- */
  if (!N.getUser()) {
    location.replace('signin.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
    return;
  }

  const rand = N.rand;
  const $ = (id) => document.getElementById(id);

  const wsQueryEl = $('wsQuery');
  const wsSearchInput = $('wsSearchInput');
  const wsSearchBtn = $('wsSearchBtn');
  const wsNewBtn = $('wsNewBtn');
  const toastEl = $('wsToast');
  const filterBar = $('filterBar');
  const trendList = $('trendList');

  /* ----------------------------------------------------------
     QUERY PREFILL from ?q=
     ---------------------------------------------------------- */
  const params = new URLSearchParams(location.search);
  const isPrivate = params.get('p') === '1';
  const privBadge = $('wsPrivateBadge');
  if (isPrivate) {
    if (privBadge) privBadge.hidden = false;
    document.title = 'Private Analysis — NABD (نبض)';
    const act = document.querySelector('.nav-links .active');
    if (act) { act.setAttribute('data-i18n', 'ws.private.badge'); act.textContent = N.t('ws.private.badge'); }
  }
  let query = (params.get('q') || '').trim() || N.QUERIES[N.lang][0];

  function setQuery(q, silent) {
    query = (q || '').trim() || N.QUERIES[N.lang][0];
    if (wsQueryEl) wsQueryEl.textContent = query;
    if (wsSearchInput && !silent) wsSearchInput.value = query === N.QUERIES[N.lang][0] ? '' : query;
  }

  setQuery(query, true);

  /* ----------------------------------------------------------
     SEARCH SUBMIT + NEW ANALYSIS
     ---------------------------------------------------------- */
  function submitSearch() {
    const q = (wsSearchInput.value || '').trim();
    setQuery(q || N.QUERIES[N.lang][0]);
    resetFilters();
    N.toast(toastEl, N.t('ws.toast.query').replace('{q}', query));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (wsSearchBtn) wsSearchBtn.addEventListener('click', submitSearch);
  if (wsSearchInput) wsSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitSearch(); });
  if (wsNewBtn) {
    wsNewBtn.addEventListener('click', () => {
      setQuery('');
      if (wsSearchInput) wsSearchInput.value = '';
      resetFilters();
      N.toast(toastEl, N.t('ws.toast.new'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     FILTER CHIPS → topics list
     ---------------------------------------------------------- */
  function resetFilters() {
    if (!filterBar) return;
    const all = filterBar.querySelector('[data-filter="all"]');
    if (all) all.click();
  }

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filterBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      if (trendList) {
        trendList.querySelectorAll('.trend-item').forEach((item) => {
          item.style.display = f === 'all' || item.dataset.cat === f ? '' : 'none';
        });
      }
    });
    try {
      const prefs = JSON.parse(localStorage.getItem('nabd-set') || '{}');
      const chip = prefs.scope && filterBar.querySelector('[data-filter="' + prefs.scope + '"]');
      if (chip) chip.click();
    } catch (e) {}
  }

  /* ----------------------------------------------------------
     PROGRESSIVE LOAD
     ---------------------------------------------------------- */
  setTimeout(() => document.body.classList.add('ws-loaded'), 120);

  /* ----------------------------------------------------------
     SENTIMENT DONUT
     ---------------------------------------------------------- */
  function renderDonut() {
    N.buildDonut($('sentimentDonut'), [
      { v: 62, color: '#35D07F' },
      { v: 24, color: '#7A8BB5' },
      { v: 14, color: '#F45D5D' }
    ], '62%', N.t('ws.donut.pos').toUpperCase());
  }
  renderDonut();

  /* ----------------------------------------------------------
     LIVE TREND TIMELINE CHART
     ---------------------------------------------------------- */
  const trendCanvas = $('trendChart');
  const trendTip = $('trendTip');

  if (trendCanvas) {
    const ctx = trendCanvas.getContext('2d');
    let dataset = makeSeries(48, 'day');
    let progress = 0, animId = null, running = false;

    function makeSeries(n, kind) {
      const out = [];
      const drift = kind === 'day' ? 0.9 : kind === 'week' ? 0.45 : 0.22;
      let v = 55;
      for (let i = 0; i < n; i++) {
        v += rand(-drift, drift) + Math.sin(i * (kind === 'day' ? 0.16 : 0.07)) * 2.4;
        out.push(Math.max(8, Math.min(96, v)));
      }
      return out;
    }

    const sizeCanvas = () => {
      const rect = trendCanvas.parentElement.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return null;
      const dpr = window.devicePixelRatio || 1;
      trendCanvas.width = Math.round(rect.width * dpr);
      trendCanvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    };

    const drawTrend = (p) => {
      const rect = sizeCanvas();
      if (!rect) return;
      const w = rect.width, h = rect.height;
      const padL = 8, padR = 8, padT = 12, padB = 22;
      const iw = w - padL - padR, ih = h - padT - padB;
      const max = Math.max(...dataset), min = Math.min(...dataset);
      const range = max - min || 1;
      const X = (i) => padL + (i / (dataset.length - 1)) * iw;
      const Y = (v) => padT + ih - ((v - min) / range) * ih;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = `rgba(${N.gridRGB().join(',')})`;
      ctx.lineWidth = 1;
      ctx.font = '10px "IBM Plex Mono", monospace';
      for (let g = 0; g <= 4; g++) {
        const gy = padT + (ih / 4) * g;
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(w - padR, gy); ctx.stroke();
        ctx.fillStyle = `rgba(${N.labelRGB().join(',')})`;
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(max - (range / 4) * g) + 'K', w - padR - 4, gy - 4);
      }
      ctx.textAlign = 'center';
      const hours = ['00', '04', '08', '12', '16', '20', '24'];
      hours.forEach((hh, i) => ctx.fillText(hh + ':00', padL + (iw / 6) * i, h - 6));

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, iw * p, ih);
      ctx.clip();

      const lastI = Math.max(1, Math.floor(p * (dataset.length - 1)));
      const seg = dataset.slice(0, lastI + 1);

      const grad = ctx.createLinearGradient(0, padT, 0, padT + ih);
      grad.addColorStop(0, `rgba(${N.accentRGB().slice(0, 3).join(',')},.32)`);
      grad.addColorStop(1, `rgba(${N.accentRGB().slice(0, 3).join(',')},0)`);
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

    const animate = (from, to, dur, done) => {
      if (animId) cancelAnimationFrame(animId);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        progress = from + (to - from) * (1 - Math.pow(1 - p, 3));
        drawTrend(progress);
        if (p < 1) animId = requestAnimationFrame(step);
        else if (done) done();
      };
      animId = requestAnimationFrame(step);
    };

    let liveTimer = null;
    N.viewObserver(trendCanvas, () => {
      if (running) return;
      running = true;
      animate(0, 1, 1500, () => {
        if (liveTimer) return;
        liveTimer = setInterval(() => {
          dataset.push(Math.min(96, Math.max(8, dataset[dataset.length - 1] + rand(-5, 5))));
          dataset.shift();
          animate(progress, 1, 700);
        }, 2400);
      });
    });

    if (trendTip) {
      const body = trendCanvas.parentElement;
      body.addEventListener('mousemove', (e) => {
        const rect = body.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const iw = rect.width - 16;
        const idx = Math.max(0, Math.min(dataset.length - 1, Math.round(((px - 8) / iw) * (dataset.length - 1))));
        const label = String(parseInt((idx / dataset.length) * 24, 10)).padStart(2, '0') + ':00';
        trendTip.textContent = `${label} · ${Math.round(dataset[idx])}K ${N.lang === 'ar' ? 'أحاديث' : 'mentions'}`;
        trendTip.style.left = px + 'px';
        trendTip.style.top = '6px';
        trendTip.classList.add('visible');
      });
      body.addEventListener('mouseleave', () => trendTip.classList.remove('visible'));
    }

    const tabs = document.querySelectorAll('.card-tabs .tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((tb) => tb.classList.remove('active'));
        tab.classList.add('active');
        dataset = makeSeries(48, tab.dataset.range || 'day');
        animate(0, 1, 900);
      });
    });

    window.addEventListener('resize', () => running && drawTrend(progress));
    document.addEventListener('nabd-theme', () => running && drawTrend(progress));
    document.addEventListener('nabd-lang', () => running && drawTrend(progress));
  }

  /* ----------------------------------------------------------
     LANG CHANGE — refresh dynamic labels
     ---------------------------------------------------------- */
  document.addEventListener('nabd-lang', () => {
    renderDonut();
    setQuery(query, true);
  });
})();
