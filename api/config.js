/* NABD — frontend config endpoint (Vercel serverless).
   Serves the n8n webhook URL from the NABD_WEBHOOK_URL env var so the
   webhook address never ships inside the client bundle. */

module.exports = function handler(req, res) {
  const url = process.env.NABD_WEBHOOK_URL;
  if (!url) {
    res.status(404).json({ ok: false, error: 'NABD_WEBHOOK_URL_NOT_SET' });
    return;
  }
  res.status(200).json({ ok: true, webhookUrl: url });
};
