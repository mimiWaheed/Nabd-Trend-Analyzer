/* NABD — consolidated Meta OAuth endpoints.
   /api/meta?action=start|revoke   (the /api/meta/callback route stays separate:
   it is the Facebook OAuth redirect target configured via META_REDIRECT_URI). */

const { fail, json, queryOf } = require('../../lib/respond');

const FACEBOOK_DIALOG = 'https://www.facebook.com/v19.0/dialog/oauth';
const SCOPE = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management,read_insights';
const GRAPH = 'https://graph.facebook.com/v19.0';

/* GET start — build the Facebook login dialog URL.
   Returns 501 META_NOT_CONFIGURED when the app env vars are missing so the
   client can show a clear setup error instead of a broken popup. */
function actionStart(req, res, q) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !redirectUri) {
    return json(res, 501, { error: 'META_NOT_CONFIGURED' });
  }

  const state = String((q && q.state) || '');
  if (!state) {
    return json(res, 400, { error: 'META_STATE_MISSING' });
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: SCOPE,
    response_type: 'code'
  });

  return json(res, 200, { url: FACEBOOK_DIALOG + '?' + params.toString() });
}

/* POST revoke — revoke a session token (best-effort).
   The frontend calls this on disconnect; failures never block the UI. */
async function actionRevoke(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }
  const token = String((req.body && req.body.token) || '');
  if (token) {
    try {
      await fetch(GRAPH + '/me/permissions?access_token=' + encodeURIComponent(token), { method: 'DELETE' });
    } catch (e) {}
  }
  return json(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  const q = queryOf(req);
  switch (String(q.action || '')) {
    case 'start': return actionStart(req, res, q);
    case 'revoke': return actionRevoke(req, res);
    default: return fail(res, 404, 'NOT_FOUND', 'Unknown meta action: ' + (q.action || '(none)'));
  }
};
