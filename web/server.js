/**
 * Web dev server for the browser preview.
 *
 * Metro (react-native start) already knows how to bundle `platform=web`
 * (see metro.config.js), but it serves no HTML. This tiny server:
 *   - serves web/index.html at `/`
 *   - reverse-proxies the Metro dev server (bundle, assets, symbolicate…)
 *     onto the SAME origin, so the bundle's relative `/assets/...` URLs and
 *     its `/index.bundle` script tag both resolve without CORS.
 *
 * Run with `npm run web` (starts Metro + this server) or:
 *   react-native start  &  node web/server.js
 *
 * No dependencies — Node's built-in http/https.
 */

'use strict';

const http = require('http');
const { createReadStream, existsSync, statSync } = require('fs');
const path = require('path');

const HOST = process.env.HOST || 'localhost';
const PORT = Number(process.env.PORT || 3000);
const METRO_HOST = process.env.METRO_HOST || 'localhost';
const METRO_PORT = Number(process.env.METRO_PORT || 8081);

const WEB_DIR = __dirname;
const INDEX_HTML = path.join(WEB_DIR, 'index.html');

// Requests Metro must answer (everything the web bundle or dev tooling calls
// back to the dev server for). Unknown paths fall through to the SPA shell.
function isMetroRequest(urlPath) {
  const p = urlPath.split('?')[0];
  return (
    p === '/index.bundle' ||
    p.endsWith('.bundle') ||
    p === '/assets' ||
    p.startsWith('/assets/') ||
    p === '/symbolicate' ||
    p === '/open-stack-frame' ||
    p === '/json' ||
    p.startsWith('/json/') ||
    p.startsWith('/hot') ||
    p === '/status'
  );
}

function proxyToMetro(req, res) {
  const proxyReq = http.request(
    {
      host: METRO_HOST,
      port: METRO_PORT,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `${METRO_HOST}:${METRO_PORT}` },
    },
    proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', err => {
    res.writeHead(502, {'content-type': 'text/plain; charset=utf-8'});
    res.end(
      `Could not reach the Metro dev server at http://${METRO_HOST}:${METRO_PORT} ` +
        `(${err.code}). Start it with \`react-native start\` (or use \`npm run web\`).`,
    );
  });
  req.pipe(proxyReq);
}

function serveStatic(res, filePath, contentType) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
    res.end('Not found');
    return;
  }
  res.writeHead(200, {'content-type': contentType});
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  if (isMetroRequest(urlPath)) {
    proxyToMetro(req, res);
    return;
  }

  if (urlPath === '/' || urlPath === '/index.html') {
    serveStatic(res, INDEX_HTML, 'text/html; charset=utf-8');
    return;
  }

  // SPA fallback: unknown routes still get the app shell.
  serveStatic(res, INDEX_HTML, 'text/html; charset=utf-8');
});

server.listen(PORT, HOST, () => {
  console.log(
    `\nEnglish Grammar Game — web preview: http://${HOST}:${PORT}\n` +
      `(proxying Metro at http://${METRO_HOST}:${METRO_PORT})\n`,
  );
});
