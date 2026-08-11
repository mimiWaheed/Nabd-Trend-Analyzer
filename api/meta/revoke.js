/* NABD — Meta OAuth: revoke a session token (best-effort).
   The frontend calls this on disconnect; failures never block the UI. */

const GRAPH = 'https://graph.facebook.com/v19.0';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  const token = String((req.body && req.body.token) || '');
  if (token) {
    try {
      await fetch(GRAPH + '/me/permissions?access_token=' + encodeURIComponent(token), { method: 'DELETE' });
    } catch (e) {}
  }
  res.status(200).json({ ok: true });
};
