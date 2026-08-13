/* NABD — frontend config endpoint (Vercel serverless).
   Serves the n8n webhook URL from the NABD_WEBHOOK_URL env var so the
   webhook address never ships inside the client bundle. */

const { json } = require('../lib/respond');

module.exports = function handler(req, res) {
  const url = process.env.NABD_WEBHOOK_URL;
  if (!url) {
    return json(res, 404, { ok: false, error: 'NABD_WEBHOOK_URL_NOT_SET' });
  }
  return json(res, 200, { ok: true, webhookUrl: url });
};
