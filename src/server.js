// Minimal zero-dependency local server. Serves the UI and one JSON scan endpoint.
// Binds to loopback only; rejects non-localhost Host headers (basic DNS-rebind guard).

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fullScan } from './scanner/index.js';
import { demoModel } from './scanner/demo.js';
import { runAction, listTrash } from './scanner/actions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI = path.join(__dirname, 'ui');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const STATIC = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/app.js': 'app.js',
  '/styles.css': 'styles.css',
};

async function serveStatic(res, file) {
  try {
    const body = await readFile(path.join(UI, file));
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const host = (req.headers.host || '').split(':')[0];
    if (host && !['localhost', '127.0.0.1', '::1'].includes(host)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    let u;
    try { u = new URL(req.url, 'http://localhost'); } catch { u = new URL('http://localhost/'); }
    const pathname = u.pathname;
    const demo = u.searchParams.get('demo') === '1' || process.env.WARDEN_DEMO === '1';

    if (pathname === '/api/action' && req.method === 'POST') {
      if (demo) {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Demo mode is read-only.' }));
        return;
      }
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 1_000_000) req.destroy(); });
      req.on('end', async () => {
        let payload = {};
        try { payload = JSON.parse(body || '{}'); } catch {}
        const result = await runAction(payload.action, payload);
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify(result));
      });
      return;
    }
    if (pathname === '/api/trash') {
      const data = demo ? { items: [] } : await listTrash();
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(data));
      return;
    }

    if (pathname === '/api/scan') {
      try {
        const data = demo ? demoModel() : await fullScan();
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: String((e && e.stack) || e) }));
      }
      return;
    }
    if (pathname === '/api/health') { res.writeHead(200); res.end('ok'); return; }
    if (STATIC[pathname]) return serveStatic(res, STATIC[pathname]);

    res.writeHead(404); res.end('Not found');
  });
}
