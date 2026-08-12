/* NABD — Facebook (Meta) OAuth server-side helpers.
   - build the login dialog URL
   - exchange an authorization code, resolve the page/IG account, and
     PERSIST the connection with tokens encrypted at rest (AES-256-GCM).
   - tokens are never returned to the client. */

const { randomToken, encryptSecret, nowIso } = require('./crypto');
const storeApi = require('./store');
const events = require('./events');

const GRAPH = 'https://graph.facebook.com/v19.0';
const FACEBOOK_DIALOG = 'https://www.facebook.com/v19.0/dialog/oauth';
const SCOPE = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management,read_insights';
const STATE_TTL_MS = 10 * 60 * 1000;

function oauthConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !redirectUri || !appSecret) return null;
  return { appId, appSecret, redirectUri };
}

function dialogUrl(state) {
  const cfg = oauthConfig();
  if (!cfg) return null;
  const params = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: cfg.redirectUri,
    state: state,
    scope: SCOPE,
    response_type: 'code'
  });
  return FACEBOOK_DIALOG + '?' + params.toString();
}

async function createOauthState(userId) {
  const store = storeApi.makeStore();
  const state = randomToken(24);
  await store.createOauthState({
    id: state,
    userId,
    expiresAt: new Date(Date.now() + STATE_TTL_MS).toISOString(),
    usedAt: null,
    createdAt: nowIso()
  });
  return state;
}

async function resolveOauthState(state) {
  const store = storeApi.makeStore();
  const row = await store.getOauthState(state);
  if (!row) return { error: 'STATE_INVALID' };
  if (row.usedAt) return { error: 'STATE_USED' };
  if (new Date(row.expiresAt) < new Date()) return { error: 'STATE_EXPIRED' };
  return { userId: row.userId };
}

/* pick the page to analyze from /me/accounts */
function pickPageId(pages, defaultId) {
  if (!Array.isArray(pages) || !pages.length) return '';
  const want = String(defaultId || '').trim();
  if (want) {
    const match = pages.find((p) => p && String(p.id) === want);
    if (match) return String(match.id);
  }
  return String(pages[0].id || '');
}

/**
 * Exchange the OAuth code, resolve identity, encrypt + persist the connection.
 * Returns { ok:true, data } or { ok:false, error }.
 */
async function exchangeAndPersist({ code, state }) {
  const cfg = oauthConfig();
  if (!cfg) return { ok: false, error: 'META_NOT_CONFIGURED' };
  if (!code) return { ok: false, error: 'META_CODE_MISSING' };

  const stateRes = await resolveOauthState(state);
  if (stateRes.error) return { ok: false, error: stateRes.error };

  let tokenJson = {};
  try {
    const url = GRAPH + '/oauth/access_token?client_id=' + encodeURIComponent(cfg.appId)
      + '&client_secret=' + encodeURIComponent(cfg.appSecret)
      + '&redirect_uri=' + encodeURIComponent(cfg.redirectUri)
      + '&code=' + encodeURIComponent(code);
    const resp = await fetch(url);
    tokenJson = await resp.json().catch(() => ({}));
  } catch (e) {
    return { ok: false, error: 'META_NETWORK' };
  }
  const userAccessToken = tokenJson.access_token;
  if (!userAccessToken) return { ok: false, error: 'META_TOKEN_EXCHANGE_FAILED' };

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

  const store = storeApi.makeStore();
  await store.upsertFb({
    userId: stateRes.userId,
    facebookUserId: accountId || null,
    accountId: accountId || null,
    accountName: accountName || null,
    igUserId: igUserId || null,
    pageAccessTokenEnc: encryptSecret(pageAccessToken || userAccessToken),
    userTokenEnc: encryptSecret(userAccessToken),
    status: 'connected'
  });

  await store.consumeOauthState(state);
  await events.logActivity(stateRes.userId, 'FACEBOOK_CONNECTED', { accountName, accountId });
  await events.createNotification(stateRes.userId, 'conn', 'Facebook connected', accountName ? ('Connected to ' + accountName + '.') : 'Your Facebook account is now connected.');

  return {
    ok: true,
    data: {
      accountId: accountId || '',
      igUserId: igUserId || '',
      accountName: accountName || '',
      connected: true
    }
  };
}

async function revokeUserToken(userId) {
  try {
    const store = storeApi.makeStore();
    const fb = await store.getFb(userId);
    if (!fb) return;
    const { decryptSecret } = require('./crypto');
    const token = decryptSecret(fb.userTokenEnc) || decryptSecret(fb.pageAccessTokenEnc);
    if (token) {
      await fetch(GRAPH + '/me/permissions?access_token=' + encodeURIComponent(token), { method: 'DELETE' }).catch(() => {});
    }
  } catch (e) {}
}

module.exports = { GRAPH, dialogUrl, createOauthState, exchangeAndPersist, revokeUserToken, pickPageId, oauthConfig };
