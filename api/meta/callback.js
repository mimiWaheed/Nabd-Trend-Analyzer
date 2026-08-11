/* NABD — Meta OAuth callback.
   Exchanges the authorization code for a token server-side (the Meta App
   Secret never reaches the browser), resolves the connected page +
   Instagram business account, then posts the result to the opener window
   and closes. Renders a plain HTML confirmation page as the OAuth
   redirect target (META_REDIRECT_URI must point at this route). */

const GRAPH = 'https://graph.facebook.com/v19.0';

const PAGE_HTML = (message) =>
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>NABD — Meta connection</title>'
  + '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'
  + 'font:15px/1.5 system-ui,Segoe UI,sans-serif;background:#070B14;color:#E8EEF9}'
  + '.card{max-width:420px;padding:32px;border:1px solid rgba(94,162,255,.25);border-radius:16px;'
  + 'background:#0D1420;text-align:center}h1{font-size:17px;margin:0 0 10px}p{color:#8FA0BC;margin:0}</style>'
  + '</head><body><div class="card"><h1>NABD (نبض)</h1><p>' + message + '</p></div></body></html>';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const code = String((req.query && req.query.code) || '');
  const authError = req.query && req.query.error;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  const fail = (message) => {
    res.status(200).send(PAGE_HTML(message));
  };

  if (authError) return fail('Meta authorization was not completed. You can close this window.');
  if (!code || !appId || !appSecret || !redirectUri) {
    return fail('Meta OAuth is not fully configured. Please set META_APP_ID, META_APP_SECRET and META_REDIRECT_URI.');
  }

  /* exchange code -> access token */
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
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return fail('Could not complete Meta sign-in. Please try again.');
  }

  /* resolve account identity (best-effort) */
  let accountName = '';
  let accountId = '';
  let igUserId = '';

  try {
    const me = await (await fetch(GRAPH + '/me?fields=name&access_token=' + encodeURIComponent(accessToken))).json();
    if (me && me.name) accountName = String(me.name);
  } catch (e) {}

  try {
    const pages = await (await fetch(GRAPH + '/me/accounts?fields=id,name&access_token=' + encodeURIComponent(accessToken))).json();
    const first = pages && Array.isArray(pages.data) && pages.data.length ? pages.data[0] : null;
    if (first && first.id) {
      accountId = String(first.id);
      if (!accountName) accountName = String(first.name || '');
      try {
        const ig = await (await fetch(GRAPH + '/' + accountId + '?fields=instagram_business_account{id}&access_token=' + encodeURIComponent(accessToken))).json();
        if (ig && ig.instagram_business_account && ig.instagram_business_account.id) {
          igUserId = String(ig.instagram_business_account.id);
        }
      } catch (e) {}
    }
  } catch (e) {}

  const payload = {
    type: 'nabd-meta-result',
    accessToken: accessToken,
    accountId: accountId,
    igUserId: igUserId,
    accountName: accountName,
    expiresAt: Date.now() + 60 * 24 * 3600 * 1000
  };

  const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  res.status(200).send(
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
