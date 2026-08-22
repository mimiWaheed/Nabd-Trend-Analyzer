/* GET /api/demo — public, no-auth live data feeds for the landing-page demo.
   No query:        Google "Trending Now" RSS for Egypt (what Egypt searches).
   ?q=<query>&lang=ar|en:
                    Google News RSS search scoped to Egyptian editions — real
                    recent headlines about ANY topic the visitor types, with
                    publisher names and timestamps.
   Both are cached in-memory (trends 10 min, per-query news 5 min) so landing
   traffic never hammers the sources. No keys, no user data. */

const { ok, fail } = require('../../lib/respond');
const { queryOf } = require('../../lib/respond');

const TRENDS_URL = 'https://trends.google.com/trending/rss?geo=EG';
const NEWS_URL = 'https://news.google.com/rss/search?gl=EG&ceid=EG:ar';
const TRENDS_TTL = 10 * 60 * 1000;
const NEWS_TTL = 5 * 60 * 1000;
const MAX_ITEMS = 20;
const MAX_NEWS = 30;
const MAX_Q = 80;

let cache = { at: 0, items: [] };
const newsCache = new Map();

function tag(block, name) {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  if (!m) return '';
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function decodeEnt(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').trim();
}

/* "50K+" / "200K" / "1M+" → numeric searches-per-day estimate published by Google */
function parseTraffic(raw) {
  const m = String(raw || '').match(/([\d.]+)\s*([KM])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return 0;
  const unit = (m[2] || '').toUpperCase();
  return Math.round(unit === 'M' ? n * 1000000 : unit === 'K' ? n * 1000 : n);
}

async function fetchRss(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NabdDemo/1.0)' }
    });
    if (!res.ok) throw new Error('rss http ' + res.status);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- trending feed ---------- */
function parseTrends(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = tag(b, 'title');
    if (!title) continue;
    const ts = Date.parse(tag(b, 'pubDate')) || 0;
    const traffic = parseTraffic(tag(b, 'ht:approx_traffic'));
    items.push({ title, traffic, ts });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

async function trendsFeed() {
  if (cache.items.length && Date.now() - cache.at < TRENDS_TTL) {
    return { items: cache.items, fetchedAt: cache.at, cached: true };
  }
  const xml = await fetchRss(TRENDS_URL);
  const items = parseTrends(xml);
  if (!items.length) throw new Error('trends rss empty');
  cache = { at: Date.now(), items };
  return { items: cache.items, fetchedAt: cache.at, cached: false };
}

/* ---------- per-query news feed ---------- */
function parseNews(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    let title = tag(b, 'title');
    if (!title) continue;
    /* Google News titles look like "Headline - Publisher" */
    let source = '';
    const sm = b.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    if (sm && sm[1].trim()) source = decodeEnt(sm[1]);
    if (!source) {
      const idx = title.lastIndexOf(' - ');
      if (idx > 10) { source = title.slice(idx + 3).trim(); title = title.slice(0, idx).trim(); }
    }
    const ts = Date.parse(tag(b, 'pubDate')) || 0;
    items.push({ title, source, ts });
    if (items.length >= MAX_NEWS) break;
  }
  return items;
}

async function newsFeed(q, lang) {
  const norm = q.toLowerCase().trim();
  const hit = newsCache.get(norm);
  if (hit && Date.now() - hit.at < NEWS_TTL) {
    return { items: hit.items, fetchedAt: hit.at, cached: true };
  }
  const hl = lang === 'en' ? 'en' : 'ar';
  const ceid = lang === 'en' ? 'EG:en' : 'EG:ar';
  const url = NEWS_URL.replace('hl=ar', 'hl=' + hl).replace('ceid=EG:ar', 'ceid=' + ceid) +
    '&q=' + encodeURIComponent(norm.slice(0, MAX_Q));
  const xml = await fetchRss(url);
  const items = parseNews(xml);
  if (!items.length) throw new Error('news rss empty');
  const out = { at: Date.now(), items };
  newsCache.set(norm, out);
  if (newsCache.size > 100) {
    /* drop oldest entries beyond the cap */
    const firstKey = newsCache.keys().next().value;
    newsCache.delete(firstKey);
  }
  return { items: out.items, fetchedAt: out.at, cached: false };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const q = String(queryOf(req).q || '').trim();
  const lang = String(queryOf(req).lang || 'ar').toLowerCase() === 'en' ? 'en' : 'ar';

  try {
    if (q) {
      const out = await newsFeed(q, lang);
      return ok(res, Object.assign({ live: true, mode: 'news', query: q }, out));
    }
    try {
      const out = await trendsFeed();
      return ok(res, Object.assign({ live: true, mode: 'trends' }, out));
    } catch (e) {
      /* serve stale trends rather than failing the demo */
      if (cache.items.length) {
        return ok(res, { live: true, stale: true, mode: 'trends', fetchedAt: cache.at, items: cache.items });
      }
      throw e;
    }
  } catch (e) {
    return fail(res, 502, 'DEMO_FEED_UNAVAILABLE', e.message || 'Live feed unavailable');
  }
};
