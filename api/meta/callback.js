/* NABD — Meta OAuth callback.
   Exchanges the authorization code for a user token server-side (the Meta App
   Secret never reaches the browser), resolves the connected page + Instagram
   business account, converts the user token into a *page access token* (the
   new Pages experience requires a page token for /{pageId}/posts), then posts
   the result to the opener window and closes. Renders a plain HTML
   confirmation page as the OAuth redirect target (META_REDIRECT_URI must
   point at this route). */

const GRAPH = 'https://graph.facebook.com/v19.0';
const { queryOf } = require('../../lib/respond');

const PAGE_HTML = (message) =>
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>NABD — Meta connection</title>'
  + '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'
  + 'font:15px/1.5 system-ui,Segoe UI,sans-serif;background:#070B14;color:#E8EEF9}'
  + '.card{max-width:420px;padding:32px;border:1px solid rgba(94,162,255,.25);border-radius:16px;'
  + 'background:#0D1420;text-align:center}h1{font-size:17px;margin:0 0 10px}p{color:#8FA0BC;margin:0}</style>'
  + '</head><body><div class="card"><h1>NABD (نبض)</h1><p>' + message + '</p></div></body></html>';

/* Pick the page to analyze from /me/accounts. META_DEFAULT_PAGE_ID wins when
   present in the list; otherwise the first page Meta returns is used. */
function pickPageId(pages, defaultId) {
  if (!Array.isArray(pages) || !pages.length) return '';
  const want = String(defaultId || '').trim();
  if (want) {
    const match = pages.find((p) => String(p && p.id) === want);
    if (match) return String(match.id);
  }
  return String(pages[0].id || '');
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const q = queryOf(req);
  const code = String((q && q.code) || '');
  const authError = q && q.error;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  const fail = (message) => {
    res.statusCode = 200;
    res.end(PAGE_HTML(message));
  };

  if (authError) return fail('Meta authorization was not completed. You can close this window.');
  if (!code || !appId || !appSecret || !redirectUri) {
    return fail('Meta OAuth is not fully configured. Please set META_APP_ID, META_APP_SECRET and META_REDIRECT_URI.');
  }

  /* exchange code -> user access token */
  let tokenJson = {};
  try {
    const url = GRAPH + '/oauth/access_token?client_id=' + encodeURIComponent(appId)
      + '&client_secret=' + encodeURIComponent(appSecret)
      + '&redirect_uri=' + encodeURIComponent(redirectUri)
      + '&code=' + encodeURIComponent(code);
    const resp = await fetch(url);
    tokenJson = await resp.json().catch(() => ({}));
  } catch (e) {
    return fail('Could not reach Meta. Please try again.');
  }
  const userAccessToken = tokenJson.access_token;
  if (!userAccessToken) {
    return fail('Could not complete Meta sign-in. Please try again.');
  }

  /* resolve account identity (best-effort) */
  let accountName = '';
  let accountId = '';
  let igUserId = '';
  let pageAccessToken = '';

  try {
    const me = await (await fetch(GRAPH + '/me?fields=name&access_token=' + encodeURIComponent(userAccessToken))).json();
    if (me && me.name) accountName = String(me.name);
  } catch (e) {}

  try {
    const pages = await (await fetch(GRAPH + '/me/accounts?fields=id,name&access_token=' + encodeURIComponent(userAccessToken))).json();
    const pageList = Array.isArray(pages && pages.data) ? pages.data : [];
    accountId = pickPageId(pageList, process.env.META_DEFAULT_PAGE_ID);
    const picked = pageList.find((p) => p && String(p.id) === accountId) || pageList[0] || null;
    if (!accountName && picked && picked.name) accountName = String(picked.name);
    if (accountId) {
      try {
        const page = await (await fetch(GRAPH + '/' + accountId + '?fields=access_token,instagram_business_account{id}&access_token=' + encodeURIComponent(userAccessToken))).json();
        if (page && page.access_token) pageAccessToken = String(page.access_token);
        if (page && page.instagram_business_account && page.instagram_business_account.id) {
          igUserId = String(page.instagram_business_account.id);
        }
      } catch (e) {}
    }
  } catch (e) {}

  const payload = {
    type: 'nabd-meta-result',
    /* the page token is what the n8n workflow uses to read /{accountId}/posts */
    accessToken: pageAccessToken || userAccessToken,
    userToken: userAccessToken,
    accountId: accountId,
    igUserId: igUserId,
    accountName: accountName,
    expiresAt: Date.now() + 60 * 24 * 3600 * 1000
  };

  const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  res.statusCode = 200;
  res.end(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>NABD — connected</title></head>'
    + '<body style="background:#070B14;color:#E8EEF9;font:14px/1.5 system-ui,sans-serif;'
    + 'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">'
    + '<div style="text-align:center">Connected.</div>'
    + '<script>'
    + '(function(){'
    + '  var payload = ' + payloadJson + ';'
    + '  try { if (window.opener) { window.opener.postMessage(payload, window.location.origin); } } catch (e) {}'
    + '  try { setTimeout(function(){ window.close(); }, 600); } catch (e) {}'
    + '})();'
    + '</script></body></html>'
  );
};

module.exports.pickPageId = pickPageId;
