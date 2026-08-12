/* NABD — local dev server (no Vercel login required).
   Mirrors `vercel dev`: serves the static frontend and mounts the real
   serverless handlers under /api/* so auth and every API route actually work
   locally. Uses the in-memory data store by default (NABD_DATA=memory) so it
   never touches a real database; set DATABASE_URL / NABD_DATA yourself if you
   want the Postgres backend (prefer `npx vercel dev` for that).

   Usage:  node dev-server.js            → http://localhost:3000
           PORT=5000 node dev-server.js  → http://localhost:5000 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

if (!process.env.NABD_DATA) process.env.NABD_DATA = 'memory';

const ROOT = __dirname;
const PORT = Number(process.env.PORT || process.env.NABD_PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

function sendFile(req, res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.end(buf);
  });
}

function resolveStatic(url) {
  const base = path.normalize(path.join(ROOT, url === '/' ? 'index.html' : url));
  if (base.indexOf(ROOT) !== 0) return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  if (path.extname(base) === '') {
    if (fs.existsSync(base + '.html') && fs.statSync(base + '.html').isFile()) return base + '.html';
    const idx = path.join(base, 'index.html');
    if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
  }
  return null;
}

function jsonOut(res, status, payload) {
  const body = JSON.stringify(payload);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = status;
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);

  if (url === '/api' || url.indexOf('/api/') === 0) {
    const rel = url === '/api' ? '' : url.replace(/^\/api\//, '');
    const candidates = [
      path.join(ROOT, 'api', rel + '.js'),
      path.join(ROOT, 'api', rel, 'index.js')
    ];
    let handler = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) { handler = require(c); break; }
    }
    if (!handler) {
      return jsonOut(res, 404, { ok: false, error: 'NOT_FOUND', message: 'No API route: /api/' + rel });
    }
    try {
      return Promise.resolve(handler(req, res)).catch((e) => {
        jsonOut(res, 500, { ok: false, error: 'INTERNAL_ERROR', message: e && e.message ? e.message : 'Internal error' });
      });
    } catch (e) {
      return jsonOut(res, 500, { ok: false, error: 'INTERNAL_ERROR', message: e && e.message ? e.message : 'Internal error' });
    }
  }

  const file = resolveStatic(url);
  if (file) return sendFile(req, res, file);

  res.statusCode = 404;
  res.end('Not found: ' + url);
});

server.listen(PORT, () => {
  console.log('[nabd-dev] serving http://localhost:' + PORT + '  (data: ' + process.env.NABD_DATA + ')');
});
