// Static file server for the e2e gate: node:http only, serves the repo root.
// Picks a free port; refuses path traversal; correct Content-Type for modules.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

export async function startServer(root = process.env.GATE_ROOT ?? ROOT) {
  const requests = [];
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      const file = resolve(root, rel);
      if (file !== root && !file.startsWith(root + sep)) {
        requests.push(`${req.method} ${url.pathname} 403`);
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await readFile(!extname(file) ? join(file, 'index.html') : file);
      requests.push(`${req.method} ${url.pathname} 200`);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      requests.push(`${req.method} ${req.url} 404`);
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;
  return {
    port,
    url: (path = '/') => `http://127.0.0.1:${port}${path}`,
    requests,
    async stop() {
      await new Promise((res) => server.close(res));
    },
  };
}
