/* NABD — HTTP/JSON response + error helpers for Vercel serverless handlers. */

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function json(res, status, payload, extraHeaders) {
  const body = JSON.stringify(payload);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  if (extraHeaders && typeof extraHeaders === 'object') {
    Object.keys(extraHeaders).forEach((k) => { headers[k] = extraHeaders[k]; });
  }
  Object.keys(headers).forEach((k) => res.setHeader(k, headers[k]));
  res.statusCode = status;
  res.end(body);
  return body;
}

function ok(res, payload) {
  return json(res, 200, Object.assign({ ok: true }, payload));
}

function created(res, payload) {
  return json(res, 201, Object.assign({ ok: true }, payload));
}

function fail(res, status, code, message) {
  return json(res, status, { ok: false, error: code, message: message || undefined });
}

/* consistent error mapping */
function errorStatus(code) {
  switch (code) {
    case 'BAD_REQUEST': return 400;
    case 'UNAUTHENTICATED': return 401;
    case 'FORBIDDEN': return 403;
    case 'NOT_FOUND': return 404;
    case 'CONFLICT': return 409;
    case 'UNPROCESSABLE': return 422;
    case 'RATE_LIMITED': return 429;
    case 'EMAIL_NOT_VERIFIED': return 403;
    default: return 500;
  }
}

function failCode(res, code, message) {
  return json(res, errorStatus(code), { ok: false, error: code, message: message || undefined });
}

/* read + parse a JSON body once, with a size cap */
function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const limit = limitBytes || 512 * 1024;
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('BODY_TOO_LARGE'), { code: 'BAD_REQUEST' }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch (e) { reject(Object.assign(new Error('INVALID_JSON'), { code: 'BAD_REQUEST' })); }
    });
    req.on('error', (e) => reject(Object.assign(new Error('BODY_READ_ERROR'), { code: 'BAD_REQUEST' })));
  });
}

function parseBodySync(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

function methodAllowed(req, res, ...methods) {
  if (methods.indexOf(req.method) === -1) {
    fail(res, 405, 'METHOD_NOT_ALLOWED');
    res.setHeader('Allow', methods.join(', '));
    return false;
  }
  return true;
}

/* Vercel may pass a req with a body already parsed (vercel dev) or streamed. */
function maybeParseBody(req) {
  return req.body !== undefined ? parseBodySync(req) : null;
}

/* get the parsed JSON body whether Vercel already parsed it or streamed it */
function asyncBody(req) {
  const parsed = maybeParseBody(req);
  if (parsed !== null) return Promise.resolve(parsed);
  return readBody(req);
}

/* unified query-string access: Vercel passes req.query (parsed), the local dev
   server passes a raw req.url, and tests may pass an explicit query object. */
function queryOf(req) {
  if (req && req.query && typeof req.query === 'object') return req.query;
  try {
    const url = new URL(String((req && req.url) || ''), 'http://nabd.local');
    const out = Object.create(null);
    url.searchParams.forEach((v, k) => { out[k] = v; });
    return out;
  } catch (e) {
    return {};
  }
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    firstName: u.firstName != null ? u.firstName : u.first_name,
    lastName: u.lastName != null ? u.lastName : u.last_name,
    email: u.email,
    emailVerified: !!(u.emailVerified != null ? u.emailVerified : u.email_verified),
    phone: u.phone != null ? u.phone : null,
    organization: u.organization != null ? u.organization : null,
    country: u.country != null ? u.country : null,
    lang: u.lang != null ? u.lang : 'en',
    createdAt: u.createdAt != null ? u.createdAt : u.created_at,
    lastLoginAt: u.lastLoginAt != null ? u.lastLoginAt : (u.last_login_at || null)
  };
}

module.exports = {
  json,
  ok,
  created,
  fail,
  failCode,
  readBody,
  asyncBody,
  parseBodySync,
  maybeParseBody,
  methodAllowed,
  errorStatus,
  publicUser,
  queryOf,
  METHODS
};
