/* POST /api/complaints — send a citizen complaint email.

   Body: { from, to, subject, body, category }

   The "from" address is the sender the citizen provides (default
   nabdanalyzerinfo@gmail.com). The email is forwarded to the
   facility's "to" address via the shared mailer. */

const { requireAuth } = require('../../lib/auth');
const mailer = require('../../lib/mailer');
const { asyncBody, fail, ok, queryOf } = require('../../lib/respond');

const CATEGORIES = ['power-outage', 'water-flooding', 'fire', 'incident', 'complaint', 'infrastructure', 'waste', 'other'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  const auth = await requireAuth(req, res);
  if (!auth) return;

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const from = String((body && body.from) || '').trim();
  const to = String((body && body.to) || '').trim();
  const subject = String((body && body.subject) || '').trim().slice(0, 500);
  const messageBody = String((body && body.body) || '').trim().slice(0, 5000);
  const category = String((body && body.category) || '').trim();

  if (!to) return fail(res, 422, 'VALIDATION_ERROR', 'Recipient email is required');
  if (!messageBody) return fail(res, 422, 'VALIDATION_ERROR', 'Complaint body is required');
  if (CATEGORIES.indexOf(category) === -1) return fail(res, 422, 'VALIDATION_ERROR', 'Invalid category');

  const senderEmail = from || 'nabdanalyzerinfo@gmail.com';
  const catLabel = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const finalSubject = subject || ('NABD Citizen Portal — ' + catLabel);

  const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">'
    + '<h2 style="color:#0B1B33">NABD Citizen Portal</h2>'
    + '<p style="font-size:13px;color:#888;margin-bottom:4px">From: ' + escHtml(senderEmail) + '</p>'
    + '<p style="font-size:13px;color:#888;margin-bottom:16px">Category: ' + escHtml(catLabel) + '</p>'
    + '<hr style="border:none;border-top:1px solid #e0e0e0;margin:12px 0">'
    + '<p style="font-size:15px;line-height:1.6;white-space:pre-wrap">' + escHtml(messageBody) + '</p>'
    + '<hr style="border:none;border-top:1px solid #e0e0e0;margin:12px 0">'
    + '<p style="font-size:12px;color:#aaa">Sent via NABD (نبض) Citizen Portal — ' + new Date().toLocaleString() + '</p>'
    + '</div>';

  const text = 'NABD Citizen Portal\n'
    + 'From: ' + senderEmail + '\n'
    + 'Category: ' + catLabel + '\n'
    + '---\n'
    + messageBody + '\n'
    + '---\n'
    + 'Sent via NABD (نبض) Citizen Portal — ' + new Date().toLocaleString();

  let emailStatus = 'pending';
  try {
    const out = await mailer.sendMail({ to, subject: finalSubject, text, html });
    emailStatus = out.mode;
  } catch (e) {
    emailStatus = 'failed';
    if (typeof console !== 'undefined') console.log('[nabd-mail] citizen complaint email to ' + to + ' failed: ' + (e && e.message));
  }

  return ok(res, { sent: true, emailStatus });
};
