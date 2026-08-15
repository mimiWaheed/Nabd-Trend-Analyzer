/* ============================================================
   NABD (نبض) — Analysis report exporter (pages/export.html)
   Reads the latest normalized analysis draft (sessionStorage) and
   renders a print/PDF-ready report that mirrors the dashboard
   workspace design. Requires script.js (window.NABD) loaded first.
   ============================================================ */
(function () {
  'use strict';
  const N = window.NABD;
  if (!N) return;
  const L = (k) => N.t(k);
  const $ = (id) => document.getElementById(id);

  const KEY = 'nabd-export';
  const report = $('report');
  const empty = $('expEmpty');
  const printBtn = $('expPrint');
  const trendWrap = $('repTrendChart');

  let draft = null;

  /* ----------------------------------------------------------
     tiny helpers (mirror the dashboard workspace renderers)
     ---------------------------------------------------------- */
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
  function timeAgo(v) {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v == null ? '' : v);
    const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    return Math.floor(s / 86400) + 'd';
  }
  function listWidget(listEl, emptyEl, items) {
    const has = items.length > 0;
    if (listEl) { listEl.style.display = has ? '' : 'none'; listEl.innerHTML = items.join(''); }
    if (emptyEl) { emptyEl.hidden = has; emptyEl.style.display = ''; }
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
  const HEALTH_TONE = { rising: 'pos', falling: 'neg', stable: 'neutral', insufficient_data: 'muted', high: 'pos', medium: 'warn', low: 'muted', 'Very Strong': 'pos', Strong: 'pos', Moderate: 'warn', Weak: 'muted', Fresh: 'pos', Mixed: 'warn', Historical: 'muted' };
  const FEED_MAP = { news: 'feed-news', web: 'feed-news', x: 'feed-x', twitter: 'feed-x', rss: 'feed-rss', facebook: 'feed-fb', fb: 'feed-fb', instagram: 'feed-ig', ig: 'feed-ig', google: 'feed-news', trends: 'feed-news' };

  /* ----------------------------------------------------------
     row / card builders — same classes as the dashboard widgets
     ---------------------------------------------------------- */
  function topicRow(t, i, maxVol) {
    const label = esc(pick(t, ['label', 'name', 'topic', 'title'], '—'));
    const vol = esc(pick(t, ['vol', 'volume', 'count', 'value'], '—'));
    const dRaw = pick(t, ['delta', 'change', 'vsBaseline'], '');
    const flat = /^(stable|flat|same|even|no change)/i.test(String(dRaw)) || String(pick(t, ['dir', 'up', 'trend'], '')).toLowerCase() === 'flat';
    const down = !flat && (/^-/.test(String(dRaw)) || String(pick(t, ['dir', 'up', 'trend'], '')).toLowerCase() === 'down');
    const countN = num(pick(t, ['count', 'vol', 'volume', 'value'], null));
    const wRaw = num(pick(t, ['w', 'weight', 'intensity'], null));
    const hasBar = wRaw != null || countN != null;
    const w = wRaw != null
      ? Math.max(0, Math.min(100, wRaw))
      : (countN != null && maxVol > 0 ? Math.max(2, Math.min(100, Math.round((countN / maxVol) * 100))) : 0);
    const sev = sevCls(pick(t, ['sev', 'severity', 'level'], 'sev-blue'));
    return '<div class="trend-item">'
      + '<span class="trend-rank">' + String(i + 1).padStart(2, '0') + '</span>'
      + '<span class="trend-name">' + label + '</span>'
      + (hasBar ? '<span class="trend-bar"><i class="' + sev + '" style="--w:' + w + '%"></i></span>' : '')
      + '<span class="trend-vol mono">' + vol + '</span>'
      + (dRaw ? '<span class="trend-delta ' + (flat ? 'flat' : down ? 'down' : 'up') + '">' + esc(fmtDelta(dRaw)) + '</span>' : '') + '</div>';
  }
  function locationCard(l) {
    const norm = N.normalizeLocation(l && l.name);
    const canonical = norm && norm.name;
    const name = esc(canonical ? (N.lang === 'ar' && norm.ar ? norm.ar : canonical) : pick(l, ['name', 'label', 'city', 'region'], '—'));
    const count = num(l && l.count);
    const detected = !!(norm && !norm.national);
    const sub = detected ? L('ws.gov.detected') : (count != null ? N.formatNumber(count) : '');
    return '<div class="region-card">'
      + '<div class="region-top"><span class="region-name">' + name + '</span></div>'
      + (sub ? '<div class="region-meta mono">' + sub + '</div>' : '')
      + (count != null ? '<div class="region-bar"><i style="--w:' + Math.min(100, count) + '%"></i></div>' : '') + '</div>';
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
  function sourceRow(s) {
    const n = num(s.count);
    return '<div class="src-row"><span>' + esc(s.label) + '</span>'
      + '<span class="src-bar"><i style="--w:' + Math.max(0, Math.min(100, n || 0)) + '%"></i></span>'
      + '<b class="mono">' + (n != null ? N.formatNumber(n) + '×' : '—') + '</b></div>';
  }
  function barRow(label, count, max) {
    const n = num(count);
    const w = max > 0 && n != null ? Math.max(2, Math.min(100, Math.round((n / max) * 100))) : 0;
    return '<div class="src-row"><span>' + esc(label) + '</span>'
      + '<span class="src-bar"><i style="--w:' + w + '%"></i></span>'
      + '<b class="mono">' + (n != null ? N.formatNumber(n) + '×' : '—') + '</b></div>';
  }
  function healthCard(label, value, sub, tone) {
    return '<div class="health-item' + (tone ? ' health-' + tone : '') + '">'
      + '<span class="health-label mono">' + esc(label) + '</span>'
      + '<b class="health-value">' + esc(String(value == null ? '—' : value)) + '</b>'
      + (sub ? '<span class="health-sub mono">' + esc(sub) + '</span>' : '') + '</div>';
  }

  /* ----------------------------------------------------------
     dashboard metrics (deterministic contract fields)
     ---------------------------------------------------------- */
  function renderDashboardMetrics(r) {
    const D = r.dashboard && typeof r.dashboard === 'object' ? r.dashboard : null;
    if (!D) {
      listWidget($('repKwList'), $('repEmptyKw'), []);
      listWidget($('repPhList'), $('repEmptyPh'), []);
      listWidget($('repHtList'), $('repEmptyHt'), []);
      listWidget($('repHealthGrid'), $('repEmptyHealth'), []);
      return;
    }
    const kws = Array.isArray(D.keywords) ? D.keywords : [];
    const phs = Array.isArray(D.phrases) ? D.phrases : [];
    const hts = Array.isArray(D.hashtags) ? D.hashtags : [];
    const kwMax = kws.reduce((m, k) => Math.max(m, num(k.count) || 0), 0);
    const phMax = phs.reduce((m, p) => Math.max(m, num(p.count) || 0), 0);
    listWidget($('repKwList'), $('repEmptyKw'), kws.slice(0, 10).map((k) => barRow(k.keyword, k.count, kwMax)));
    listWidget($('repPhList'), $('repEmptyPh'), phs.slice(0, 8).map((p) => barRow(p.phrase, p.count, phMax)));
    const htHtml = hts.slice(0, 16).map((h) => {
      const n = num(h.count);
      return '<span class="chip ht-chip"><span class="chip-pulse" aria-hidden="true"></span> <span>' + esc(h.tag || h.hashtag || '') + (n != null ? ' · ' + N.formatNumber(n, true) : '') + '</span></span>';
    });
    const htWrap = $('repHtList');
    if (htWrap) { htWrap.style.display = htHtml.length ? '' : 'none'; htWrap.innerHTML = htHtml.join(''); }
    const htEmpty = $('repEmptyHt');
    if (htEmpty) { htEmpty.hidden = htHtml.length > 0; htEmpty.style.display = ''; }

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
    listWidget($('repHealthGrid'), $('repEmptyHealth'), items);
  }

  /* ----------------------------------------------------------
     trend (inline SVG, no canvas — print-friendly)
     ---------------------------------------------------------- */
  function bucketLabel(ms) {
    const d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    if (ms % 86400000 === 0 || d.getHours() === 0 && ms / 3600000 % 24 === 0) {
      return d.toLocaleDateString(N.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
    }
    return String(d.getHours()).padStart(2, '0') + ':00';
  }
  function axisTickLabel(ts) {
    if (ts == null) return '';
    const n = Number(ts);
    if (!isNaN(n) && /^\d{10,}$/.test(String(ts).replace(/\.\d+$/, ''))) return bucketLabel(n);
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      if (d.getHours() === 0 && d.getMinutes() === 0 && String(ts).indexOf(':') === -1) {
        return d.toLocaleDateString(N.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
      }
      return String(d.getHours()).padStart(2, '0') + ':00';
    }
    return esc(String(ts).slice(0, 10));
  }
  function renderTrend(r) {
    if (!trendWrap) return;
    const emptyTrend = $('repEmptyTrend');
    const tl = Array.isArray(r.timeline) ? r.timeline : [];
    const pts = [];
    tl.forEach((p) => {
      if (p && typeof p === 'object') {
        const v = num(p.count != null ? p.count : (p.value != null ? p.value : p.v));
        if (v != null) pts.push({ v: v, ts: p.bucket != null ? p.bucket : (p.time != null ? p.time : (p.date != null ? p.date : null)) });
      } else {
        const v = num(p);
        if (v != null) pts.push({ v: v, ts: null });
      }
    });
    if (!pts.length) {
      trendWrap.innerHTML = '';
      if (emptyTrend) { emptyTrend.hidden = false; emptyTrend.style.display = ''; }
      return;
    }
    if (emptyTrend) { emptyTrend.hidden = true; emptyTrend.style.display = 'none'; }

    const rect = trendWrap.parentElement ? trendWrap.parentElement.getBoundingClientRect() : null;
    const W = rect && rect.width >= 100 ? Math.round(rect.width) : 560;
    const H = rect && rect.height >= 100 ? Math.round(rect.height) : 220;
    const padL = 6, padR = 6, padT = 14, padB = 24;
    const iw = W - padL - padR, ih = H - padT - padB;
    const max = Math.max.apply(null, pts.map((p) => p.v));
    const min = Math.min.apply(null, pts.map((p) => p.v));
    const range = max - min || 1;
    const X = (i) => padL + (i / (pts.length - 1 || 1)) * iw;
    const Y = (v) => padT + ih - ((v - min) / range) * ih;

    let line = '';
    pts.forEach((p, i) => { line += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1) + ' '; });
    const lastX = X(pts.length - 1).toFixed(1), baseY = (padT + ih).toFixed(1);
    const area = line + 'L' + lastX + ' ' + baseY + ' L' + padL + ' ' + baseY + ' Z';

    let grid = '', ylabels = '';
    for (let g = 0; g <= 4; g++) {
      const gy = padT + (ih / 4) * g;
      grid += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '"/>';
      const v = max - (range / 4) * g;
      ylabels += '<text x="' + (W - padR - 4) + '" y="' + (gy - 4).toFixed(1) + '" text-anchor="end">' + esc(N.formatNumber(v)) + '</text>';
    }
    let xlabels = '';
    const step = Math.max(1, Math.ceil(pts.length / 7));
    pts.forEach((p, i) => {
      if (i % step !== 0 && i !== pts.length - 1) return;
      const lbl = axisTickLabel(p.ts);
      if (!lbl) return;
      xlabels += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + lbl + '</text>';
    });
    const dots = pts.map((p, i) => '<circle class="tr-dot" cx="' + X(i).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="2.4"/>').join('');

    trendWrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(L('ws.timeline.t')) + '">'
      + '<defs><linearGradient id="repTrGrad" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="var(--accent)" stop-opacity=".32"/>'
      + '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>'
      + '</linearGradient></defs>'
      + '<g class="tr-grid">' + grid + '</g>'
      + '<g class="tr-labels">' + ylabels + xlabels + '</g>'
      + '<path class="tr-fill" d="' + area + '"/>'
      + '<path class="tr-line" d="' + line + '"/>'
      + dots
      + '</svg>';
  }

  /* ----------------------------------------------------------
     KPIs + summary
     ---------------------------------------------------------- */
  function renderKpis(r) {
    const stats = (r.stats) || (r.raw && r.raw.stats) || {};
    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set('repKpiPosts', N.isAvailable(stats.totalPosts) ? N.formatNumber(stats.totalPosts, true) : '—');
    if (N.isAvailable(stats.activeTopics)) set('repKpiActive', N.formatNumber(stats.activeTopics));
    else if (N.isAvailable(stats.totalPosts)) set('repKpiActive', '~' + N.formatNumber(Math.max(1, Math.round(stats.totalPosts / 4))));
    else set('repKpiActive', '—');
    set('repKpiSentiment', N.isAvailable(stats.sentimentScore) ? N.formatNumber(stats.sentimentScore) : '—');
    set('repKpiCrises', N.isAvailable(stats.emergencyAlerts) ? N.formatNumber(stats.emergencyAlerts) : '—');

    const topics = Array.isArray(r.topics) ? r.topics : [];
    const dPosts = topics.length ? topics[0].delta : null;
    const dActive = topics.length > 1 ? topics[1].delta : null;
    set('repKpiPostsDelta', dPosts != null && String(dPosts).trim() ? String(dPosts) : '—');
    set('repKpiActiveDelta', dActive != null && String(dActive).trim() ? String(dActive) : '—');
    if (r.sentiment && r.sentiment.label) {
      const lbl = String(r.sentiment.label);
      set('repKpiSentDelta', lbl.charAt(0).toUpperCase() + lbl.slice(1));
    } else set('repKpiSentDelta', '—');
    set('repKpiCrisesDelta', '—');
  }

  function renderSummary(r, query) {
    const title = $('repBriefTitle');
    if (title) {
      const briefTitle = r.briefMeta && String(r.briefMeta.title || '').trim();
      title.textContent = esc(briefTitle || query) + ' — ' + L('ws.brief');
    }
    const st = $('repSummary');
    const es = $('repEmptySummary');
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
      if (st) { st.hidden = false; st.innerHTML = structured.join(''); }
      if (es) es.hidden = true;
    } else if (paras && paras.length) {
      if (st) { st.hidden = false; st.innerHTML = paras.map((p) => '<p>' + esc(p) + '</p>').join(''); }
      if (es) es.hidden = true;
    } else if (st) {
      st.hidden = true;
      st.innerHTML = '';
      if (es) es.hidden = false;
    }

    const meta1 = $('repMeta1');
    if (meta1) meta1.textContent = r.articles && r.articles.length ? r.articles.length + ' ' + L('ws.src.count') : '';
    const meta2 = $('repMeta2');
    if (meta2) meta2.textContent = r.analyzedAt ? L('ws.updated') + ' ' + timeAgo(r.analyzedAt) : '';
    const meta3 = $('repMeta3');
    if (meta3) meta3.textContent = r.confidence != null ? L('ws.conf') + ' ' + Math.round(r.confidence) + '%' : '';

    const chips = $('repChips');
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

  /* ----------------------------------------------------------
     regions, sentiment donut, full render
     ---------------------------------------------------------- */
  function renderRegions(r) {
    const has = (v) => Array.isArray(v) && v.length > 0;
    const locs = has(r.locations) ? r.locations : (Array.isArray(r.topLocations) ? r.topLocations : []);
    const regional = locs.filter((l) => {
      const n = N.normalizeLocation(l && l.name);
      return n ? !n.national : true;
    });
    const showNational = (!locs.length && r.national) || (locs.length && !regional.length);
    const el = $('repEmptyLocations');
    const nl = $('repNational');
    if (showNational) {
      listWidget($('repRegions'), el, []);
      if (el) el.hidden = true;
      if (nl) nl.hidden = false;
    } else {
      listWidget($('repRegions'), el, regional.map(locationCard));
      if (nl) nl.hidden = true;
    }
  }

  function renderDonut(r, query) {
    const donutEl = $('repDonut');
    const legendB = donutEl && donutEl.parentElement
      ? Array.prototype.slice.call(donutEl.parentElement.querySelectorAll('.donut-legend b'))
      : [];
    const emptyS = $('repEmptySentiment');
    const subEl = $('repSentSub');
    const scope = r.scope || (r.raw && r.raw.scope);
    const scopeLbl = scope === 'private' ? L('ws.scope.private') : scope === 'public' ? L('ws.scope.public') : '—';
    if (subEl) subEl.textContent = L('ws.sent.sub').split('{q}').join(query || '—').split('{s}').join(scopeLbl);

    const s = r.sentiment;
    if (s && Array.isArray(s) && s.length) {
      if (emptyS) emptyS.hidden = true;
      N.buildDonut(donutEl, s, (s[0].v || 0) + '%', L('ws.donut.pos').toUpperCase());
      legendB.forEach((b, i) => { if (s[i]) b.textContent = (s[i].v || 0) + '%'; });
      return;
    }
    if (s && typeof s === 'object') {
      const pos = num(s.positive), neu = num(s.neutral), neg = num(s.negative);
      const anyVal = (pos || 0) + (neu || 0) + (neg || 0) > 0;
      if (anyVal) {
        if (emptyS) emptyS.hidden = true;
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

  function renderWidgets() {
    const r = draft && draft.r && typeof draft.r === 'object' ? draft.r : {};
    const has = (v) => Array.isArray(v) && v.length > 0;
    const query = String(draft.q || r.query || '');

    renderKpis(r);
    renderSummary(r, query);
    renderDashboardMetrics(r);

    const topics = has(r.topics) ? r.topics : (Array.isArray(r.trendingTopics) ? r.trendingTopics : []);
    const infs = has(r.influencers) ? r.influencers : (Array.isArray(r.topInfluencers) ? r.topInfluencers : []);
    const hls = has(r.highlights) ? r.highlights : (Array.isArray(r.aiHighlights) ? r.aiHighlights : []);
    const feed = has(r.articles) ? r.articles : (Array.isArray(r.sampleSources) ? r.sampleSources : []);

    const maxCount = topics.reduce((m, t) => {
      const n = num(pick(t, ['count', 'vol', 'volume', 'value'], null));
      return n != null && n > m ? n : m;
    }, 0);
    listWidget($('repTrendList'), $('repEmptyTopics'), topics.map((t, i) => topicRow(t, i, maxCount)));
    listWidget($('repHlList'), $('repEmptyHl'), hls.map(highlightCard));
    listWidget($('repFeedList'), $('repEmptyFeed'), feed.slice(0, 30).map(feedItem));
    listWidget($('repRankList'), $('repEmptyInf'), infs.map(influencerRow));

    renderRegions(r);

    let srcs;
    if (has(r.sources)) {
      srcs = r.sources.slice(0, 8);
    } else {
      const countBy = {};
      feed.forEach((f) => {
        const label = N.getSourceLabel(f);
        if (label) countBy[label] = (countBy[label] || 0) + 1;
      });
      srcs = Object.keys(countBy)
        .map((label) => ({ label: label, count: countBy[label] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }
    listWidget($('repSrcList'), $('repEmptySrc'), srcs.map(sourceRow));

    renderDonut(r, query);
    renderTrend(r);
  }

  function render() {
    draft = null;
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) draft = JSON.parse(raw);
    } catch (e) { draft = null; }

    if (!draft || !draft.r || typeof draft.r !== 'object') {
      if (report) report.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    if (report) report.hidden = false;
    if (empty) empty.hidden = true;

    const r = draft.r;
    const query = String(draft.q || r.query || '');

    const queryEl = $('repQuery');
    if (queryEl) queryEl.textContent = esc(query) || '—';

    const gen = $('repGenerated');
    if (gen) {
      const d = new Date(draft.t || Date.now());
      gen.textContent = L('export.generated') + ' ' + (isNaN(d.getTime())
        ? ''
        : d.toLocaleString(N.lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }));
    }

    document.title = (query || L('export.title')) + ' — ' + L('export.title');

    renderWidgets();
  }

  /* ----------------------------------------------------------
     wiring
     ---------------------------------------------------------- */
  if (printBtn) printBtn.addEventListener('click', () => { try { window.print(); } catch (e) {} });
  document.addEventListener('nabd-lang', render);
  window.addEventListener('resize', (() => {
    let t = null;
    return () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => { if (report && !report.hidden) renderTrend(draft && draft.r ? draft.r : {}); }, 200);
    };
  })());

  render();
})();
