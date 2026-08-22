/* NABD — input validation helpers. */
/* eslint-disable no-control-regex */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}\p{M}'’\s.-]+$/u;
const ID_RE = /^[a-zA-Z0-9_-]{4,64}$/;

function isEmail(v) {
  const s = String(v == null ? '' : v).trim();
  if (!EMAIL_RE.test(s)) return false;
  const at = s.lastIndexOf('@');
  const local = s.slice(0, at);
  const domain = s.slice(at + 1).toLowerCase();
  /* local part: sane characters only, no stray or repeated dots */
  if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return false;
  if (local[0] === '.' || local[local.length - 1] === '.' || local.includes('..')) return false;
  /* domain labels: non-empty, no stray hyphens, alpha TLD of 2+ */
  const parts = domain.split('.');
  if (parts.length < 2 || parts.some((p) => !p)) return false;
  const host = parts[parts.length - 2] || '';
  const tld = parts[parts.length - 1] || '';
  if (!host || !/^[a-z]{2,}$/.test(tld)) return false;
  if (parts.slice(0, -1).some((p) => p[0] === '-' || p[p.length - 1] === '-')) return false;
  if (s.length > 254) return false;
  return true;
}

function isName(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s || s.length < 2 || s.length > 64) return false;
  if (!NAME_RE.test(s)) return false;
  if ((s.match(/\p{L}/gu) || []).length < 2) return false;
  return true;
}

function isPassword(v) {
  return typeof v === 'string' && v.length >= 8 && v.length <= 200;
}

function isId(v) {
  return typeof v === 'string' && ID_RE.test(v);
}

function cleanPhone(v) {
  return String(v == null ? '' : v).replace(/[\s().-]/g, '');
}

/* Egyptian mobile numbers: 010/011/012/015 followed by 8 digits.
   Accepts local (0), local-without-0, +20 and 0020 prefixes. */
function isPhone(v) {
  let n = cleanPhone(v);
  if (!n) return false;
  if (n.charAt(0) === '+') n = n.slice(1);
  if (n.indexOf('0020') === 0) n = n.slice(3);
  else if (n.indexOf('20') === 0) n = n.slice(2);
  if (n.length === 11 && n.charAt(0) === '0') n = n.slice(1);
  return /^1[0125]\d{8}$/.test(n);
}

function isIsoDate(v) {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

function pagination(query) {
  let limit = parseInt(String((query && query.limit) || '10'), 10);
  let offset = parseInt(String((query && query.offset) || '0'), 10);
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

module.exports = { isEmail, isName, isPassword, isId, isPhone, cleanPhone, isIsoDate, pagination };
