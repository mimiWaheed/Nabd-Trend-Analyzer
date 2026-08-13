/* NABD — email sender.
   Uses nodemailer + SMTP env vars when configured. When SMTP is not
   configured (local dev without an SMTP server) it falls back to a
   console log so the flow stays usable; the OTP is never returned from
   the API and never written to application logs outside this dev path. */

const dev = (to, subject, text) => {
  if (typeof console !== 'undefined') {
    console.log('[nabd-mail] (SMTP not configured — dev mode) to=' + to);
    console.log('[nabd-mail] ' + subject);
    text.split('\n').forEach((l) => console.log('[nabd-mail] ' + l));
  }
};

function configured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function sendMail({ to, subject, text, html }) {
  if (!configured()) {
    dev(to, subject, text || '');
    return Promise.resolve({ ok: true, mode: 'dev' });
  }

  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || '' }
      : undefined
  });

  return transport.sendMail({
    from: process.env.EMAIL_FROM || 'NABD <no-reply@nabd.app>',
    to,
    subject,
    text,
    html
  }).then(() => ({ ok: true, mode: 'smtp' }));
}

function sendOtpEmail(to, otp, lang) {
  const ar = String(lang) === 'ar';
  const subject = ar ? 'كود التحقق الخاص بك — نبض' : 'Your NABD verification code';
  const text = ar
    ? ('مرحبًا،\n\nكود التحقق الخاص بك لمنصة نبض هو:\n\n    ' + otp + '\n\n' +
       'الكود صالح لمدة 10 دقائق ويستخدم مرة واحدة فقط.\n\nشكرًا لك،\nفريق نبض')
    : ('Hello,\n\nYour NABD verification code is:\n\n    ' + otp + '\n\n' +
       'The code expires in 10 minutes and can only be used once.\n\nThank you,\nThe NABD team');
  const html = ar
    ? '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">' +
      '<h2 style="color:#0B1B33">نبض</h2>' +
      '<p style="font-size:15px">كود التحقق الخاص بك:</p>' +
      '<p style="font-size:30px;letter-spacing:8px;font-weight:700;color:#2563EB">' + otp + '</p>' +
      '<p style="color:#555">الكود صالح لمدة 10 دقائق ويستخدم مرة واحدة فقط.</p></div>'
    : '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">' +
      '<h2 style="color:#0B1B33">NABD</h2>' +
      '<p style="font-size:15px">Your verification code:</p>' +
      '<p style="font-size:30px;letter-spacing:8px;font-weight:700;color:#2563EB">' + otp + '</p>' +
      '<p style="color:#555">The code expires in 10 minutes and can only be used once.</p></div>';
  return sendMail({ to, subject, text, html });
}

module.exports = { sendMail, sendOtpEmail, configured };
