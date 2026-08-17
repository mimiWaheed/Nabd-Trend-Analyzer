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
  function userKey(base) { const u = N.getUser(); return (u && u.id) ? base + '-' + u.id : base; }

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
  const SEV_HEX = { 'sev-danger': '#F45D5D', 'sev-warn': '#F5B84A', 'sev-blue': '#5EA2FF', 'sev-pos': '#35D07F', 'sev-purple': '#7A5CFF' };
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
    const vals = items.map((t) => {
      const v = Math.max(0, num(pick(t, ['count', 'vol', 'volume', 'value'], null)) || 0);
      const sev = sevCls(pick(t, ['sev', 'severity', 'level'], ''));
      const color = SEV_HEX[sev] || palette[0];
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
  function healthCard(label, value, sub, tone) {
    return '<div class="health-item' + (tone ? ' health-' + tone : '') + '">'
      + '<span class="health-label mono">' + esc(label) + '</span>'
      + '<b class="health-value">' + esc(String(value == null ? '—' : value)) + '</b>'
      + (sub ? '<span class="health-sub mono">' + esc(sub) + '</span>' : '') + '</div>';
  }
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
    const chart = $('repHealthChart');
    const html = healthRadar(D);
    if (chart) { chart.hidden = !html; chart.innerHTML = html; }
    return html;
  }

  /* ----------------------------------------------------------
     dashboard metrics (deterministic contract fields)
     ---------------------------------------------------------- */
  function renderDashboardMetrics(r) {
    const D = r.dashboard && typeof r.dashboard === 'object' ? r.dashboard : null;
    const setCardHidden = (anchorId, on) => {
      const el = $(anchorId);
      const card = el ? el.closest('.ws-card') : null;
      if (card) card.hidden = on;
    };
    if (!D) {
      listWidget($('repKwList'), $('repEmptyKw'), []);
      listWidget($('repPhList'), $('repEmptyPh'), []);
      listWidget($('repHtList'), $('repEmptyHt'), []);
      listWidget($('repHealthGrid'), $('repEmptyHealth'), []);
      setCardHidden('repHtList', true);
      renderHealthChart(null);
      return;
    }
    const kws = Array.isArray(D.keywords) ? D.keywords : [];
    const phs = Array.isArray(D.phrases) ? D.phrases : [];
    const hts = Array.isArray(D.hashtags) ? D.hashtags : [];
    const kwMax = kws.reduce((m, k) => Math.max(m, num(k.count) || 0), 0);
    const phMax = phs.reduce((m, p) => Math.max(m, num(p.count) || 0), 0);
    listWidget($('repKwList'), $('repEmptyKw'), kws.slice(0, 10).map((k) => vbarRow(k.keyword, k.count, kwMax, k.percentage)));
    listWidget($('repPhList'), $('repEmptyPh'), phs.slice(0, 8).map((p) => heatTile(p.phrase, p.count, phMax)));
    const htHtml = hts.slice(0, 16).map((h) => {
      const n = num(h.count);
      return '<span class="chip ht-chip"><span class="chip-pulse" aria-hidden="true"></span> <span>' + esc(h.tag || h.hashtag || '') + (n != null ? ' · ' + N.formatNumber(n, true) : '') + '</span></span>';
    });
    const htWrap = $('repHtList');
    if (htWrap) { htWrap.style.display = htHtml.length ? '' : 'none'; htWrap.innerHTML = htHtml.join(''); }
    const htEmpty = $('repEmptyHt');
    if (htEmpty) { htEmpty.hidden = htHtml.length > 0; htEmpty.style.display = ''; }
    setCardHidden('repHtList', htHtml.length === 0);

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
      const lbl = String(r.sentiment.label).toUpperCase();
      const el = $('repKpiSentDelta');
      if (el) {
        el.textContent = lbl.charAt(0) + lbl.slice(1).toLowerCase();
        el.classList.remove('pos', 'neg', 'neu');
        if (lbl.indexOf('POS') !== -1) el.classList.add('pos');
        else if (lbl.indexOf('NEG') !== -1) el.classList.add('neg');
        else el.classList.add('neu');
      }
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

    const genNote = $('repGenNote');
    if (genNote) {
      const ts = r.analyzedAt || r.generatedAt || (r.raw && r.raw.generatedAt);
      const rel = N.formatRelativeTime(ts);
      const arts = Array.isArray(r.articles) ? r.articles.length : 0;
      const n = arts || ((r.stats && r.stats.totalPosts) || 0);
      const note = rel ? L('ws.gen.note').split('{t}').join(rel).split('{n}').join(String(n)) : '';
      genNote.hidden = !note;
      if (note) genNote.innerHTML = note.replace(/\b\d+(?:[mhdw])?\b/g, (m) => '<b>' + m + '</b>');
    }

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
    renderRegionHeat($('repRegions'), locs, r);
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

    renderTopicPie($('repTrendList'), $('repEmptyTopics'), topics);
    listWidget($('repHlList'), $('repEmptyHl'), hls.map(highlightCard));
    listWidget($('repFeedList'), $('repEmptyFeed'), feed.slice(0, 30).map(feedItem));
    listWidget($('repRankList'), $('repEmptyInf'), infs.map(influencerRow));
    const infCard = $('repRankList') ? $('repRankList').closest('.ws-card') : null;
    if (infCard) infCard.hidden = infs.length === 0;

    renderRegions(r);

    /* overall analysis summary (numbers only, real contract values) */
    const tsEl = $('repTotalSummary');
    if (tsEl) {
      const rows = totalSummaryRows(r);
      tsEl.hidden = rows.length === 0;
      tsEl.innerHTML = rows.length
        ? '<span class="ts-label">' + esc(L('ws.hl.total')) + '</span>' + rows.map((x) => '<p class="ts-text">' + x + '</p>').join('')
        : '';
    }

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
    const srcList = $('repSrcList');
    const srcEmpty = $('repEmptySrc');
    const srcFoot = $('repSrcFoot');
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

    renderDonut(r, query);
    renderTrend(r);
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
  if (printBtn) printBtn.addEventListener('click', () => {
    if (draft) {
      if (N.recordDownload) N.recordDownload('pdf', null);
      if (N.activityAdd) N.activityAdd('export', { q: String(draft.q || (draft.r && draft.r.query) || '') });
    }
    try { window.print(); } catch (e) {}
  });
  document.addEventListener('nabd-lang', render);
  window.addEventListener('resize', (() => {
    let t = null;
    return () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => { if (report && !report.hidden) renderTrend(draft && draft.r ? draft.r : {}); }, 200);
    };
  })());

  /* ---------- suggested actions on the report page ---------- */
  function currentDraft() {
    if (!draft || !draft.r || typeof draft.r !== 'object') return null;
    return draft;
  }
  function buildComplaintTemplate(d) {
    const r = (d && d.r) || {};
    const brief = (r.briefMeta && r.briefMeta.headline) || (r.aiBrief && r.aiBrief.headline)
      || (Array.isArray(r.highlights) && r.highlights[0] && (r.highlights[0].title || r.highlights[0].detail)) || '';
    const q = (d && d.q) || r.query || '';
    return [
      N.fmt('ws.fac.email.line1', { q: q }),
      N.fmt('ws.fac.email.line2', { t: new Date((d && d.t) || Date.now()).toLocaleString() }),
      brief ? N.fmt('ws.fac.email.line3', { b: brief }) : '',
      N.fmt('ws.fac.email.line4', { u: window.location.href }),
      '',
      N.fmt('ws.fac.email.line5', { q: q }),
      '',
      N.fmt('ws.fac.email.sign')
    ].filter(Boolean).join('\n');
  }
  function facilityEmailModal(d) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'c-modal';
      const facs = Array.isArray(N.facilities) ? N.facilities : [];
      const items = facs.map((f, i) =>
        '<button type="button" class="fac-btn" data-f="' + i + '">'
        + '<span class="fac-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></span>'
        + '<span><b>' + esc(L(f.key)) + '</b><span class="fac-mail">' + esc(f.email || '') + '</span></span>'
        + '</button>').join('');
      const body = buildComplaintTemplate(d);
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
        try { document.removeEventListener('keydown', onKey); } catch (err) {}
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
        if (!to) { N.toast(document.body, L('ws.actions.pick.err')); toEl.focus(); return; }
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
        try { document.removeEventListener('keydown', onKey); } catch (err) {}
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
    const d = currentDraft();
    if (!d) return;
    const choice = await reminderModal();
    if (!choice) return;
    const q = String(d.q || (d.r && d.r.query) || '');
    const ms = REMINDER_MS[choice] || REMINDER_MS['12h'];
    if (N.alertsAdd) N.alertsAdd({ q: q, dueAt: Date.now() + ms });
    if (N.activityAdd) N.activityAdd('alert', { q: q });
    N.toast(document.body, L('app.toast.reminder'));
  }
  const repActList = $('repActList');
  if (repActList) repActList.addEventListener('click', (e) => {
    const b = e.target.closest('.act-btn');
    if (!b) return;
    const d = currentDraft();
    if (!d) return;
    const act = b.dataset.act;
    if (act === 'send') {
      facilityEmailModal(d).then((res) => {
        if (!res) return;
        N.toast(document.body, L('app.toast.email'));
        const q = String(d.q || (d.r && d.r.query) || '');
        const subject = N.fmt('ws.fac.email.line1', { q: q });
        try {
          window.location.href = 'mailto:' + res.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(res.body);
        } catch (err) {}
        N.toast(document.body, L('app.toast.facility'));
      });
    } else if (act === 'save') {
      try {
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem(userKey('nabd-saved-reports')) || '[]'); if (!Array.isArray(saved)) saved = []; } catch (err) { saved = []; }
        saved.unshift(d);
        saved = saved.slice(0, 20);
        localStorage.setItem(userKey('nabd-saved-reports'), JSON.stringify(saved));
        if (N.activityAdd) N.activityAdd('save', { q: String(d.q || (d.r && d.r.query) || '') });
        N.toast(document.body, L('app.toast.savedReport'));
      } catch (err) {
        N.toast(document.body, L('app.toast.exported'));
      }
    } else if (act === 'share') {
      const url = window.location.href;
      if (window.navigator && navigator.share) {
        navigator.share({ title: L('export.title'), text: String(d.q || (d.r && d.r.query) || ''), url: url }).catch(() => {});
      } else {
        try { window.navigator.clipboard.writeText(url); N.toast(document.body, L('app.toast.shared')); } catch (err) { N.toast(document.body, L('app.toast.exported')); }
      }
    } else if (act === 'remind') {
      setReminder();
    }
  });

  render();
})();
