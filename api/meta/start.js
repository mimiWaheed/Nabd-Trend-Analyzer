/* NABD — Meta OAuth: build the Facebook login dialog URL.
   Returns 501 META_NOT_CONFIGURED when the app env vars are missing so the
   client can show a clear setup error instead of a broken popup. */

const FACEBOOK_DIALOG = 'https://www.facebook.com/v19.0/dialog/oauth';
const SCOPE = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management,read_insights';

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !redirectUri) {
    res.status(501).json({ error: 'META_NOT_CONFIGURED' });
    return;
  }

  const state = String((req.query && req.query.state) || '');
  if (!state) {
    res.status(400).json({ error: 'META_STATE_MISSING' });
    return;
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: SCOPE,
    response_type: 'code'
  });

  res.status(200).json({ url: FACEBOOK_DIALOG + '?' + params.toString() });
};
