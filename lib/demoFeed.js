/* NABD — public demo data feeds (no auth, no user data).
   Used by the landing-page demo via /api/nabd?action=trends|signals.

   trends:  Google "Trending Now" RSS for Egypt (what Egypt searches now).
   signals: Google News RSS search scoped to Egyptian editions — real recent
            headlines about ANY query, with publisher names + timestamps.

   Both are cached in-memory so landing traffic never hammers the sources. */

const TRENDS_URL = 'https://trends.google.com/trending/rss?geo=EG';
const NEWS_URL = 'https://news.google.com/rss/search?gl=EG&ceid=EG:ar';
const TRENDS_TTL = 10 * 60 * 1000;
const NEWS_TTL = 5 * 60 * 1000;
const MAX_ITEMS = 20;
const MAX_NEWS = 30;
const MAX_Q = 80;

let trendsCache = { at: 0, items: [] };
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

/* "50K+" / "200K" → numeric searches-per-day estimate published by Google */
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

function parseTrends(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = tag(b, 'title');
    if (!title) continue;
    items.push({ title, traffic: parseTraffic(tag(b, 'ht:approx_traffic')), ts: Date.parse(tag(b, 'pubDate')) || 0 });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

async function trendsFeed() {
  if (trendsCache.items.length && Date.now() - trendsCache.at < TRENDS_TTL) {
    return { items: trendsCache.items, fetchedAt: trendsCache.at, cached: true };
  }
  const xml = await fetchRss(TRENDS_URL);
  const items = parseTrends(xml);
  if (!items.length) throw new Error('trends rss empty');
  trendsCache = { at: Date.now(), items };
  return { items: trendsCache.items, fetchedAt: trendsCache.at, cached: false };
}

function trendsFeedStale() {
  return trendsCache.items.length
    ? { items: trendsCache.items, fetchedAt: trendsCache.at, stale: true }
    : null;
}

function parseNews(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    let title = tag(b, 'title');
    if (!title) continue;
    let source = '';
    const sm = b.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    if (sm && sm[1].trim()) source = decodeEnt(sm[1]);
    if (!source) {
      /* Google News titles fall back to "Headline - Publisher" */
      const idx = title.lastIndexOf(' - ');
      if (idx > 10) { source = title.slice(idx + 3).trim(); title = title.slice(0, idx).trim(); }
    }
    items.push({ title, source, ts: Date.parse(tag(b, 'pubDate')) || 0 });
    if (items.length >= MAX_NEWS) break;
  }
  return items;
}

async function signalsFeed(q, lang) {
  const norm = String(q || '').toLowerCase().trim().slice(0, MAX_Q);
  if (!norm) throw new Error('query required');
  const hit = newsCache.get(norm);
  if (hit && Date.now() - hit.at < NEWS_TTL) {
    return { items: hit.items, fetchedAt: hit.at, cached: true };
  }
  const hl = lang === 'en' ? 'en' : 'ar';
  const ceid = lang === 'en' ? 'EG:en' : 'EG:ar';
  const url = NEWS_URL.replace('hl=ar', 'hl=' + hl).replace('ceid=EG:ar', 'ceid=' + ceid) +
    '&q=' + encodeURIComponent(norm);
  const xml = await fetchRss(url);
  const items = parseNews(xml);
  if (!items.length) throw new Error('news rss empty');
  const out = { at: Date.now(), items };
  newsCache.set(norm, out);
  if (newsCache.size > 100) {
    const firstKey = newsCache.keys().next().value;
    newsCache.delete(firstKey);
  }
  return { items: out.items, fetchedAt: out.at, cached: false };
}

module.exports = { trendsFeed, trendsFeedStale, signalsFeed };
